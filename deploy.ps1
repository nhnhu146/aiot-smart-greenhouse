# DevOps Deployment Script for AIoT Smart Greenhouse
# Ensures proper network setup and forced rebuild for testing

Write-Host "🚀 AIoT Smart Greenhouse - DevOps Deployment" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Step 1: Create external network if it doesn't exist
Write-Host ""
Write-Host "📡 Step 1: Setting up external network..." -ForegroundColor Yellow
$networkExists = docker network ls --filter name=multi-domain --format "{{.Name}}" | Select-String -Pattern "^multi-domain$"

if ($networkExists) {
    Write-Host "✅ Network 'multi-domain' already exists" -ForegroundColor Green
} else {
    docker network create multi-domain
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Network 'multi-domain' created successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create network 'multi-domain'" -ForegroundColor Red
        exit 1
    }
}

# Step 2: Stop and remove existing containers
Write-Host ""
Write-Host "🛑 Step 2: Cleaning up existing containers..." -ForegroundColor Yellow
docker compose down --rmi all --volumes --remove-orphans
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Cleanup completed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Cleanup completed with warnings" -ForegroundColor Yellow
}

# Step 3: Build and deploy with forced rebuild
Write-Host ""
Write-Host "🔨 Step 3: Building and deploying services..." -ForegroundColor Yellow
docker compose up -d --build --force-recreate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment completed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

# Step 4: Show deployment status
Write-Host ""
Write-Host "📊 Step 4: Deployment Status" -ForegroundColor Yellow
docker compose ps

Write-Host ""
Write-Host "🌐 Step 5: Service URLs" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "Backend:  Internal only (exposed via frontend)" -ForegroundColor White
Write-Host "MongoDB:  Internal only" -ForegroundColor White
Write-Host "Redis:    Internal only" -ForegroundColor White

Write-Host ""
Write-Host "✅ DevOps deployment completed!" -ForegroundColor Green
Write-Host "Only frontend port (3000) is exposed for security" -ForegroundColor Cyan
