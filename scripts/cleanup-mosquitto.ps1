# PowerShell script to clean up mosquitto-related files and references

# Ensure UTF-8 encoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Cleaning up mosquitto-related files and references..." -ForegroundColor Yellow

# Remove mosquitto directory if exists
if (Test-Path "mosquitto") {
    Write-Host "Removing mosquitto directory..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "mosquitto"
    Write-Host "Mosquitto directory removed" -ForegroundColor Green
} else {
    Write-Host "Mosquitto directory not found" -ForegroundColor Gray
}

# Clean up any remaining mosquitto references in docker-compose files
Write-Host "Checking for any remaining mosquitto references..." -ForegroundColor Yellow

$composeFiles = @("compose.yml", "compose.prod.yml")
foreach ($file in $composeFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -match "mosquitto|mqtt.*:.*1883") {
            Write-Host "Found mosquitto references in $file - please review manually" -ForegroundColor Yellow
        } else {
            Write-Host "$file is clean" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "Cleanup completed!" -ForegroundColor Green
Write-Host "The application now uses external MQTT broker: mqtt://mqtt.noboroto.id.vn:1883" -ForegroundColor Cyan
