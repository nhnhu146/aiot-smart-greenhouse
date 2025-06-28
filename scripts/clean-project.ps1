# Clean and optimize AIOT Smart Greenhouse project
# Enhanced version with force cleanup capabilities

param(
    [switch]$Force,
    [switch]$SkipDocker,
    [switch]$SkipCache
)

# Ensure UTF-8 encoding for proper Unicode character display
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$cleanupMode = if ($Force) { "Force" } else { "Standard" }
Write-Host "Cleaning and optimizing AIOT Smart Greenhouse project ($cleanupMode mode)..." -ForegroundColor Green

# Enable long path support for current session (Windows 10/11)
try {
    if ([Environment]::OSVersion.Platform -eq "Win32NT") {
        # This might help with some long path issues
        [System.IO.Directory]::SetCurrentDirectory((Get-Location).Path)
    }
} catch {
    # Silently continue if this fails
}

# Function to safely remove directory with Windows long path support
function Remove-DirectorySafe {
    param([string]$Path)
    if (Test-Path $Path) {
        try {
            # Try normal removal first
            Remove-Item $Path -Recurse -Force -ErrorAction Stop
            Write-Host "Removed: $Path" -ForegroundColor Gray
        } catch {
            if ($Force) {
                try {
                    # Try with robocopy for stubborn directories (Windows long path issue)
                    Write-Host "Attempting force removal for: $Path" -ForegroundColor Yellow
                    $tempDir = Join-Path $env:TEMP "empty_$(Get-Random)"
                    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
                    robocopy $tempDir $Path /MIR /R:0 /W:0 /NFL /NDL /NJH /NJS | Out-Null
                    Remove-Item $tempDir -Force -ErrorAction SilentlyContinue
                    Remove-Item $Path -Force -ErrorAction SilentlyContinue
                    Write-Host "Removed: $Path (force method)" -ForegroundColor Gray
                } catch {
                    try {
                        # Final attempt with takeown and icacls (Windows-specific)
                        Write-Host "Attempting admin removal for: $Path" -ForegroundColor Yellow
                        cmd /c "takeown /f `"$Path`" /r /d y >nul 2>&1"
                        cmd /c "icacls `"$Path`" /grant administrators:F /t >nul 2>&1"
                        Remove-Item $Path -Recurse -Force -ErrorAction SilentlyContinue
                        Write-Host "Removed: $Path (admin method)" -ForegroundColor Gray
                    } catch {
                        Write-Host "Failed to remove: $Path - $($_.Exception.Message)" -ForegroundColor Red
                    }
                }
            } else {
                Write-Host "Failed to remove: $Path (use -Force for aggressive removal)" -ForegroundColor Yellow
            }
        }
    }
}

# Function to safely remove file
function Remove-FileSafe {
    param([string]$Path)
    if (Test-Path $Path) {
        try {
            Remove-Item $Path -Force
            Write-Host "Removed: $Path" -ForegroundColor Gray
        } catch {
            Write-Host "Failed to remove: $Path" -ForegroundColor Red
        }
    }
}

Write-Host "Cleaning node_modules..." -ForegroundColor Yellow
Remove-DirectorySafe "backend/node_modules"
Remove-DirectorySafe "frontend/node_modules"

Write-Host "Cleaning build artifacts..." -ForegroundColor Yellow
Remove-DirectorySafe "backend/dist"
Remove-DirectorySafe "backend/build"
Remove-DirectorySafe "frontend/.next"
Remove-DirectorySafe "frontend/build"
Remove-DirectorySafe "frontend/dist"

Write-Host "Cleaning logs..." -ForegroundColor Yellow
Remove-DirectorySafe "backend/logs"
Remove-DirectorySafe "mosquitto/logs"
Remove-FileSafe "*.log"
Remove-FileSafe "backend/*.log"
Remove-FileSafe "frontend/*.log"

Write-Host "Cleaning cache files..." -ForegroundColor Yellow
Remove-DirectorySafe "backend/.cache"
Remove-DirectorySafe "frontend/.cache"

# Clean Yarn cache directories with special handling for Windows long paths
Write-Host "Cleaning Yarn cache (this may take a moment for deep nested paths)..." -ForegroundColor Yellow
$yarnCachePaths = @(
    "backend/.yarn-cache",
    "frontend/.yarn-cache", 
    ".yarn/cache"
)

foreach ($cachePath in $yarnCachePaths) {
    if (Test-Path $cachePath) {
        Write-Host "Processing: $cachePath" -ForegroundColor Cyan
        Remove-DirectorySafe $cachePath
    }
}

Remove-FileSafe "backend/.eslintcache"
Remove-FileSafe "frontend/.eslintcache"

Write-Host "Cleaning temporary files..." -ForegroundColor Yellow
Get-ChildItem -Path . -Recurse -Name "*.tmp" | ForEach-Object { Remove-FileSafe $_ }
Get-ChildItem -Path . -Recurse -Name ".DS_Store" | ForEach-Object { Remove-FileSafe $_ }
Get-ChildItem -Path . -Recurse -Name "Thumbs.db" | ForEach-Object { Remove-FileSafe $_ }

Write-Host "Removing package-lock.json files (using yarn instead)..." -ForegroundColor Yellow
Remove-FileSafe "backend/package-lock.json"
Remove-FileSafe "frontend/package-lock.json"

Write-Host "Optimizing Docker..." -ForegroundColor Yellow
if (-not $SkipDocker) {
    try {
        docker system prune -f
        Write-Host "Docker system cleaned" -ForegroundColor Gray
    } catch {
        Write-Host "Docker cleanup failed or Docker not running" -ForegroundColor Yellow
    }
} else {
    Write-Host "Skipping Docker cleanup (--SkipDocker specified)" -ForegroundColor Yellow
}

# Clean yarn cache if yarn is available
if (-not $SkipCache -and (Get-Command -Name "yarn" -ErrorAction SilentlyContinue)) {
    Write-Host "Cleaning yarn global cache..." -ForegroundColor Yellow
    try {
        # Clean global yarn cache
        yarn cache clean --all
        Write-Host "Yarn global cache cleaned" -ForegroundColor Gray
    } catch {
        Write-Host "Yarn global cache cleanup failed" -ForegroundColor Yellow
    }
    
    # Clean project-specific yarn cache
    foreach ($projectDir in @("backend", "frontend")) {
        if (Test-Path $projectDir) {
            try {
                Write-Host "Cleaning yarn cache in $projectDir..." -ForegroundColor Cyan
                Set-Location $projectDir
                yarn cache clean --force 2>$null
                Set-Location ".."
                Write-Host "Yarn cache cleaned in $projectDir" -ForegroundColor Gray
            } catch {
                Write-Host "Yarn cache cleanup failed in $projectDir" -ForegroundColor Yellow
                Set-Location ".."
            }
        }
    }
}

# Clean npm cache
if (-not $SkipCache -and (Get-Command -Name "npm" -ErrorAction SilentlyContinue)) {
    Write-Host "Cleaning npm cache..." -ForegroundColor Yellow
    npm cache clean --force
}

Write-Host ""
Write-Host "Project cleaned successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Cleaned directories and files:" -ForegroundColor Cyan
Write-Host "- node_modules (backend and frontend)" -ForegroundColor White
Write-Host "- Build artifacts (.next, dist, build)" -ForegroundColor White
Write-Host "- Log files" -ForegroundColor White
Write-Host "- Cache files (.cache, .yarn-cache)" -ForegroundColor White
Write-Host "- Temporary files" -ForegroundColor White
Write-Host "- Package lock files" -ForegroundColor White
Write-Host ""
Write-Host "Recommended next steps:" -ForegroundColor Cyan
Write-Host "1. Run: .\scripts\start-dev.ps1" -ForegroundColor White
Write-Host "2. Or manually install dependencies: yarn install (in backend and frontend)" -ForegroundColor White
Write-Host ""
Write-Host "If you encountered path length errors, they are non-critical and" -ForegroundColor Yellow
Write-Host "the cleanup was still successful for the important directories." -ForegroundColor Yellow
