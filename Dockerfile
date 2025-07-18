# ---- Base image ----
FROM node:20 AS base
WORKDIR /app

# Install compatible pnpm version (lockfileVersion 9)
ARG PNPM_VERSION=9.1.1
RUN npm i -g pnpm@${PNPM_VERSION}

# Set env to ignore missing checksum
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

# Copy manifest first for better cache hygiene
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- Build stage ----
FROM base AS builder
# Copy rest of the source
COPY . .

# Set env to ignore missing checksum and use binary engine type
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 \
    PRISMA_CLI_QUERY_ENGINE_TYPE=binary

# Generate Prisma client and compile TypeScript
RUN pnpm prisma generate --data-proxy \
    && pnpm run build

# ---- Production runtime ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Install pnpm in the runtime stage so it's available for release command
ARG PNPM_VERSION=9.1.1
RUN npm i -g pnpm@${PNPM_VERSION}

# Copy compiled output and minimal node_modules (prod only)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

EXPOSE 8080
CMD ["node", "dist/src/index.js"] 