import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../utils/prisma'

const router = Router()

// GET /items
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page ?? 1)
    const limit = Math.min(Number(req.query.limit ?? 20), 100)
    const skip = (page - 1) * limit

    const [items, total] = await prisma.$transaction([
      prisma.item.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          variants: {
            select: {
              id: true,
              size: true,
              color: true,
            },
          },
        },
      }),
      prisma.item.count(),
    ])

    res.json({
      data: items,
      meta: {
        total,
        page,
        hasMore: skip + items.length < total,
      },
      timestamps: {
        dataAsOf: new Date().toISOString(),
        requestedAt: new Date().toISOString(),
      },
    })
  } catch (err) {
    next(err)
  }
})

// GET /items/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const item = await prisma.item.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        variants: {
          include: {
            prices: {
              orderBy: { capturedAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    })

    if (!item) {
      return res.status(404).json({ error: 'Item not found' })
    }

    res.json({
      data: item,
      timestamps: {
        dataAsOf: new Date().toISOString(),
        requestedAt: new Date().toISOString(),
      },
    })
  } catch (err) {
    next(err)
  }
})

// GET /items/:id/prices
router.get('/:id/prices', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const platform = (req.query.platform as string | undefined)?.toLowerCase()
    const limit = Math.min(Number(req.query.limit ?? 1000), 5000)

    const variants = await prisma.variant.findMany({
      where: { itemId: id },
      select: { id: true },
    })

    const variantIds = variants.map((v) => v.id)
    if (variantIds.length === 0) {
      return res.json({ data: [], meta: { total: 0 } })
    }

    const where: any = { variantId: { in: variantIds } }
    if (platform) where.platform = platform

    const [prices, total] = await prisma.$transaction([
      prisma.price.findMany({
        where,
        orderBy: { capturedAt: 'desc' },
        take: limit,
      }),
      prisma.price.count({ where }),
    ])

    res.json({
      data: prices,
      meta: { total },
      timestamps: {
        dataAsOf: new Date().toISOString(),
        requestedAt: new Date().toISOString(),
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router 