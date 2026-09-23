import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Seeding 2 Fixed Products (Jeeru Masala & Orange Soda) with ₹145/Peti Distributor & ₹155/Peti Wholesaler rates...');

  // Delete all records
  await prisma.auditLog.deleteMany();
  await prisma.eMISchedule.deleteMany();
  await prisma.lender.deleteMany();
  await prisma.accountTransaction.deleteMany();
  await prisma.payrollRecord.deleteMany();
  await prisma.salaryAdvance.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.factoryExpense.deleteMany();
  await prisma.salesTarget.deleteMany();
  await prisma.crateTransaction.deleteMany();
  await prisma.wholesalerPayment.deleteMany();
  await prisma.wholesalerLedger.deleteMany();
  await prisma.salesOrderItem.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.wholesaler.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.finishedGoodsStock.deleteMany();
  await prisma.productionLoss.deleteMany();
  await prisma.productionBatch.deleteMany();
  await prisma.recipeIngredient.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.rawMaterial.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.product.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create 1 Default Owner Admin User
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      name: 'Owner Admin',
      email: 'owner@abvfoods.com',
      passwordHash,
      role: 'OWNER',
    },
  });

  // Initialize Default Accounts (0 balance)
  await prisma.account.createMany({
    data: [
      { accountName: 'Factory Cash Box', accountType: 'CASH', balance: 0.0 },
      { accountName: 'Current Bank Account', accountType: 'BANK', balance: 0.0 },
      { accountName: 'UPI Merchant Account', accountType: 'UPI', balance: 0.0 },
    ],
  });

  // Seed 2 Fixed Core Products (160ml PET, 30 btl/Peti)
  const jeeru = await prisma.product.create({
    data: {
      name: 'Jeeru Masala 160ml',
      flavor: 'Jeeru',
      bottleSizeMl: 160,
      bottlesPerCase: 30,
      mrpPerBottle: 10.0,
      defaultPricePerCase: 145.0, // Distributor Rate ₹145/Peti (Wholesaler Rate ₹155/Peti)
      skuCode: 'JEERU-160-30',
    },
  });

  const orange = await prisma.product.create({
    data: {
      name: 'Orange Soda 160ml',
      flavor: 'Orange',
      bottleSizeMl: 160,
      bottlesPerCase: 30,
      mrpPerBottle: 10.0,
      defaultPricePerCase: 145.0, // Distributor Rate ₹145/Peti (Wholesaler Rate ₹155/Peti)
      skuCode: 'ORANGE-160-30',
    },
  });

  // Create standard Recipes for Jeeru & Orange
  await prisma.recipe.create({
    data: {
      productId: jeeru.id,
      standardBatchLiters: 1000.0,
      description: 'Jeeru Masala 160ml Standard Recipe (₹131.31 Landed Cost / 30-bottle Peti)',
    },
  });

  await prisma.recipe.create({
    data: {
      productId: orange.id,
      standardBatchLiters: 1000.0,
      description: 'Orange Soda 160ml Standard Recipe (₹131.31 Landed Cost / 30-bottle Peti)',
    },
  });

  console.log('✅ Database initialized with 2 Fixed Products: Jeeru Masala 160ml & Orange Soda 160ml.');
}

main()
  .catch((e) => {
    console.error('❌ Error executing clean:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
