# AIOT Smart Greenhouse - Project Documentation

## 📋 Project Overview

AIOT Smart Greenhouse System là một hệ thống nhà kính thông minh tích hợp IoT, cung cấp giám sát và điều khiển tự động cho môi trường trồng trọt.

### Core Features
- 🌡️ Real-time sensor monitoring (temperature, humidity, soil moisture, water level, light, rain)
- 🎛️ Device control (lights, fan, watering pump, door, window)
- 📊 Historical data visualization and analytics
- 🚨 Smart alerting with email notifications
- 👤 User authentication and settings management
- 🔄 MQTT integration for IoT communication
- 📱 Responsive web interface

### Technology Stack
- **Frontend**: Next.js 13, React, TypeScript, Bootstrap, Chart.js
- **Backend**: Node.js, Express, TypeScript, MongoDB, Socket.IO
- **IoT**: ESP32, MQTT, Various sensors
- **Infrastructure**: Docker, Docker Compose

## 🏗️ Architecture

### System Components
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

### Data Flow
1. **Sensor Data Collection**: ESP32 reads sensor values
2. **MQTT Publishing**: Data published to MQTT topics
3. **Backend Processing**: Node.js subscribes to MQTT, processes data
4. **Database Storage**: Processed data stored in MongoDB
5. **Real-time Updates**: WebSocket sends data to frontend
6. **User Interface**: React components display real-time data

## 🚀 Getting Started

### Quick Setup (Recommended)
```bash
# 1. Clone repository
git clone <repository-url>
cd aiot-smart-greenhouse

# 2. Setup environment
cp .env.example .env
# Edit .env with your configurations

# 3. Start with Docker
docker-compose up -d

# 4. Access system
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# Default login: admin@gmail.com / admin
```

### Development Setup
```bash
# Backend development
cd backend
npm install
npm run dev

# Frontend development  
cd frontend
npm install
npm run dev
```

## 🔧 Configuration

### Environment Variables
All configurations are centralized in the root `.env` file:

```env
# Application
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://user:password@localhost:27017/database

# MQTT
MQTT_BROKER_URL=mqtt://mqtt.noboroto.id.vn:1883
MQTT_USERNAME=vision
MQTT_PASSWORD=vision

# Email (for password reset & alerts)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend (Next.js)
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_MQTT_URL=mqtt://mqtt.noboroto.id.vn:1883
```

### Key Features Configuration

#### Mock Data Mode
- Development mode with simulated sensor data
- Toggle via Settings page or browser console
- Automatic fallback when real sensors unavailable

#### User Settings
- Personal alert recipients configuration
- Custom MQTT broker settings
- Threshold configurations per user
- Stored in database with user preferences

#### Password Reset
- Email-based password reset flow
- Secure token generation and validation
- Configurable email templates

## 📁 Project Structure

```
aiot-smart-greenhouse/
├── .env                    # Environment configuration
├── .env.example           # Environment template
├── compose.yml            # Production Docker setup
├── compose.dev.yml        # Development Docker setup
├── README.md              # Project overview
├── PROJECT_DOCS.md        # This documentation
│
├── backend/               # Node.js backend
│   ├── src/
│   │   ├── models/        # MongoDB schemas
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   └── types/         # TypeScript definitions
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/              # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js 13 app router
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities & services
│   │   └── services/      # API & data services
│   ├── package.json
│   └── tsconfig.json
│
├── embedded/              # ESP32 Arduino code
│   └── aiot-greenhouse-embedded.ino
│
└── scripts/               # Utility scripts
    ├── start-dev.ps1      # Development startup
    ├── start-prod.ps1     # Production startup
    ├── stop-dev.ps1       # Stop development
    ├── stop-prod.ps1      # Stop production
    ├── clean-project.ps1  # Cleanup
    ├── system-check.ps1   # Health check
    └── init-mongo.js      # Database initialization
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation

### Sensors & Data
- `GET /api/sensors/latest` - Latest sensor readings
- `POST /api/sensors` - Submit sensor data
- `GET /api/history/sensors` - Historical sensor data

### Device Control
- `POST /api/devices/:device/control` - Control greenhouse devices
- `GET /api/devices/status` - Device status overview

### Settings & Alerts
- `GET /api/settings` - User settings
- `POST /api/settings` - Update settings
- `GET /api/alerts` - Alert history
- `POST /api/alerts/test` - Test alert system

### User Settings
- `GET /api/user-settings` - Get user preferences
- `PUT /api/user-settings/alert-recipients` - Update alert emails
- `PUT /api/user-settings/mqtt-config` - Update MQTT settings
- `PUT /api/user-settings/thresholds` - Update alert thresholds

## 🛠️ Development

### Code Organization
- **Types**: Centralized in `backend/src/types/index.ts`
- **Models**: MongoDB schemas with TypeScript interfaces
- **Services**: Business logic separation (MQTT, Email, Database, etc.)
- **Components**: Reusable React components with TypeScript
- **Hooks**: Custom React hooks for data fetching and state management

### Best Practices
- Environment variables centralized in root `.env`
- Type safety with TypeScript throughout
- Error handling with custom error classes
- Input validation with middleware
- Responsive design with Bootstrap
- Real-time updates with WebSocket
- Mock data for development/testing

### Testing
- Use mock data service for frontend testing
- Environment variable validation
- Error boundary implementation
- API endpoint testing with Postman/curl

## 🚀 Deployment

### Production Deployment
```bash
# Using Docker Compose
docker-compose -f compose.yml up -d

# Manual deployment
# 1. Build backend
cd backend && npm run build

# 2. Build frontend  
cd frontend && npm run build

# 3. Start services with PM2 or similar
```

### Environment Setup
1. Configure production `.env` file
2. Setup MongoDB instance
3. Configure MQTT broker access
4. Setup email service (Gmail/SMTP)
5. Configure SSL/TLS for HTTPS

## 🔒 Security

### Authentication
- JWT-based authentication
- Password hashing with bcrypt
- Session management
- Rate limiting

### Data Protection
- Input validation and sanitization
- CORS configuration
- Helmet.js security headers
- Environment variable protection

### IoT Security
- MQTT authentication
- Topic-based access control
- Device authentication

## 🐛 Troubleshooting

### Common Issues

#### Frontend not loading data
- Check if backend is running on port 5000
- Verify NEXT_PUBLIC_API_URL in .env
- Check browser console for errors
- Ensure mock data is enabled for development

#### MQTT connection issues
- Verify MQTT broker credentials
- Check network connectivity
- Validate MQTT_BROKER_URL format
- Check ESP32 connection status

#### Email notifications not working
- Verify EMAIL_USER and EMAIL_PASS
- Check Gmail app password setup
- Validate SMTP configuration
- Test with /api/alerts/test endpoint

#### Database connection issues
- Check MongoDB service status
- Verify MONGODB_URI format
- Ensure database permissions
- Check network connectivity

### Debug Commands
```bash
# Check services status
docker-compose ps

# View logs
docker-compose logs backend
docker-compose logs frontend

# Restart services
docker-compose restart

# Clean rebuild
docker-compose down && docker-compose up --build
```

## 📞 Support

For technical issues or questions:
1. Check this documentation
2. Review error logs
3. Verify environment configuration
4. Contact team members

---

**Project Team**: Tran Minh Duc, Nguyen Gia Kiet, Nguyen Hoang Nhu, Vo Thanh Tu  
**Institution**: University of Science, VNU-HCM  
**Course**: Applied IoT Technology  
