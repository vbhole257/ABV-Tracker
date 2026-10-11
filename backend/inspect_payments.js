const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?pgbouncer=true'
    }
  }
});

async function inspect() {
  console.log('=== INSPECTING PAYMENT MODES ACROSS PURCHASES & EXPENSES ===');

  try {
    const purchases = await prisma.purchase.findMany({ include: { supplier: true } });
    console.log('\n--- PURCHASES ---');
    purchases.forEach((p) => {
      console.log(`Invoice #${p.invoiceNumber} | Supplier: ${p.supplier ? p.supplier.name : p.supplierId} | Total: ₹${p.totalAmount} | Paid: ₹${p.paidAmount} | Mode: ${p.paymentMode}`);
    });
  } catch (e) {
    console.log('Error fetching purchases:', e.message);
  }

  try {
    const expenses = await prisma.factoryExpense.findMany();
    console.log('\n--- FACTORY EXPENSES ---');
    expenses.forEach((e) => {
      console.log(`Expense ID: ${e.id} | Category: ${e.category} | Amount: ₹${e.amount} | Mode: ${e.paymentMode}`);
    });
  } catch (e) {
    console.log('Error fetching expenses:', e.message);
  }

  try {
    const sales = await prisma.salesOrder.findMany({ include: { wholesaler: true } });
    console.log('\n--- SALES ORDERS ---');
    sales.forEach((s) => {
      console.log(`Sales Invoice #${s.invoiceNumber} | Wholesaler: ${s.wholesaler ? s.wholesaler.businessName : s.wholesalerId} | Total: ₹${s.totalAmount} | Paid: ₹${s.paidAmount} | Mode: ${(s).paymentMode || 'CASH'}`);
    });
  } catch (e) {
    console.log('Error fetching sales:', e.message);
  }

  await prisma.$disconnect();
}

inspect();
