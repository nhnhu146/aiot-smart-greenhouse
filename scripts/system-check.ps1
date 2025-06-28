# Smart Greenhouse System Check Script
# Enhanced version with comprehensive testing capabilities

param(
    [switch]$Comprehensive,
    [switch]$SkipServiceCheck,
    [string]$Environment = "development"
)

Write-Host "Smart Greenhouse System Check" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green

if ($Comprehensive) {
    Write-Host "Running comprehensive system check..." -ForegroundColor Cyan
} else {
    Write-Host "Running basic system check (use -Comprehensive for full test)" -ForegroundColor Cyan
}

# Test Results Tracking
$TestResults = @()
$TotalTests = 0
$PassedTests = 0

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$Details = ""
    )
    
    $script:TotalTests++
    if ($Passed) {
        $script:PassedTests++
        Write-Host "✅ $TestName" -ForegroundColor Green
    } else {
        Write-Host "❌ $TestName" -ForegroundColor Red
    }
    
    if ($Details) {
        Write-Host "   $Details" -ForegroundColor Gray
    }
    
    $script:TestResults += [PSCustomObject]@{
        Test = $TestName
        Status = if ($Passed) { "PASS" } else { "FAIL" }
        Details = $Details
    }
}

# Check project structure
Write-Host "`nChecking project structure..." -ForegroundColor Yellow

$criticalFiles = @(
    "backend/package.json",
    "frontend/package.json", 
    "embeded/aiot-greenhouse-embedded.ino",
    "compose.yml",
    ".env.example",
    "DOCUMENTATION.md"
)

foreach ($file in $criticalFiles) {
    Write-TestResult "File: $file" (Test-Path $file)
}

# Check environment
Write-Host "`nChecking environment..." -ForegroundColor Yellow

if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-TestResult "Node.js" $true "Version: $nodeVersion"
} else {
    Write-TestResult "Node.js" $false "Not found"
}

if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-TestResult "Docker" $true
} else {
    Write-TestResult "Docker" $false "Not found"
}

if (Get-Command yarn -ErrorAction SilentlyContinue) {
    Write-TestResult "Yarn" $true
} else {
    Write-TestResult "Yarn" $false "Not found (npm can be used instead)"
}

# Check configuration
Write-Host "`nChecking configuration..." -ForegroundColor Yellow

Write-TestResult ".env file" (Test-Path ".env") $(if (Test-Path ".env") { "Found" } else { "Copy from .env.example" })

# Service Health Check (if not skipped)
if (-not $SkipServiceCheck -and $Comprehensive) {
    Write-Host "`nChecking service health..." -ForegroundColor Yellow
    
    function Test-ServiceHealth {
        param([string]$Name, [string]$URL, [int]$Port)
        
        try {
            if ($URL) {
                $response = Invoke-WebRequest -Uri $URL -TimeoutSec 5 -ErrorAction Stop
                Write-TestResult "Service: $Name" $true "HTTP $($response.StatusCode)"
                return $true
            } elseif ($Port) {
                $connection = Test-NetConnection -ComputerName "localhost" -Port $Port -WarningAction SilentlyContinue
                Write-TestResult "Service: $Name" $connection.TcpTestSucceeded "Port $Port"
                return $connection.TcpTestSucceeded
            }
        }
        catch {
            Write-TestResult "Service: $Name" $false "Not responding"
            return $false
        }
    }
    
    # Test services
    Test-ServiceHealth "Backend API" "http://localhost:5000/api/health" 0
    Test-ServiceHealth "Frontend App" "http://localhost:3000" 0
    Test-ServiceHealth "MongoDB" "" 27017
    Test-ServiceHealth "MQTT Broker" "" 1883
}

# Comprehensive tests
if ($Comprehensive) {
    Write-Host "`nRunning comprehensive tests..." -ForegroundColor Yellow
    
    # Check package.json dependencies
    foreach ($dir in @("backend", "frontend")) {
        $packageJson = Join-Path $dir "package.json"
        if (Test-Path $packageJson) {
            try {
                $package = Get-Content $packageJson | ConvertFrom-Json
                $depCount = if ($package.dependencies) { $package.dependencies.PSObject.Properties.Count } else { 0 }
                Write-TestResult "Dependencies: $dir" $true "Found $depCount dependencies"
            } catch {
                Write-TestResult "Dependencies: $dir" $false "Invalid package.json"
            }
        }
    }
    
    # Check for node_modules
    foreach ($dir in @("backend", "frontend")) {
        $nodeModules = Join-Path $dir "node_modules"
        Write-TestResult "Node modules: $dir" (Test-Path $nodeModules) $(if (Test-Path $nodeModules) { "Installed" } else { "Run yarn install" })
    }
}

# Summary
Write-Host "`n" + "="*50 -ForegroundColor Cyan
$successRate = if ($TotalTests -gt 0) { [math]::Round(($PassedTests / $TotalTests) * 100, 1) } else { 0 }

Write-Host "Test Results: $PassedTests/$TotalTests passed ($successRate%)" -ForegroundColor $(if ($successRate -ge 80) { "Green" } else { "Yellow" })

if ($successRate -ge 80) {
    Write-Host "✅ System check passed!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor White
    Write-Host "1. Configure .env file" -ForegroundColor Gray
    Write-Host "2. Run: docker-compose up -d" -ForegroundColor Gray
    Write-Host "3. Access: http://localhost:3000" -ForegroundColor Gray
} else {
    Write-Host "❌ System check failed - multiple issues found" -ForegroundColor Red
    Write-Host "`nFailed tests:" -ForegroundColor Yellow
    $TestResults | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object { 
        Write-Host "- $($_.Test)" -ForegroundColor Red 
        if ($_.Details) { Write-Host "  $($_.Details)" -ForegroundColor Gray }
    }
}

Write-Host "`nFor complete documentation: DOCUMENTATION.md" -ForegroundColor Cyan
Write-Host "To run comprehensive check: .\scripts\system-check.ps1 -Comprehensive" -ForegroundColor Cyan
