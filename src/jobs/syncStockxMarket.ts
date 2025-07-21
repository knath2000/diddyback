import { prisma } from '../utils/prisma'
import { fetchWithAuth } from '../utils/stockxAuth'

export async function syncStockxMarket() {
  // Cast to any to bypass type checking until updated Prisma types
  const items = await (prisma.item as any).findMany({
    where: { stockxProductId: { not: null } },
  })

  for (const item of items) {
    try {
      const res = await fetchWithAuth(`https://api.stockx.com/v2/products/${(item as any).stockxProductId}/market`)
      if (!res.ok) {
        console.error('StockX market fetch failed', item.id, res.status)
        continue
      }
      const data = await res.json() as any
      if (!data?.Product?.market) continue
      const m = data.Product.market
      const now = new Date()
      const rows = [
        { type: 'lowestAsk', price: m.lowestAsk },
        { type: 'highestBid', price: m.highestBid },
        { type: 'lastSale',  price: m.lastSale  },
      ].filter(r => typeof r.price === 'number' && !isNaN(r.price))

      for (const r of rows) {
        // @ts-ignore – model added in new migration
        await prisma.stockXPrice.create({
          data: {
            itemId: item.id,
            size: null,
            type: r.type,
            price: r.price,
            fetchedAt: now,
          },
        })
      }
    } catch (err) {
      console.error('syncStockxMarket error', err)
    }
  }
} 