# AIOT Smart Greenhouse Documentation

Welcome to the comprehensive documentation for the AIOT Smart Greenhouse System.

## 📖 Documentation Index

### 📋 Project Overview
- **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** - Complete project documentation including architecture, features, and setup instructions

### 🚀 Getting Started
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Step-by-step deployment guide for development and production environments
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Complete development guide with coding standards, workflow, and best practices

### 🔌 Technical Integration
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete REST API reference with examples
- **[IOT_INTEGRATION.md](IOT_INTEGRATION.md)** - ESP32 hardware setup, MQTT communication, and sensor integration

### 🔍 System Status
- **[ERROR_CHECK_REPORT.md](ERROR_CHECK_REPORT.md)** - Latest system health check and error analysis

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ESP32 Device  │    │   MQTT Broker   │    │  Web Frontend   │
│   (Sensors)     │◄──►│   (Mosquitto)   │◄──►│   (Next.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └─────────────►│  Backend API    │◄─────────────┘
                        │  (Express)      │
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │    MongoDB      │
                        │   (Database)    │
                        └─────────────────┘
```

## 🚀 Quick Start

### For Developers
1. Read [DEVELOPMENT.md](DEVELOPMENT.md) for complete setup
2. Follow [DEPLOYMENT.md](DEPLOYMENT.md) for environment setup
3. Reference [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for API usage

### For IoT Integration
1. Follow [IOT_INTEGRATION.md](IOT_INTEGRATION.md) for hardware setup
2. Configure MQTT topics and communication
3. Implement sensor reading and device control

### For Deployment
1. Check [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
2. Configure environment variables
3. Set up monitoring and backups

## 📚 Key Features

- 🌡️ **Real-time Monitoring**: Temperature, humidity, soil moisture, water level, light, rain sensors
- 🎛️ **Device Control**: Automated control of lights, pumps, fans, doors, windows
- 📊 **Data Analytics**: Historical data visualization and trend analysis
- 🚨 **Smart Alerts**: Email notifications based on configurable thresholds
- 👤 **User Management**: Authentication, user settings, and preferences
- 🔄 **IoT Integration**: MQTT-based communication with ESP32 devices
- 📱 **Responsive UI**: Modern web interface built with Next.js and React

## 🛠️ Technology Stack

### Frontend
- **Next.js 13**: React framework with app router
- **TypeScript**: Type-safe development
- **Bootstrap**: Responsive UI components
- **Chart.js**: Data visualization
- **Socket.IO**: Real-time updates

### Backend
- **Node.js**: Runtime environment
- **Express**: Web framework
- **TypeScript**: Type-safe server development
- **MongoDB**: Document database
- **MQTT**: IoT communication protocol
- **Socket.IO**: WebSocket communication

### IoT & Hardware
- **ESP32**: Microcontroller for sensor integration
- **MQTT**: Message broker for device communication
- **Various Sensors**: Temperature, humidity, soil moisture, etc.
- **Relay Modules**: Device control and automation

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-service orchestration
- **MongoDB**: Database with persistent storage
- **Redis**: Caching and session storage

## 📝 Contributing

1. Read the [DEVELOPMENT.md](DEVELOPMENT.md) guide
2. Follow the established coding standards
3. Include tests for new features
4. Update documentation as needed
5. Submit pull requests for review

## 🔧 Maintenance

### Regular Tasks
- Monitor system health via `/api/health` endpoint
- Review log files for errors or warnings
- Update dependencies and security patches
- Backup database and configuration files
- Check sensor calibration and accuracy

### Performance Monitoring
- Database query performance
- API response times
- MQTT message throughput
- Memory and CPU usage
- WebSocket connection health

## 📞 Support

### Documentation Issues
If you find issues with the documentation:
1. Check existing documentation for accuracy
2. Submit issues or improvements
3. Keep documentation updated with code changes

### Technical Support
For technical issues:
1. Check the [ERROR_CHECK_REPORT.md](ERROR_CHECK_REPORT.md)
2. Review application logs
3. Test system health endpoints
4. Follow troubleshooting guides in deployment documentation

---

**Last Updated**: July 15, 2025  
**Version**: 2.0.0  
**Project**: AIOT Smart Greenhouse System
