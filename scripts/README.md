# 🔧 Scripts Documentation

This directory contains PowerShell scripts for automating development, deployment, and maintenance tasks for the AIOT Smart Greenhouse project.

## 📋 Available Scripts

### 🔍 System Check & Validation
- **`system-check.ps1`** - Basic system health check
  - `system-check.ps1 -Comprehensive` - Full system validation with service checks
  - `system-check.ps1 -SkipServiceCheck` - Skip service health validation
- **`quick-check.ps1`** - Quick status check with service management options
  - `quick-check.ps1 -StartServices` - Check and start services
  - `quick-check.ps1 -StopServices` - Stop all services
  - `quick-check.ps1 -CheckOnly` - Status check only

### 🚀 Environment Management
- **`start-dev.ps1`** - Start development environment with hot reload
- **`start-prod.ps1`** - Start production environment with optimizations
- **`stop-dev.ps1`** - Stop development services
- **`stop-prod.ps1`** - Stop production services

### 🧹 Maintenance & Cleanup
- **`clean-project.ps1`** - Clean build artifacts and cache files
  - `clean-project.ps1 -Force` - Aggressive cleanup for Windows long paths
  - `clean-project.ps1 -SkipDocker` - Skip Docker system cleanup
  - `clean-project.ps1 -SkipCache` - Skip yarn/npm cache cleanup
- **`optimize-project.ps1`** - Project optimization and analysis
- **`cleanup-mosquitto.ps1`** - Clean up MQTT broker specific files

### ⚙️ Configuration & Setup
- **`setup-email-alerts.ps1`** - Interactive email alert system configuration
- **`init-mongo.js`** - MongoDB initialization script (Node.js)

## 🎯 Common Usage Patterns

### Quick Start Development
```powershell
# Check system readiness
.\scripts\system-check.ps1

# Start development environment
.\scripts\start-dev.ps1

# Access application at http://localhost:3000
```

### System Troubleshooting
```powershell
# Comprehensive system check
.\scripts\system-check.ps1 -Comprehensive

# Check service status and manage services
.\scripts\quick-check.ps1 -StartServices

# Clean and reset environment
.\scripts\clean-project.ps1 -Force
.\scripts\start-dev.ps1
```

### Production Deployment
```powershell
# System validation
.\scripts\system-check.ps1 -Comprehensive

# Optimize project
.\scripts\optimize-project.ps1

# Deploy production
.\scripts\start-prod.ps1
```

### Maintenance Tasks
```powershell
# Regular cleanup
.\scripts\clean-project.ps1

# Deep cleanup for Windows path issues
.\scripts\clean-project.ps1 -Force

# Project optimization
.\scripts\optimize-project.ps1
```

## 🔧 Script Features

### Smart Cleanup (`clean-project.ps1`)
- **Standard Mode**: Safe cleanup of build artifacts, cache files, and temporary files
- **Force Mode**: Aggressive cleanup using multiple Windows-specific methods for long paths
- **Selective Cleanup**: Options to skip Docker or cache cleanup
- **Windows Long Path Support**: Handles Windows path length limitations automatically

### Comprehensive Testing (`system-check.ps1`)
- **Basic Check**: Project structure and environment validation
- **Comprehensive Mode**: Full system validation including service health checks
- **Detailed Reporting**: Test results with success rates and failure details
- **Service Health**: API endpoint and port connectivity testing

### Service Management (`quick-check.ps1`)
- **Status Monitoring**: Real-time service health checking
- **Service Control**: Start/stop services with single command
- **System Overview**: Quick status dashboard for all services
- **Docker Integration**: Container status and management

## 📊 Exit Codes
- `0` - Success
- `1` - General error
- `2` - Missing dependencies
- `3` - Service connection failure
- `4` - Configuration error

## 🔒 Security Notes
- Scripts prefer `yarn` over `npm` for better security and performance
- Environment variables are validated before use  
- No sensitive data is logged or displayed
- Docker cleanup removes only project-related containers

## 🐛 Troubleshooting

### Common Issues
1. **PowerShell Execution Policy**: Run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
2. **Long Path Issues**: Use `-Force` parameter with cleanup scripts
3. **Docker Not Running**: Start Docker Desktop before running scripts
4. **Port Conflicts**: Check if ports 3000, 5000, 27017, 1883 are available

### Windows-Specific Tips
- Scripts are optimized for Windows PowerShell 5.1 and PowerShell 7+
- Long path support is automatically handled in cleanup scripts
- Admin rights may be required for some cleanup operations

## 📚 Related Documentation
- [Main Documentation](../DOCUMENTATION.md) - Complete system documentation
- [README](../README.md) - Quick start guide
- [Environment Configuration](../DOCUMENTATION.md#configuration-guide) - Detailed configuration guide

---

**Note**: All scripts are designed to be run from the project root directory. They include proper error handling and user feedback for reliable automation.
