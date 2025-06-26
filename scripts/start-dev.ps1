# PowerShell Development start script for AIOT Smart Greenhouse

# Ensure UTF-8 encoding for proper Unicode character display
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Starting AIOT Smart Greenhouse Development Environment..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "Docker is not running. Please start Docker first." -ForegroundColor Red
    exit 1
}

# Check for yarn, prefer it over npm for speed
$useYarn = [bool](Get-Command -Name "yarn" -ErrorAction SilentlyContinue)
if ($useYarn) {
    Write-Host "Using yarn for faster package management" -ForegroundColor Green
} else {
    Write-Host "Yarn not found, using npm. Consider installing yarn: npm install -g yarn" -ForegroundColor Yellow
}

# Check if .env file exists
if (!(Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
    } else {
        $envContent = @"
# Environment Configuration for AIOT Smart Greenhouse
NODE_ENV=development
MONGODB_USER=greenhouse_user
MONGODB_PASSWORD=greenhouse_password
MQTT_USERNAME=vision
MQTT_PASSWORD=vision
"@
        $envContent | Out-File -FilePath ".env" -Encoding UTF8
    }
}

# Create necessary directories
Write-Host "Creating necessary directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "mosquitto/data" | Out-Null
New-Item -ItemType Directory -Force -Path "mosquitto/logs" | Out-Null
New-Item -ItemType Directory -Force -Path "backend/logs" | Out-Null

# Setup MQTT configuration with proper sequence
Write-Host "Setting up MQTT configuration..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "mosquitto/config" | Out-Null

# Step 1: Create anonymous configuration
Write-Host "Step 1: Creating anonymous MQTT configuration..." -ForegroundColor Cyan
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

# Install backend dependencies if node_modules doesn't exist
if (!(Test-Path "backend/node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Push-Location backend
    # Remove package-lock.json if exists and we're using yarn
    if ($useYarn -and (Test-Path "package-lock.json")) {
        Remove-Item "package-lock.json" -Force
        Write-Host "Removed package-lock.json for yarn compatibility" -ForegroundColor Gray
    }
    
    if ($useYarn) {
        yarn install --prefer-offline --silent --production=false
    } else {
        npm install --prefer-offline --no-audit --silent
    }
    Pop-Location
}

# Install frontend dependencies if node_modules doesn't exist
if (!(Test-Path "frontend/node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location frontend
    # Remove package-lock.json if exists and we're using yarn
    if ($useYarn -and (Test-Path "package-lock.json")) {
        Remove-Item "package-lock.json" -Force
        Write-Host "Removed package-lock.json for yarn compatibility" -ForegroundColor Gray
    }
    
    if ($useYarn) {
        # Create yarn.lock if not exists for frontend
        if (!(Test-Path "yarn.lock")) {
            yarn install --prefer-offline --silent --production=false
        } else {
            yarn install --prefer-offline --silent --frozen-lockfile --production=false
        }
    } else {
        npm install --prefer-offline --no-audit --silent
    }
    Pop-Location
}

# Start services
Write-Host "Starting Docker services..." -ForegroundColor Yellow
docker compose up -d mongodb mosquitto redis

Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 2: Create MQTT user with password
Write-Host "Step 2: Creating MQTT user 'vision' with password 'vision'..." -ForegroundColor Cyan
try {
    docker exec aiot_greenhouse_mqtt mosquitto_passwd -b -c /mosquitto/config/passwd vision vision
    docker exec aiot_greenhouse_mqtt chmod 600 /mosquitto/config/passwd
    Write-Host "MQTT user created successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to create MQTT user: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Continuing with anonymous access..." -ForegroundColor Yellow
}

# Step 3: Switch to secure configuration (disable anonymous)
Write-Host "Step 3: Switching to secure configuration (disabling anonymous)..." -ForegroundColor Cyan
Copy-Item "mosquitto/config/mosquitto-secure.conf" "mosquitto/config/mosquitto.conf" -Force
docker restart aiot_greenhouse_mqtt
Start-Sleep -Seconds 5

# Verify MQTT is running with authentication
$mqttRunning = docker ps --filter "name=aiot_greenhouse_mqtt" --filter "status=running" --quiet
if ($mqttRunning) {
    Write-Host "MQTT authentication configured successfully!" -ForegroundColor Green
    Write-Host "   Username: vision" -ForegroundColor Cyan
    Write-Host "   Password: vision" -ForegroundColor Cyan
    Write-Host "   Anonymous access: DISABLED" -ForegroundColor Green
} else {
    Write-Host "MQTT failed to restart with authentication" -ForegroundColor Red
}

# Start backend in development mode
Write-Host "Starting backend in development mode..." -ForegroundColor Yellow
Push-Location backend
if ($useYarn) {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "yarn dev" -WindowStyle Normal
} else {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run dev" -WindowStyle Normal
}
Pop-Location

# Wait for backend to start
Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start frontend in development mode
Write-Host "Starting frontend in development mode..." -ForegroundColor Yellow
Push-Location frontend
if ($useYarn) {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "yarn dev" -WindowStyle Normal
} else {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run dev" -WindowStyle Normal
}
Pop-Location

Write-Host ""
Write-Host "AIOT Smart Greenhouse is starting up!" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:5000/api" -ForegroundColor Cyan
Write-Host "Health Check: http://localhost:5000/api/health" -ForegroundColor Cyan
Write-Host "MQTT Broker: mqtt://localhost:1883" -ForegroundColor Cyan
Write-Host "MongoDB: mongodb://localhost:27017" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop all services, run: .\scripts\stop-dev.ps1" -ForegroundColor Yellow
Write-Host "To view logs, run: docker compose logs -f [service_name]" -ForegroundColor Yellow
Write-Host ""

# Create stop script
$stopScript = @"
# PowerShell stop script for AIOT Smart Greenhouse
Write-Host "Stopping AIOT Smart Greenhouse Development Environment..." -ForegroundColor Red

# Stop Node.js processes
Get-Process | Where-Object {`$_.ProcessName -eq "node"} | Stop-Process -Force

# Stop Docker services
docker compose down

Write-Host "All services stopped." -ForegroundColor Green
"@

$stopScript | Out-File -FilePath "scripts/stop-dev.ps1" -Encoding UTF8

Write-Host "Press Ctrl+C to stop all services..." -ForegroundColor Yellow
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "Stopping development environment..." -ForegroundColor Red
    Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force
    docker compose down
}
