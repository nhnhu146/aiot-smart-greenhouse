# AIoT Smart Greenhouse - Docker Test Script (Windows)
# Usage: .\test-docker.ps1

Write-Host "🧹 AIoT Smart Greenhouse - Clean Docker Test" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Gray

# Step 1: Stop all containers and clean images
Write-Host "🔄 Stopping containers and cleaning images..." -ForegroundColor Yellow
docker compose down --rmi all
docker system prune -f

# Step 2: Build and start services
Write-Host "🔨 Building and starting services..." -ForegroundColor Yellow  
docker compose up -d --build

# Step 3: Wait for services to initialize
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Step 4: Check service status
Write-Host "🏥 Checking service health..." -ForegroundColor Yellow
docker compose ps

Write-Host ""
Write-Host "📊 Backend logs (last 20 lines):" -ForegroundColor Cyan
docker compose logs --tail=20 backend

Write-Host ""
Write-Host "🌐 Frontend logs (last 20 lines):" -ForegroundColor Cyan  
docker compose logs --tail=20 frontend

Write-Host ""
Write-Host "🗄️ Database logs (last 10 lines):" -ForegroundColor Cyan
docker compose logs --tail=10 mongodb

Write-Host ""
Write-Host "==================================================" -ForegroundColor Gray
Write-Host "✅ Test completed!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "📡 Backend API: http://localhost:5000" -ForegroundColor White
Write-Host "🗄️ MongoDB: localhost:27017" -ForegroundColor White
Write-Host ""
Write-Host "📖 Check REFACTOR_DOCUMENTATION.md for details" -ForegroundColor Blue
