# 🌱 AIOT Smart Greenhouse System

Hệ thống nhà kính thông minh sử dụng IoT với monitoring và điều khiển tự động.

## 📖 Documentation

For complete documentation, please visit the [docs/](docs/) directory:

- **[📋 Project Overview](docs/PROJECT_OVERVIEW.md)** - Complete system architecture and features
- **[🚀 Deployment Guide](docs/DEPLOYMENT.md)** - Step-by-step setup for development and production
- **[👨‍💻 Development Guide](docs/DEVELOPMENT.md)** - Coding standards, workflow, and best practices
- **[🔌 API Documentation](docs/API_DOCUMENTATION.md)** - Complete REST API reference
- **[🔧 IoT Integration](docs/IOT_INTEGRATION.md)** - ESP32 hardware setup and MQTT communication
- **[✅ System Status](docs/ERROR_CHECK_REPORT.md)** - Latest health check and error analysis

## Team Members
1. **Tran Minh Duc** - 22127081 (Project Manager & System Architect)  
2. **Nguyen Gia Kiet** - 22127221 (Backend Developer)
3. **Nguyen Hoang Nhu** - 22127314 (Frontend Developer)  
4. **Vo Thanh Tu** - 21127469 (Hardware Engineer)

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (development only)

### 1-Minute Setup
```bash
# Clone and setup
git clone <repository-url>
cd aiot-smart-greenhouse

# Configure environment
cp .env.example .env
# Edit .env with your email settings

# Start with Docker
docker-compose up -d

# Access the system
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# Login: admin@gmail.com / admin
```

For detailed setup instructions, see [Deployment Guide](docs/DEPLOYMENT.md).

---

## ⚙️ Configuration

### Required Environment Variables
Copy `.env.example` to `.env` and configure:

```env
# Core Settings
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/aiot_greenhouse

# MQTT (ESP32 Communication)
MQTT_BROKER_URL=mqtt://mqtt.noboroto.id.vn:1883
MQTT_USERNAME=vision
MQTT_PASSWORD=vision

# Email (Password Reset & Alerts)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# Security
JWT_SECRET=your-super-secret-jwt-key
```

### User Settings (Database-Managed)
- **Alert Recipients**: Each user manages their own email list
- **MQTT Settings**: Users can customize broker settings
- **Alert Thresholds**: Per-user sensor threshold configuration

---

## 🏗️ System Architecture

```
ESP32 ──MQTT──► Backend ──HTTP/WS──► Frontend
   │              │                    │
   │              │                    │
Sensors         MongoDB             React UI
```

### Technology Stack
- **Hardware**: ESP32 + Sensors (DHT22, Soil, Water, Motion, etc.)
- **Backend**: Node.js, Express, TypeScript, MongoDB
- **Frontend**: Next.js 13+, TypeScript, SCSS
- **Communication**: MQTT, WebSocket, REST API
- **Deployment**: Docker, Docker Compose

---

## 📊 Features

### ✅ Implemented Features
- **Sensor Monitoring**: Temperature, humidity, soil moisture, water level
- **Device Control**: Light, pump, door, window automation
- **Real-time Dashboard**: Live sensor data with charts
- **Email Alerts**: Customizable threshold-based notifications
- **User Authentication**: Secure JWT-based login system
- **Password Reset**: Email-based password recovery
- **User Settings**: Per-user configuration for alerts and MQTT
- **Mobile Responsive**: Works on all device sizes

### 🔧 Hardware Support
- ESP32 microcontroller
- DHT22 (temperature, humidity)
- Soil moisture sensor
- Ultrasonic sensor (water level)
- PIR motion sensor
- Rain sensor
- Light control relay
- Water pump control

---

## 🛠️ Development

### Local Development
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev

# Using Docker (recommended)
docker-compose -f compose.dev.yml up -d
```

### Scripts
```bash
# System management
.\scripts\start-dev.ps1     # Start development
.\scripts\stop-dev.ps1      # Stop development
.\scripts\system-check.ps1  # Health check

# Production
.\scripts\start-prod.ps1    # Start production
.\scripts\stop-prod.ps1     # Stop production
```

### API Endpoints

#### Authentication
```
POST /api/auth/signin              # User login
POST /api/auth/forgot-password     # Request password reset
POST /api/auth/reset-password      # Reset password with token
```

#### User Settings
```
GET    /api/user-settings                    # Get user settings
PUT    /api/user-settings/alert-recipients   # Update alert emails
PUT    /api/user-settings/mqtt-config        # Update MQTT settings
PUT    /api/user-settings/alert-thresholds   # Update sensor thresholds
POST   /api/user-settings/reset              # Reset to defaults
```

#### Sensors & Devices
```
GET    /api/sensors/current        # Current sensor data
GET    /api/history               # Historical data
POST   /api/devices/control       # Control devices
GET    /api/alerts               # Alert history
```

---

## 📡 MQTT Topics

### Sensor Data (ESP32 → Backend)
```
greenhouse/sensors/temperature    # Temperature (°C)
greenhouse/sensors/humidity       # Humidity (%)
greenhouse/sensors/soil          # Soil moisture (%)
greenhouse/sensors/water         # Water level (%)
greenhouse/sensors/motion        # Motion detection (0/1)
greenhouse/sensors/rain          # Rain detection (0/1)
greenhouse/sensors/light         # Light intensity (lux)
```

### Device Control (Backend → ESP32)
```
greenhouse/devices/light/control   # on/off
greenhouse/devices/pump/control    # on/off/auto
greenhouse/devices/door/control    # open/close
greenhouse/devices/window/control  # open/close
```

---

## 🚨 Troubleshooting

### Common Issues

**MQTT Connection Failed**
```bash
# Check broker status
docker ps | grep mosquitto

# Test connection
mosquitto_pub -h localhost -t "test" -m "hello"
```

**Database Connection Error**
```bash
# Check MongoDB
docker ps | grep mongo

# Restart services
docker-compose restart
```

**Email Not Working**
- Verify Gmail app password (not regular password)
- Check EMAIL_USER and EMAIL_PASS in .env
- Test email settings in user settings page

**Permission Denied**
```bash
# Linux/macOS
sudo chown -R $USER:$USER .

# Windows (run as administrator)
.\scripts\clean-project.ps1 -Force
```

### Health Check
```bash
# Quick system status
curl http://localhost:5000/api/health

# Comprehensive check
.\scripts\system-check.ps1 -Comprehensive
```

---

## 📝 Notes

### Database Changes
- **UserSettings Model**: Manages per-user configuration
- **Alert Recipients**: Moved from environment to database
- **MQTT Config**: User-customizable with environment defaults
- **Thresholds**: Per-user sensor alert thresholds

### Environment Unification
- Unified EMAIL_* variables (removed SMTP_* duplicates)
- Centralized .env configuration
- Removed subfolder .env files

### Security
- JWT-based authentication
- Rate limiting on all endpoints
- Email validation for alert recipients
- Secure password reset with time-limited tokens

---

## 📄 License

This project is for educational purposes as part of university coursework.

---

**Last Updated**: July 14, 2025
**Version**: 2.0.0
