#!/bin/sh
set -e

echo "Running database migrations..."
pnpm prisma migrate deploy

echo "Starting the application..."
exec node dist/index.js 