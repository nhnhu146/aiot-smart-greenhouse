# 🔧 API Documentation

## Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: `https://your-domain.com/api`

## Authentication
API sử dụng JWT (JSON Web Tokens) cho authentication. Token cần được gửi trong header `Authorization`.

```
Authorization: Bearer <jwt_token>
```

---

## 🔐 Authentication Endpoints

### **POST /auth/signin**
Đăng nhập người dùng

**Request Body:**
```json
{
  "email": "admin@gmail.com",
  "password": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "admin-001",
    "email": "admin@gmail.com"
  }
}
```

### **POST /auth/signup**
Đăng ký người dùng mới

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": "user-002",
    "email": "user@example.com"
  }
}
```

### **POST /auth/verify-token**
Xác thực JWT token

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "admin-001",
    "email": "admin@gmail.com"
  }
}
```

---

## 📊 Sensor Data Endpoints

### **GET /sensors/latest**
Lấy dữ liệu cảm biến mới nhất

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "temperature": 25.5,
    "humidity": 65.2,
    "soilMoisture": 45.8,
    "waterLevel": 78.3,
    "plantHeight": 15.2,
    "rainStatus": false,
    "lightLevel": 850,
    "motionDetected": false,
    "dataQuality": "complete"
  }
}
```

### **GET /sensors/history**
Lấy lịch sử dữ liệu cảm biến

**Query Parameters:**
- `limit` (optional): Số lượng records (default: 100)
- `startDate` (optional): Ngày bắt đầu (ISO string)
- `endDate` (optional): Ngày kết thúc (ISO string)
- `sensorType` (optional): Loại cảm biến specific

**Example:**
```
GET /sensors/history?limit=50&startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-31T23:59:59.999Z
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "temperature": 25.5,
      "humidity": 65.2,
      "soilMoisture": 45.8,
      "waterLevel": 78.3,
      "dataQuality": "complete"
    }
  ],
  "pagination": {
    "total": 1250,
    "page": 1,
    "limit": 50,
    "totalPages": 25
  }
}
```

### **GET /sensors/stats**
Thống kê dữ liệu cảm biến

**Query Parameters:**
- `period`: `24h`, `7d`, `30d`, `1y`

**Response:**
```json
{
  "success": true,
  "data": {
    "temperature": {
      "avg": 24.8,
      "min": 18.2,
      "max": 32.1,
      "current": 25.5
    },
    "humidity": {
      "avg": 62.5,
      "min": 45.0,
      "max": 85.0,
      "current": 65.2
    },
    "soilMoisture": {
      "avg": 48.3,
      "min": 25.0,
      "max": 70.0,
      "current": 45.8
    },
    "waterLevel": {
      "avg": 75.2,
      "min": 20.0,
      "max": 100.0,
      "current": 78.3
    }
  }
}
```

---

## 🎛️ Device Control Endpoints

### **POST /devices/{deviceType}/control**
Điều khiển thiết bị

**Parameters:**
- `deviceType`: `light`, `pump`, `door`, `window`

**Request Body:**
```json
{
  "command": "on"  // "on", "off", "open", "close", "auto"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device control command sent successfully",
  "device": "light",
  "command": "on",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### **GET /devices/status**
Lấy trạng thái tất cả thiết bị

**Response:**
```json
{
  "success": true,
  "data": {
    "light": {
      "status": "on",
      "lastUpdated": "2024-01-15T10:30:00.000Z"
    },
    "pump": {
      "status": "auto",
      "lastUpdated": "2024-01-15T10:25:00.000Z"
    },
    "door": {
      "status": "closed",
      "lastUpdated": "2024-01-15T09:00:00.000Z"
    },
    "window": {
      "status": "open",
      "lastUpdated": "2024-01-15T08:30:00.000Z"
    }
  }
}
```

### **GET /devices/{deviceType}/history**
Lịch sử điều khiển thiết bị

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "device": "light",
      "command": "on",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "user": "admin@gmail.com"
    }
  ]
}
```

---

## 🚨 Alert Endpoints

### **GET /alerts**
Lấy danh sách cảnh báo

**Query Parameters:**
- `limit` (optional): Số lượng alerts
- `status` (optional): `active`, `resolved`, `all`
- `type` (optional): `temperature`, `humidity`, `soil`, `water`, `motion`, `system`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "type": "temperature",
      "level": "warning",
      "message": "High temperature detected: 32.5°C",
      "data": {
        "temperature": 32.5,
        "threshold": 30.0
      },
      "resolved": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### **POST /alerts/{alertId}/resolve**
Đánh dấu cảnh báo đã xử lý

**Response:**
```json
{
  "success": true,
  "message": "Alert resolved successfully",
  "alert": {
    "_id": "64a1b2c3d4e5f6789012345",
    "resolved": true,
    "resolvedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### **POST /alerts/email/test**
Test gửi email cảnh báo

**Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully",
  "recipient": "admin@example.com",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### **GET /alerts/email/status**
Kiểm tra trạng thái email service

**Response:**
```json
{
  "success": true,
  "emailService": {
    "configured": true,
    "lastTest": "2024-01-15T10:30:00.000Z",
    "status": "healthy",
    "totalSent": 125,
    "totalErrors": 2
  }
}
```

---

## ⚙️ Settings Endpoints

### **GET /settings**
Lấy cài đặt hệ thống

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "userId": "admin-001",
    "thresholds": {
      "temperature": { "min": 18, "max": 30 },
      "humidity": { "min": 40, "max": 80 },
      "soilMoisture": { "min": 30, "max": 70 },
      "waterLevel": { "min": 20, "max": 100 }
    },
    "notifications": {
      "email": true,
      "recipients": ["admin@example.com", "manager@example.com"]
    },
    "deviceSchedules": {
      "lightAutoMode": true,
      "pumpAutoMode": true,
      "schedules": []
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### **PUT /settings**
Cập nhật cài đặt

**Request Body:**
```json
{
  "thresholds": {
    "temperature": { "min": 20, "max": 32 },
    "humidity": { "min": 45, "max": 85 }
  },
  "notifications": {
    "email": true,
    "recipients": ["admin@example.com"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    // Updated settings object
  }
}
```

---

## 🏥 System Health Endpoints

### **GET /health**
Kiểm tra trạng thái hệ thống

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "database": {
      "status": "connected",
      "responseTime": 15
    },
    "mqtt": {
      "status": "connected",
      "topics": 8,
      "messagesReceived": 1250
    },
    "websocket": {
      "status": "active",
      "connections": 3
    },
    "email": {
      "status": "configured",
      "lastTest": "2024-01-15T09:00:00.000Z"
    }
  },
  "system": {
    "uptime": 86400,
    "memory": {
      "used": "125 MB",
      "free": "875 MB"
    },
    "cpu": {
      "usage": "15%"
    }
  }
}
```

### **GET /system/status**
Trạng thái chi tiết hệ thống

**Response:**
```json
{
  "success": true,
  "data": {
    "version": "2.0.0",
    "environment": "development",
    "startTime": "2024-01-15T00:00:00.000Z",
    "lastDataReceived": "2024-01-15T10:29:45.000Z",
    "totalSensorReadings": 12500,
    "totalAlerts": 25,
    "activeConnections": {
      "mqtt": true,
      "database": true,
      "websocket": 3
    }
  }
}
```

---

## 📈 Analytics Endpoints

### **GET /analytics/dashboard**
Dữ liệu cho dashboard

**Response:**
```json
{
  "success": true,
  "data": {
    "currentReadings": {
      "temperature": 25.5,
      "humidity": 65.2,
      "soilMoisture": 45.8,
      "waterLevel": 78.3
    },
    "todayStats": {
      "averageTemperature": 24.8,
      "totalAlerts": 3,
      "pumpActivations": 5,
      "motionEvents": 12
    },
    "trends": {
      "temperature": "stable",
      "humidity": "increasing",
      "soilMoisture": "decreasing",
      "waterLevel": "stable"
    },
    "systemStatus": "healthy"
  }
}
```

### **GET /analytics/export**
Export dữ liệu

**Query Parameters:**
- `format`: `csv`, `json`, `xlsx`
- `startDate`: Start date
- `endDate`: End date
- `dataType`: `sensors`, `alerts`, `devices`, `all`

**Response:**
```json
{
  "success": true,
  "message": "Export completed",
  "downloadUrl": "/api/downloads/export-2024-01-15.csv",
  "fileSize": "2.5 MB",
  "recordCount": 5000
}
```

---

## 🔌 WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:5000');

// Authentication
socket.emit('authenticate', { token: 'your-jwt-token' });
```

### Events

#### **Sensor Data Updates**
```javascript
socket.on('sensor_data', (data) => {
  console.log('New sensor data:', data);
  // {
  //   temperature: 25.5,
  //   humidity: 65.2,
  //   timestamp: "2024-01-15T10:30:00.000Z"
  // }
});
```

#### **Device Status Updates**
```javascript
socket.on('device_status', (data) => {
  console.log('Device status changed:', data);
  // {
  //   device: "light",
  //   status: "on",
  //   timestamp: "2024-01-15T10:30:00.000Z"
  // }
});
```

#### **Alert Notifications**
```javascript
socket.on('alert', (data) => {
  console.log('New alert:', data);
  // {
  //   type: "temperature",
  //   level: "warning",
  //   message: "High temperature detected",
  //   timestamp: "2024-01-15T10:30:00.000Z"
  // }
});
```

---

## 🚫 Error Responses

### **Standard Error Format**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Specific error code",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### **HTTP Status Codes**
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### **Common Error Examples**

#### **Authentication Error**
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "error": "AUTH_TOKEN_INVALID",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### **Validation Error**
```json
{
  "success": false,
  "message": "Validation failed",
  "error": "VALIDATION_ERROR",
  "details": {
    "email": "Email is required",
    "password": "Password must be at least 6 characters"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### **Rate Limit Error**
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later",
  "error": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 900,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 📝 Request/Response Examples

### **Using cURL**
```bash
# Login
curl -X POST http://localhost:5000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"admin"}'

# Get latest sensor data
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/sensors/latest

# Control device
curl -X POST http://localhost:5000/api/devices/light/control \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"command":"on"}'
```

### **Using JavaScript/Fetch**
```javascript
// Login
const loginResponse = await fetch('/api/auth/signin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@gmail.com',
    password: 'admin'
  })
});

const loginData = await loginResponse.json();
const token = loginData.token;

// Get sensor data
const sensorResponse = await fetch('/api/sensors/latest', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const sensorData = await sensorResponse.json();
console.log(sensorData);
```

---

**API được thiết kế theo RESTful principles và cung cấp real-time updates qua WebSocket để đảm bảo trải nghiệm người dùng tốt nhất.**
