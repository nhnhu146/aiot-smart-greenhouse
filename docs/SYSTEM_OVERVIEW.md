# 📋 System Overview

## 🏗️ Architecture Overview

AIoT Smart Greenhouse là một hệ thống IoT toàn diện cho quản lý và tự động hóa nhà kính thông minh. Hệ thống sử dụng kiến trúc microservices với các thành phần chính:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   IoT Devices   │    │   Mobile App    │    │  Web Dashboard  │
│    (ESP32)      │    │                 │    │   (React)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                ┌─────────────────┴─────────────────┐
                │          MQTT Broker             │
                │     (mqtt.noboroto.id.vn)        │
                └─────────────────┬─────────────────┘
                                 │
         ┌───────────────────────────────────────────────┐
         │            Backend API Server                 │
         │          (Node.js + TypeScript)               │
         │  ┌─────────────────┐  ┌─────────────────┐    │
         │  │   WebSocket     │  │   HTTP API      │    │
         │  │   Server        │  │   Endpoints     │    │
         │  └─────────────────┘  └─────────────────┘    │
         └───────────────────────────────────────────────┘
                                 │
         ┌───────────────────────────────────────────────┐
         │              Data Layer                       │
         │  ┌─────────────────┐  ┌─────────────────┐    │
         │  │    MongoDB      │  │     Redis       │    │
         │  │  (Primary DB)   │  │   (Cache)       │    │
         │  └─────────────────┘  └─────────────────┘    │
         └───────────────────────────────────────────────┘
```

## 🎯 Core Features

### 📊 Real-time Monitoring
- **Sensor Data Collection**: Temperature, humidity, soil moisture, water level, light, rain
- **Live Dashboard**: Real-time visualization với WebSocket updates
- **Historical Charts**: Interactive charts với Chart.js
- **Data Export**: CSV/JSON export cho analysis

### 🎛️ Device Control
- **Manual Control**: Toggle switches cho lights, pumps, fans, doors, windows
- **Scheduled Control**: Time-based device scheduling
- **Bulk Operations**: Control multiple devices simultaneously
- **Status Feedback**: Real-time device status updates

### 🤖 Smart Automation
- **Rule-based Automation**: Threshold-based automated responses
- **Environmental Control**: Temperature, humidity, soil moisture regulation
- **Rain Protection**: Automatic door/window closure during rain
- **Customizable Rules**: User-configurable automation parameters

### 🔔 Alert System
- **Real-time Alerts**: Immediate notifications for critical conditions
- **Email Notifications**: SMTP-based email alerts
- **Push Notifications**: Browser push notifications
- **Alert Management**: Acknowledge, resolve, and track alerts

### 🎤 Voice Control
- **Voice Commands**: Natural language device control
- **MQTT Integration**: Voice commands via MQTT protocol
- **Command History**: Track and analyze voice usage
- **Multi-device Support**: Control multiple devices via voice

## 🏢 System Architecture

### Backend Architecture
```
backend/
├── src/
│   ├── index.ts              # Application entry point
│   ├── auth/                 # Authentication logic
│   ├── config/               # Configuration files
│   ├── handlers/             # MQTT message handlers
│   ├── middleware/           # Express middleware
│   ├── models/               # Mongoose data models
│   ├── routes/               # API route definitions
│   ├── services/             # Business logic services
│   ├── schemas/              # Validation schemas
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions
```

**Key Services:**
- **MQTTService**: MQTT broker communication
- **WebSocketService**: Real-time client communication
- **AutomationService**: Rule-based device automation
- **AlertService**: Alert generation and notification
- **EmailService**: SMTP email notifications
- **DatabaseService**: MongoDB connection management

### Frontend Architecture
```
frontend/
├── src/
│   ├── components/           # Reusable React components
│   ├── pages/                # Route-level page components
│   ├── hooks/                # Custom React hooks
│   ├── services/             # API client services
│   ├── contexts/             # React Context providers
│   ├── types/                # TypeScript interfaces
│   ├── utils/                # Utility functions
│   └── styles/               # SCSS styling
```

**Key Components:**
- **Dashboard**: Real-time sensor monitoring
- **Device Control**: Manual device operation
- **AutoMode**: Automation configuration
- **History**: Historical data analysis
- **Settings**: System configuration

### Data Models

#### Sensor Data Model
```typescript
interface SensorData {
  temperature?: number;      // °C
  humidity?: number;         // %
  soilMoisture?: number;     // %
  waterLevel?: number;       // cm
  lightLevel?: number;       // lux
  rainStatus?: boolean;      // true/false
  deviceId?: string;         // Device identifier
  dataQuality?: 'complete' | 'partial' | 'error';
  createdAt: Date;           // Timestamp
}
```

#### Device Status Model
```typescript
interface DeviceStatus {
  deviceType: 'light' | 'pump' | 'fan' | 'door' | 'window';
  status: boolean;           // ON/OFF or OPEN/CLOSE
  lastCommand?: string;      // Last executed command
  source: 'manual' | 'automation' | 'voice';
  userId?: string;           // User who triggered
  triggeredBy?: string;      // Automation rule or voice command
  timestamp: Date;
}
```

#### Alert Model
```typescript
interface Alert {
  type: 'warning' | 'error' | 'info';
  message: string;
  sensor?: string;           // Related sensor
  value?: number;            // Sensor value that triggered alert
  threshold?: number;        // Threshold that was exceeded
  severity: 'low' | 'medium' | 'high' | 'critical';
  acknowledged: boolean;
  resolved: boolean;
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}
```

## 🔄 Data Flow

### Sensor Data Flow
```
1. ESP32 Sensors → MQTT Publish → Backend MQTT Handler
2. Backend → Validate Data → Store in MongoDB
3. Backend → Process Automation Rules → Control Devices
4. Backend → Check Alert Thresholds → Generate Alerts
5. Backend → WebSocket Broadcast → Frontend Update
6. Frontend → Update Dashboard → Display to User
```

### Device Control Flow
```
1. User Action → Frontend → HTTP API Request
2. Backend → Validate Request → MQTT Publish Command
3. ESP32 Device → Execute Command → MQTT Status Update
4. Backend → Update Device State → WebSocket Broadcast
5. Frontend → Update UI → Show New Status
```

### Automation Flow
```
1. Sensor Data Received → Automation Engine Evaluation
2. Rule Matched → Check Cooldown Period → Execute Action
3. Device Command → MQTT Publish → Device Response
4. Log Automation Action → Update Statistics
5. WebSocket Broadcast → UI Notification
```

## 🔧 Technology Stack

### Backend Technologies
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.3+
- **Framework**: Express.js 4.18+
- **Database**: MongoDB 7.0 with Mongoose ODM
- **Cache**: Redis 7.2
- **Message Queue**: MQTT (Eclipse Mosquitto)
- **WebSocket**: Socket.io 4.7+
- **Authentication**: JWT + bcrypt
- **Email**: Nodemailer
- **Logging**: Winston
- **Validation**: Zod schemas

### Frontend Technologies
- **Framework**: React 19+ with TypeScript
- **Build Tool**: Vite 5.3+
- **UI Library**: React Bootstrap 2.10+
- **Styling**: SCSS + Bootstrap 5.3
- **Charts**: Chart.js 4.4+ with react-chartjs-2
- **Routing**: React Router DOM 6.26+
- **State**: React Context + hooks
- **HTTP Client**: Axios
- **WebSocket**: Socket.io-client

### IoT & Hardware
- **Microcontroller**: ESP32 DevKit
- **Communication**: WiFi + MQTT
- **Sensors**:
  - DHT22 (Temperature + Humidity)
  - Soil Moisture Sensor
  - Water Level Sensor (Ultrasonic)
  - LDR (Light Detection)
  - Rain Sensor
- **Actuators**:
  - Relay Modules (4-channel)
  - Water Pumps
  - LED Grow Lights
  - Exhaust Fans
  - Servo Motors (Doors/Windows)

### DevOps & Deployment
- **Containerization**: Docker + Docker Compose
- **Process Manager**: PM2 (production)
- **Reverse Proxy**: Nginx (recommended)
- **SSL**: Let's Encrypt certificates
- **Monitoring**: Health checks + logging
- **Backup**: MongoDB backup scripts

## 📈 Performance Specifications

### System Requirements
- **Minimum RAM**: 2GB
- **Recommended RAM**: 4GB+
- **Storage**: 10GB (including logs and backups)
- **CPU**: 2 cores minimum
- **Network**: Stable internet connection for MQTT

### Performance Metrics
- **API Response Time**: <2 seconds average
- **WebSocket Latency**: <100ms
- **MQTT Message Processing**: <50ms
- **Database Query Time**: <500ms
- **Concurrent Users**: 50+ supported
- **Sensor Data Rate**: 10 readings/minute per sensor

### Scalability
- **Horizontal Scaling**: Load balancer + multiple backend instances
- **Database Scaling**: MongoDB replica sets
- **Cache Scaling**: Redis cluster
- **MQTT Scaling**: Shared subscriptions

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure session management
- **Password Hashing**: bcrypt with salt rounds
- **Role-based Access**: Admin/User permissions
- **Session Management**: Token expiration + refresh

### Data Security
- **HTTPS/WSS**: Encrypted communication
- **Input Validation**: Comprehensive request validation
- **SQL Injection Prevention**: Mongoose ODM protection
- **XSS Prevention**: Content Security Policy headers
- **Rate Limiting**: API request throttling

### IoT Security
- **MQTT Authentication**: Username/password protection
- **Device Identification**: Unique device IDs
- **Command Validation**: Authorized device commands only
- **Network Isolation**: Separate IoT network (recommended)

## 🌍 Deployment Options

### Development Environment
- **Local**: Docker Compose với hot reload
- **Database**: Local MongoDB + Redis containers
- **MQTT**: External broker (mqtt.noboroto.id.vn)
- **Storage**: Local volumes

### Production Environment
- **Cloud**: AWS/GCP/Azure deployment
- **Database**: MongoDB Atlas hoặc self-hosted replica set
- **Cache**: Redis Cloud hoặc ElastiCache
- **Load Balancer**: Nginx hoặc cloud load balancer
- **SSL**: Automated certificates với certbot

### Edge Deployment
- **Raspberry Pi**: Local processing capability
- **Offline Mode**: Limited functionality without internet
- **Local MQTT**: Mosquitto broker on edge device
- **Data Sync**: Periodic cloud synchronization

## 📊 Monitoring & Analytics

### System Monitoring
- **Health Checks**: Automated service health monitoring
- **Metrics Collection**: Performance metrics tracking
- **Log Aggregation**: Centralized logging với Winston
- **Error Tracking**: Error reporting và alerting

### Business Analytics
- **Usage Statistics**: User activity tracking
- **Device Performance**: Device uptime và usage patterns
- **Environmental Trends**: Long-term sensor data analysis
- **Cost Optimization**: Resource usage optimization

## 🚀 Future Roadmap

### Short-term (3-6 months)
- [ ] Mobile application (React Native)
- [ ] Advanced automation rules engine
- [ ] Weather API integration
- [ ] Multi-language support

### Medium-term (6-12 months)
- [ ] Machine learning predictions
- [ ] Multi-greenhouse management
- [ ] Energy consumption monitoring
- [ ] Social features và community

### Long-term (12+ months)
- [ ] AI-powered crop optimization
- [ ] Blockchain data integrity
- [ ] Edge computing capabilities
- [ ] Marketplace integration

---

## 📚 Additional Documentation

- [Local Development Setup](./LOCAL_DEVELOPMENT_SETUP.md)
- [Environment Variables](./ENVIRONMENT_VARIABLES.md)
- [Use Cases](./USE_CASES.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

---

💡 **Contact Information**:
- **Developer**: [nhnhu146](https://github.com/nhnhu146)
- **Repository**: [aiot-smart-greenhouse](https://github.com/nhnhu146/aiot-smart-greenhouse)
- **License**: MIT License