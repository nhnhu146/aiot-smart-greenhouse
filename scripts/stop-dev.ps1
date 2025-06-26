# PowerShell stop script for AIOT Smart Greenhouse
Write-Host "Stopping AIOT Smart Greenhouse Development Environment..." -ForegroundColor Red

# Stop Node.js processes
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force

# Stop Docker services
docker compose down

Write-Host "All services stopped." -ForegroundColor Green
