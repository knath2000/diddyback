# ---- Base image ----
FROM node:20 AS base
WORKDIR /app

# Install pnpm globally
RUN npm i -g pnpm

# Copy manifest first for better cache hygiene
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- Build stage ----
FROM base AS builder
# Copy rest of the source
COPY . .

# Generate Prisma client and compile TypeScript
RUN pnpm prisma generate \
    && pnpm run build

# ---- Production runtime ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy compiled output and minimal node_modules (prod only)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

EXPOSE 8080
CMD ["node", "dist/src/index.js"] 