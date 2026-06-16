#!/bin/bash

# Production startup script for Acquisition App
# Connects directly to Neon Cloud — no local DB proxy needed.

echo "🚀 Starting Acquisition App in Production Mode"
echo "================================================"

# Check if .env.production exists and has been filled in
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    echo "   Copy .env.production.example and fill in real values."
    exit 1
fi

# Warn if placeholder values are still present
if grep -q "your_password\|your_arcjet_key_here\|a_very_long_and_random" .env.production; then
    echo "⚠️  Warning: .env.production still contains placeholder values!"
    echo "   Update DATABASE_URL, JWT_SECRET, and ARCJET_KEY before deploying."
    read -p "   Continue anyway? [y/N] " confirm
    [[ "$confirm" =~ ^[Yy]$ ]] || exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    echo "   Please start Docker and try again."
    exit 1
fi

echo "📦 Building and starting production container..."
echo "   - Migrations will run automatically before server start"
echo "   - Connecting directly to Neon Cloud database"
echo ""

docker compose -f docker-compose.prod.yml up --build -d

echo ""
echo "✅ Production container started in detached mode!"
echo "   Application: http://localhost:3000"
echo "   Health check: http://localhost:3000/health"
echo ""
echo "Useful commands:"
echo "  View logs:    docker compose -f docker-compose.prod.yml logs -f"
echo "  Stop:         npm run prod:docker:down"
echo "  Restart:      docker compose -f docker-compose.prod.yml restart"
