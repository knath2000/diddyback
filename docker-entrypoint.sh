#!/bin/sh
set -e

echo "--- PRINTING ENVIRONMENT VARIABLES ---"
printenv
echo "------------------------------------"

echo "Running database migrations..."
pnpm prisma migrate deploy

echo "Starting the application..."
exec node dist/src/index.js 