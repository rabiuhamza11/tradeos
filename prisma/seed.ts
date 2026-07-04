// TradeOS Prisma Seed Script
// Populates the database with demo data for development

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding TradeOS database...\n');

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@tradeos.io' },
    update: {},
    create: {
      email: 'demo@tradeos.io',
      password: await bcrypt.hash('demo123456', 10),
      firstName: 'Rabiu',
      lastName: 'Hamza',
      twoFactorEnabled: true,
    },
  });
  console.log(`✅ User: ${user.email}`);

  // Create organization
  const org = await prisma.organization.upsert({
    where: { name: 'HARZ Capital' },
    update: {},
    create: {
      name: 'HARZ Capital',
      ownerId: user.id,
      plan: 'enterprise',
    },
  });
  console.log(`✅ Organization: ${org.name}`);

  // Create portfolios
  const cryptoPort = await prisma.portfolio.create({
    data: {
      name: 'Crypto Portfolio',
      description: 'Main cryptocurrency holdings',
      initialCapital: 50000,
      currentValue: 67850,
      currency: 'USD',
      ownerId: user.id,
      orgId: org.id,
    },
  });

  const stockPort = await prisma.portfolio.create({
    data: {
      name: 'Stock Portfolio',
      description: 'US equities long-term',
      initialCapital: 100000,
      currentValue: 112400,
      currency: 'USD',
      ownerId: user.id,
      orgId: org.id,
    },
  });

  const forexPort = await prisma.portfolio.create({
    data: {
      name: 'Forex Portfolio',
      description: 'Currency trading',
      initialCapital: 25000,
      currentValue: 23100,
      currency: 'USD',
      ownerId: user.id,
      orgId: org.id,
    },
  });
  console.log(`✅ Portfolios: ${cryptoPort.name}, ${stockPort.name}, ${forexPort.name}`);

  // Create positions
  const positions = [
    { symbol: 'BTC', exchange: 'binance', side: 'LONG', quantity: 0.85, entryPrice: 58000, currentPrice: 65432, portfolioId: cryptoPort.id },
    { symbol: 'ETH', exchange: 'binance', side: 'LONG', quantity: 8.2, entryPrice: 2900, currentPrice: 3521, portfolioId: cryptoPort.id },
    { symbol: 'SOL', exchange: 'binance', side: 'LONG', quantity: 120, entryPrice: 95, currentPrice: 142, portfolioId: cryptoPort.id },
    { symbol: 'AAPL', exchange: 'alpaca', side: 'LONG', quantity: 50, entryPrice: 185, currentPrice: 214, portfolioId: stockPort.id },
    { symbol: 'TSLA', exchange: 'alpaca', side: 'SHORT', quantity: 30, entryPrice: 255, currentPrice: 248, portfolioId: stockPort.id },
    { symbol: 'EURUSD', exchange: 'oanda', side: 'LONG', quantity: 10000, entryPrice: 1.0812, currentPrice: 1.0842, portfolioId: forexPort.id },
  ];

  for (const pos of positions) {
    const pnl = pos.side === 'LONG'
      ? (pos.currentPrice - pos.entryPrice) * pos.quantity
      : (pos.entryPrice - pos.currentPrice) * pos.quantity;
    const pnlPct = pos.side === 'LONG'
      ? ((pos.currentPrice - pos.entryPrice) / pos.entryPrice) * 100
      : ((pos.entryPrice - pos.currentPrice) / pos.entryPrice) * 100;

    await prisma.position.create({
      data: {
        ...pos,
        pnl,
        pnlPct,
        status: 'OPEN',
      },
    });
  }
  console.log(`✅ Positions: ${positions.length} created`);

  // Create trades
  const tradeSymbols = ['BTC', 'ETH', 'SOL', 'AAPL', 'TSLA', 'EURUSD'];
  const exchanges = ['binance', 'binance', 'binance', 'alpaca', 'alpaca', 'oanda'];
  for (let i = 0; i < 20; i++) {
    const idx = i % tradeSymbols.length;
    const isWin = Math.random() > 0.35;
    const pnl = isWin ? Math.random() * 2000 : -Math.random() * 800;
    const qty = Math.random() * 5 + 0.1;

    await prisma.trade.create({
      data: {
        symbol: tradeSymbols[idx],
        exchange: exchanges[idx],
        side: Math.random() > 0.5 ? 'BUY' : 'SELL',
        quantity: parseFloat(qty.toFixed(4)),
        entryPrice: parseFloat((Math.random() * 1000 + 50).toFixed(2)),
        exitPrice: parseFloat((Math.random() * 1000 + 50).toFixed(2)),
        pnl: parseFloat(pnl.toFixed(2)),
        pnlPct: parseFloat((pnl / 5000 * 100).toFixed(2)),
        status: 'CLOSED',
        portfolioId: cryptoPort.id,
        userId: user.id,
        executedAt: new Date(Date.now() - i * 86400000),
      },
    });
  }
  console.log(`✅ Trades: 20 created`);

  // Create watchlist
  const watchlist = await prisma.watchlist.create({
    data: {
      name: 'Main Watchlist',
      ownerId: user.id,
    },
  });

  const watchSymbols = [
    { symbol: 'BTC', exchange: 'binance', sortOrder: 0 },
    { symbol: 'ETH', exchange: 'binance', sortOrder: 1 },
    { symbol: 'SOL', exchange: 'binance', sortOrder: 2 },
    { symbol: 'AAPL', exchange: 'alpaca', sortOrder: 3 },
    { symbol: 'EURUSD', exchange: 'oanda', sortOrder: 4 },
    { symbol: 'XAU', exchange: 'oanda', sortOrder: 5 },
  ];

  for (const w of watchSymbols) {
    await prisma.watchlistItem.create({
      data: { ...w, watchlistId: watchlist.id },
    });
  }
  console.log(`✅ Watchlist: ${watchSymbols.length} symbols`);

  // Create AI agents
  const agents = [
    { name: 'Scalper Agent', type: 'scalper', description: 'High-frequency micro-profit trading', strategy: 'scalping', riskLevel: 'MEDIUM', isActive: true },
    { name: 'Swing Agent', type: 'swing', description: 'Multi-day trend capture', strategy: 'swing', riskLevel: 'MEDIUM', isActive: true },
    { name: 'Arbitrage Agent', type: 'arbitrage', description: 'Cross-exchange price gap exploitation', strategy: 'arbitrage', riskLevel: 'LOW', isActive: true },
    { name: 'Risk Manager', type: 'risk_manager', description: 'Position sizing and exposure limits', strategy: 'risk_management', riskLevel: 'LOW', isActive: true },
    { name: 'Sentiment Agent', type: 'sentiment', description: 'News and social sentiment analysis', strategy: 'sentiment', riskLevel: 'HIGH', isActive: false },
    { name: 'Portfolio Rebalancer', type: 'rebalancer', description: 'Auto-rebalance portfolio allocations', strategy: 'rebalancing', riskLevel: 'LOW', isActive: false },
  ];

  for (const agent of agents) {
    await prisma.aiAgent.create({
      data: {
        ...agent,
        ownerId: user.id,
        config: { maxPositions: 5, maxRiskPerTrade: 0.02, timeframe: '1h' },
      },
    });
  }
  console.log(`✅ AI Agents: ${agents.length} created`);

  // Create notifications
  const notifications = [
    { type: 'trade', title: 'Order Filled', message: 'BUY 0.01 BTC @ $65,432 executed on Binance', priority: 'normal' },
    { type: 'alert', title: 'Price Alert', message: 'ETH crossed $3,500 — watchlist triggered', priority: 'high' },
    { type: 'risk', title: 'Risk Warning', message: 'Portfolio exposure at 78% — consider reducing', priority: 'high' },
    { type: 'system', title: 'Agent Started', message: 'Scalper Agent started trading session', priority: 'normal' },
  ];

  for (const n of notifications) {
    await prisma.notification.create({
      data: { ...n, userId: user.id },
    });
  }
  console.log(`✅ Notifications: ${notifications.length} created`);

  console.log('\n🎉 Seeding complete!');
  console.log('Login: demo@tradeos.io / demo123456');
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
