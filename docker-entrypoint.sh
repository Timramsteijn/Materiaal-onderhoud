#!/bin/sh
set -e

echo "Database-migraties toepassen..."
npx prisma migrate deploy

echo "Basisgegevens controleren/aanmaken (categorieen + eerste beheeraccount)..."
node prisma/seed.mjs

echo "Server starten..."
exec "$@"
