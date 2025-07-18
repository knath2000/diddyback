"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../utils/prisma");
const router = (0, express_1.Router)();
// GET /items
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const page = Number((_a = req.query.page) !== null && _a !== void 0 ? _a : 1);
        const limit = Math.min(Number((_b = req.query.limit) !== null && _b !== void 0 ? _b : 20), 100);
        const skip = (page - 1) * limit;
        const [items, total] = yield prisma_1.prisma.$transaction([
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
}));
// GET /items/:id
router.get('/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const item = yield prisma_1.prisma.item.findFirst({
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
}));
// GET /items/:id/prices
router.get('/:id/prices', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const platform = (_a = req.query.platform) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        const limit = Math.min(Number((_b = req.query.limit) !== null && _b !== void 0 ? _b : 1000), 5000);
        const variants = yield prisma_1.prisma.variant.findMany({
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
        const [prices, total] = yield prisma_1.prisma.$transaction([
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
}));
exports.default = router;
