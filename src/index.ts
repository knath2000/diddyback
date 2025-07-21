import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// @ts-ignore – types bundled with node-cron but TS may not locate before install
import cron from 'node-cron'
import { syncStockxMarket } from './jobs/syncStockxMarket'

import itemsRouter from './routes/items'

// Load environment variables from .env if present
dotenv.config()

const app = express()
console.log('Environment PORT variable:', process.env.PORT);
const port = process.env.PORT ? Number(process.env.PORT) : 8080

const defaultAllowed = ['http://localhost:3000', 'http://localhost:4000']
const envAllowed = process.env.CORS_ALLOWED_ORIGINS?.split(',').filter(Boolean) || []
const allowedOrigins = [...defaultAllowed, ...envAllowed]

const isProd = process.env.NODE_ENV === 'production'

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // In development allow requests from any origin so Nuxt dev server on LAN IP works
    if (!isProd) {
      return callback(null, true)
    }

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Root endpoint (Railway health checks default to "/")
app.get('/', (req, res) => {
  res.status(200).send('OK');
});

app.use('/items', itemsRouter)

// Schedule StockX market sync every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  console.log('[cron] Starting StockX sync job')
  await syncStockxMarket()
  console.log('[cron] StockX sync done')
})

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal Server Error' })
})

app.listen(port, "0.0.0.0", () => {
  console.log(`diddyback server listening on port ${port}`);
}); 