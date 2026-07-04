#!/bin/bash
# TradeOS deployment script
set -e

echo "🚀 Deploying TradeOS..."

# Build all packages
echo "📦 Building..."
npm run build

# Build Docker images
echo "🐳 Building Docker images..."
docker build -f docker/Dockerfile -t tradeos/api:latest .
docker build -f docker/Dockerfile.web -t tradeos/web:latest .

# Deploy to Kubernetes
if command -v kubectl &> /dev/null; then
  echo "☸️ Deploying to Kubernetes..."
  kubectl apply -f kubernetes/
  kubectl rollout restart deployment/tradeos-api
  kubectl rollout restart deployment/tradeos-web
fi

echo "✅ TradeOS deployed successfully!"
