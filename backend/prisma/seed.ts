import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding AbvFoods Tracker database...');

  // 1. Create Users
  const passwordHash = await bcrypt.hash('admin123', 10);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@abvfoods.com' },
    update: {},
    create: {
      name: 'AbvFoods Owner',
      email: 'owner@abvfoods.com',
      passwordHash,
      role: 'OWNER',
    },
  });

  await prisma.user.upsert({
    where: { email: 'manager@abvfoods.com' },
    update: {},
    create: {
      name: 'Factory Floor Manager',
      email: 'manager@abvfoods.com',
      passwordHash,
      role: 'FACTORY_MANAGER',
    },
  });

  await prisma.user.upsert({
    where: { email: 'sales@abvfoods.com' },
    update: {},
    create: {
      name: 'Dispatch Sales Rep',
      email: 'sales@abvfoods.com',
      passwordHash,
      role: 'DISPATCH_SALES',
    },
  });

  console.log('✅ Users created');

  // 2. Create Accounts
  const cashAccount = await prisma.account.create({
    data: {
      accountName: 'Factory Cash Box',
      accountType: 'CASH',
      balance: 140000.0,
    },
  });

  const bankAccount = await prisma.account.create({
    data: {
      accountName: 'HDFC Current Bank Account',
      accountType: 'BANK',
      accountNo: '50200049281001',
      balance: 820000.0,
    },
  });

  const upiAccount = await prisma.account.create({
    data: {
      accountName: 'Factory UPI Merchant Account',
      accountType: 'UPI',
      balance: 50000.0,
    },
  });

  console.log('✅ Cash & Bank Accounts created');

  // 3. Create Products / SKUs
  const jeeraProduct = await prisma.product.create({
    data: {
      name: 'Jeera Masala 160ml',
      flavor: 'Jeera',
      bottleSizeMl: 160,
      bottlesPerCase: 30,
      mrpPerBottle: 10.0,
      defaultPricePerCase: 270.0,
      skuCode: 'JEERA-160-30',
    },
  });

  const colaProduct = await prisma.product.create({
    data: {
      name: 'Cola Carbonated 200ml',
      flavor: 'Cola',
      bottleSizeMl: 200,
      bottlesPerCase: 24,
      mrpPerBottle: 15.0,
      defaultPricePerCase: 310.0,
      skuCode: 'COLA-200-24',
    },
  });

  const orangeProduct = await prisma.product.create({
    data: {
      name: 'Orange Refresh 500ml',
      flavor: 'Orange',
      bottleSizeMl: 500,
      bottlesPerCase: 12,
      mrpPerBottle: 25.0,
      defaultPricePerCase: 260.0,
      skuCode: 'ORANGE-500-12',
    },
  });

  console.log('✅ Products created');

  // 4. Create Raw Materials
  const sugarMat = await prisma.rawMaterial.create({
    data: {
      name: 'Refined Sugar',
      currentQuantity: 450.0,
      unit: 'KG',
      reorderLevel: 500.0,
      lastPurchaseRate: 42.0,
    },
  });

  const flavorMat = await prisma.rawMaterial.create({
    data: {
      name: 'Jeera Concentrate Flavor',
      currentQuantity: 25.0,
      unit: 'LITER',
      reorderLevel: 10.0,
      lastPurchaseRate: 850.0,
    },
  });

  const co2Mat = await prisma.rawMaterial.create({
    data: {
      name: 'Food Grade CO2 Gas',
      currentQuantity: 60.0,
      unit: 'KG',
      reorderLevel: 30.0,
      lastPurchaseRate: 65.0,
    },
  });

  const preformMat = await prisma.rawMaterial.create({
    data: {
      name: 'PET 160ml Preforms',
      currentQuantity: 18500.0,
      unit: 'PCS',
      reorderLevel: 5000.0,
      lastPurchaseRate: 1.2,
    },
  });

  const capMat = await prisma.rawMaterial.create({
    data: {
      name: '28mm Plastic Caps',
      currentQuantity: 14200.0,
      unit: 'PCS',
      reorderLevel: 5000.0,
      lastPurchaseRate: 0.45,
    },
  });

  console.log('✅ Raw Materials created');

  // 5. Recipe
  const jeeraRecipe = await prisma.recipe.create({
    data: {
      productId: jeeraProduct.id,
      standardBatchLiters: 1000.0,
      description: 'Standard 1,000 L Jeera Syrup & Carbonation Mix',
      ingredients: {
        create: [
          { materialId: sugarMat.id, requiredQuantity: 95.0, unit: 'KG' },
          { materialId: flavorMat.id, requiredQuantity: 5.0, unit: 'LITER' },
          { materialId: co2Mat.id, requiredQuantity: 12.0, unit: 'KG' },
          { materialId: preformMat.id, requiredQuantity: 6250.0, unit: 'PCS' },
          { materialId: capMat.id, requiredQuantity: 6250.0, unit: 'PCS' },
        ],
      },
    },
  });

  // 6. Production Batch
  const batch1 = await prisma.productionBatch.create({
    data: {
      batchNumber: 'J26092301',
      productId: jeeraProduct.id,
      recipeId: jeeraRecipe.id,
      batchSizeLiters: 1000.0,
      actualCasesProduced: 500,
      mfgDate: new Date('2026-09-23'),
      expDate: new Date('2027-03-23'),
      status: 'COMPLETED',
    },
  });

  await prisma.finishedGoodsStock.create({
    data: {
      productId: jeeraProduct.id,
      batchId: batch1.id,
      casesAvailable: 320,
    },
  });

  console.log('✅ Production Batch & Finished Goods created');

  // 7. Suppliers
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'Imperial Sugar Mills Ltd',
      contactPerson: 'Harish Mehta',
      phone: '+91 98220 11223',
      address: 'Sugar Factory Complex, Sector 4',
      currentOutstanding: 45000.0,
    },
  });

  console.log('✅ Suppliers created');

  // 8. Wholesalers
  const wholesaler1 = await prisma.wholesaler.create({
    data: {
      businessName: 'Metro Cold Drink Distributor',
      contactPerson: 'Sanjay Gupta',
      mobile: '+91 98901 55443',
      address: 'Shop 14, Wholesale Beverage Market',
      creditLimit: 100000.0,
      currentOutstanding: 42000.0,
      cratesHeld: 85,
    },
  });

  const wholesaler2 = await prisma.wholesaler.create({
    data: {
      businessName: 'City Beverage Wholesalers',
      contactPerson: 'Anil Agarwal',
      mobile: '+91 97654 32100',
      address: 'Plot 88, Industrial Trading Estate',
      creditLimit: 75000.0,
      currentOutstanding: 18500.0,
      cratesHeld: 40,
    },
  });

  console.log('✅ Wholesalers created');

  // 9. Lenders & EMI Schedule
  const hdfcLender = await prisma.lender.create({
    data: {
      lenderName: 'HDFC Bank Factory Loan',
      lenderType: 'BANK',
      accountNumber: 'TL-9948102941',
      principalGranted: 2500000.0,
      outstandingPrincipal: 1500000.0,
      annualInterestRate: 9.5,
      monthlyEmiAmount: 45000.0,
      tenureMonths: 60,
      startDate: new Date('2025-01-10'),
    },
  });

  await prisma.eMISchedule.create({
    data: {
      lenderId: hdfcLender.id,
      installmentNo: 21,
      dueDate: new Date('2026-09-28'),
      emiAmount: 45000.0,
      principalComponent: 33125.0,
      interestComponent: 11875.0,
      status: 'UPCOMING',
    },
  });

  console.log('✅ Lenders & EMI Schedules created');

  // 10. Target
  await prisma.salesTarget.create({
    data: {
      targetType: 'MONTHLY',
      periodIdentifier: '2026-09',
      targetCasesCount: 10000,
      targetRevenueAmount: 1800000.0,
      achievedCasesCount: 7800,
      achievedRevenueAmount: 1404000.0,
      status: 'IN_PROGRESS',
    },
  });

  console.log('✅ Sales Targets created');

  // 11. Employees
  const emp1 = await prisma.employee.create({
    data: {
      name: 'Ramesh Kumar',
      phone: '+91 98111 22334',
      designation: 'Factory Supervisor',
      wageType: 'MONTHLY_FIXED',
      baseRate: 22000.0,
      advanceBalance: 5000.0,
    },
  });

  await prisma.salaryAdvance.create({
    data: {
      employeeId: emp1.id,
      amount: 5000.0,
      advanceDate: new Date('2026-09-12'),
      notes: 'Festival advance for Diwali preparation',
      status: 'OPEN',
    },
  });

  console.log('✅ Employees & Salary Advances created');
  console.log('🎉 Seeding complete successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
