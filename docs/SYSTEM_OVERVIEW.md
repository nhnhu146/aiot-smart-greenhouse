# 🌱 AIoT Smart Greenhouse - System Documentation

> **Last Updated**: July 25, 2025  
> **Version**: 2.0.0  
> **Status**: Production Ready ✅

## 📋 Quick Start

### Development Environment
```bash
# Clone repository
git clone https://github.com/nhnhu146/aiot-smart-greenhouse.git
cd aiot-smart-greenhouse

# Start all services
docker compose up -d

# Frontend available at: http://localhost:3000
# Backend API at: http://localhost:5000
```

### Production Deployment
```bash
# Build and deploy
docker compose -f compose.yml up -d --build

# Check service status
docker compose ps
```

## 🏗️ Architecture Overview

### System Components
- **Frontend**: Next.js 14 with TypeScript, Bootstrap UI
- **Backend**: Node.js/Express with TypeScript, WebSocket support
- **Database**: MongoDB for sensor data and settings
- **IoT Communication**: MQTT broker for real-time device control
- **Authentication**: Cookie-based session management
- **Containerization**: Docker Compose for all services

### Key Features ✅
- **Real-time Monitoring**: Temperature, humidity, soil moisture, water level
- **Device Control**: Automated pumps, lights, doors, windows via MQTT
- **Smart Automation**: Backend-driven automation with configurable rules
- **Alert System**: Email notifications with batch processing
- **Data Analytics**: Historical data with CSV export capabilities
- **Mobile Responsive**: Modern UI that works on all devices
- **Route Protection**: Middleware-based authentication system

## 🔧 Recent Major Updates

### 1. Enhanced History UI (July 2025)
- **Improved Filter Interface**: Modern gradient design with better contrast
- **Smart Filter Controls**: Date, month, year filters with visual feedback
- **Active Filter Summary**: Clear badge system for applied filters
- **Export Functionality**: CSV export with loading states
- **Mobile Responsive**: Optimized for all screen sizes

### 2. Route Protection System
- **Middleware Enhancement**: Simplified and robust auth checking
- **Protected Routes**: `/dashboard`, `/history`, `/settings`, `/api-examples`
- **Automatic Redirects**: Unauthenticated users go to signin
- **Session Management**: Support for multiple token formats

### 3. Backend Automation Migration
- **Centralized Logic**: All automation moved from frontend to backend
- **Real-time Processing**: Sensor data triggers immediate automation
- **MQTT Integration**: Direct device control via 1/0 values
- **Configuration API**: Frontend only displays and configures settings
- **Performance Boost**: Reduced latency and improved reliability

### 4. MQTT Protocol Standardization
- **Value Format**: Migrated from "HIGH"/"LOW" to "1"/"0" 
- **ESP32 Compatibility**: Numeric values easier to parse
- **Backward Compatible**: Legacy commands still supported
- **Documentation**: Comprehensive MQTT examples and testing guides

## 📊 System Status

### ✅ Working Components
- **Authentication**: Auto-redirect from landing page
- **Database**: MongoDB storing sensor data and device history
- **Backend API**: All endpoints functional and documented
- **Frontend**: Real-time dashboard with WebSocket updates
- **Docker**: All services deploy and communicate correctly
- **MQTT**: Enhanced logging and device control
- **Email Alerts**: Batch system prevents spam
- **Automation**: Backend-driven smart device control

### 🔄 Configuration

#### Automation Settings
- **Light Control**: Auto-on when light level = 0 (dark)
- **Pump Control**: Auto-on when soil moisture = 0 (dry)  
- **Temperature Control**: Fan/ventilation at high temps
- **Door/Window**: Optional motion-based automation

#### MQTT Topics
```bash
# Sensor Data (ESP32 → Backend)
greenhouse/sensors/temperature
greenhouse/sensors/humidity
greenhouse/sensors/soil
greenhouse/sensors/water
greenhouse/sensors/light
greenhouse/sensors/rain
greenhouse/sensors/height

# Device Control (Backend → ESP32)
greenhouse/devices/light/control     # 1=ON, 0=OFF
greenhouse/devices/pump/control      # 1=ON, 0=OFF
greenhouse/devices/door/control      # 1=OPEN, 0=CLOSE  
greenhouse/devices/window/control    # 1=OPEN, 0=CLOSE
```

## 🛠️ Development Guide

### Adding New Sensors
1. **ESP32**: Add sensor reading in `embeded/aiot-greenhouse-embedded.ino`
2. **Backend**: Add processing in `backend/src/index.ts` MQTT handler
3. **Database**: Update models in `backend/src/models/`
4. **Frontend**: Add UI components in `frontend/src/components/`

### Adding New Devices
1. **ESP32**: Add control function in embedded code
2. **Backend**: Add device type to `backend/src/types/index.ts`
3. **Routes**: Update `backend/src/routes/devices.ts`
4. **Frontend**: Add controls to dashboard

### Environment Variables
```bash
# Backend (.env)
MONGODB_URI=mongodb://localhost:27017/greenhouse
MQTT_BROKER_URL=mqtt://mqtt.noboroto.id.vn:1883
MQTT_USERNAME=vision
MQTT_PASSWORD=vision
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000
```

## 📱 API Documentation

### Authentication Endpoints
- `POST /api/auth/signin` - User authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signout` - User logout

### Sensor Data Endpoints
- `GET /api/sensors/latest` - Latest sensor readings
- `GET /api/data/history` - Historical sensor data

### Device Control Endpoints  
- `GET /api/devices` - Get device statuses
- `POST /api/devices/control` - Control device actions
- `POST /api/devices/schedule` - Schedule device actions

### Automation Endpoints
- `GET /api/automation` - Get automation configuration
- `PUT /api/automation` - Update automation settings

## 🔍 Troubleshooting

### Common Issues
1. **MQTT Connection Failed**: Check broker credentials and network
2. **Database Connection**: Ensure MongoDB is running
3. **Authentication Issues**: Clear browser cookies and retry
4. **Device Control Not Working**: Verify MQTT topics and ESP32 connection

### Debug Commands
```bash
# Check Docker services
docker compose logs -f

# Monitor MQTT messages
mosquitto_sub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/+/+

# Test device control
mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/devices/light/control -m "1"

# Check database
docker exec -it mongodb mongosh --eval "use greenhouse; db.sensordata.find().limit(5)"
```

## 📈 Performance Metrics

### System Specifications
- **Response Time**: API < 100ms average
- **WebSocket Latency**: < 50ms for real-time updates  
- **Database Queries**: Optimized with indexing
- **Memory Usage**: < 512MB per service container
- **Storage**: Efficient sensor data compression

### Monitoring Recommendations
- Monitor MQTT message frequency
- Track database growth and implement rotation
- Set up health check endpoints
- Monitor email alert frequency to prevent spam

---

## 🎯 Future Roadmap

### Planned Features
- [ ] Mobile app development (React Native)
- [ ] Advanced analytics and machine learning
- [ ] Weather API integration
- [ ] Multi-greenhouse support
- [ ] Voice control integration
- [ ] Enhanced security with JWT tokens

### Technical Improvements
- [ ] Implement Redis for caching
- [ ] Add comprehensive test suite
- [ ] Set up CI/CD pipeline
- [ ] Performance monitoring dashboard
- [ ] API rate limiting

---

**For technical support**: Create an issue in the GitHub repository  
**For deployment help**: Check the Docker Compose logs  
**For API questions**: Refer to the API examples in the frontend application
