# 🏗️ System Architecture - AIOT Smart Greenhouse

## Tổng quan Kiến trúc

Hệ thống AIOT Smart Greenhouse được thiết kế theo kiến trúc microservices với các thành phần độc lập, dễ mở rộng và bảo trì.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ESP32 Device  │    │   MQTT Broker   │    │   MongoDB       │
│   (Hardware)    │◄──►│   (Mosquitto)   │◄──►│   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       ▲                       ▲
         │                       │                       │
         ▼                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Sensors       │    │   Backend API   │◄──►│   Email Service │
│   (IoT Data)    │    │   (Node.js)     │    │   (Gmail SMTP)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                   ┌─────────────────┐
                   │   Frontend      │
                   │   (Next.js)     │
                   └─────────────────┘
```

---

## 📋 Danh sách Components

### 1. **Hardware Layer (ESP32)**
- **Vai trò**: Thu thập dữ liệu cảm biến và điều khiển thiết bị
- **Công nghệ**: ESP32, Arduino IDE
- **Cảm biến**: DHT22, Soil Moisture, Ultrasonic, PIR, Rain, LDR
- **Actuators**: LED, Water Pump, Servo Motors

### 2. **Communication Layer (MQTT)**
- **Vai trò**: Trung gian giao tiếp giữa hardware và backend
- **Công nghệ**: Mosquitto MQTT Broker
- **Protocols**: MQTT over TCP/IP
- **QoS**: Level 1 (At least once delivery)

### 3. **Backend Services (Node.js)**
- **API Server**: Express.js REST API
- **Real-time**: WebSocket connections
- **Data Processing**: MQTT message handling
- **Business Logic**: Alert system, device control
- **Database**: MongoDB integration

### 4. **Database Layer (MongoDB)**
- **Collections**: SensorData, Alerts, Settings, DeviceStatus
- **Features**: Time-series data, indexing, aggregation
- **Backup**: Automated backup strategies

### 5. **Frontend Application (Next.js)**
- **UI/UX**: React-based responsive interface
- **Real-time**: WebSocket integration
- **Authentication**: JWT-based auth
- **Charts**: Data visualization with Chart.js

### 6. **External Services**
- **Email**: Gmail SMTP for alerts
- **Notifications**: Real-time push notifications

---

## 🔄 Data Flow

### 1. **Sensor Data Flow**
```
ESP32 Sensors → MQTT Publish → MQTT Broker → Backend Subscribe → 
Database Storage → WebSocket Broadcast → Frontend Update
```

### 2. **Device Control Flow**
```
Frontend UI → Backend API → MQTT Publish → MQTT Broker → 
ESP32 Subscribe → Device Action → Status Feedback
```

### 3. **Alert Flow**
```
Sensor Threshold Breach → Alert Service → Email Service → 
SMTP Gmail → User Notification
```

---

## 📡 MQTT Topic Architecture

### **Hierarchical Topic Structure**
```
greenhouse/
├── sensors/
│   ├── temperature     # Nhiệt độ (°C)
│   ├── humidity        # Độ ẩm (%)
│   ├── soil           # Độ ẩm đất (%)
│   ├── water          # Mức nước (%)
│   ├── height         # Chiều cao cây (cm)
│   ├── rain           # Mưa (boolean)
│   ├── light          # Ánh sáng (lux)
│   └── motion         # Chuyển động (boolean)
├── devices/
│   ├── light/control   # Điều khiển đèn
│   ├── pump/control    # Điều khiển bơm
│   ├── door/control    # Điều khiển cửa
│   └── window/control  # Điều khiển cửa sổ
└── backend/
    └── status         # Trạng thái backend
```

---

## 🗄️ Database Schema

### **SensorData Collection**
```javascript
{
  _id: ObjectId,
  timestamp: Date,           // Thời gian tự động
  temperature: Number,       // °C
  humidity: Number,          // %
  soilMoisture: Number,      // %
  waterLevel: Number,        // %
  plantHeight: Number,       // cm (optional)
  rainStatus: Boolean,       // true/false (optional)
  lightLevel: Number,        // lux (optional)
  motionDetected: Boolean,   // true/false (optional)
  dataQuality: String       // 'complete' | 'partial'
}
```

### **Settings Collection**
```javascript
{
  _id: ObjectId,
  userId: String,
  thresholds: {
    temperature: { min: Number, max: Number },
    humidity: { min: Number, max: Number },
    soilMoisture: { min: Number, max: Number },
    waterLevel: { min: Number, max: Number }
  },
  notifications: {
    email: Boolean,
    recipients: [String]
  },
  createdAt: Date,
  updatedAt: Date
}
```

### **Alert Collection**
```javascript
{
  _id: ObjectId,
  type: String,              // 'temperature', 'humidity', etc.
  level: String,             // 'warning', 'critical'
  message: String,
  data: Object,              // Sensor data context
  resolved: Boolean,
  createdAt: Date,
  resolvedAt: Date
}
```

---

## 🔧 Service Architecture

### **Backend Services**

#### **1. MQTT Service** (`src/services/MQTTService.ts`)
- **Responsibility**: MQTT client management
- **Key Methods**:
  - `processSensorData()`: Xử lý dữ liệu cảm biến
  - `publishDeviceControl()`: Điều khiển thiết bị
  - `handleMessage()`: Xử lý tin nhắn MQTT
- **Integrations**: AlertService, DatabaseService

#### **2. Alert Service** (`src/services/AlertService.ts`)
- **Responsibility**: Xử lý cảnh báo và thông báo
- **Key Methods**:
  - `checkSensorThresholds()`: Kiểm tra ngưỡng
  - `sendEmailAlert()`: Gửi email cảnh báo
  - `handleMotionDetected()`: Xử lý phát hiện chuyển động
- **Templates**: HTML email templates

#### **3. WebSocket Service** (`src/services/WebSocketService.ts`)
- **Responsibility**: Real-time communication
- **Features**: 
  - Broadcast sensor data
  - Device status updates
  - Alert notifications

#### **4. Database Service** (`src/services/DatabaseService.ts`)
- **Responsibility**: MongoDB connection and operations
- **Features**:
  - Connection management
  - Query optimization
  - Data aggregation

---

## 🛡️ Security Architecture

### **Authentication & Authorization**
- **JWT Tokens**: Stateless authentication
- **Password Hashing**: bcrypt with salt rounds
- **CORS**: Cross-origin request protection
- **Rate Limiting**: Request throttling

### **Data Security**
- **Input Validation**: Request validation middleware
- **SQL Injection**: NoSQL injection prevention
- **HTTPS**: SSL/TLS encryption (production)
- **Environment Variables**: Secure configuration

---

## 📊 Performance & Monitoring

### **Real-time Performance**
- **WebSocket**: < 100ms latency
- **MQTT**: QoS 1 delivery guarantee
- **Database**: Indexed queries < 50ms
- **API Response**: < 2 seconds average

### **Monitoring Points**
- **System Health**: `/api/health` endpoint
- **MQTT Status**: Connection monitoring
- **Database**: Connection pool status
- **Email Service**: Delivery status

---

## 🔄 Deployment Architecture

### **Development Environment**
```
Docker Compose (compose.dev.yml)
├── Backend (Node.js dev server)
├── Frontend (Next.js dev server)  
├── MongoDB (Docker container)
├── Mosquitto (Docker container)
└── Volume mounts (hot reload)
```

### **Production Environment**
```
Docker Compose (compose.yml)
├── Backend (Production build)
├── Frontend (Static build + Nginx)
├── MongoDB (Persistent volume)
├── Mosquitto (Persistent config)
└── Reverse Proxy (Nginx)
```

---

## 🚀 Scalability Considerations

### **Horizontal Scaling**
- **Backend**: Load balancer + multiple instances
- **Database**: MongoDB replica sets
- **MQTT**: Clustered brokers
- **Frontend**: CDN distribution

### **Vertical Scaling**
- **Memory**: Sensor data buffering
- **CPU**: Real-time processing
- **Storage**: Time-series data growth
- **Network**: MQTT message throughput

---

## 📈 Future Enhancements

### **Machine Learning Integration**
- Predictive analytics for plant growth
- Anomaly detection for sensor data
- Automated irrigation scheduling
- Energy consumption optimization

### **IoT Expansion**
- Multiple greenhouse support
- Edge computing with ESP32
- LoRaWAN for long-range sensors
- Camera integration for visual monitoring

### **Advanced Features**
- Mobile app development
- Voice control integration
- Advanced dashboard analytics
- Cloud deployment options

---

**Architecture được thiết kế để đảm bảo tính mở rộng, độ tin cậy và hiệu suất cao cho hệ thống AIOT Smart Greenhouse.**
