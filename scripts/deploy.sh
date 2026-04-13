#!/bin/bash
# Production Deployment Script
# Usage: ./scripts/deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Starting deployment for: $ENVIRONMENT"

# 1. Check if .env file exists
if [ ! -f "$PROJECT_DIR/backend/.env" ]; then
  echo "❌ Error: backend/.env file not found"
  echo "📝 Create it from: backend/.env.production.example"
  exit 1
fi

# 2. Validate environment variables
echo "🔍 Validating environment variables..."
required_vars=("MONGODB_URI" "JWT_SECRET" "CLIENT_URL" "NODE_ENV")

for var in "${required_vars[@]}"; do
  if ! grep -q "^$var=" "$PROJECT_DIR/backend/.env"; then
    echo "❌ Missing required variable: $var"
    exit 1
  fi
done

echo "✅ Environment variables validated"

# 3. Build Docker images
echo "🔨 Building Docker images..."
docker-compose build --no-cache

# 4. Stop existing containers
echo "⏹️  Stopping existing containers..."
docker-compose down || true

# 5. Start new containers
echo "▶️  Starting containers..."
docker-compose up -d

# 6. Verify services are running
echo "🧪 Verifying services..."
sleep 5

# Check API health
if curl -f http://localhost:5000/api/health > /dev/null; then
  echo "✅ API is healthy"
else
  echo "❌ API health check failed"
  docker-compose logs api | tail -20
  exit 1
fi

# 7. Show status
echo ""
echo "✅ Deployment successful!"
echo ""
echo "📊 Container Status:"
docker-compose ps
echo ""
echo "📝 Logs:"
echo "   docker-compose logs -f api    # View API logs"
echo "   docker-compose logs -f web    # View frontend logs"
echo "   docker-compose logs -f mongo  # View database logs"
echo ""
