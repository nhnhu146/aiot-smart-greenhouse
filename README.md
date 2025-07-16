# 🌱 AIOT Smart Greenhouse System

Hệ thống nhà kính thông minh sử dụng IoT với monitoring và điều khiển tự động. **Hệ thống đã hoạt động ổn định với MQTT, WebSocket real-time updates, database và frontend đầy đủ.**

## � Quick Start

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

# Start with Docker
docker-compose up -d

# Access the system
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# Login: admin@gmail.com / admin
```

## ✅ System Status (July 2025)
- **MQTT Connection**: ✅ Working - Connected to mqtt.noboroto.id.vn:1883
- **WebSocket Real-time**: ✅ Working - Frontend updates automatically
- **Database**: ✅ MongoDB running with sensor data storage
- **Frontend**: ✅ React Next.js with error-free console
- **Backend**: ✅ Node.js API with optimized performance

## �📖 Documentation

For complete documentation, please visit the [docs/](docs/) directory:

- **[📋 Project Overview](docs/PROJECT_OVERVIEW.md)** - System architecture and features
- **[🚀 Deployment Guide](docs/DEPLOYMENT.md)** - Setup for development and production
- **[👨‍💻 Development Guide](docs/DEVELOPMENT.md)** - Coding standards and workflow
- **[🔌 API Documentation](docs/API_DOCUMENTATION.md)** - Complete REST API reference
- **[🔧 IoT Integration](docs/IOT_INTEGRATION.md)** - ESP32 hardware setup and MQTT

## 🏆 Team Members
1. **Nguyen Van Le Ba Thanh** - 22127390  
2. **Nguyen Gia Kiet** - 22127221 
3. **Nguyen Hoang Nhu** - 22127314  
4. **Vo Thanh Tu** - 21127469

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
