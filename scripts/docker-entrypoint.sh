#!/bin/sh
set -eu

echo "[entrypoint] Prisma generate (PostgreSQL schema)"
npx prisma generate --schema prisma/schema.postgresql.prisma

if [ "${PRISMA_FORCE_RESET_ON_START:-false}" = "true" ]; then
  echo "[entrypoint] Prisma db push --force-reset"
  npx prisma db push --schema prisma/schema.postgresql.prisma --skip-generate --force-reset
else
  echo "[entrypoint] Prisma db push"
  npx prisma db push --schema prisma/schema.postgresql.prisma --skip-generate
fi

if [ "${PRISMA_SEED_ON_START:-true}" = "true" ]; then
  echo "[entrypoint] Prisma seed"
  npm run db:seed
else
  echo "[entrypoint] Seed skipped (PRISMA_SEED_ON_START=${PRISMA_SEED_ON_START:-false})"
fi

echo "[entrypoint] Starting Next.js"
exec npm run start
