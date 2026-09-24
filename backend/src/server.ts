import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from './db.js';

const server = Fastify({ logger: true });

async function initServer() {
  await server.register(cors, { origin: true });
  await server.register(jwt, { secret: process.env.JWT_SECRET || 'abvfoods-secret-key-2026' });

  server.get('/', async () => {
    return { status: 'OK', system: 'AbvFoods Tracker API v1.1.0', time: new Date() };
  });

  server.get('/api/v1/health', async () => {
    return { status: 'OK', system: 'AbvFoods Tracker API v1.1.0', time: new Date() };
  });

  // 1. UNIT ECONOMICS SPECIFICATION & CALCULATOR (DISTRIBUTOR ₹145 & WHOLESALER ₹155)
  server.get('/api/v1/economics/unit-standard', async () => {
    return {
      success: true,
      data: {
        product: "160ml PET Bottle (30 Bottles / Peti)",
        landedUnitCost: 4.377,
        landedPetiCost: 131.31,
        materialBomPeti: 118.11,
        overheadsPeti: 13.20,
        itemizedBreakdown: [
          { item: 'PET Bottle (160ml)', costPerBottle: 2.59, costPerPeti: 77.70, category: 'Packaging' },
          { item: 'Cap (28mm)', costPerBottle: 0.60, costPerPeti: 18.00, category: 'Packaging' },
          { item: 'Shrink Sleeve Label', costPerBottle: 0.17, costPerPeti: 5.10, category: 'Packaging' },
          { item: 'Sugar', costPerBottle: 0.24, costPerPeti: 7.20, category: 'Ingredient' },
          { item: 'Sucralose', costPerBottle: 0.04, costPerPeti: 1.20, category: 'Ingredient' },
          { item: 'Sodium Benzoate', costPerBottle: 0.006, costPerPeti: 0.18, category: 'Preservative' },
          { item: 'Liquid Colour', costPerBottle: 0.001, costPerPeti: 0.03, category: 'Ingredient' },
          { item: 'Maharaj Flavour', costPerBottle: 0.10, costPerPeti: 3.00, category: 'Ingredient' },
          { item: 'Apollo Flavour', costPerBottle: 0.10, costPerPeti: 3.00, category: 'Ingredient' },
          { item: 'CO2 (Carbonation)', costPerBottle: 0.06, costPerPeti: 1.80, category: 'Gas' },
          { item: 'Printing', costPerBottle: 0.03, costPerPeti: 0.90, category: 'Packaging' },
          { item: 'Electricity & Power', costPerBottle: 0.24, costPerPeti: 7.20, category: 'Factory Overhead' },
          { item: 'Labour & Wages', costPerBottle: 0.10, costPerPeti: 3.00, category: 'Factory Overhead' },
          { item: 'Other Overheads', costPerBottle: 0.10, costPerPeti: 3.00, category: 'Factory Overhead' },
        ],
        margins: [
          { tier: 'Distributor Rate', petiPrice: 145.00, netProfitPeti: 13.69, marginPercent: 9.44 },
          { tier: 'Wholesaler Rate', petiPrice: 155.00, netProfitPeti: 23.69, marginPercent: 15.28 },
          { tier: 'Direct MRP Value (₹10/btl)', petiPrice: 300.00, grossRevenuePeti: 300.00, grossProfitPeti: 168.69 },
        ]
      }
    };
  });

  // 2. DASHBOARD EXECUTIVE SUMMARY API
  server.get('/api/v1/dashboard/summary', async () => {
    const accounts = await prisma.account.findMany();
    let totalCash = 0;
    let totalBank = 0;
    accounts.forEach((acc) => {
      if (acc.accountType === 'CASH') totalCash += acc.balance;
      else totalBank += acc.balance;
    });

    const wholesalers = await prisma.wholesaler.findMany();
    const customerReceivables = wholesalers.reduce((sum, w) => sum + w.currentOutstanding, 0);

    const suppliers = await prisma.supplier.findMany();
    const supplierPayables = suppliers.reduce((sum, s) => sum + s.currentOutstanding, 0);

    const lenders = await prisma.lender.findMany();
    const totalLoanOutstanding = lenders.reduce((sum, l) => sum + l.outstandingPrincipal, 0);

    const next30Days = new Date();
    next30Days.setDate(next30Days.getDate() + 30);
    const upcomingEmis = await prisma.eMISchedule.findMany({
      where: {
        status: 'UPCOMING',
        dueDate: { lte: next30Days },
      },
      include: { lender: true },
    });
    const emiDue30Days = upcomingEmis.reduce((sum, e) => sum + e.emiAmount, 0);

    const rawMaterials = await prisma.rawMaterial.findMany();
    const lowStockMaterials = rawMaterials.filter((m) => m.currentQuantity <= m.reorderLevel);

    const finishedGoods = await prisma.finishedGoodsStock.findMany({
      include: { product: true },
    });

    const target = await prisma.salesTarget.findFirst({
      where: { periodIdentifier: '2026-09' },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySales = await prisma.salesOrder.findMany({
      where: { createdAt: { gte: today } },
    });
    const todayCasesSold = todaySales.reduce((sum, o) => sum + (o.cratesIssued || 0), 0);
    const todayRevenue = todaySales.reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      success: true,
      data: {
        financialPulse: {
          totalCash,
          totalBank,
          totalAvailableBalance: totalCash + totalBank,
          customerReceivables,
          supplierPayables,
          totalLoanOutstanding,
          emiDue30Days,
        },
        todaySummary: {
          casesSold: todayCasesSold,
          revenue: todayRevenue,
          ordersCount: todaySales.length,
        },
        targetMeter: target
          ? {
              period: target.periodIdentifier,
              targetCases: target.targetCasesCount,
              achievedCases: target.achievedCasesCount,
              targetRevenue: target.targetRevenueAmount,
              achievedRevenue: target.achievedRevenueAmount,
              percentAchieved: Math.round((target.achievedCasesCount / target.targetCasesCount) * 100),
            }
          : null,
        inventoryAlerts: {
          lowStockMaterialsCount: lowStockMaterials.length,
          lowStockMaterials: lowStockMaterials.map((m) => ({
            name: m.name,
            current: m.currentQuantity,
            reorder: m.reorderLevel,
            unit: m.unit,
          })),
          finishedGoodsCount: finishedGoods.reduce((sum, fg) => sum + fg.casesAvailable, 0),
        },
        upcomingEmis: upcomingEmis.map((e) => ({
          id: e.id,
          lenderName: e.lender.lenderName,
          dueDate: e.dueDate,
          amount: e.emiAmount,
          status: e.status,
        })),
      },
    };
  });

  // 3. PRODUCTS FULL CRUD APIs
  server.get('/api/v1/products', async () => {
    const products = await prisma.product.findMany({ include: { finishedGoods: true } });
    return { success: true, data: products };
  });

  server.post('/api/v1/products', async (request) => {
    const schema = z.object({
      name: z.string(),
      flavor: z.string(),
      bottleSizeMl: z.number().default(160),
      bottlesPerCase: z.number().default(30),
      mrpPerBottle: z.number().default(10.0),
      defaultPricePerCase: z.number().default(145.0),
      skuCode: z.string(),
    });
    const body = schema.parse(request.body);
    const product = await prisma.product.create({ data: body });
    return { success: true, data: product };
  });

  server.delete('/api/v1/products/:id', async (request) => {
    const { id } = request.params as { id: string };
    await prisma.$transaction(async (tx) => {
      await tx.finishedGoodsStock.deleteMany({ where: { productId: id } });
      await tx.recipeIngredient.deleteMany({ where: { recipe: { productId: id } } });
      await tx.recipe.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });
    return { success: true, message: 'Product deleted' };
  });

  // 4. SUPPLIERS & PURCHASES FULL CRUD APIs
  server.get('/api/v1/suppliers', async () => {
    const suppliers = await prisma.supplier.findMany({ include: { purchases: true } });
    return { success: true, data: suppliers };
  });

  server.post('/api/v1/suppliers', async (request) => {
    const schema = z.object({
      name: z.string(),
      contactPerson: z.string(),
      phone: z.string(),
      address: z.string().optional(),
      gstNumber: z.string().optional(),
      currentOutstanding: z.number().default(0.0),
    });
    const body = schema.parse(request.body);
    const supplier = await prisma.supplier.create({ data: body });
    return { success: true, data: supplier };
  });

  server.delete('/api/v1/suppliers/:id', async (request) => {
    const { id } = request.params as { id: string };
    await prisma.supplier.delete({ where: { id } });
    return { success: true, message: 'Supplier deleted successfully' };
  });

  // RAW MATERIAL PURCHASE RECORD API
  server.post('/api/v1/purchases', async (request, reply) => {
    const schema = z.object({
      supplierId: z.string(),
      invoiceNumber: z.string(),
      paymentMode: z.string().default('CASH'),
      paidAmount: z.number().default(0.0),
      items: z.array(
        z.object({
          materialId: z.string(),
          quantity: z.number(),
          rate: z.number(),
        })
      ),
    });

    const body = schema.parse(request.body);
    const totalAmount = body.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const unpaidBalance = totalAmount - body.paidAmount;

    try {
      const purchase = await prisma.$transaction(async (tx) => {
        const createdPurchase = await tx.purchase.create({
          data: {
            invoiceNumber: body.invoiceNumber,
            supplierId: body.supplierId,
            totalAmount,
            paidAmount: body.paidAmount,
            paymentMode: body.paymentMode,
            items: {
              create: body.items.map((i) => ({
                materialId: i.materialId,
                quantity: i.quantity,
                rate: i.rate,
                subtotal: i.quantity * i.rate,
              })),
            },
          },
        });

        for (const item of body.items) {
          await tx.rawMaterial.update({
            where: { id: item.materialId },
            data: {
              currentQuantity: { increment: item.quantity },
              lastPurchaseRate: item.rate,
            },
          });
        }

        if (unpaidBalance > 0) {
          await tx.supplier.update({
            where: { id: body.supplierId },
            data: { currentOutstanding: { increment: unpaidBalance } },
          });
        }

        if (body.paidAmount > 0) {
          const account = await tx.account.findFirst();
          if (account) {
            await tx.account.update({
              where: { id: account.id },
              data: { balance: { decrement: body.paidAmount } },
            });
          }
        }

        return createdPurchase;
      });

      return { success: true, data: purchase };
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message });
    }
  });

  // RAW MATERIALS CRUD
  server.get('/api/v1/raw-materials', async () => {
    const materials = await prisma.rawMaterial.findMany();
    return { success: true, data: materials };
  });

  server.post('/api/v1/raw-materials', async (request) => {
    const schema = z.object({
      name: z.string(),
      unit: z.string().default('KG'),
      currentQuantity: z.number().default(0.0),
      reorderLevel: z.number().default(100.0),
      lastPurchaseRate: z.number().default(0.0),
    });
    const body = schema.parse(request.body);
    const material = await prisma.rawMaterial.create({ data: body });
    return { success: true, data: material };
  });

  server.delete('/api/v1/raw-materials/:id', async (request) => {
    const { id } = request.params as { id: string };
    await prisma.rawMaterial.delete({ where: { id } });
    return { success: true, message: 'Raw Material deleted' };
  });

  // 5. PRODUCTION BATCHES CRUD APIs
  server.get('/api/v1/production/batches', async () => {
    const batches = await prisma.productionBatch.findMany({
      include: { product: true, rejections: true, finishedGoods: true },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: batches };
  });

  server.post('/api/v1/production/complete-batch', async (request, reply) => {
    const schema = z.object({
      productId: z.string(),
      recipeId: z.string().optional(),
      batchNumber: z.string(),
      batchSizeLiters: z.number(),
      actualCasesProduced: z.number(),
      mfgDate: z.string(),
      expDate: z.string(),
    });

    const body = schema.parse(request.body);

    let recipeId = body.recipeId;
    if (!recipeId) {
      const existingRecipe = await prisma.recipe.findFirst({ where: { productId: body.productId } });
      if (existingRecipe) {
        recipeId = existingRecipe.id;
      } else {
        const newRecipe = await prisma.recipe.create({
          data: {
            productId: body.productId,
            standardBatchLiters: body.batchSizeLiters,
            description: 'Standard Production Recipe',
          },
        });
        recipeId = newRecipe.id;
      }
    }

    const batch = await prisma.$transaction(async (tx) => {
      const createdBatch = await tx.productionBatch.create({
        data: {
          batchNumber: body.batchNumber,
          productId: body.productId,
          recipeId: recipeId!,
          batchSizeLiters: body.batchSizeLiters,
          actualCasesProduced: body.actualCasesProduced,
          mfgDate: new Date(body.mfgDate),
          expDate: new Date(body.expDate),
          status: 'COMPLETED',
        },
      });

      await tx.finishedGoodsStock.create({
        data: {
          productId: body.productId,
          batchId: createdBatch.id,
          casesAvailable: body.actualCasesProduced,
        },
      });

      return createdBatch;
    });

    return { success: true, data: batch };
  });

  server.delete('/api/v1/production/batches/:id', async (request) => {
    const { id } = request.params as { id: string };

    await prisma.$transaction(async (tx) => {
      await tx.finishedGoodsStock.deleteMany({ where: { batchId: id } });
      await tx.productionLoss.deleteMany({ where: { batchId: id } });
      await tx.productionBatch.delete({ where: { id } });
    });

    return { success: true, message: 'Production batch removed successfully' };
  });

  // 6. WHOLESALERS FULL CRUD APIs
  server.get('/api/v1/wholesalers', async () => {
    const wholesalers = await prisma.wholesaler.findMany({
      include: { salesOrders: true, payments: true },
    });
    return { success: true, data: wholesalers };
  });

  server.post('/api/v1/wholesalers', async (request) => {
    const schema = z.object({
      businessName: z.string(),
      contactPerson: z.string(),
      mobile: z.string(),
      address: z.string().optional(),
      creditLimit: z.number().default(50000.0),
    });
    const body = schema.parse(request.body);
    const wholesaler = await prisma.wholesaler.create({
      data: {
        ...body,
        pricingTier: 'NUMERIC_RATE',
      },
    });
    return { success: true, data: wholesaler };
  });

  server.delete('/api/v1/wholesalers/:id', async (request) => {
    const { id } = request.params as { id: string };
    await prisma.$transaction(async (tx) => {
      await tx.wholesalerPayment.deleteMany({ where: { wholesalerId: id } });
      await tx.wholesalerLedger.deleteMany({ where: { wholesalerId: id } });
      await tx.crateTransaction.deleteMany({ where: { wholesalerId: id } });
      await tx.wholesaler.delete({ where: { id } });
    });
    return { success: true, message: 'Wholesaler deleted successfully' };
  });

  // 7. LENDERS & LOANS FULL CRUD APIs
  server.get('/api/v1/finance/lenders', async () => {
    const lenders = await prisma.lender.findMany({
      include: { emiSchedules: true },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: lenders };
  });

  server.post('/api/v1/finance/lenders', async (request) => {
    const schema = z.object({
      lenderName: z.string(),
      lenderType: z.string().default('BANK'),
      accountNumber: z.string(),
      principalGranted: z.number(),
      outstandingPrincipal: z.number(),
      annualInterestRate: z.number(),
      monthlyEmiAmount: z.number(),
      tenureMonths: z.number(),
      startDate: z.string().default(new Date().toISOString().slice(0, 10)),
    });

    const body = schema.parse(request.body);

    const lender = await prisma.$transaction(async (tx) => {
      const createdLender = await tx.lender.create({
        data: {
          lenderName: body.lenderName,
          lenderType: body.lenderType,
          accountNumber: body.accountNumber,
          principalGranted: body.principalGranted,
          outstandingPrincipal: body.outstandingPrincipal,
          annualInterestRate: body.annualInterestRate,
          monthlyEmiAmount: body.monthlyEmiAmount,
          tenureMonths: body.tenureMonths,
          startDate: new Date(body.startDate),
        },
      });

      const nextDueDate = new Date();
      nextDueDate.setDate(nextDueDate.getDate() + 30);
      const interestEst = (body.outstandingPrincipal * (body.annualInterestRate / 100)) / 12;
      const principalEst = body.monthlyEmiAmount - interestEst;

      await tx.eMISchedule.create({
        data: {
          lenderId: createdLender.id,
          installmentNo: 1,
          dueDate: nextDueDate,
          emiAmount: body.monthlyEmiAmount,
          principalComponent: Math.max(0, principalEst),
          interestComponent: Math.max(0, interestEst),
          status: 'UPCOMING',
        },
      });

      return createdLender;
    });

    return { success: true, data: lender };
  });

  server.delete('/api/v1/finance/lenders/:id', async (request) => {
    const { id } = request.params as { id: string };
    await prisma.$transaction(async (tx) => {
      await tx.eMISchedule.deleteMany({ where: { lenderId: id } });
      await tx.lender.delete({ where: { id } });
    });
    return { success: true, message: 'Lender Loan profile deleted successfully' };
  });

  server.post('/api/v1/finance/emis/:id/pay', async (request, reply) => {
    const { id } = request.params as { id: string };
    const emi = await prisma.eMISchedule.findUnique({
      where: { id },
      include: { lender: true },
    });

    if (!emi) return reply.status(404).send({ success: false, error: 'EMI schedule not found' });

    await prisma.$transaction(async (tx) => {
      await tx.eMISchedule.update({
        where: { id },
        data: { status: 'PAID', paidDate: new Date() },
      });

      await tx.lender.update({
        where: { id: emi.lenderId },
        data: { outstandingPrincipal: { decrement: emi.principalComponent } },
      });

      await tx.factoryExpense.create({
        data: {
          category: 'LOAN_INTEREST',
          amount: emi.interestComponent,
          paymentMode: 'BANK',
          notes: `Interest component for ${emi.lender.lenderName} EMI #${emi.installmentNo}`,
        },
      });

      const bank = await tx.account.findFirst({ where: { accountType: 'BANK' } });
      if (bank) {
        await tx.account.update({
          where: { id: bank.id },
          data: { balance: { decrement: emi.emiAmount } },
        });
      }
    });

    return { success: true, message: 'EMI Paid successfully. Principal updated & interest logged.' };
  });

  // 8. EMPLOYEES CRUD APIs
  server.get('/api/v1/employees', async () => {
    const employees = await prisma.employee.findMany({
      include: { advances: true, payrolls: true },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: employees };
  });

  server.post('/api/v1/employees', async (request) => {
    const schema = z.object({
      name: z.string(),
      phone: z.string(),
      designation: z.string(),
      wageType: z.string(),
      baseRate: z.number(),
    });
    const body = schema.parse(request.body);
    const employee = await prisma.employee.create({ data: body });
    return { success: true, data: employee };
  });

  server.put('/api/v1/employees/:id', async (request) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      designation: z.string().optional(),
      wageType: z.string().optional(),
      baseRate: z.number().optional(),
      isActive: z.boolean().optional(),
    });
    const body = schema.parse(request.body);
    const updated = await prisma.employee.update({
      where: { id },
      data: body,
    });
    return { success: true, data: updated };
  });

  server.delete('/api/v1/employees/:id', async (request) => {
    const { id } = request.params as { id: string };
    await prisma.$transaction(async (tx) => {
      await tx.salaryAdvance.deleteMany({ where: { employeeId: id } });
      await tx.payrollRecord.deleteMany({ where: { employeeId: id } });
      await tx.employee.delete({ where: { id } });
    });
    return { success: true, message: 'Employee deleted successfully' };
  });

  // 8B. SALARY ADVANCES CRUD APIs
  server.get('/api/v1/employees/salary-advances', async () => {
    const advances = await prisma.salaryAdvance.findMany({
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: advances };
  });

  server.post('/api/v1/employees/salary-advances', async (request) => {
    const schema = z.object({
      employeeId: z.string(),
      amount: z.number().positive(),
      accountId: z.string().optional(),
      notes: z.string().optional(),
    });
    const body = schema.parse(request.body);

    const advance = await prisma.$transaction(async (tx) => {
      const adv = await tx.salaryAdvance.create({
        data: {
          employeeId: body.employeeId,
          amount: body.amount,
          notes: body.notes || 'Salary Advance Issued',
          status: 'OPEN',
        },
      });

      await tx.employee.update({
        where: { id: body.employeeId },
        data: { advanceBalance: { increment: body.amount } },
      });

      if (body.accountId) {
        await tx.account.update({
          where: { id: body.accountId },
          data: { balance: { decrement: body.amount } },
        });

        await tx.accountTransaction.create({
          data: {
            accountId: body.accountId,
            transactionType: 'OUTFLOW',
            amount: body.amount,
            category: 'SALARY_ADVANCE',
            referenceId: adv.id,
            notes: `Salary advance to employee ID: ${body.employeeId}`,
          },
        });
      }

      return adv;
    });

    return { success: true, data: advance, message: 'Salary advance recorded successfully.' };
  });

  server.delete('/api/v1/employees/salary-advances/:id', async (request) => {
    const { id } = request.params as { id: string };

    await prisma.$transaction(async (tx) => {
      const adv = await tx.salaryAdvance.findUnique({ where: { id } });
      if (adv) {
        await tx.employee.update({
          where: { id: adv.employeeId },
          data: { advanceBalance: { decrement: adv.amount } },
        });
        await tx.salaryAdvance.delete({ where: { id } });
      }
    });

    return { success: true, message: 'Salary advance record deleted.' };
  });

  // 8C. PAYROLL SETTLEMENT CRUD APIs
  server.get('/api/v1/employees/payrolls', async () => {
    const payrolls = await prisma.payrollRecord.findMany({
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: payrolls };
  });

  server.post('/api/v1/employees/payrolls', async (request) => {
    const schema = z.object({
      employeeId: z.string(),
      periodMonth: z.number().min(1).max(12),
      periodYear: z.number().min(2020),
      grossSalary: z.number().nonnegative(),
      advanceDeducted: z.number().nonnegative().default(0),
      paymentMode: z.string(),
      accountId: z.string().optional(),
    });
    const body = schema.parse(request.body);
    const netPaid = body.grossSalary - body.advanceDeducted;

    const payroll = await prisma.$transaction(async (tx) => {
      const record = await tx.payrollRecord.create({
        data: {
          employeeId: body.employeeId,
          periodMonth: body.periodMonth,
          periodYear: body.periodYear,
          grossSalary: body.grossSalary,
          advanceDeducted: body.advanceDeducted,
          netPaid,
          paymentMode: body.paymentMode,
        },
      });

      if (body.advanceDeducted > 0) {
        await tx.employee.update({
          where: { id: body.employeeId },
          data: { advanceBalance: { decrement: body.advanceDeducted } },
        });
      }

      if (body.accountId && netPaid > 0) {
        await tx.account.update({
          where: { id: body.accountId },
          data: { balance: { decrement: netPaid } },
        });

        await tx.accountTransaction.create({
          data: {
            accountId: body.accountId,
            transactionType: 'OUTFLOW',
            amount: netPaid,
            category: 'PAYROLL_SETTLEMENT',
            referenceId: record.id,
            notes: `Payroll paid for ${body.periodMonth}/${body.periodYear}`,
          },
        });
      }

      return record;
    });

    return { success: true, data: payroll, message: 'Payroll processed and logged successfully.' };
  });

  server.delete('/api/v1/employees/payrolls/:id', async (request) => {
    const { id } = request.params as { id: string };

    await prisma.$transaction(async (tx) => {
      const record = await tx.payrollRecord.findUnique({ where: { id } });
      if (record) {
        if (record.advanceDeducted > 0) {
          await tx.employee.update({
            where: { id: record.employeeId },
            data: { advanceBalance: { increment: record.advanceDeducted } },
          });
        }
        await tx.payrollRecord.delete({ where: { id } });
      }
    });

    return { success: true, message: 'Payroll record deleted successfully.' };
  });

  // Start listening (DYNAMIC PORT FOR RENDER.COM DEPLOYMENT)
  try {
    const port = Number(process.env.PORT) || 5000;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 AbvFoods Tracker Fastify Server running on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

initServer();
