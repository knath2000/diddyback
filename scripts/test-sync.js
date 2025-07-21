require('dotenv').config();
const { syncStockxMarket } = require('../src/jobs/syncStockxMarket');
const { PrismaClient } = require('@prisma/client');

(async () => {
  console.log('🧪 Testing StockX price sync...');
  try {
    await syncStockxMarket();
    console.log('✅ Sync completed!');

    const prisma = new PrismaClient();
    const count = await prisma.stockXPrice.count();
    console.log(`📊 Total StockXPrice rows: ${count}`);

    const recent = await prisma.stockXPrice.findMany({
      take: 5,
      orderBy: { fetchedAt: 'desc' },
      include: { variant: { include: { item: true } } },
    });

    recent.forEach((p) => {
      console.log(`→ ${p.variant.item.title} (${p.variant.size}) ${p.type}: $${p.price}`);
    });

    await prisma.$disconnect();
  } catch (err) {
    console.error('❌ Sync failed:', err.message);
  }
})(); 