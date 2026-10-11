const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanBank() {
  console.log('=== CLEANING TEST BANK EXPENSES & RECALCULATING ===');

  // Delete sample test EMI loan interest bank expense
  await prisma.factoryExpense.deleteMany({
    where: { category: 'LOAN_INTEREST' }
  });

  // Ensure 2 accounts: Cash Box and Online Bank Account
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

  // Remove any extra accounts
  await prisma.account.deleteMany({
    where: { id: { notIn: [cashAcc.id, bankAcc.id] } }
  });

  // Calculate actual Cash and Bank
  let computedCash = 0.0;
  let computedBank = 0.0;

  // Inflows: Sales
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

  // Outflows: Factory Expenses
  const expenses = await prisma.factoryExpense.findMany();
  for (const e of expenses) {
    const isCash = (e.paymentMode || 'CASH').toUpperCase() === 'CASH';
    if (isCash) computedCash -= e.amount;
    else computedBank -= e.amount;
  }

  // Update DB accounts
  await prisma.account.update({
    where: { id: cashAcc.id },
    data: { balance: computedCash, accountName: 'Factory Cash Box' }
  });

  await prisma.account.update({
    where: { id: bankAcc.id },
    data: { balance: computedBank, accountName: 'Online Bank Account' }
  });

  console.log('=== PURE ₹0.00 RECALCULATION COMPLETE ===');
  console.log(`- Base Initial Cash & Bank: ₹0.00`);
  console.log(`- Factory Cash Box Balance: ₹${computedCash.toLocaleString('en-IN')}`);
  console.log(`- Online Bank Account Balance: ₹${computedBank.toLocaleString('en-IN')}`);
  console.log(`- Combined Total Liquidity: ₹${(computedCash + computedBank).toLocaleString('en-IN')}`);

  await prisma.$disconnect();
}

cleanBank().catch((e) => {
  console.error(e);
  prisma.$disconnect();
});
