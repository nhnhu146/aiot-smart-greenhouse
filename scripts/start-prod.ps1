# PowerShell Production start script for AIOT Smart Greenhouse

# Ensure UTF-8 encoding for proper Unicode character display
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

param(
    [string]$MqttUser = "vision",
    [string]$MqttPassword = "vision",
    [switch]$SkipBuild = $false,
    [switch]$Force = $false
)

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
    $envContent = @"
# Production Environment Configuration for AIOT Smart Greenhouse
NODE_ENV=production
MONGODB_USER=greenhouse_admin
MONGODB_PASSWORD=$(Get-Random -Minimum 100000 -Maximum 999999)_SecurePass
MQTT_USERNAME=$MqttUser
MQTT_PASSWORD=$MqttPassword
API_PREFIX=/api
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
"@
    $envContent | Set-Content ".env" -Encoding ASCII
    Write-Host "Production .env file created with secure credentials" -ForegroundColor Green
}

# Create necessary directories with proper permissions
Write-Host "Creating necessary directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "mosquitto/data" | Out-Null
New-Item -ItemType Directory -Force -Path "mosquitto/logs" | Out-Null
New-Item -ItemType Directory -Force -Path "backend/logs" | Out-Null

# Create production backup directory
New-Item -ItemType Directory -Force -Path "backups" | Out-Null

# Step 1: Initialize MQTT with anonymous access for setup
Write-Host "Step 1: Setting up MQTT configuration for anonymous access..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "mosquitto/config" | Out-Null

# Create anonymous configuration
$anonymousConfig = @"
listener 1883
allow_anonymous true
persistence true
persistence_location /mosquitto/data/
log_dest stdout
"@
$anonymousConfig | Set-Content "mosquitto/config/mosquitto.conf" -Encoding ASCII
$anonymousConfig | Set-Content "mosquitto/config/mosquitto-anonymous.conf" -Encoding ASCII

# Create secure configuration template
$secureConfig = @"
listener 1883
allow_anonymous false
password_file /mosquitto/config/passwd
persistence true
persistence_location /mosquitto/data/
log_dest stdout
"@
$secureConfig | Set-Content "mosquitto/config/mosquitto-secure.conf" -Encoding ASCII
Write-Host "MQTT initially configured for anonymous access" -ForegroundColor Green

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

# Step 2: Create MQTT user with password
Write-Host "Step 2: Creating MQTT user '$MqttUser' with password '$MqttPassword'..." -ForegroundColor Cyan
try {
    docker exec aiot_greenhouse_mqtt mosquitto_passwd -b -c /mosquitto/config/passwd $MqttUser $MqttPassword
    docker exec aiot_greenhouse_mqtt chmod 600 /mosquitto/config/passwd
    Write-Host "MQTT user created successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to create MQTT user: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Production deployment cannot continue without secure MQTT!" -ForegroundColor Red
    exit 1
}

# Step 3: Switch to secure configuration (disable anonymous)
Write-Host "Step 3: Switching to secure configuration (disabling anonymous)..." -ForegroundColor Cyan
Copy-Item "mosquitto/config/mosquitto-secure.conf" "mosquitto/config/mosquitto.conf" -Force
docker restart aiot_greenhouse_mqtt
Start-Sleep -Seconds 5

# Verify MQTT is running with authentication
$mqttRunning = docker ps --filter "name=aiot_greenhouse_mqtt" --filter "status=running" --quiet
if ($mqttRunning) {
    Write-Host "Production MQTT authentication configured successfully!" -ForegroundColor Green
    Write-Host "   Username: $MqttUser" -ForegroundColor Cyan
    Write-Host "   Password: $MqttPassword" -ForegroundColor Cyan
    Write-Host "   Anonymous access: DISABLED" -ForegroundColor Green
} else {
    Write-Host "MQTT failed to restart with authentication" -ForegroundColor Red
    exit 1
}

# Check service health
Write-Host "Checking service health..." -ForegroundColor Yellow
$services = @("aiot_greenhouse_db", "aiot_greenhouse_mqtt", "aiot_greenhouse_redis", "aiot_greenhouse_backend")

foreach ($service in $services) {
    $status = docker inspect $service --format='{{.State.Status}}' 2>$null
    $health = docker inspect $service --format='{{.State.Health.Status}}' 2>$null
    
    if ($status -eq "running") {
        if ($health -eq "healthy" -or $health -eq "") {
            Write-Host "[OK] $service : Running and healthy" -ForegroundColor Green
        } else {
            Write-Host "[WARN] $service : Running but $health" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[ERROR] $service : $status" -ForegroundColor Red
    }
}

# Create production backup script
$backupScript = @"
# Production backup script
`$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Write-Host "Creating backup at `$timestamp..." -ForegroundColor Green

# Backup MongoDB
docker exec aiot_greenhouse_db mongodump --out /tmp/backup_`$timestamp
docker cp aiot_greenhouse_db:/tmp/backup_`$timestamp ./backups/mongodb_`$timestamp

# Backup MQTT config
Copy-Item -Recurse mosquitto/config ./backups/mqtt_config_`$timestamp

Write-Host "Backup completed: ./backups/*_`$timestamp" -ForegroundColor Green
"@

$backupScript | Set-Content "scripts/backup-prod.ps1" -Encoding ASCII

# Display production information
Write-Host ""
Write-Host "AIOT Smart Greenhouse Production Environment Started!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Cyan
Write-Host "   Backend API: http://localhost:5000/api" -ForegroundColor White
Write-Host "   Health Check: http://localhost:5000/api/health" -ForegroundColor White
Write-Host "   MQTT Broker: mqtt://localhost:1883" -ForegroundColor White
Write-Host "   MongoDB: mongodb://localhost:27017" -ForegroundColor White
Write-Host "   Redis: redis://localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "Credentials:" -ForegroundColor Cyan
Write-Host "   MQTT User: $MqttUser" -ForegroundColor White
Write-Host "   MQTT Password: [Check .env file]" -ForegroundColor White
Write-Host ""
Write-Host "Management Commands:" -ForegroundColor Cyan
Write-Host "   Stop services: docker compose -f compose.prod.yml down" -ForegroundColor White
Write-Host "   View logs: docker compose -f compose.prod.yml logs -f [service]" -ForegroundColor White
Write-Host "   Create backup: .\scripts\backup-prod.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Security Notes:" -ForegroundColor Yellow
Write-Host "   - Change default MQTT credentials in production" -ForegroundColor White
Write-Host "   - Set up proper SSL/TLS certificates" -ForegroundColor White
Write-Host "   - Configure firewall rules" -ForegroundColor White
Write-Host "   - Set up log rotation" -ForegroundColor White
Write-Host ""

Write-Host "Production environment is ready!" -ForegroundColor Green
