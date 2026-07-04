# 📊 TradeOS — Enterprise AI Trading Platform

[![CI/CD](https://github.com/tradeos/tradeos/actions/workflows/ci.yml/badge.svg)](https://github.com/tradeos/tradeos)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**AI-powered trading platform with multi-exchange support, portfolio management, automated strategies, and real-time analytics.**

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend (Web) | Next.js 14, React 18, TypeScript, Tailwind CSS, Recharts |
| Frontend (Mobile) | React Native |
| Frontend (Desktop) | Electron |
| Backend | NestJS 10, TypeScript, REST API, Swagger |
| Database | PostgreSQL 16, Prisma ORM |
| Cache/Queue | Redis 7 |
| Auth | JWT (access + refresh), 2FA (TOTP), OAuth (Google, GitHub), RBAC |
| Infra | Docker, Docker Compose, Kubernetes, GitHub Actions, GitLab CI, Bitbucket Pipelines |
| Deploy | Vercel (web), Render (API), Docker Hub |
| Build | Turborepo (monorepo) |

## Monorepo Structure

```
tradeos/
├── apps/
│   ├── web/                 # Next.js Dashboard (trading UI, charts, analytics)
│   ├── api/                 # NestJS Backend (auth, trading, portfolios, markets)
│   ├── mobile/              # React Native App (iOS/Android)
│   └── desktop/             # Electron App (Windows/Mac/Linux)
│
├── packages/
│   ├── ai-engine/           # Technical analysis, predictions, sentiment
│   ├── agent-sdk/           # 6 AI trading agents (analyst, risk, strategy, execution, news, rebalancer)
│   ├── trading-engine/      # Order execution, position management, strategy runner, risk manager
│   ├── analytics/           # Performance metrics, reporting, equity curves
│   ├── blockchain/          # Wallet management, DeFi scanning, on-chain analytics
│   ├── cybersecurity/       # Security auditing, encryption, threat detection
│   ├── voice/               # Voice commands and TTS for hands-free trading
│   ├── video/               # Chart rendering, market visualizations
│   ├── automation/          # Workflow automation, triggers, scheduled tasks
│   ├── notifications/       # Multi-channel: push, email, SMS, WhatsApp, Telegram
│   └── shared/              # Common types, utilities, constants
│
├── prisma/
│   ├── schema.prisma        # 16 database models
│   └── migrations/
│
├── docker/                  # Dockerfiles (API + Web)
├── kubernetes/              # K8s deployments, services, HPA
├── .github/workflows/       # GitHub Actions CI/CD
├── gitlab/                  # GitLab CI config
├── bitbucket/               # Bitbucket Pipelines config
├── docs/                    # Documentation
├── scripts/                 # Utility scripts
│
├── .env.example
├── docker-compose.yml       # PostgreSQL + Redis + API + Web
├── package.json
├── turbo.json               # Turborepo build config
├── README.md
└── LICENSE
```

## Core Features

### Trading
- Multi-asset support: Stocks, Crypto, Forex, Commodities, ETFs, Bonds, Options, Futures
- Order types: Market, Limit, Stop, Stop-Limit, Trailing Stop, Bracket
- Real-time position tracking with P&L
- Trade history with full audit trail

### Portfolio Management
- Multiple portfolios per user
- Real-time valuation
- Asset allocation tracking
- Performance analytics (Sharpe, Sortino, max drawdown, win rate)

### AI Engine
- Technical indicators: RSI, MACD, SMA, EMA, Bollinger Bands, ATR, Stochastic
- AI price predictions with confidence scoring
- Sentiment analysis from news and social
- Trading signals: Strong Buy → Strong Sell

### AI Agents (6)
1. Market Analyst — scans for opportunities and trends
2. Risk Manager — monitors exposure, enforces limits
3. Strategy Optimizer — backtests and optimizes strategies
4. Execution Agent — optimal trade execution
5. News Monitor — sentiment-based signals
6. Portfolio Rebalancer — auto-rebalancing

### Security
- JWT auth with refresh token rotation
- Two-factor authentication (TOTP)
- API key encryption (AES-256-GCM)
- Threat detection and audit logging
- KYC compliance support

### Infrastructure
- Docker + Docker Compose for local development
- Kubernetes manifests with autoscaling (3-10 replicas)
- CI/CD for GitHub, GitLab, and Bitbucket
- Deploy to Vercel (web), Render (API), Docker Hub

## Quick Start

```bash
git clone https://github.com/tradeos/tradeos.git
cd tradeos
npm install
cp .env.example .env  # Edit with your values
docker-compose up -d  # Start PostgreSQL + Redis
npx prisma migrate dev
npx prisma db seed
npm run dev  # Starts API (4000) + Web (3000)
```

- Web: http://localhost:3000
- API: http://localhost:4000
- Swagger: http://localhost:4000/api/docs

## API Endpoints

```
Auth:     POST /auth/register, /auth/login, /auth/refresh, /auth/logout, /auth/2fa/enable
Users:    GET /users/profile, PUT /users/profile, POST /users/kyc
Markets:  GET /markets, /markets/movers, /markets/:symbol, /markets/:symbol/candles
Trading:  POST /trading/order, DELETE /trading/order/:id, GET /trading/orders, /trading/trades
Portfolios: POST /portfolios, GET /portfolios, GET /portfolios/:id/positions, /performance
Analytics: GET /analytics/dashboard, /analytics/trades, /analytics/risk
Watchlist: POST /watchlist, GET /watchlist, POST /watchlist/:id/add
```

## Database Models (16)

User, RefreshToken, Portfolio, Allocation, Position, Order, Trade, Watchlist, WatchlistItem, Alert, Strategy, Conversation, Message, ApiKey, Notification, AuditLog

## License

MIT © 2026 TradeOS
