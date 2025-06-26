# Force clean AIOT Smart Greenhouse project with aggressive Windows long path handling
# Use this script only if the regular clean-project.ps1 fails due to path length issues

# Ensure UTF-8 encoding for proper Unicode character display
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Force cleaning AIOT Smart Greenhouse project..." -ForegroundColor Red
Write-Host "This uses aggressive methods and may take longer..." -ForegroundColor Yellow

# Enable long paths for Windows 10/11 (requires admin rights)
function Enable-LongPaths {
    try {
        if (([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
            Write-Host "Running as Administrator - attempting to enable long paths..." -ForegroundColor Cyan
            reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d 1 /f 2>$null
        }
    } catch {
        # Silently continue
    }
}

# Function to force remove directory using multiple methods
function Force-RemoveDirectory {
    param([string]$Path)
    
    if (-not (Test-Path $Path)) {
        return
    }
    
    Write-Host "Force removing: $Path" -ForegroundColor Yellow
    
    # Method 1: Standard PowerShell
    try {
        Remove-Item $Path -Recurse -Force -ErrorAction Stop
        Write-Host "Removed: $Path (standard method)" -ForegroundColor Green
        return
    } catch {
        Write-Host "Standard removal failed, trying alternative methods..." -ForegroundColor Yellow
    }
    
    # Method 2: Robocopy mirror with empty directory
    try {
        $tempDir = Join-Path $env:TEMP "empty_$(Get-Random)"
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
        robocopy $tempDir $Path /MIR /R:0 /W:0 /NFL /NDL /NJH /NJS | Out-Null
        Remove-Item $tempDir -Force -ErrorAction SilentlyContinue
        Remove-Item $Path -Force -ErrorAction SilentlyContinue
        Write-Host "Removed: $Path (robocopy method)" -ForegroundColor Green
        return
    } catch {
        Write-Host "Robocopy method failed, trying CMD..." -ForegroundColor Yellow
    }
    
    # Method 3: CMD rmdir with /s /q
    try {
        $fullPath = Resolve-Path $Path -ErrorAction SilentlyContinue
        if ($fullPath) {
            cmd /c "rmdir `"$($fullPath.Path)`" /s /q" 2>$null
            if (-not (Test-Path $Path)) {
                Write-Host "Removed: $Path (CMD method)" -ForegroundColor Green
                return
            }
        }
    } catch {
        Write-Host "CMD method failed..." -ForegroundColor Yellow
    }
    
    # Method 4: Rename and delete (for locked files)
    try {
        $randomName = "toDelete_$(Get-Random)"
        $parentDir = Split-Path $Path -Parent
        $newPath = Join-Path $parentDir $randomName
        Move-Item $Path $newPath -Force -ErrorAction SilentlyContinue
        Remove-Item $newPath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Removed: $Path (rename method)" -ForegroundColor Green
        return
    } catch {
        Write-Host "All methods failed for: $Path" -ForegroundColor Red
    }
}

# Try to enable long paths
Enable-LongPaths

Write-Host "Force cleaning node_modules..." -ForegroundColor Yellow
Force-RemoveDirectory "backend\node_modules"
Force-RemoveDirectory "frontend\node_modules"

Write-Host "Force cleaning build artifacts..." -ForegroundColor Yellow
Force-RemoveDirectory "backend\dist"
Force-RemoveDirectory "backend\build"
Force-RemoveDirectory "frontend\.next"
Force-RemoveDirectory "frontend\build"
Force-RemoveDirectory "frontend\dist"

Write-Host "Force cleaning cache directories..." -ForegroundColor Yellow
Force-RemoveDirectory "backend\.cache"
Force-RemoveDirectory "frontend\.cache"
Force-RemoveDirectory "backend\.yarn-cache"
Force-RemoveDirectory "frontend\.yarn-cache"
Force-RemoveDirectory ".yarn\cache"

Write-Host "Force cleaning logs..." -ForegroundColor Yellow
Force-RemoveDirectory "backend\logs"
Force-RemoveDirectory "mosquitto\logs"

# Clean remaining files
Write-Host "Cleaning remaining files..." -ForegroundColor Yellow
$filesToRemove = @(
    "backend\.eslintcache",
    "frontend\.eslintcache",
    "backend\package-lock.json",
    "frontend\package-lock.json"
)

foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        try {
            Remove-Item $file -Force
            Write-Host "Removed: $file" -ForegroundColor Gray
        } catch {
            Write-Host "Failed to remove: $file" -ForegroundColor Red
        }
    }
}

# Clean yarn and npm caches
if (Get-Command -Name "yarn" -ErrorAction SilentlyContinue) {
    Write-Host "Cleaning yarn cache..." -ForegroundColor Yellow
    yarn cache clean --all 2>$null
}

if (Get-Command -Name "npm" -ErrorAction SilentlyContinue) {
    Write-Host "Cleaning npm cache..." -ForegroundColor Yellow
    npm cache clean --force 2>$null
}

Write-Host ""
Write-Host "Force cleaning completed!" -ForegroundColor Green
Write-Host "If some files couldn't be removed, they may be locked by running processes." -ForegroundColor Yellow
Write-Host "Try closing VS Code, Docker, and other development tools, then run this script again." -ForegroundColor Yellow
