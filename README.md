# 📊 TradeOS

> Enterprise AI Trading Platform — Multi-exchange, real-time WebSocket streaming, AI agents, and portfolio management.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.3-red.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.10-2D3748.svg)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)
[![K8s](https://img.shields.io/badge/Kubernetes-Ready-326CE5.svg)](https://kubernetes.io/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-success.svg)](https://github.com/rabiuhamza11/tradeos)

![GitHub last commit](https://img.shields.io/github/last-commit/rabiuhamza11/tradeos)
![GitHub repo size](https://img.shields.io/github/repo-size/rabiuhamza11/tradeos)
![GitHub issues](https://img.shields.io/github/issues/rabiuhamza11/tradeos)

---

## 🌟 Overview

TradeOS is a full-stack enterprise trading platform supporting multiple asset classes (Crypto, Stocks, Forex, Commodities) across 5 exchanges with real-time WebSocket streaming, AI-powered trading agents, and live portfolio management.

## 🔗 Supported Exchanges

| Exchange | Asset Type | Live Data | Trading | WebSocket |
|----------|-----------|-----------|---------|-----------|
| Binance Spot | Crypto | ✅ | ✅ | ✅ |
| Binance Futures | Crypto Futures | ✅ | ✅ | ✅ |
| Coinbase Advanced | Crypto | ✅ | ✅ | ✅ |
| Alpaca Markets | US Stocks, ETFs | ✅ | ✅ | ✅ |
| OANDA | Forex, CFDs | ✅ | ✅ | ✅ |

## ✨ Features

- **5 Exchange Adapters** — Binance (Spot + Futures), Coinbase, Alpaca, OANDA
- **Real-time WebSocket Streaming** — Live prices, candles, order book, and order fills
- **Live Candlestick Charts** — Canvas-based rendering with real-time updates
- **AI Trading Agents** — 6 specialized agents for different strategies
- **Portfolio Management** — Live P&L tracking, positions, multi-portfolio support
- **Order Management** — Market, Limit, Stop, Stop-Limit orders across all exchanges
- **Analytics Dashboard** — Performance metrics, trade history, risk analysis
- **Watchlist** — Track favorite symbols with real-time updates
- **Multi-Platform** — Web (Next.js), Mobile (React Native), Desktop (Electron)
- **Auth** — JWT with 2FA, OAuth (Google, GitHub)
- **Infrastructure** — Docker, Kubernetes, CI/CD (GitHub Actions, Bitbucket)

## 🏗️ Architecture

```
tradeos/
├── apps/
│   ├── api/                # NestJS backend (10 modules)
│   │   ├── src/
│   │   │   ├── auth/       # JWT + OAuth + 2FA
│   │   │   ├── trading/    # Order execution → exchange routing
│   │   │   ├── markets/    # Real-time market data
│   │   │   ├── portfolios/ # Portfolio & position management
│   │   │   ├── analytics/  # Performance & risk analytics
│   │   │   ├── watchlist/  # Symbol tracking
│   │   │   ├── stream/     # WebSocket gateway (Socket.IO)
│   │   │   └── users/      # Profile + API key management
│   ├── web/                # Next.js 14 dashboard
│   ├── mobile/             # React Native app
│   └── desktop/            # Electron app
├── packages/
│   ├── exchange-adapters/  # 5 exchange adapters + WebSocket streams
│   ├── ai-engine/          # AI trading agents
│   ├── trading-engine/     # Core trading logic
│   ├── exchange-adapters/  # Binance, Coinbase, Alpaca, OANDA
│   ├── notifications/      # Push, email, SMS
│   ├── blockchain/         # On-chain analytics
│   ├── automation/         # Strategy automation
│   ├── cybersecurity/      # Security hardening
│   └── shared/             # Shared types & utilities
├── prisma/                 # 16 database models
├── docker/                 # Dockerfiles + docker-compose
├── kubernetes/             # K8s deployment
└── .github/workflows/      # CI/CD pipeline
```

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/rabiuhamza11/tradeos.git
cd tradeos

# Install
npm install

# Configure
cp .env.example .env
# Add your exchange API keys

# Database
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# Start backend (port 4000)
cd apps/api && npm run start:dev

# Start frontend (port 3000)
cd apps/web && npm run dev
```

## 🔑 Environment Variables

See [.env.example](.env.example) for all configuration. Key variables:

- `BINANCE_API_KEY` / `BINANCE_API_SECRET` — Binance Spot
- `BINANCE_FUTURES_API_KEY` / `BINANCE_FUTURES_API_SECRET` — Binance Futures
- `COINBASE_API_KEY` / `COINBASE_API_SECRET` — Coinbase
- `ALPACA_API_KEY` / `ALPACA_API_SECRET` — Alpaca (Stocks)
- `OANDA_API_KEY` / `OANDA_ACCOUNT_ID` — OANDA (Forex)
- `EXCHANGE_TESTNET=true` — Paper trading mode (default)

## 📊 Database Models (16)

User, Organization, ApiKey, Portfolio, Order, Trade, Position, Watchlist, WatchlistItem, AiAgent, AgentExecution, Notification, TradeJournal, TradeJournalEntry, Deployment, RefreshToken

## 🤖 AI Agents

1. **Scalper Agent** — High-frequency micro-profits
2. **Swing Agent** — Multi-day trend capture
3. **Arbitrage Agent** — Cross-exchange price gaps
4. **Risk Manager** — Position sizing & exposure limits
5. **Sentiment Agent** — News & social sentiment analysis
6. **Portfolio Rebalancer** — Auto-rebalance allocations

## 👤 Author

**Rabiu Hamza Mohammed**
- Email: harzco.business@gmail.com
- GitHub: [@rabiuhamza11](https://github.com/rabiuhamza11)

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## ⚠️ Disclaimer

TradeOS is for educational and professional use. Trading involves risk. Always test with paper trading (testnet) before going live. The authors are not responsible for any financial losses.
