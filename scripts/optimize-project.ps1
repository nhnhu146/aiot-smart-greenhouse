# PowerShell script to optimize and clean up the entire AIOT Smart Greenhouse project

# Ensure UTF-8 encoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "AIOT Smart Greenhouse - Project Optimization Script" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

$optimizations = @()
$issues = @()

# 1. Check for unused files and directories
Write-Host "1. Checking for unused files and directories..." -ForegroundColor Yellow

# Check for common unnecessary files
$unnecessaryFiles = @(
    ".DS_Store",
    "Thumbs.db",
    "*.log",
    "*.tmp",
    "npm-debug.log*",
    "yarn-debug.log*",
    "yarn-error.log*"
)

foreach ($pattern in $unnecessaryFiles) {
    $files = Get-ChildItem -Recurse -Force -Name $pattern -ErrorAction SilentlyContinue
    if ($files) {
        Write-Host "   Found unnecessary files: $($files -join ', ')" -ForegroundColor Yellow
        $optimizations += "Remove unnecessary files: $($files -join ', ')"
    }
}

# 2. Check Docker setup
Write-Host "2. Checking Docker setup..." -ForegroundColor Yellow

if (!(Test-Path "compose.yml") -or !(Test-Path "compose.prod.yml")) {
    $issues += "Missing Docker compose files"
} else {
    Write-Host "   Docker compose files present" -ForegroundColor Green
}

# 3. Check environment configuration
Write-Host "3. Checking environment configuration..." -ForegroundColor Yellow

if (!(Test-Path ".env.example")) {
    $optimizations += "Create .env.example template file"
} else {
    Write-Host "   .env.example template found" -ForegroundColor Green
}

# 4. Check backend structure
Write-Host "4. Checking backend structure..." -ForegroundColor Yellow

$backendFiles = @(
    "backend/package.json",
    "backend/tsconfig.json",
    "backend/src/index.ts"
)

foreach ($file in $backendFiles) {
    if (!(Test-Path $file)) {
        $issues += "Missing critical backend file: $file"
    }
}

# Check for unused backend dependencies
if (Test-Path "backend/package.json") {
    $packageContent = Get-Content "backend/package.json" | ConvertFrom-Json
    $deps = $packageContent.dependencies
    
    # Check for potential unused dependencies
    $potentiallyUnused = @()
    
    if ($deps.PSObject.Properties.Name -contains "lodash" -and !(Select-String -Path "backend/src/**/*.ts" -Pattern "lodash" -Quiet -ErrorAction SilentlyContinue)) {
        $potentiallyUnused += "lodash"
    }
    
    if ($potentiallyUnused.Count -gt 0) {
        $optimizations += "Review potentially unused backend dependencies: $($potentiallyUnused -join ', ')"
    }
}

# 5. Check frontend structure
Write-Host "5. Checking frontend structure..." -ForegroundColor Yellow

$frontendFiles = @(
    "frontend/package.json",
    "frontend/tsconfig.json",
    "frontend/next.config.js"
)

foreach ($file in $frontendFiles) {
    if (!(Test-Path $file)) {
        $issues += "Missing critical frontend file: $file"
    }
}

# 6. Check for security issues
Write-Host "6. Checking for security issues..." -ForegroundColor Yellow

# Check for hardcoded credentials
$securityFiles = Get-ChildItem -Recurse -Include "*.ts", "*.js", "*.tsx", "*.jsx" -Exclude "node_modules" -ErrorAction SilentlyContinue

foreach ($file in $securityFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -match "(password|secret|key)\s*[:=]\s*['`"][^'`"]{8,}['`"]") {
        $optimizations += "Review potential hardcoded credentials in: $($file.Name)"
    }
}

# 7. Check TypeScript configuration
Write-Host "7. Checking TypeScript configuration..." -ForegroundColor Yellow

$tsConfigs = @("backend/tsconfig.json", "frontend/tsconfig.json")
foreach ($config in $tsConfigs) {
    if (Test-Path $config) {
        $content = Get-Content $config | ConvertFrom-Json
        if (!$content.compilerOptions.strict) {
            $optimizations += "Enable strict mode in $config for better type safety"
        }
    }
}

# 8. Check scripts and automation
Write-Host "8. Checking scripts and automation..." -ForegroundColor Yellow

$scripts = @(
    "scripts/start-dev.ps1",
    "scripts/start-prod.ps1",
    "scripts/stop-dev.ps1",
    "scripts/stop-prod.ps1"
)

foreach ($script in $scripts) {
    if (!(Test-Path $script)) {
        $issues += "Missing automation script: $script"
    }
}

# 9. Check for large files
Write-Host "9. Checking for large files..." -ForegroundColor Yellow

$largeFiles = Get-ChildItem -Recurse -File | Where-Object { $_.Length -gt 10MB -and $_.FullName -notmatch "node_modules" }
if ($largeFiles) {
    foreach ($file in $largeFiles) {
        $sizeMB = [math]::Round($file.Length / 1MB, 2)
        $optimizations += "Large file detected: $($file.Name) ($sizeMB MB) - consider optimization"
    }
}

# 10. Generate optimization report
Write-Host ""
Write-Host "Optimization Report" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green

if ($issues.Count -eq 0 -and $optimizations.Count -eq 0) {
    Write-Host "✅ Project structure looks good!" -ForegroundColor Green
} else {
    if ($issues.Count -gt 0) {
        Write-Host ""
        Write-Host "🚨 Critical Issues:" -ForegroundColor Red
        foreach ($issue in $issues) {
            Write-Host "   - $issue" -ForegroundColor Red
        }
    }
    
    if ($optimizations.Count -gt 0) {
        Write-Host ""
        Write-Host "💡 Optimization Suggestions:" -ForegroundColor Yellow
        foreach ($optimization in $optimizations) {
            Write-Host "   - $optimization" -ForegroundColor Yellow
        }
    }
}

# 11. Create summary report file
$reportContent = @"
# AIOT Smart Greenhouse - Project Optimization Report
Generated: $(Get-Date)

## Project Status
- Total Issues Found: $($issues.Count)
- Total Optimization Suggestions: $($optimizations.Count)

## Critical Issues
$($issues | ForEach-Object { "- $_" } | Out-String)

## Optimization Suggestions
$($optimizations | ForEach-Object { "- $_" } | Out-String)

## Recent Changes
- Removed mosquitto service and related configurations
- Updated scripts to use external MQTT broker
- Cleaned up Docker compose files
- Optimized development and production scripts

## MQTT Configuration
The application now uses external MQTT broker:
- Broker: mqtt://mqtt.noboroto.id.vn:1883
- Username: vision
- Password: vision

## Next Steps
1. Review and implement optimization suggestions
2. Test all scripts and Docker configurations
3. Update documentation if needed
4. Consider implementing automated testing
"@

$reportContent | Out-File -FilePath "OPTIMIZATION_REPORT.md" -Encoding UTF8
Write-Host ""
Write-Host "📊 Detailed report saved to: OPTIMIZATION_REPORT.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Optimization check completed!" -ForegroundColor Green
