#!/bin/sh
# Fail fast if something goes wrong
set -e

# echo "Running Prisma migrate..."
# bun run db:migrate

echo "Running Prisma generate..."
bun run db:generate

echo "Starting db-worker backend..."
bun run db-worker:run
