import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import itemsRouter from './routes/items'

// Load environment variables from .env if present
dotenv.config()

const app = express()
console.log('Environment PORT variable:', process.env.PORT);
const port = process.env.PORT ? Number(process.env.PORT) : 8080

const allowedOrigins = [
  'http://localhost:3000',
  'https://your-production-frontend-url.com' // TODO: Add your production frontend URL
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions))
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

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal Server Error' })
})

app.listen(port, () => {
  console.log(`diddyback server listening on port ${port}`);
}); 