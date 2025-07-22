"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// @ts-ignore – types bundled with node-cron but TS may not locate before install
const node_cron_1 = __importDefault(require("node-cron"));
const syncStockxMarket_1 = require("./jobs/syncStockxMarket");
const items_1 = __importDefault(require("./routes/items"));
const oauth_1 = __importDefault(require("./routes/oauth"));
// Load environment variables from .env if present
dotenv_1.default.config();
const app = (0, express_1.default)();
console.log('Environment PORT variable:', process.env.PORT);
const port = process.env.PORT ? Number(process.env.PORT) : 8080;
const defaultAllowed = ['http://localhost:3000', 'http://localhost:4000'];
const envAllowed = process.env.CORS_ALLOWED_ORIGINS?.split(',').filter(Boolean) || [];
const allowedOrigins = [...defaultAllowed, ...envAllowed];
const isProd = process.env.NODE_ENV === 'production';
const corsOptions = {
    origin: (origin, callback) => {
        // In development allow requests from any origin so Nuxt dev server on LAN IP works
        if (!isProd) {
            return callback(null, true);
        }
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express_1.default.json());
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});
// Root endpoint (Railway health checks default to "/")
app.get('/', (req, res) => {
    res.status(200).send('OK');
});
app.use('/items', items_1.default);
app.use('/oauth/stockx', oauth_1.default);
// Schedule StockX market sync every 10 minutes
node_cron_1.default.schedule('*/10 * * * *', async () => {
    console.log('[cron] Starting StockX sync job');
    await (0, syncStockxMarket_1.syncStockxMarket)();
    console.log('[cron] StockX sync done');
});
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
});
app.listen(port, "0.0.0.0", () => {
    console.log(`diddyback server listening on port ${port}`);
});
//# sourceMappingURL=index.js.map