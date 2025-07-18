"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../utils/prisma");
const router = (0, express_1.Router)();
// GET /items
router.get('/', async (req, res, next) => {
    try {
        const page = Number(req.query.page ?? 1);
        const limit = Math.min(Number(req.query.limit ?? 20), 100);
        const skip = (page - 1) * limit;
        const [items, total] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.item.findMany({
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
            prisma_1.prisma.item.count(),
        ]);
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
        });
    }
    catch (err) {
        next(err);
    }
});
// GET /items/:id
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const item = await prisma_1.prisma.item.findFirst({
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
        });
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json({
            data: item,
            timestamps: {
                dataAsOf: new Date().toISOString(),
                requestedAt: new Date().toISOString(),
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// GET /items/:id/prices
router.get('/:id/prices', async (req, res, next) => {
    try {
        const { id } = req.params;
        const platform = req.query.platform?.toLowerCase();
        const limit = Math.min(Number(req.query.limit ?? 1000), 5000);
        const variants = await prisma_1.prisma.variant.findMany({
            where: { itemId: id },
            select: { id: true },
        });
        const variantIds = variants.map((v) => v.id);
        if (variantIds.length === 0) {
            return res.json({ data: [], meta: { total: 0 } });
        }
        const where = { variantId: { in: variantIds } };
        if (platform)
            where.platform = platform;
        const [prices, total] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.price.findMany({
                where,
                orderBy: { capturedAt: 'desc' },
                take: limit,
            }),
            prisma_1.prisma.price.count({ where }),
        ]);
        res.json({
            data: prices,
            meta: { total },
            timestamps: {
                dataAsOf: new Date().toISOString(),
                requestedAt: new Date().toISOString(),
            },
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
