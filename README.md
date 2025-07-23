# 🌱 AIoT Smart Greenhouse

> **📚 Documentation**: See [`/docs`](./docs) for detailed guides, fixes, and system updates

A comprehensive IoT-based smart greenhouse monitoring and control system built with modern web technologies. Features real-time sensor monitoring, automated device control, intelligent alerting, and a fully responsive web dashboard.

![System Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Build](https://img.shields.io/badge/Build-Passing-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Version](https://img.shields.io/badge/Version-2.1.0-orange)

## 🚀 Quick Start (DevOps Optimized)

### Prerequisites
- Docker 20.10+ with Docker Compose v2
- 2GB RAM minimum, 10GB disk space
- Internet connection for MQTT services

### DevOps Deployment
```bash
# Clone the repository
git clone https://github.com/nhnhu146/aiot-smart-greenhouse.git
cd aiot-smart-greenhouse

# Windows (PowerShell) - Automated DevOps deployment
.\deploy.ps1

# Linux/macOS - Manual steps
docker network create multi-domain
docker compose down --rmi all --volumes
docker compose up -d --build --force-recreate
```

**Security-First Access:**
- 🌐 **Frontend Dashboard**: http://localhost:3000 *(Only exposed port)*
- � **Backend API**: Internal network only
- � **Database**: Internal network only  
- 🔒 **Redis Cache**: Internal network only

**Default Login:**
- **Email**: `admin@greenhouse.com`
- **Password**: `admin123`

## 📊 Features

### 🌡️ Real-time Monitoring
- **Live Sensor Data**: Temperature, humidity, soil moisture, water level, light intensity, rain detection
- **Responsive Dashboard**: Mobile-first design with adaptive layouts
- **Historical Analytics**: Trend analysis with data export capabilities
- **WebSocket Communication**: Instant updates without page refresh

### 🎛️ Smart Control System
- **Automated Devices**: Intelligent control of lights, pumps, fans, windows, and doors
- **Manual Override**: User-controlled device operation when needed  
- **Automation Rules**: Temperature-based fan control, soil moisture-based irrigation
- **Safety Features**: Automatic alerts and emergency shutdowns

### 🚨 Intelligent Alerts
- **Configurable Thresholds**: Custom min/max values for all sensors
- **Multi-channel Notifications**: Email alerts, push notifications, dashboard alerts
- **Severity Levels**: Info, warning, high, and critical alert classifications
- **Test Functionality**: Verify alert configuration with test notifications

### ⚙️ Advanced Configuration
- **Dynamic Settings**: Real-time threshold updates without system restart
- **Email Management**: Multiple recipients with customizable alert preferences
- **Data Source Control**: Switch between real sensor data and mock data for testing
- **Persistent Storage**: All configurations automatically saved to database

## 🧪 Testing Guide

### Quick Test Commands
```bash
# System health check
curl http://localhost:5000/api/health

# Test WebSocket connection (check browser console)
# Should see: "✅ Connected to WebSocket server"

# Test authentication
curl -X POST http://localhost:5000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@greenhouse.com","password":"admin123"}'

# Test sensor data
curl http://localhost:5000/api/sensors/latest
```

### Manual Testing Steps
1. **Login**: Access dashboard with provided credentials
2. **Real-time Data**: Verify sensor values update automatically
3. **Device Control**: Test manual pump/fan/light controls
4. **Settings**: Configure email alerts and send test notification
5. **Mock Data**: Enable mock data for testing without physical sensors

## 📚 Documentation

### Complete Guides
- 📖 **[System Architecture](docs/SYSTEM_ARCHITECTURE.md)**: Technical architecture and data flow
- 🚀 **[Deployment Guide](docs/DEPLOYMENT.md)**: Complete setup and deployment instructions

### System Status ✅
- **Authentication**: ✅ JWT-based secure login system
- **Real-time Data**: ✅ WebSocket live sensor updates  
- **Device Control**: ✅ Manual and automated device operation
- **Alert System**: ✅ Configurable email notifications
- **Database**: ✅ MongoDB with optimized schema
- **Docker Deployment**: ✅ Production-ready containers
- **MQTT Integration**: ✅ IoT sensor data processing
- **Mock Data Testing**: ✅ Simulation for development

## 🏆 Team Members
1. **Nguyen Van Le Ba Thanh** - 22127390  
2. **Nguyen Gia Kiet** - 22127221 
3. **Nguyen Hoang Nhu** - 22127314  
4. **Vo Thanh Tu** - 21127469

---

**⭐ Star this repository if you find it useful!**

For detailed technical documentation and troubleshooting, see the [docs/](docs/) directory.

*Built with ❤️ using Next.js, Node.js, MongoDB, and Docker*

## ⚙️ Technology Stack
- **Frontend**: Next.js 13, React, TypeScript, Bootstrap
- **Backend**: Node.js, Express, TypeScript, Socket.io
- **Database**: MongoDB with Mongoose ODM
- **IoT Communication**: MQTT broker, WebSocket real-time updates
- **Deployment**: Docker, Docker Compose
- **Hardware**: ESP32 microcontroller with sensors

## 📊 Features
- 🌡️ **Real-time Monitoring**: Temperature, humidity, soil moisture, water level
- 🔧 **Device Control**: Automated fans, pumps, lights, and window systems  
- 📱 **Web Dashboard**: Modern responsive interface with real-time data
- 🚨 **Alert System**: Smart notifications for threshold violations
- 📈 **Data Analytics**: Historical sensor data with visualization
- 🔐 **User Management**: Authentication and role-based access control  
- **Authentication**: ✅ Working - Auto-redirect from landing page
- **Database**: ✅ Working - Sensor data logging active
- **Database**: ✅ Working - MongoDB storing sensor data
- **Backend API**: ✅ Working - All endpoints functional  
- **Frontend**: ✅ Working - Real-time dashboard and history
- **Docker Build**: ✅ Working - All services deploy successfully
- **Enhanced MQTT Logging**: ✅ Implemented - Detailed message tracking

For detailed setup instructions, see [Deployment Guide](docs/DEPLOYMENT.md).

---

## 🏗️ Technology Stack
- **Hardware**: ESP32 + Sensors + Actuators
- **Backend**: Node.js, Express, TypeScript, MongoDB, MQTT
- **Frontend**: Next.js 13+, TypeScript, Bootstrap
- **Deployment**: Docker Compose

## 🛠️ Quick Commands

```bash
# Start development
.\scripts\start-dev.ps1

# Start production  
.\scripts\start-prod.ps1

# Stop services
.\scripts\stop-dev.ps1
```

## 📡 MQTT Topics
- **Sensors**: `greenhouse/sensors/{type}` (temperature, humidity, soil, water, motion, rain, light)
- **Control**: `greenhouse/devices/{device}/control` (light, pump, door, window)

## � Documentation
- [📖 Project Overview](docs/PROJECT_OVERVIEW.md)
- [🚀 Deployment Guide](docs/DEPLOYMENT.md) 
- [🔧 Development Setup](docs/DEVELOPMENT.md)
- [📡 IoT Integration](docs/IOT_INTEGRATION.md)
- [📚 API Documentation](docs/API_DOCUMENTATION.md)
