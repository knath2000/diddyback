# Backend System Patterns

## Database Schema (PostgreSQL)
```sql
TABLE items
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  brand TEXT DEFAULT 'Supreme',
  image_url TEXT,
  season TEXT,
  style_code TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()

TABLE variants (
  id SERIAL PRIMARY KEY,
  item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
  size TEXT,
  color TEXT,
  UNIQUE(item_id, size, color)
)

TABLE prices (
  id SERIAL PRIMARY KEY,
  variant_id INTEGER REFERENCES variants(id) ON DELETE CASCADE,
  platform TEXT CHECK (platform IN ('stockx','goat','grailed')),
  price_usd NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  ask_or_bid TEXT CHECK (ask_or_bid IN ('ask','bid','last')),
  captured_at TIMESTAMPTZ DEFAULT now()
)

TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
)
```

## REST API Surface
```
GET    /items
GET    /items/:id
GET    /items/:id/prices
POST   /auth/signup  { email, password }
POST   /auth/login   { email, password }
GET    /auth/me      (JWT)
```

## Authentication Flow
1. User signs up → password hashed with bcrypt → stored in users table.
2. Login issues JWT (expires 7 days) signed with `JWT_SECRET`.
3. Protected routes use middleware to verify token.

## Deployment Pipeline
1. Push to GitHub → Railway build pipeline.
2. `pnpm install && pnpm run generate && pnpm run build`.
3. Prisma migrations auto-apply (`prisma migrate deploy`).
4. Container starts `node dist/index.js`. 