#!/bin/sh
# Fail fast if something goes wrong
set -e

# echo "Running Prisma migrate..."
# bun run db:migrate

echo "Running Prisma generate..."
bun run db:generate

echo "Starting ws backend..."
bun run ws:run
