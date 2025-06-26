# Scripts Directory

This directory contains essential scripts for managing the AIOT Smart Greenhouse project.

## 🚀 Core Scripts

### Development & Production Management
- **`start-dev.ps1`** - Start development environment with automatic MQTT authentication setup
- **`start-prod.ps1`** - Start production environment with secure MQTT configuration
- **`stop-dev.ps1`** - Stop development environment gracefully
- **`stop-prod.ps1`** - Stop production environment with optional backup

### Project Maintenance
- **`clean-project.ps1`** - Clean build artifacts, cache files, and temporary files
- **`force-clean-project.ps1`** - Aggressive cleaning for stubborn files and Windows long path issues

### System Setup
- **`init-mongo.js`** - MongoDB initialization script (used by Docker compose)

## � MQTT Authentication Process

The following scripts were removed as their functionality was integrated into the main start scripts:

- ❌ **`init-mqtt.ps1`** - MQTT initialization (integrated into start scripts)
- ❌ **`setup-mqtt-user.ps1`** - MQTT authentication setup (integrated into start scripts)
- ❌ **`test-system.ps1`** - Simple Docker service status check (functionality moved to main scripts)
- ❌ **`test-mqtt-auth.ps1`** - MQTT authentication testing (not used in main workflows)  
- ❌ **`init-system.ps1`** - System initialization (functionality covered by start-dev.ps1)

## 🔐 MQTT Authentication Process

Both start scripts now follow a secure 4-step MQTT setup process:

1. **Start with Anonymous Access** - MQTT initially allows anonymous connections
2. **Create Default User** - Creates user 'vision' with password 'vision'
3. **Disable Anonymous Access** - Switches to secure configuration
4. **Continue with Services** - Proceeds with backend/frontend startup

## 🎯 Quick Start

For development:
```powershell
.\scripts\start-dev.ps1
```

For production:
```powershell
.\scripts\start-prod.ps1
```

To clean the project:
```powershell
.\scripts\clean-project.ps1
```

## 📝 Script Overview

All scripts are essential and actively used in the project workflow:

- **Development Scripts**: `start-dev.ps1`, `stop-dev.ps1`
- **Production Scripts**: `start-prod.ps1`, `stop-prod.ps1`
- **Maintenance Scripts**: `clean-project.ps1`, `force-clean-project.ps1`
- **Database Setup**: `init-mongo.js`

## ✨ Features

- **Automatic MQTT Authentication**: Both start scripts automatically configure MQTT security
- **Cross-Platform Support**: PowerShell scripts work on Windows, Linux, and macOS
- **Docker Integration**: Seamless Docker Compose integration
- **Development Tools**: Hot reload and debugging support
- **Production Ready**: Optimized builds and security configurations
