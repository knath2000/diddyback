import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import itemsRouter from './routes/items'

// Load environment variables from .env if present
dotenv.config()

const app = express()
const port = process.env.PORT ? Number(process.env.PORT) : 4000

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/items', itemsRouter)

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal Server Error' })
})

app.listen(port, () => {
  console.log(`diddyback server listening on http://localhost:${port}`)
}) 