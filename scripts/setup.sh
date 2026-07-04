#!/bin/bash
# TradeOS setup script
set -e

echo "📊 Setting up TradeOS..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Run migrations
echo "🔨 Running migrations..."
npx prisma migrate dev --name init

# Seed database
echo "🌱 Seeding database..."
npx prisma db seed

echo ""
echo "✅ TradeOS setup complete!"
echo ""
echo "Next steps:"
echo "  1. Copy .env.example to .env and fill in your values"
echo "  2. Run: npm run dev"
echo "  3. Open http://localhost:3000 for the dashboard"
echo "  4. Open http://localhost:4000/api/docs for API docs"
