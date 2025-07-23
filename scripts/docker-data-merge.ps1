# Data Merger Script for Docker Container
# This script runs data merge operation inside the Docker container

Write-Host "🔄 Starting data merge operation in Docker container..." -ForegroundColor Cyan

# Check if container is running
$ContainerName = "aiot-greenhouse-backend"

$ContainerStatus = docker ps -q -f "name=$ContainerName"

if ($ContainerStatus) {
    Write-Host "✅ Container $ContainerName is running" -ForegroundColor Green
    
    # Execute data merge command inside container
    Write-Host "🔄 Running data merge..." -ForegroundColor Yellow
    docker exec $ContainerName npm run data:merge:build
    
    Write-Host "✅ Data merge completed!" -ForegroundColor Green
} else {
    Write-Host "❌ Container $ContainerName is not running" -ForegroundColor Red
    Write-Host "💡 Please start the container first using: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}
