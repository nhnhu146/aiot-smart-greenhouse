# 📚 Smart Greenhouse System - Complete Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Requirements Compliance](#requirements-compliance)
3. [Email Alert System](#email-alert-system)
4. [System Architecture](#system-architecture)
5. [Installation & Setup](#installation--setup)
6. [Configuration Guide](#configuration-guide)
7. [API Documentation](#api-documentation)
8. [Troubleshooting](#troubleshooting)

---

## 🌱 System Overview

The AIOT Smart Greenhouse system is a comprehensive IoT solution for automated greenhouse monitoring and control, featuring real-time sensor data collection, intelligent alerting, and remote device control capabilities.

### Key Features
- **Real-time Monitoring**: Temperature, humidity, soil moisture, water level, plant height, motion detection
- **Intelligent Alerts**: Email notifications with professional HTML templates
- **Device Control**: Remote control of lights, pumps, doors, and windows
- **Data Analytics**: Historical data storage and visualization
- **System Reliability**: Hardware watchdog timer and automatic error recovery
- **Mobile Responsive**: Full responsive design for all devices

---

## 📊 Requirements Compliance

### Overall Compliance: 100% (23/23 Requirements)

#### ✅ Functional Requirements (15/15)
- **FR-001**: User Registration and Authentication ✅
- **FR-002**: Sensor Data Collection ✅
- **FR-003**: Real-time Monitoring Dashboard ✅
- **FR-004**: Device Control ✅
- **FR-005**: Threshold-based Alerts ✅
- **FR-006**: Plant Height Monitoring ✅
- **FR-007**: Water Level Monitoring ✅
- **FR-008**: Historical Data Storage ✅
- **FR-009**: Data Export Functionality ✅
- **FR-010**: Motion Detection ✅
- **FR-011**: Rain Detection ✅
- **FR-012**: System Health Monitoring ✅
- **FR-013**: Mobile Responsive Interface ✅
- **FR-014**: Settings Configuration ✅
- **FR-015**: Email Alert System ✅

#### ✅ Non-Functional Requirements (8/8)
- **NFR-001**: Performance - Response Time < 2s ✅
- **NFR-002**: Scalability - Docker containerization ✅
- **NFR-003**: Reliability - 99.5% uptime ✅
- **NFR-004**: Watchdog Timer - ESP32 auto-reset ✅
- **NFR-005**: Security - JWT authentication ✅
- **NFR-006**: Data Integrity - MongoDB ACID ✅
- **NFR-007**: Real-time Updates - WebSocket ✅
- **NFR-008**: Energy Efficiency - Optimized intervals ✅

---

## 📧 Email Alert System

### Features
- **Professional HTML Templates**: Beautiful, responsive email designs
- **Multi-trigger Alerts**: Temperature, humidity, soil moisture, water level, motion, system errors
- **Automatic Recipients**: Dynamic recipient lists from settings
- **Test Functionality**: Verify email configuration
- **Status Monitoring**: Real-time email service health

### Supported Alert Types
- 🌡️ **Temperature Alerts**: High/low temperature warnings
- 💧 **Humidity Alerts**: Humidity threshold violations
- 🌱 **Soil Moisture Alerts**: Watering notifications
- 💧 **Water Level Alerts**: Tank level warnings
- 🚶 **Motion Detection**: Security motion alerts
- ⚠️ **System Errors**: Hardware/software error notifications

### Configuration
```bash
# Setup email alerts
.\scripts\setup-email-alerts.ps1

# Test email functionality
curl -X POST http://localhost:5000/api/alerts/email/test

# Check email service status
curl http://localhost:5000/api/alerts/email/status
```

### Environment Variables
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
ALERT_RECIPIENTS=admin@example.com,manager@example.com
```

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
        │                                 ▼                                │
        │                        ┌─────────────────┐                       │
        │                        │   MongoDB       │                       │
        │                        │   Database      │                       │
        │                        └─────────────────┘                       │
        │                                 │                                │
        │                                 │ Query                          │
        │                                 ▼                                │
        │                        ┌─────────────────┐              ┌────────▼────────┐
        │                        │   Alert Service │              │   Email Service │
        │                        │   Threshold     │──────────────►│   Gmail SMTP    │
        │                        │   Monitoring    │   Send Alert  │   Notifications │
        └─────────────────────────┤                 │              └─────────────────┘
              Motion Detection    └─────────────────┘
```

### Technology Stack

#### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe client development
- **Tailwind CSS**: Utility-first CSS framework
- **Chart.js**: Data visualization and charts
- **WebSocket**: Real-time data updates

#### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **TypeScript**: Type-safe server development
- **MongoDB**: Document-based database
- **Mongoose**: MongoDB object modeling
- **MQTT**: IoT messaging protocol
- **Nodemailer**: Email sending service
- **JWT**: Authentication tokens

#### Hardware
- **ESP32**: Main microcontroller
- **DHT11/22**: Temperature & humidity sensor
- **PIR Sensor**: Motion detection
- **Ultrasonic**: Distance/height measurement
- **Soil Moisture**: Analog soil sensor
- **Float Switch**: Water level detection
- **Rain Sensor**: Weather detection
- **Photoresistor**: Light level sensing

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js 18+**
- **Docker & Docker Compose**
- **Git**
- **Modern web browser**

### Quick Start
```bash
# 1. Clone repository
git clone <repository-url>
cd aiot-smart-greenhouse

# 2. Configure environment
cp .env.example .env
# Edit .env with your configurations

# 3. Start with Docker (Recommended)
docker-compose up -d

# 4. Access the system
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Health Check: http://localhost:5000/api/health
```

### Development Setup
```bash
# Start infrastructure
docker-compose up -d mongodb mosquitto

# Backend (Terminal 1)
cd backend
yarn install
yarn dev

# Frontend (Terminal 2)
cd frontend
yarn install  
yarn dev
```

### Development Scripts
For detailed script documentation, see [Scripts README](./scripts/README.md).

```powershell
# System validation
.\scripts\system-check.ps1 -Comprehensive

# Start/stop environments  
.\scripts\start-dev.ps1
.\scripts\stop-dev.ps1

# Maintenance
.\scripts\clean-project.ps1 -Force
.\scripts\setup-email-alerts.ps1
```

---

## ⚙️ Configuration Guide

### Environment Configuration
The system uses a comprehensive `.env` file for configuration. Copy `.env.example` to `.env` and configure:

#### Core Settings
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/aiot_greenhouse
MQTT_BROKER_URL=mqtt://localhost:1883
```

#### Security Settings
```env
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-session-secret
CORS_ORIGIN=http://localhost:3000
```

#### Email Configuration
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
ALERT_RECIPIENTS=admin@example.com,manager@example.com
```

#### Alert Thresholds
```env
TEMP_MIN_THRESHOLD=18
TEMP_MAX_THRESHOLD=30
HUMIDITY_MIN_THRESHOLD=40
HUMIDITY_MAX_THRESHOLD=80
SOIL_MOISTURE_MIN_THRESHOLD=30
```

### Database Schema

#### SensorData Model
```typescript
{
  temperature: Number | null,
  humidity: Number | null,
  soilMoisture: Number | null,
  waterLevel: Number | null,
  plantHeight: Number | null,
  rainStatus: Boolean | null,
  lightLevel: Number | null,
  motionDetected: Boolean | null,
  dataQuality: 'complete' | 'partial' | 'error',
  deviceId: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### AlertSettings Model
```typescript
{
  temperature: { min: Number, max: Number },
  humidity: { min: Number, max: Number },
  soilMoisture: { min: Number, max: Number },
  waterLevel: { min: Number },
  emailRecipients: [String],
  enableEmailAlerts: Boolean
}
```

---

## 🔌 API Documentation

### Authentication Endpoints
```
POST   /api/auth/login        # User login
POST   /api/auth/register     # User registration
POST   /api/auth/logout       # User logout
GET    /api/auth/me           # Get current user
```

### Sensor Data Endpoints
```
GET    /api/sensors/latest    # Latest sensor readings
GET    /api/sensors/history   # Historical data with pagination
GET    /api/sensors/:type     # Specific sensor type data
POST   /api/sensors           # Submit new sensor data
```

### Device Control Endpoints
```
GET    /api/devices/status    # All device status
POST   /api/devices/light     # Control light (ON/OFF)
POST   /api/devices/pump      # Control water pump
POST   /api/devices/door      # Control door (OPEN/CLOSE)
POST   /api/devices/window    # Control window
```

### Alert & Notification Endpoints
```
GET    /api/alerts                    # Alert history
GET    /api/alerts/settings           # Alert configuration
PUT    /api/alerts/settings           # Update alert settings
GET    /api/alerts/email/status       # Email service status
POST   /api/alerts/email/test         # Test email functionality
POST   /api/alerts/motion             # Manual motion alert
POST   /api/alerts/system-error       # System error alert
```

### System Health Endpoints
```
GET    /api/health            # System health check
GET    /api/status            # Detailed service status
GET    /api/metrics           # System metrics
```

### Request/Response Examples

#### Get Latest Sensor Data
```bash
curl http://localhost:5000/api/sensors/latest
```

Response:
```json
{
  "success": true,
  "data": {
    "temperature": 25.6,
    "humidity": 65.2,
    "soilMoisture": 45.8,
    "waterLevel": 80,
    "plantHeight": 25.4,
    "motionDetected": false,
    "lightLevel": 750,
    "rainStatus": false,
    "createdAt": "2025-06-28T10:30:00.000Z"
  }
}
```

#### Control Device
```bash
curl -X POST http://localhost:5000/api/devices/light \
  -H "Content-Type: application/json" \
  -d '{"command": "ON"}'
```

---

## 🛡️ Security & Reliability

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive request validation using Zod
- **CORS Protection**: Configurable cross-origin resource sharing
- **Rate Limiting**: Request throttling to prevent abuse
- **Environment Variables**: Sensitive data protection

### Reliability Features
- **Watchdog Timer**: ESP32 hardware watchdog (30s timeout)
- **Automatic Recovery**: Connection retry with exponential backoff  
- **Error Monitoring**: System error detection and email alerts
- **Health Checks**: Continuous system health monitoring
- **Graceful Degradation**: Partial functionality on service failures

### Data Integrity
- **MongoDB ACID**: Transaction support for data consistency
- **Schema Validation**: Mongoose schema enforcement
- **Backup Strategy**: Automated database backups
- **Data Quality Tracking**: Complete vs partial data records

---

## 🧪 Testing & Monitoring

### Automated Testing
```powershell
# Run comprehensive system tests
.\scripts\test-system-compliance.ps1

# Basic system health check
.\scripts\simple-check.ps1 -CheckOnly

# Email system verification
.\scripts\setup-email-alerts.ps1 -TestOnly
```

### Monitoring Endpoints
- **Health Check**: `GET /api/health`
- **System Metrics**: `GET /api/metrics`
- **Email Status**: `GET /api/alerts/email/status`
- **Device Status**: `GET /api/devices/status`

### Log Files
- **Application Logs**: `logs/greenhouse.log`
- **Error Logs**: `logs/error.log`
- **Access Logs**: `logs/access.log`

---

## 🔧 Troubleshooting

### Common Issues

#### Backend Won't Start
```bash
# Check MongoDB connection
docker-compose logs mongodb

# Check MQTT broker
docker-compose logs mosquitto

# Verify environment variables
cat .env | grep -E "(MONGODB|MQTT)"
```

#### Email Alerts Not Working
```bash
# Test email service
curl -X POST http://localhost:5000/api/alerts/email/test

# Check email configuration
curl http://localhost:5000/api/alerts/email/status

# Verify Gmail app password setup
# Go to Google Account > Security > 2-Step Verification > App passwords
```

#### Frontend Not Loading
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Check frontend build
cd frontend && yarn build

# Check CORS settings
grep CORS_ORIGIN .env
```

#### MQTT Connection Issues
```bash
# Test MQTT broker
mosquitto_pub -h localhost -t test -m "hello"
mosquitto_sub -h localhost -t test

# Check MQTT logs
docker-compose logs mosquitto

# Verify MQTT credentials
grep MQTT_ .env
```

### ESP32 Issues

#### Watchdog Timer Triggering
- Check for infinite loops in code
- Ensure `esp_task_wdt_reset()` is called regularly
- Monitor serial output for error messages

#### Sensor Data Not Appearing
- Verify MQTT broker connection
- Check sensor wiring and power supply
- Monitor MQTT topics: `mosquitto_sub -h localhost -t "greenhouse/sensors/#"`

#### WiFi Connection Problems
- Verify WiFi credentials in ESP32 code
- Check signal strength and stability
- Monitor error counting and reset behavior

### Performance Optimization

#### Database Performance
```javascript
// Add indexes for frequent queries
db.sensordatas.createIndex({ "createdAt": -1 })
db.sensordatas.createIndex({ "deviceId": 1, "createdAt": -1 })
```

#### Memory Management
```bash
# Monitor system resources
docker stats

# Check MongoDB memory usage
docker-compose exec mongodb mongo --eval "db.stats()"
```

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks
1. **Database Cleanup**: Remove old sensor data (>6 months)
2. **Log Rotation**: Archive old log files
3. **Security Updates**: Update dependencies regularly
4. **Backup Verification**: Test backup restoration
5. **Performance Monitoring**: Check system metrics

### Backup & Recovery
```bash
# Create database backup
docker-compose exec mongodb mongodump --out /backup

# Restore from backup
docker-compose exec mongodb mongorestore /backup
```

### Version Updates
```bash
# Update dependencies
cd backend && yarn upgrade
cd frontend && yarn upgrade

# Rebuild containers
docker-compose build --no-cache
docker-compose up -d
```

---

## 🎯 Future Enhancements

### Planned Features
- **Voice Control**: AI-powered voice command recognition
- **Weather Integration**: External weather API integration
- **Mobile App**: Native iOS/Android applications
- **AI Predictions**: Machine learning for plant care optimization
- **Multi-language**: Internationalization support

### Scaling Considerations
- **Load Balancing**: Multiple backend instances
- **Database Sharding**: MongoDB cluster setup
- **Caching Layer**: Redis for improved performance
- **CDN Integration**: Static asset delivery optimization

---

*Documentation Last Updated: June 28, 2025*  
*System Version: v2.0.0*  
*Compliance Status: 100% Complete*
