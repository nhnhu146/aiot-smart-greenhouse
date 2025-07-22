# Script to create the required external network for testing

Write-Host "Creating external network: multi-domain" -ForegroundColor Cyan

# Check if network already exists
$networkExists = docker network ls --filter name=multi-domain --format "{{.Name}}" | Select-String -Pattern "^multi-domain$"

if ($networkExists) {
    Write-Host "Network 'multi-domain' already exists" -ForegroundColor Green
} else {
    # Create the external network
    docker network create multi-domain
    Write-Host "Network 'multi-domain' created successfully" -ForegroundColor Green
}

Write-Host ""
Write-Host "Network information:" -ForegroundColor Yellow
docker network inspect multi-domain --format='{{.Name}}: {{.Driver}} ({{.Scope}})'

Write-Host ""
Write-Host "Network is ready for Docker Compose deployment" -ForegroundColor Green
Write-Host "Run: docker compose up -d --build" -ForegroundColor White