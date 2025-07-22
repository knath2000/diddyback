"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_express3 = __toESM(require("express"));
var import_cors = __toESM(require("cors"));
var import_dotenv = __toESM(require("dotenv"));
var import_node_cron = __toESM(require("node-cron"));

// src/utils/prisma.ts
var import_client = require("@prisma/client");
var globalForPrisma = globalThis;
var prisma = globalForPrisma.prisma ?? new import_client.PrismaClient({
  log: ["error", "warn"]
});
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// src/utils/stockxAuth.ts
var import_axios = __toESM(require("axios"));
var dotenv = __toESM(require("dotenv"));
dotenv.config();
var cachedToken = process.env.STOCKX_ACCESS_TOKEN || null;
var tokenExpiresAt = 0;
function getTokenExpiry() {
  return tokenExpiresAt;
}
async function refreshAccessToken() {
  const refreshToken = process.env.STOCKX_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error("Missing STOCKX_REFRESH_TOKEN env variable");
  }
  const clientId = process.env.STOCKX_CLIENT_ID;
  const clientSecret = process.env.STOCKX_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing StockX client credentials");
  }
  const res = await import_axios.default.post("https://accounts.stockx.com/oauth/token", {
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken
  });
  const { access_token, expires_in, refresh_token } = res.data;
  cachedToken = access_token;
  tokenExpiresAt = Date.now() + expires_in * 1e3 - 6e4;
  if (refresh_token) {
    process.env.STOCKX_REFRESH_TOKEN = refresh_token;
  }
  return cachedToken;
}
async function getAccessToken() {
  if (!cachedToken || Date.now() > tokenExpiresAt) {
    return refreshAccessToken();
  }
  return cachedToken;
}
async function fetchWithAuth(url, opts = {}) {
  const token = await getAccessToken();
  const apiKey = process.env.STOCKX_API_KEY;
  if (!apiKey) {
    throw new Error("Missing STOCKX_API_KEY env variable");
  }
  const headers = {
    "Authorization": `Bearer ${token}`,
    "x-api-key": apiKey,
    "Content-Type": "application/json",
    ...opts.headers || {}
  };
  return fetch(url, { ...opts, headers });
}

// src/jobs/syncStockxMarket.ts
async function syncStockxMarket() {
  const lockName = "stockx-sync";
  const lockTtlMs = 25 * 60 * 1e3;
  try {
    await prisma.jobLock.create({
      data: {
        name: lockName,
        expiresAt: new Date(Date.now() + lockTtlMs)
      }
    });
  } catch (err) {
    if (err.code === "P2002" || err.meta?.cause?.includes("Unique")) {
      console.log("[syncStockxMarket] Another instance holds the lock \u2013 skipping");
      return;
    }
    throw err;
  }
  try {
    const variants = await prisma.variant.findMany({
      where: { stockxProductId: { not: null } }
    });
    for (const variant of variants) {
      try {
        const res = await fetchWithAuth(`https://api.stockx.com/v2/products/${variant.stockxProductId}/market`);
        if (!res.ok) {
          console.error(`StockX market fetch failed for variant ${variant.id}: ${res.status}`);
          continue;
        }
        const data = await res.json();
        if (!data?.Product?.market) continue;
        const m = data.Product.market;
        const now = /* @__PURE__ */ new Date();
        const rows = [
          { type: "lowestAsk", price: m.lowestAsk },
          { type: "highestBid", price: m.highestBid },
          { type: "lastSale", price: m.lastSale }
        ].filter((r) => typeof r.price === "number" && !isNaN(r.price));
        for (const r of rows) {
          await prisma.stockXPrice.create({
            data: {
              variantId: variant.id,
              type: r.type,
              price: r.price,
              fetchedAt: now
            }
          });
        }
      } catch (err) {
        console.error("syncStockxMarket error", err);
      }
    }
  } finally {
    await prisma.jobLock.delete({ where: { name: lockName } }).catch(() => {
    });
  }
}

// src/routes/items.ts
var import_express = require("express");
var router = (0, import_express.Router)();
router.get("/", async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    const skip = (page - 1) * limit;
    const [items, total] = await prisma.$transaction([
      prisma.item.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          variants: {
            select: {
              id: true,
              size: true,
              color: true
            }
          }
        }
      }),
      prisma.item.count()
    ]);
    res.json({
      data: items,
      meta: {
        total,
        page,
        hasMore: skip + items.length < total
      },
      timestamps: {
        dataAsOf: (/* @__PURE__ */ new Date()).toISOString(),
        requestedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
});
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await prisma.item.findFirst({
      where: {
        OR: [{ id }, { slug: id }]
      },
      include: {
        variants: {
          include: {
            prices: {
              orderBy: { capturedAt: "desc" },
              take: 1
            },
            stockxPrices: {
              orderBy: { fetchedAt: "desc" },
              take: 3
              // latest ask, bid, last
            }
          }
        },
        // @ts-ignore - images relation will be available after prisma generate
        images: {
          orderBy: { idx: "asc" },
          select: { url: true, idx: true }
        }
      }
    });
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json({
      data: item,
      timestamps: {
        dataAsOf: (/* @__PURE__ */ new Date()).toISOString(),
        requestedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
});
router.get("/:id/prices", async (req, res, next) => {
  try {
    const { id } = req.params;
    const platform = req.query.platform?.toLowerCase();
    const limit = Math.min(Number(req.query.limit ?? 1e3), 5e3);
    const variants = await prisma.variant.findMany({
      where: { itemId: id },
      select: { id: true }
    });
    const variantIds = variants.map((v) => v.id);
    if (variantIds.length === 0) {
      return res.json({ data: [], meta: { total: 0 } });
    }
    const where = { variantId: { in: variantIds } };
    if (platform) where.platform = platform;
    const [prices, total] = await prisma.$transaction([
      prisma.price.findMany({
        where,
        orderBy: { capturedAt: "desc" },
        take: limit
      }),
      prisma.price.count({ where })
    ]);
    res.json({
      data: prices,
      meta: { total },
      timestamps: {
        dataAsOf: (/* @__PURE__ */ new Date()).toISOString(),
        requestedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
});
router.get("/:id/stockx", async (req, res, next) => {
  try {
    const { id } = req.params;
    const variant = await prisma.variant.findFirst({
      where: { itemId: id },
      select: { id: true }
    });
    if (!variant) {
      return res.json({ data: {} });
    }
    const results = await prisma.stockXPrice.findMany({
      where: { variantId: variant.id },
      orderBy: { fetchedAt: "desc" },
      take: 50
      // fetch recent then reduce
    });
    const latest = {};
    for (const r of results) {
      if (!latest[r.type]) {
        latest[r.type] = r;
      }
    }
    res.json({
      data: latest,
      timestamps: {
        dataAsOf: (/* @__PURE__ */ new Date()).toISOString(),
        requestedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
});
router.get("/:id/stockx/history", async (req, res, next) => {
  try {
    const { id } = req.params;
    const type = req.query.type ?? "lastSale";
    const days = Number(req.query.days ?? 30);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1e3);
    const variants = await prisma.variant.findMany({
      where: { itemId: id },
      select: { id: true }
    });
    const variantIds = variants.map((v) => v.id);
    const data = await prisma.stockXPrice.findMany({
      where: { variantId: { in: variantIds }, type, fetchedAt: { gte: since } },
      orderBy: { fetchedAt: "asc" }
    });
    res.json({
      data,
      meta: { count: data.length },
      timestamps: {
        dataAsOf: (/* @__PURE__ */ new Date()).toISOString(),
        requestedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
});
var items_default = router;

// src/routes/oauth.ts
var import_express2 = require("express");
var import_axios2 = __toESM(require("axios"));

// src/utils/oauthSecurity.ts
var import_crypto = __toESM(require("crypto"));
var stateStore = /* @__PURE__ */ new Map();
var STATE_TTL_MS = 10 * 60 * 1e3;
function generateState() {
  const state = import_crypto.default.randomBytes(16).toString("hex");
  stateStore.set(state, Date.now() + STATE_TTL_MS);
  return state;
}
function validateState(state) {
  const exp = stateStore.get(state);
  if (!exp) return false;
  stateStore.delete(state);
  return Date.now() <= exp;
}
function requireAdmin(req) {
  const token = req.headers["x-admin-token"] || req.query.adminToken;
  return token === process.env.OAUTH_ADMIN_TOKEN;
}

// src/routes/oauth.ts
var router2 = (0, import_express2.Router)();
var CLIENT_ID = process.env.STOCKX_CLIENT_ID;
var CLIENT_SECRET = process.env.STOCKX_CLIENT_SECRET;
var REDIRECT_URI = process.env.STOCKX_REDIRECT_URI || "http://localhost:8080/oauth/stockx/callback";
router2.get("/authorize", (_req, res) => {
  const state = generateState();
  const authUrl = `https://accounts.stockx.com/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=offline_access%20openid&audience=gateway.stockx.com&state=${state}`;
  res.redirect(authUrl);
});
router2.get("/callback", async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state || typeof code !== "string" || typeof state !== "string") {
    return res.status(400).send("Missing code or state");
  }
  if (!validateState(state)) {
    return res.status(400).send("Invalid state");
  }
  try {
    const tokenResp = await import_axios2.default.post("https://accounts.stockx.com/oauth/token", {
      grant_type: "authorization_code",
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI
    });
    const { access_token, refresh_token, expires_in } = tokenResp.data;
    process.env.STOCKX_ACCESS_TOKEN = access_token;
    process.env.STOCKX_REFRESH_TOKEN = refresh_token;
    const expireAt = new Date(Date.now() + expires_in * 1e3).toISOString();
    res.send(`<h1>StockX OAuth Success</h1><p>Tokens stored in memory for this runtime.</p><p>Access token expires at ${expireAt}</p>`);
  } catch (e) {
    console.error("OAuth callback error", e.response?.data || e.message);
    res.status(500).send("Token exchange failed");
  }
});
router2.get("/status", (req, res) => {
  if (!requireAdmin(req)) return res.status(401).json({ error: "unauthorized" });
  const accessToken = process.env.STOCKX_ACCESS_TOKEN;
  const refresh = process.env.STOCKX_REFRESH_TOKEN;
  res.json({
    hasTokens: Boolean(accessToken && refresh),
    tokenExpiry: getTokenExpiry() ? new Date(getTokenExpiry()).toISOString() : null,
    canRefresh: Boolean(refresh)
  });
});
router2.post("/refresh", async (req, res) => {
  if (!requireAdmin(req)) return res.status(401).json({ error: "unauthorized" });
  try {
    const token = await getAccessToken();
    res.json({ ok: true, token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router2.delete("/revoke", (req, res) => {
  if (!requireAdmin(req)) return res.status(401).json({ error: "unauthorized" });
  delete process.env.STOCKX_ACCESS_TOKEN;
  delete process.env.STOCKX_REFRESH_TOKEN;
  res.json({ ok: true });
});
var oauth_default = router2;

// src/index.ts
import_dotenv.default.config();
var app = (0, import_express3.default)();
console.log("Environment PORT variable:", process.env.PORT);
var port = process.env.PORT ? Number(process.env.PORT) : 8080;
var defaultAllowed = ["http://localhost:3000", "http://localhost:4000"];
var envAllowed = process.env.CORS_ALLOWED_ORIGINS?.split(",").filter(Boolean) || [];
var allowedOrigins = [...defaultAllowed, ...envAllowed];
var isProd = process.env.NODE_ENV === "production";
app.use((0, import_cors.default)({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(import_express3.default.json());
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});
app.get("/", (req, res) => {
  res.status(200).send("OK");
});
app.use("/items", items_default);
app.use("/oauth/stockx", oauth_default);
import_node_cron.default.schedule("*/10 * * * *", async () => {
  console.log("[cron] Starting StockX sync job");
  await syncStockxMarket();
  console.log("[cron] StockX sync done");
});
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});
app.listen(port, "0.0.0.0", () => {
  console.log(`diddyback server listening on port ${port}`);
});
