@echo off
REM IGCFMS Docker Quick Start Script for Windows
REM This script starts the Docker environment from Windows Command Prompt

echo 🚀 Starting IGCFMS Docker Environment...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Copy environment file for Docker
if not exist "backend\.env" (
    echo 📝 Copying Docker environment file...
    copy "backend\.env.docker" "backend\.env"
)

REM Build and start containers
echo 🔨 Building Docker containers...
docker-compose build

echo 🚀 Starting services...
docker-compose up -d

REM Wait for MySQL to be ready
echo ⏳ Waiting for MySQL to be ready...
timeout /t 30 /nobreak >nul

REM Run Laravel setup
echo 🔧 Setting up Laravel...
docker-compose exec -T backend php artisan key:generate --force
docker-compose exec -T backend php artisan migrate --force
docker-compose exec -T backend php artisan config:cache
docker-compose exec -T backend php artisan route:cache

echo ✅ IGCFMS is now running!
echo.
echo 🌐 Access your application:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:8000/api
echo    Database: localhost:3306
echo.
echo 📊 Check status: docker-compose ps
echo 📝 View logs: docker-compose logs -f [service-name]
echo 🛑 Stop services: docker-compose down
echo.
pause
