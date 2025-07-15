# PowerShell Production stop script for AIOT Smart Greenhouse

# Ensure UTF-8 encoding for proper Unicode character display
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

param(
    [switch]$Force = $false,
    [switch]$Backup = $true
)

Write-Host "Stopping AIOT Smart Greenhouse Production Environment..." -ForegroundColor Red

# Create backup before stopping if requested
if ($Backup -and (Test-Path "scripts/backup-prod.ps1")) {
    Write-Host "Creating backup before shutdown..." -ForegroundColor Yellow
    try {
        & "scripts/backup-prod.ps1"
    } catch {
        Write-Host "Warning: Backup failed: $($_.Exception.Message)" -ForegroundColor Yellow
        if (-not $Force) {
            $continue = Read-Host "Continue shutdown without backup? (y/N)"
            if ($continue -ne "y" -and $continue -ne "Y") {
                Write-Host "Shutdown cancelled." -ForegroundColor Yellow
                exit 0
            }
        }
    }
}

# Graceful shutdown
Write-Host "Performing graceful shutdown..." -ForegroundColor Yellow

# Use docker compose to stop services gracefully
if ($Force) {
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
if (-not $Force) {
    Write-Host "To remove containers and volumes: .\scripts\stop-prod.ps1 -Force" -ForegroundColor Cyan
}
Write-Host ""
