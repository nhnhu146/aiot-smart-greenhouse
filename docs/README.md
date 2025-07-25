# 📚 AIoT Smart Greenhouse - Documentation

## 📋 Documentation Overview

This directory contains comprehensive documentation for the Smart Greenhouse system, including fixes, updates, and deployment guides.

### 📖 Available Documents

| Document | Description |
|----------|-------------|
| [`FIXES_SUMMARY.md`](FIXES_SUMMARY.md) | Complete summary of all system fixes and improvements |
| [`DATA_MERGER_UI_UPDATES.md`](DATA_MERGER_UI_UPDATES.md) | Data management and UI improvements |
| [`ALERT_FIXES_SUMMARY.md`](ALERT_FIXES_SUMMARY.md) | Alert system fixes and optimizations |
| [`devops-status.md`](devops-status.md) | Current deployment and security status |
| [`EMAIL_CONTRAST_FIXES.md`](EMAIL_CONTRAST_FIXES.md) | Email template contrast improvements |

### 🎯 Quick Reference

#### Recent Major Fixes
- ✅ **Device Control Simplified**: API-only approach, removed hybrid system (Jan 2025)
- ✅ **MQTT Values Fixed**: Using 0/1 instead of HIGH/LOW for ESP32 compatibility
- ✅ **Production Error Fixed**: DeviceHistory validation error resolved
- ✅ **Email Spam Issue**: Fixed AlertService batch system
- ✅ **Dashboard Controls**: Fixed WebSocket MQTT integration
- ✅ **Data Quality**: Enhanced DataMergerService for duplicate handling

#### System Status
- 🚀 **Deployment**: Fully containerized with Docker Compose
- 🔐 **Security**: Only frontend port (3000) exposed
- 📧 **Email Alerts**: Batch system active (5-minute intervals)
- 🌐 **Frontend**: Next.js with WebSocket real-time updates
- 🛠️ **Backend**: Node.js/TypeScript with MQTT integration

### 🔧 Development Notes

For detailed technical information about specific fixes and implementations, refer to the individual documentation files in this directory.

### 📅 Last Updated
January 2025 - Email spam resolution and documentation reorganization
