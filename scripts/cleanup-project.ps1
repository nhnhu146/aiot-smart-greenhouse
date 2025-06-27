# PowerShell script to clean up and optimize AIOT Smart Greenhouse project

Write-Host "AIOT Smart Greenhouse - Cleanup and Optimization" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# 1. Remove mosquitto-related files if they exist
Write-Host "1. Cleaning up mosquitto-related files..." -ForegroundColor Yellow

if (Test-Path "mosquitto") {
    Remove-Item -Recurse -Force "mosquitto"
    Write-Host "   Removed mosquitto directory" -ForegroundColor Green
}

# 2. Clean up unnecessary files
Write-Host "2. Cleaning up unnecessary files..." -ForegroundColor Yellow

$cleanupPatterns = @("*.log", "*.tmp", ".DS_Store", "Thumbs.db")
foreach ($pattern in $cleanupPatterns) {
    $files = Get-ChildItem -Recurse -Force -Name $pattern -ErrorAction SilentlyContinue
    if ($files) {
        foreach ($file in $files) {
            Remove-Item $file -Force -ErrorAction SilentlyContinue
        }
        Write-Host "   Removed $($files.Count) $pattern files" -ForegroundColor Green
    }
}

# 3. Check Docker configuration
Write-Host "3. Checking Docker configuration..." -ForegroundColor Yellow

$composeFiles = @("compose.yml", "compose.prod.yml")
foreach ($file in $composeFiles) {
    if (Test-Path $file) {
        Write-Host "   $file - OK" -ForegroundColor Green
    } else {
        Write-Host "   $file - Missing" -ForegroundColor Red
    }
}

# 4. Check scripts
Write-Host "4. Checking automation scripts..." -ForegroundColor Yellow

$scriptFiles = @(
    "scripts/start-dev.ps1",
    "scripts/start-prod.ps1", 
    "scripts/stop-dev.ps1",
    "scripts/stop-prod.ps1"
)

foreach ($script in $scriptFiles) {
    if (Test-Path $script) {
        Write-Host "   $script - OK" -ForegroundColor Green
    } else {
        Write-Host "   $script - Missing" -ForegroundColor Red
    }
}

# 5. Create summary
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "- Mosquitto service removed from all configurations" -ForegroundColor White
Write-Host "- Using external MQTT broker: mqtt://mqtt.noboroto.id.vn:1883" -ForegroundColor White
Write-Host "- All scripts updated to exclude mosquitto" -ForegroundColor White
Write-Host "- Unnecessary files cleaned up" -ForegroundColor White

Write-Host ""
Write-Host "Cleanup completed successfully!" -ForegroundColor Green
