# AIOT Smart Greenhouse - System Architecture Documentation

## 📋 Overview

This project is a complete IoT Smart Greenhouse monitoring and control system with real-time data processing, automated device control, and intelligent alerting capabilities.

## 🏗️ Architecture

### Frontend (Next.js + TypeScript)
- **Dashboard**: Real-time sensor monitoring with charts and gauges
- **Control Panel**: Manual device control and automation settings
- **Settings**: Threshold configuration and email alert management
- **Authentication**: Secure user login and session management

### Backend (Node.js + Express + TypeScript)
- **API Server**: RESTful API for data management and configuration
- **MQTT Client**: Real-time sensor data ingestion from IoT devices
- **WebSocket Server**: Live data broadcasting to connected clients
- **Alert System**: Intelligent threshold monitoring and notifications
- **Email Service**: Automated alert notifications

### Database (MongoDB)
- **Sensor Data**: Time-series sensor readings
- **Device Status**: Equipment state and control history
- **Settings**: System configuration and thresholds
- **User Data**: Authentication and preferences

## 🔧 Key Features

### Real-time Monitoring
- **Live Sensor Data**: Temperature, humidity, soil moisture, water level, light, rain
- **WebSocket Communication**: Instant data updates without page refresh
- **Visual Dashboards**: Charts, gauges, and status indicators
- **Historical Data**: Trend analysis and data export capabilities

### Automated Control
- **Smart Automation**: Temperature-based fan control, soil-based irrigation
- **Manual Override**: User can manually control devices when needed
- **Device Management**: Light, pump, fan, window, door control
- **Safety Features**: Automatic shutdown and alert generation

### Alert System
- **Threshold Monitoring**: Configurable min/max values for all sensors
- **Email Notifications**: Automated alert emails to multiple recipients
- **Alert Levels**: Info, warning, high, critical severity levels
- **Test Functionality**: Send test alerts to verify email configuration

### Configuration Management
- **Dynamic Thresholds**: Real-time threshold updates without restart
- **Email Setup**: Multiple recipients and alert type preferences
- **Data Source Toggle**: Switch between real and mock data for testing
- **Settings Persistence**: All configurations saved to database

## 📡 Data Flow

### Sensor Data Path
1. **IoT Device** → MQTT Broker → **Backend MQTT Client**
2. **Backend** validates and stores data in MongoDB
3. **Backend** broadcasts via WebSocket to connected clients
4. **Frontend** receives real-time updates and updates UI
5. **Alert Service** checks thresholds and sends notifications

### Device Control Path
1. **Frontend** sends device control command via WebSocket
2. **Backend** validates and broadcasts to MQTT broker
3. **IoT Device** receives command and executes action
4. **Device Status** is reported back via MQTT
5. **Frontend** reflects status changes in real-time

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB 7.0+
- Docker and Docker Compose

### Development Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd aiot-smart-greenhouse
   ```

2. **Environment Variables**
   ```bash
   # Create .env file in root directory
   MONGODB_USER=greenhouse_user
   MONGODB_PASSWORD=greenhouse_password
   MQTT_BROKER_URL=mqtt://mqtt.noboroto.id.vn:1883
   MQTT_USERNAME=vision
   MQTT_PASSWORD=vision
   ```

3. **Install Dependencies**
   ```bash
   # Backend dependencies
   cd backend && npm install
   
   # Frontend dependencies
   cd ../frontend && npm install
   ```

4. **Start Services**
   ```bash
   # Option 1: Docker Compose (Recommended)
   docker compose down --rmi all
   docker compose -f compose.local.yml up -d --build
   
   # Option 2: Manual Development
   cd backend && npm run dev
   cd frontend && npm run dev
   ```

5. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Default Login: admin@greenhouse.com / admin123

### Production Deployment

1. **Build and Deploy**
   ```bash
   docker compose down --rmi all
   docker compose -f compose.yml up -d --build
   ```

2. **Environment Configuration**
   - Update environment variables for production
   - Configure SSL certificates
   - Set up email service credentials
   - Configure production MQTT broker

## 🧪 Testing

### Manual Testing Steps

1. **System Health Check**
   ```bash
   # Check service status
   docker compose ps
   
   # View logs
   docker compose logs -f backend
   docker compose logs -f frontend
   ```

2. **Data Flow Testing**
   - Verify sensor data appears in dashboard
   - Test device control functionality
   - Check WebSocket connection status
   - Validate alert threshold triggers

3. **Email Alert Testing**
   - Configure email recipients in settings
   - Set test thresholds (e.g., temperature > 25°C)
   - Use "Send Test Email" button
   - Verify emails are received

4. **Mock Data Testing**
   - Enable mock data in settings
   - Verify realistic sensor value simulation
   - Check chart updates and data persistence
   - Switch back to real data

### API Testing

```bash
# Test backend health
curl http://localhost:5000/api/health

# Get latest sensor data
curl http://localhost:5000/api/sensors/latest

# Test authentication
curl -X POST http://localhost:5000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@greenhouse.com","password":"admin123"}'
```

## 📊 Monitoring & Logs

### Application Logs
```bash
# Backend logs
docker compose logs -f backend

# Frontend logs  
docker compose logs -f frontend

# MongoDB logs
docker compose logs -f mongodb
```

### Performance Monitoring
- WebSocket connection count in browser console
- MQTT message processing rate in backend logs
- Database query performance via MongoDB logs
- Memory usage via Docker stats

## 🔧 Configuration

### Backend Configuration (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://user:pass@mongodb:27017/aiot_greenhouse
MQTT_BROKER_URL=mqtt://broker.hivemq.com:1883
CORS_ORIGIN=http://localhost:3000
API_PREFIX=/api
```

### Frontend Configuration (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=http://localhost:5000
```

### Alert Thresholds (Default Values)
```json
{
  "temperatureThreshold": { "min": 18, "max": 30 },
  "humidityThreshold": { "min": 40, "max": 80 },
  "soilMoistureThreshold": { "min": 30, "max": 70 },
  "waterLevelThreshold": { "min": 20, "max": 90 }
}
```

## 🛠️ Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check backend service status
   - Verify CORS configuration
   - Check firewall/proxy settings

2. **MQTT Data Not Received**
   - Verify MQTT broker connectivity
   - Check topic subscriptions
   - Validate sensor data format

3. **Email Alerts Not Working**
   - Check email service configuration
   - Verify recipient email addresses
   - Test email service credentials

4. **Database Connection Issues**
   - Check MongoDB service status
   - Verify connection string
   - Check authentication credentials

### Debug Commands
```bash
# Check service health
curl http://localhost:5000/api/health

# Test MQTT connectivity
docker compose exec backend node -e "console.log('MQTT test')"

# Database connection test
docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

## 📈 Performance Optimization

### Database Optimization
- Index sensor data by timestamp
- Implement data retention policies
- Use aggregation pipelines for analytics

### Real-time Communication
- Optimize WebSocket message frequency
- Implement client-side data buffering
- Use compression for large datasets

### Frontend Performance
- Implement virtual scrolling for large datasets
- Use React.memo for expensive components
- Optimize chart rendering intervals

## 🔒 Security Considerations

### Authentication & Authorization
- JWT token-based authentication
- Secure password hashing with bcrypt
- Session timeout and refresh mechanisms

### Data Protection
- HTTPS encryption in production
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### Infrastructure Security
- Docker container isolation
- Network security groups
- Regular security updates
- Monitoring and logging

## 📚 API Documentation

### Sensor Endpoints
- `GET /api/sensors/latest` - Get latest sensor readings
- `GET /api/sensors/history` - Get historical data
- `GET /api/sensors/stats` - Get sensor statistics

### Settings Endpoints
- `GET /api/settings` - Get current settings
- `POST /api/settings` - Update settings
- `POST /api/settings/test-alert` - Send test alert email

### Authentication Endpoints
- `POST /api/auth/signin` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/password-reset` - Request password reset

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Make changes with proper testing
4. Submit pull request with description
5. Code review and merge

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits

---

**Last Updated**: January 2025
**Version**: 2.0.0
**Authors**: AIOT Greenhouse Team
