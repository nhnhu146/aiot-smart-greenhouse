# Start Development Servers
# Frontend: http://localhost:3000
# Backend: http://localhost:5000

Write-Host "🚀 Starting AIOT Smart Greenhouse Development Servers..." -ForegroundColor Green
Write-Host ""

# Check if ports are available
Write-Host "🔍 Checking port availability..." -ForegroundColor Yellow

$frontendPort = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
$backendPort = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue

if ($frontendPort) {
    Write-Host "⚠️  Port 3000 is in use. Stopping existing processes..." -ForegroundColor Red
    Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force
}

if ($backendPort) {
    Write-Host "⚠️  Port 5000 is in use. Stopping existing processes..." -ForegroundColor Red
    Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force
}

Write-Host ""
Write-Host "📊 Port Configuration:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White
Write-Host ""

Write-Host "🎯 To start development servers:" -ForegroundColor Green
Write-Host "   Frontend: cd frontend && yarn dev" -ForegroundColor White
Write-Host "   Backend:  cd backend && yarn dev" -ForegroundColor White
Write-Host ""
Write-Host "✅ Port configuration verified!" -ForegroundColor Green
