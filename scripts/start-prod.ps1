# PowerShell Production start script for AIOT Smart Greenhouse

param(
    [switch]$SkipBuild,
    [switch]$Force
)

# Ensure UTF-8 encoding for proper Unicode character display
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Starting AIOT Smart Greenhouse Production Environment..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "Docker is not running. Please start Docker first." -ForegroundColor Red
    exit 1
}

# Check if running as administrator for production
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "Warning: Running production script without administrator privileges." -ForegroundColor Yellow
    Write-Host "Some operations may fail. Consider running as administrator." -ForegroundColor Yellow
}

# Check if .env file exists, create production version
Write-Host "Setting up production environment..." -ForegroundColor Yellow
if (!(Test-Path ".env") -or $Force) {
    $securePassword = "$(Get-Random -Minimum 100000 -Maximum 999999)_SecurePass"
    $envContent = @"
# Production Environment Configuration for AIOT Smart Greenhouse
NODE_ENV=production
MONGODB_USER=greenhouse_admin
MONGODB_PASSWORD=$securePassword
MQTT_BROKER_URL=mqtt://mqtt.noboroto.id.vn:1883
MQTT_USERNAME=vision
MQTT_PASSWORD=vision
API_PREFIX=/api
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
"@
    $envContent | Set-Content ".env" -Encoding UTF8NoBOM
    Write-Host "Production .env file created with secure credentials" -ForegroundColor Green
}

# Create necessary directories with proper permissions
Write-Host "Creating necessary directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "backend/logs" | Out-Null
New-Item -ItemType Directory -Force -Path "backups" | Out-Null

# Build production images if not skipped
if (-not $SkipBuild) {
    Write-Host "Building production Docker images..." -ForegroundColor Yellow
    
    # Build backend
    Write-Host "Building backend image..." -ForegroundColor Cyan
    docker build -t aiot-smart-greenhouse-backend:latest ./backend
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to build backend image" -ForegroundColor Red
        exit 1
    }
    
    # Build frontend (uncomment if using Docker for frontend)
    # Write-Host "Building frontend image..." -ForegroundColor Cyan
    # docker build -t aiot-smart-greenhouse-frontend:latest ./frontend
    # if ($LASTEXITCODE -ne 0) {
    #     Write-Host "Failed to build frontend image" -ForegroundColor Red
    #     exit 1
    # }
}

# Start production services
Write-Host "Starting production services..." -ForegroundColor Yellow
docker compose -f compose.prod.yml up -d

Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Check service health
Write-Host "Checking service health..." -ForegroundColor Yellow
$containers = @("aiot_greenhouse_db", "aiot_greenhouse_redis", "aiot_greenhouse_backend", "aiot_greenhouse_frontend")

foreach ($container in $containers) {
    $status = docker inspect $container --format='{{.State.Status}}' 2>$null
    if ($status) {
        $health = docker inspect $container --format='{{.State.Health.Status}}' 2>$null
        
        if ($status -eq "running") {
            if ($health -eq "healthy" -or $health -eq "" -or $health -eq "<no value>") {
                Write-Host "[OK] $container : Running and healthy" -ForegroundColor Green
            } else {
                Write-Host "[WARN] $container : Running but $health" -ForegroundColor Yellow
            }
        } else {
            Write-Host "[ERROR] $container : $status" -ForegroundColor Red
        }
    } else {
        Write-Host "[INFO] $container : Not started or doesn't exist" -ForegroundColor Gray
    }
}

# Create production backup script
$backupScript = @"
# Production backup script
`$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Write-Host "Creating backup at `$timestamp..." -ForegroundColor Green

# Create backups directory if it doesn't exist
New-Item -ItemType Directory -Force -Path "./backups" | Out-Null

# Backup MongoDB
Write-Host "Backing up MongoDB..." -ForegroundColor Yellow
docker exec aiot_greenhouse_db mongodump --out /tmp/backup_`$timestamp 2>`$null
if (`$LASTEXITCODE -eq 0) {
    docker cp aiot_greenhouse_db:/tmp/backup_`$timestamp ./backups/mongodb_`$timestamp
    Write-Host "MongoDB backup completed" -ForegroundColor Green
} else {
    Write-Host "MongoDB backup failed" -ForegroundColor Red
}

# Backup MQTT config
Write-Host "Backing up application logs..." -ForegroundColor Yellow
if (Test-Path "backend/logs") {
    Copy-Item -Recurse backend/logs ./backups/logs_`$timestamp
    Write-Host "Application logs backup completed" -ForegroundColor Green
} else {
    Write-Host "Logs directory not found" -ForegroundColor Yellow
}

Write-Host "Backup completed: ./backups/*_`$timestamp" -ForegroundColor Green
"@

$backupScript | Set-Content "scripts/backup-prod.ps1" -Encoding UTF8

# Display production information
Write-Host ""
Write-Host "AIOT Smart Greenhouse Production Environment Started!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend API: http://localhost:5000/api" -ForegroundColor White
Write-Host "   Health Check: http://localhost:5000/api/health" -ForegroundColor White
Write-Host "   MongoDB: mongodb://localhost:27017" -ForegroundColor White
Write-Host "   Redis: redis://localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "Management Commands:" -ForegroundColor Cyan
Write-Host "   Stop services: .\scripts\stop-prod.ps1" -ForegroundColor White
Write-Host "   View logs: docker compose -f compose.prod.yml logs -f [service]" -ForegroundColor White
Write-Host "   Create backup: .\scripts\backup-prod.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Security Notes:" -ForegroundColor Yellow
Write-Host "   - Set up proper SSL/TLS certificates" -ForegroundColor White
Write-Host "   - Configure firewall rules" -ForegroundColor White
Write-Host "   - Set up log rotation" -ForegroundColor White
Write-Host ""

Write-Host "Production environment is ready!" -ForegroundColor Green

# Create/update stop script to ensure it's current
$stopScript = @"
# PowerShell Production stop script for AIOT Smart Greenhouse
# Auto-generated by start-prod.ps1

# Ensure UTF-8 encoding for proper Unicode character display
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
`$OutputEncoding = [System.Text.Encoding]::UTF8

param(
    [switch]`$Force = `$false,
    [switch]`$Backup = `$true
)

Write-Host "Stopping AIOT Smart Greenhouse Production Environment..." -ForegroundColor Red

# Create backup before stopping if requested
if (`$Backup -and (Test-Path "scripts/backup-prod.ps1")) {
    Write-Host "Creating backup before shutdown..." -ForegroundColor Yellow
    try {
        & "scripts/backup-prod.ps1"
    } catch {
        Write-Host "Warning: Backup failed: `$(`$_.Exception.Message)" -ForegroundColor Yellow
        if (-not `$Force) {
            `$continue = Read-Host "Continue shutdown without backup? (y/N)"
            if (`$continue -ne "y" -and `$continue -ne "Y") {
                Write-Host "Shutdown cancelled." -ForegroundColor Yellow
                exit 0
            }
        }
    }
}

# Graceful shutdown
Write-Host "Performing graceful shutdown..." -ForegroundColor Yellow

# Use docker compose to stop services gracefully
if (`$Force) {
    Write-Host "Force stopping and removing containers..." -ForegroundColor Red
    docker compose -f compose.prod.yml down --remove-orphans --volumes
} else {
    Write-Host "Stopping services gracefully..." -ForegroundColor Yellow
    docker compose -f compose.prod.yml stop
}

Write-Host ""
Write-Host "Production environment stopped successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "To restart: .\scripts\start-prod.ps1" -ForegroundColor Cyan
if (-not `$Force) {
    Write-Host "To remove containers and volumes: .\scripts\stop-prod.ps1 -Force" -ForegroundColor Cyan
}
Write-Host ""
"@

$stopScript | Set-Content "scripts/stop-prod.ps1" -Encoding UTF8
