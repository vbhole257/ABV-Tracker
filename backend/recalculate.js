const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('=== STARTING RECALCULATION FROM ₹0.00 BASE (NO LENDING AFFECTS) ===');

  // 1. Clean up accounts, ensure Cash Box and Online Bank exist
  let cashAcc = await prisma.account.findFirst({ where: { accountType: 'CASH' } });
  if (!cashAcc) {
    cashAcc = await prisma.account.create({
      data: { id: 'acc-cash-01', accountName: 'Factory Cash Box', accountType: 'CASH', balance: 0.0 }
    });
  }

  let bankAcc = await prisma.account.findFirst({ where: { accountType: 'BANK' } });
  if (!bankAcc) {
    bankAcc = await prisma.account.create({
      data: { id: 'acc-bank-01', accountName: 'Online Bank Account', accountType: 'BANK', balance: 0.0 }
    });
  }

  // Delete legacy temporary capital lender if any
  await prisma.lender.deleteMany({
    where: { id: 'lender-capital-01' }
  });

  // Remove any legacy extra accounts
  await prisma.account.deleteMany({
    where: { id: { notIn: [cashAcc.id, bankAcc.id] } }
  });

  // 2. Base starts at 0.0 (No lending effects)
  let computedCash = 0.0;
  let computedBank = 0.0;

  // Inflows: Sales Orders paid amounts
  const sales = await prisma.salesOrder.findMany();
  for (const s of sales) {
    if (s.paidAmount > 0) {
      const isCash = (s.paymentMode || 'CASH').toUpperCase() === 'CASH';
      if (isCash) computedCash += s.paidAmount;
      else computedBank += s.paidAmount;
    }
  }

  // Outflows: Purchases
  const purchases = await prisma.purchase.findMany();
  for (const p of purchases) {
    if (p.paidAmount > 0) {
      const isCash = (p.paymentMode || 'CASH').toUpperCase() === 'CASH';
      if (isCash) computedCash -= p.paidAmount;
      else computedBank -= p.paidAmount;
    }
  }

  // Outflows: Expenses (Factory Kharche)
  const expenses = await prisma.factoryExpense.findMany();
  for (const e of expenses) {
    const isCash = (e.paymentMode || 'CASH').toUpperCase() === 'CASH';
    if (isCash) computedCash -= e.amount;
    else computedBank -= e.amount;
  }

  // Outflows: Payroll Records
  try {
    const payrolls = await prisma.payrollRecord.findMany();
    for (const pay of payrolls) {
      if (pay.netPaid > 0) {
        const isCash = (pay.paymentMode || 'CASH').toUpperCase() === 'CASH';
        if (isCash) computedCash -= pay.netPaid;
        else computedBank -= pay.netPaid;
      }
    }
  } catch (err) {
    console.log('Payroll table not populated or schema mismatch, skipping payroll calculation.');
  }

  // Outflows: Salary Advances
  try {
    const advances = await prisma.salaryAdvance.findMany();
    for (const adv of advances) {
      if (adv.amount > 0) {
        computedCash -= adv.amount;
      }
    }
  } catch (err) {
    console.log('Salary advance table skip.');
  }

  // Update Account records in Database
  await prisma.account.update({
    where: { id: cashAcc.id },
    data: { balance: computedCash, accountName: 'Factory Cash Box' }
  });

  await prisma.account.update({
    where: { id: bankAcc.id },
    data: { balance: computedBank, accountName: 'Online Bank Account' }
  });

  console.log('=== RECALCULATION COMPLETE (PURE ₹0.00 BASE) ===');
  console.log(`- Base Initial Cash & Bank: ₹0.00`);
  console.log(`- Factory Cash Box Balance: ₹${computedCash.toLocaleString('en-IN')}`);
  console.log(`- Online Bank Account Balance: ₹${computedBank.toLocaleString('en-IN')}`);
  console.log(`- Net Liquidity (Cash + Bank): ₹${(computedCash + computedBank).toLocaleString('en-IN')}`);

  await prisma.$disconnect();
}

run().catch((e) => {
  console.error('Error running recalculation:', e);
  prisma.$disconnect();
});
