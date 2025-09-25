#!/bin/bash

# IGCFMS Docker Quick Start Script
# Run this script in WSL to start the application

echo "🚀 Starting IGCFMS Docker Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Copy environment file for Docker
if [ ! -f "backend/.env" ]; then
    echo "📝 Copying Docker environment file..."
    cp backend/.env.docker backend/.env
fi

# Build and start containers
echo "🔨 Building Docker containers..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

# Wait for MySQL to be ready
echo "⏳ Waiting for MySQL to be ready..."
sleep 30

# Run Laravel setup
echo "🔧 Setting up Laravel..."
docker-compose exec -T backend php artisan key:generate --force
docker-compose exec -T backend php artisan migrate --force
docker-compose exec -T backend php artisan config:cache
docker-compose exec -T backend php artisan route:cache

echo "✅ IGCFMS is now running!"
echo ""
echo "🌐 Access your application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000/api"
echo "   Database: localhost:3306"
echo ""
echo "📊 Check status: docker-compose ps"
echo "📝 View logs: docker-compose logs -f [service-name]"
echo "🛑 Stop services: docker-compose down"
