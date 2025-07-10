# 🌱 AIOT Smart Greenhouse System

> **Comprehensive IoT Solution for Smart Agriculture**

Hệ thống nhà kính thông minh sử dụng công nghệ AIOT (Artificial Intelligence of Things) để giám sát và điều khiển tự động môi trường nhà kính với khả năng cảnh báo email và monitoring thời gian thực.

[![System Status](https://img.shields.io/badge/Status-Production%20Ready-green)](https://github.com/nhnhu146/aiot-smart-greenhouse)
[![Requirements](https://img.shields.io/badge/Requirements-100%25%20Compliant-brightgreen)](./DOCUMENTATION.md#requirements-compliance)
[![Version](https://img.shields.io/badge/Version-v2.0.0-blue)](https://github.com/nhnhu146/aiot-smart-greenhouse)

## 📋 Quick Navigation

- 📚 **[Complete Documentation](./docs/README.md)** - Documentation hub và quick start
- 🚀 **[Getting Started](./docs/getting-started.md)** - Hướng dẫn bắt đầu chi tiết
- 🏗️ **[System Architecture](./docs/architecture.md)** - Kiến trúc hệ thống
- 📡 **[MQTT Guide](./docs/mqtt-guide.md)** - Cấu hình MQTT và triggers
- 🔧 **[API Documentation](./docs/api-documentation.md)** - API reference
- 👨‍💻 **[Development Guide](./docs/development-guide.md)** - Setup development
- �️ **[Troubleshooting](./docs/troubleshooting.md)** - Xử lý sự cố

## 👥 Development Team
1. **Nguyen Van Le Ba Thanh** - 22127390 (Project Lead)
2. **Nguyen Gia Kiet** - 22127221 (Backend Developer)
3. **Nguyen Hoang Nhu** - 22127314 (Frontend Developer)  
4. **Vo Thanh Tu** - 21127469 (Hardware Engineer)

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for development)
- Modern web browser

### 1-Minute Setup
```bash
# Clone and setup
git clone <repository-url>
cd aiot-smart-greenhouse

# Configure environment
cp .env.example .env
# Edit .env with your settings (see Configuration section)

# Start everything with Docker
docker-compose up -d

# Access the system
# 🌐 Frontend: http://localhost:3000
# 🔧 Backend: http://localhost:5000
# 📊 Health: http://localhost:5000/api/health
```

### Development Scripts
```powershell
# System check and status
.\scripts\system-check.ps1                 # Basic system check
.\scripts\system-check.ps1 -Comprehensive  # Full system validation
.\scripts\quick-check.ps1                  # Status check with service management

# Environment management
.\scripts\start-dev.ps1                    # Start development environment
.\scripts\start-prod.ps1                   # Start production environment
.\scripts\stop-dev.ps1                     # Stop development services
.\scripts\stop-prod.ps1                    # Stop production services

# Maintenance
.\scripts\clean-project.ps1                # Clean build artifacts
.\scripts\clean-project.ps1 -Force         # Aggressive cleanup for Windows long paths
.\scripts\optimize-project.ps1             # Project optimization and analysis
.\scripts\setup-email-alerts.ps1           # Configure email alerts
```

---

## ⚙️ Configuration

### Environment Setup
Copy `.env.example` to `.env` and configure your specific values:

```env
# Core Settings
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/aiot_greenhouse
MQTT_BROKER_URL=mqtt://localhost:1883

# Email Alerts (FR-015)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
ALERT_RECIPIENTS=admin@example.com,manager@example.com

# Security
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-session-secret

# Alert Thresholds
TEMP_MIN_THRESHOLD=18
TEMP_MAX_THRESHOLD=30
HUMIDITY_MIN_THRESHOLD=40
HUMIDITY_MAX_THRESHOLD=80
```

> 📚 **[Complete Configuration Guide](./DOCUMENTATION.md#configuration-guide)** - Detailed environment variable documentation

---

## 🏗️ System Architecture

```
┌─────────────────┐    MQTT     ┌─────────────────┐    HTTP/WS   ┌─────────────────┐
│   ESP32/Arduino │─────────────►│   Backend API   │◄─────────────│   Frontend App  │
│   Sensors &     │              │   (Node.js)     │              │   (Next.js)     │
│   Controllers   │              │                 │              │                 │
└─────────────────┘              └─────────────────┘              └─────────────────┘
        │                                 │                                │
        │                                 │ Store                           │
        │                        ┌─────────────────┐                       │
        │                        │   MongoDB       │                       │
        │                        │   Database      │                       │
        │                        └─────────────────┘                       │
        │                                 │                                │
        │                        ┌─────────────────┐              ┌────────▼────────┐
        │                        │   Alert Service │              │   Email Service │
        │                        │   Threshold     │──────────────►│   Gmail SMTP    │
        └─────────────────────────┤   Monitoring    │   Alerts     │   Notifications │
              Motion Detection    └─────────────────┘              └─────────────────┘
```

### 🎯 Key Features
- **📊 Real-time Monitoring**: Temperature, humidity, soil moisture, water level, plant height, motion
- **🔔 Smart Alerts**: Email notifications with professional HTML templates  
- **🎛️ Device Control**: Remote control of lights, pumps, doors, windows
- **🛡️ System Reliability**: Hardware watchdog timer, automatic error recovery
- **📱 Mobile Responsive**: Full responsive design for all devices
- **🔒 Secure**: JWT authentication, input validation, CORS protection

> 📚 **[Detailed Architecture Guide](./DOCUMENTATION.md#system-architecture)** - Complete technical documentation

---

## 📊 System Status

### Requirements Compliance: **100%** ✅
- **15/15 Functional Requirements** (FR-001 to FR-015)
- **8/8 Non-Functional Requirements** (NFR-001 to NFR-008)

### Key Implementations
- ✅ **Email Alert System** (FR-015) - Professional HTML templates
- ✅ **Motion Detection** (FR-010) - PIR sensor with alerts
- ✅ **Plant Height Monitor** (FR-006) - Ultrasonic sensor tracking
- ✅ **Watchdog Timer** (NFR-004) - ESP32 auto-recovery
- ✅ **Real-time Updates** (NFR-007) - WebSocket communication

---

## 🛠️ Technology Stack

### Hardware
- **ESP32**: Main microcontroller with watchdog timer
- **DHT11/22**: Temperature & humidity sensors
- **PIR Sensor**: Motion detection
- **Ultrasonic**: Plant height measurement
- **Soil Moisture**: Analog soil sensor
- **Float Switch**: Water level detection

### Software
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Chart.js
- **Backend**: Node.js, Express.js, TypeScript, MongoDB, MQTT
- **Infrastructure**: Docker, Docker Compose, Mosquitto MQTT
- **Email Service**: Nodemailer with Gmail SMTP
- **Security**: JWT authentication, input validation

---

## 🎯 Available Scripts

### System Management
```powershell
# Quick health check
.\scripts\simple-check.ps1

# Comprehensive testing
.\scripts\test-system-compliance.ps1

# Email alert setup
.\scripts\setup-email-alerts.ps1
```

### Development
```powershell
# Start development environment
.\scripts\start-dev.ps1

# Stop development environment
.\scripts\stop-dev.ps1
```

### Production
```powershell
# Start production environment
.\scripts\start-prod.ps1

# Stop production environment
.\scripts\stop-prod.ps1
```

---

## 📞 Support & Troubleshooting

### Common Issues
- **Backend won't start**: Check MongoDB and MQTT broker status
- **Email alerts not working**: Verify Gmail app password setup
- **Frontend not loading**: Check CORS settings and backend connectivity
- **ESP32 issues**: Monitor serial output and MQTT connectivity

### System Health
- **Health Check**: `http://localhost:5000/api/health`
- **Email Status**: `http://localhost:5000/api/alerts/email/status`
- **System Metrics**: Monitor via Docker logs and API endpoints

### Getting Help
1. Check the **[Complete Documentation](./DOCUMENTATION.md)** for detailed guides
2. Review system logs: `docker-compose logs -f`
3. Run diagnostic scripts: `.\scripts\test-system-compliance.ps1`
4. Verify environment configuration in `.env` file

---

## 📋 Project Structure

```
aiot-smart-greenhouse/
├── 📁 backend/           # Node.js API server
│   ├── src/
│   │   ├── services/     # MQTT, Email, Alert services
│   │   ├── models/       # MongoDB schemas
│   │   ├── routes/       # API endpoints
│   │   └── types/        # TypeScript definitions
│   └── package.json
├── 📁 frontend/          # Next.js web application
│   ├── src/
│   │   ├── app/          # App router pages
│   │   ├── components/   # React components
│   │   └── lib/          # Utilities and services
│   └── package.json
├── 📁 embeded/           # ESP32 Arduino code
│   └── aiot-greenhouse-embedded.ino
├── 📁 scripts/           # PowerShell automation scripts
├── 📋 DOCUMENTATION.md   # Complete system documentation
├── 🔧 .env.example       # Environment configuration template
├── 🐳 docker-compose.yml # Container orchestration
└── 📖 README.md          # This file
```

---

## 🎉 Success Metrics

- **100% Requirements Compliance** - All FR/NFR requirements met
- **Production Ready** - Comprehensive testing and error handling
- **Professional Email System** - HTML templates with multi-trigger support
- **Hardware Reliability** - Watchdog timer and automatic recovery
- **Real-time Performance** - Sub-second WebSocket updates
- **Comprehensive Documentation** - Complete setup and maintenance guides

---

**🚀 Ready for Production Deployment!**

For complete documentation, configuration guides, API references, and troubleshooting, see **[DOCUMENTATION.md](./DOCUMENTATION.md)**

*Last Updated: June 28, 2025 | Version: v2.0.0 | Status: Production Ready*
