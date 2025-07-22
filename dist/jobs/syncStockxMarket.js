"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncStockxMarket = syncStockxMarket;
const prisma_1 = require("../utils/prisma");
const stockxAuth_1 = require("../utils/stockxAuth");
async function syncStockxMarket() {
    // ---------------- Distributed lock ----------------
    const lockName = 'stockx-sync';
    const lockTtlMs = 25 * 60 * 1000; // 25-minute TTL
    try {
        await prisma_1.prisma.jobLock.create({
            data: {
                name: lockName,
                expiresAt: new Date(Date.now() + lockTtlMs),
            },
        });
    }
    catch (err) {
        // If unique constraint violation, another instance is already running the job
        if (err.code === 'P2002' || err.meta?.cause?.includes('Unique')) {
            console.log('[syncStockxMarket] Another instance holds the lock – skipping');
            return;
        }
        // other errors propagate
        throw err;
    }
    try {
        const variants = await prisma_1.prisma.variant.findMany({
            where: { stockxProductId: { not: null } },
        });
        for (const variant of variants) {
            try {
                const res = await (0, stockxAuth_1.fetchWithAuth)(`https://api.stockx.com/v2/products/${variant.stockxProductId}/market`);
                if (!res.ok) {
                    console.error(`StockX market fetch failed for variant ${variant.id}: ${res.status}`);
                    continue;
                }
                const data = await res.json();
                if (!data?.Product?.market)
                    continue;
                const m = data.Product.market;
                const now = new Date();
                const rows = [
                    { type: 'lowestAsk', price: m.lowestAsk },
                    { type: 'highestBid', price: m.highestBid },
                    { type: 'lastSale', price: m.lastSale },
                ].filter(r => typeof r.price === 'number' && !isNaN(r.price));
                for (const r of rows) {
                    await prisma_1.prisma.stockXPrice.create({
                        data: {
                            variantId: variant.id,
                            type: r.type,
                            price: r.price,
                            fetchedAt: now,
                        },
                    });
                }
            }
            catch (err) {
                console.error('syncStockxMarket error', err);
            }
        }
    }
    finally {
        // Release lock (ignore errors)
        await prisma_1.prisma.jobLock.delete({ where: { name: lockName } }).catch(() => { });
    }
}
//# sourceMappingURL=syncStockxMarket.js.map