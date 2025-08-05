# 🔐 Environment Variables Documentation

## Overview

Dự án AIoT Smart Greenhouse sử dụng các biến môi trường để cấu hình các thành phần khác nhau. Tài liệu này mô tả tất cả các biến môi trường cần thiết và tùy chọn.

## 📁 File Locations

### Backend Environment (`.env`)
Đặt trong thư mục gốc hoặc `backend/`:

```bash
backend/.env          # Backend-specific variables
.env                  # Root-level shared variables
```

### Frontend Environment (`.env.local`)
Đặt trong thư mục `frontend/`:

```bash
frontend/.env.local   # Frontend-specific variables
```

### Docker Environment
```bash
.env                  # Used by docker-compose.yml
```

## 🛠️ Backend Environment Variables

### **Core Application Settings**

#### `NODE_ENV`
- **Type**: String
- **Default**: `development`
- **Options**: `development`, `production`, `test`
- **Description**: Xác định môi trường chạy ứng dụng
```bash
NODE_ENV=development
```

#### `PORT`
- **Type**: Number
- **Default**: `5000`
- **Description**: Port cho backend API server
```bash
PORT=5000
```

#### `API_PREFIX`
- **Type**: String
- **Default**: `/api`
- **Description**: Prefix cho tất cả API routes
```bash
API_PREFIX=/api
```

### **Database Configuration**

#### `MONGODB_URI`
- **Type**: String
- **Required**: ✅
- **Description**: MongoDB connection string
```bash
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/greenhouse

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/greenhouse

# Docker MongoDB
MONGODB_URI=mongodb://mongodb:27017/greenhouse
```

#### `REDIS_URL`
- **Type**: String
- **Default**: `redis://localhost:6379`
- **Description**: Redis connection URL
```bash
# Local Redis
REDIS_URL=redis://localhost:6379

# Redis with password
REDIS_URL=redis://:password@localhost:6379

# Docker Redis
REDIS_URL=redis://redis:6379
```

### **Authentication & Security**

#### `JWT_SECRET`
- **Type**: String
- **Required**: ✅
- **Description**: Secret key cho JWT token signing
- **Security**: 🔒 Cực kỳ quan trọng - không share
```bash
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
```

#### `JWT_EXPIRES_IN`
- **Type**: String
- **Default**: `24h`
- **Description**: JWT token expiration time
```bash
JWT_EXPIRES_IN=24h
# Options: 15m, 1h, 24h, 7d, 30d
```

#### `BCRYPT_ROUNDS`
- **Type**: Number
- **Default**: `12`
- **Description**: BCrypt salt rounds cho password hashing
```bash
BCRYPT_ROUNDS=12
```

### **MQTT Configuration**

#### `MQTT_HOST`
- **Type**: String
- **Default**: `mqtt.noboroto.id.vn`
- **Description**: MQTT broker hostname
```bash
MQTT_HOST=mqtt.noboroto.id.vn
```

#### `MQTT_PORT`
- **Type**: Number
- **Default**: `1883`
- **Description**: MQTT broker port
```bash
MQTT_PORT=1883
```

#### `MQTT_USERNAME`
- **Type**: String
- **Optional**: ⚠️
- **Description**: MQTT authentication username
```bash
MQTT_USERNAME=your-mqtt-username
```

#### `MQTT_PASSWORD`
- **Type**: String
- **Optional**: ⚠️
- **Description**: MQTT authentication password
```bash
MQTT_PASSWORD=your-mqtt-password
```

#### `MQTT_CLIENT_ID`
- **Type**: String
- **Default**: Auto-generated
- **Description**: Unique MQTT client identifier
```bash
MQTT_CLIENT_ID=greenhouse-server-12345
```

### **Email Configuration**

#### `EMAIL_HOST`
- **Type**: String
- **Required**: ✅ (for email features)
- **Description**: SMTP server hostname
```bash
# Gmail
EMAIL_HOST=smtp.gmail.com

# Outlook
EMAIL_HOST=smtp-mail.outlook.com

# Custom SMTP
EMAIL_HOST=mail.yourdomain.com
```

#### `EMAIL_PORT`
- **Type**: Number
- **Default**: `587`
- **Description**: SMTP server port
```bash
EMAIL_PORT=587   # TLS
EMAIL_PORT=465   # SSL
EMAIL_PORT=25    # Unsecured (not recommended)
```

#### `EMAIL_SECURE`
- **Type**: Boolean
- **Default**: `false`
- **Description**: Use SSL/TLS encryption
```bash
EMAIL_SECURE=false  # for port 587 (STARTTLS)
EMAIL_SECURE=true   # for port 465 (SSL)
```

#### `EMAIL_USER`
- **Type**: String
- **Required**: ✅
- **Description**: SMTP authentication username
```bash
EMAIL_USER=your-email@gmail.com
```

#### `EMAIL_PASS`
- **Type**: String
- **Required**: ✅
- **Security**: 🔒 Sensitive
- **Description**: SMTP authentication password
```bash
EMAIL_PASS=your-app-password
```

#### `EMAIL_FROM`
- **Type**: String
- **Required**: ✅
- **Description**: Default sender email address
```bash
EMAIL_FROM="Smart Greenhouse <noreply@yourdomain.com>"
```

### **WebSocket Configuration**

#### `FRONTEND_URL`
- **Type**: String
- **Default**: `http://localhost:3000`
- **Description**: Frontend URL cho CORS configuration
```bash
# Development
FRONTEND_URL=http://localhost:3000

# Production
FRONTEND_URL=https://yourdomain.com
```

#### `WEBSOCKET_PING_TIMEOUT`
- **Type**: Number
- **Default**: `60000`
- **Description**: WebSocket ping timeout (ms)
```bash
WEBSOCKET_PING_TIMEOUT=60000
```

#### `WEBSOCKET_PING_INTERVAL`
- **Type**: Number
- **Default**: `25000`
- **Description**: WebSocket ping interval (ms)
```bash
WEBSOCKET_PING_INTERVAL=25000
```

### **Logging Configuration**

#### `LOG_LEVEL`
- **Type**: String
- **Default**: `info`
- **Options**: `error`, `warn`, `info`, `debug`, `verbose`
- **Description**: Minimum log level
```bash
LOG_LEVEL=info
```

#### `LOG_TO_FILE`
- **Type**: Boolean
- **Default**: `true`
- **Description**: Enable file logging
```bash
LOG_TO_FILE=true
```

#### `LOG_MAX_SIZE`
- **Type**: String
- **Default**: `20m`
- **Description**: Maximum log file size
```bash
LOG_MAX_SIZE=20m
```

#### `LOG_MAX_FILES`
- **Type**: Number
- **Default**: `14`
- **Description**: Maximum number of log files to retain
```bash
LOG_MAX_FILES=14
```

### **Development & Debug**

#### `DEBUG`
- **Type**: String
- **Optional**: ⚠️
- **Description**: Debug namespace pattern
```bash
DEBUG=*                    # All debug messages
DEBUG=app:*               # App-specific debug
DEBUG=mqtt:*,websocket:*  # Specific modules
```

#### `MOCK_DATA_ENABLED`
- **Type**: Boolean
- **Default**: `false`
- **Description**: Enable mock sensor data generation
```bash
MOCK_DATA_ENABLED=true
```

## 🌐 Frontend Environment Variables

### **API Configuration**

#### `VITE_API_URL`
- **Type**: String
- **Default**: `http://localhost:5000`
- **Description**: Backend API base URL
```bash
# Development
VITE_API_URL=http://localhost:5000

# Production
VITE_API_URL=https://api.yourdomain.com
```

#### `VITE_WS_URL`
- **Type**: String
- **Default**: Same as VITE_API_URL
- **Description**: WebSocket server URL
```bash
# Development
VITE_WS_URL=http://localhost:5000

# Production
VITE_WS_URL=https://api.yourdomain.com
```

### **Application Settings**

#### `VITE_APP_TITLE`
- **Type**: String
- **Default**: `Smart Greenhouse`
- **Description**: Application title
```bash
VITE_APP_TITLE=Smart Greenhouse Management System
```

#### `VITE_APP_VERSION`
- **Type**: String
- **Default**: From package.json
- **Description**: Application version display
```bash
VITE_APP_VERSION=1.0.0
```

### **Feature Flags**

#### `VITE_ENABLE_MOCK_DATA`
- **Type**: Boolean
- **Default**: `false`
- **Description**: Enable mock data toggle in UI
```bash
VITE_ENABLE_MOCK_DATA=true
```

#### `VITE_ENABLE_DEBUG`
- **Type**: Boolean
- **Default**: `false`
- **Description**: Enable debug features in UI
```bash
VITE_ENABLE_DEBUG=true
```

## 🐳 Docker Environment Variables

### **Database Volumes**

#### `MONGODB_DATA_PATH`
- **Type**: String
- **Default**: `./data/mongodb`
- **Description**: MongoDB data directory path
```bash
MONGODB_DATA_PATH=./data/mongodb
```

#### `REDIS_DATA_PATH`
- **Type**: String
- **Default**: `./data/redis`
- **Description**: Redis data directory path
```bash
REDIS_DATA_PATH=./data/redis
```

### **Network Configuration**

#### `DOCKER_NETWORK_NAME`
- **Type**: String
- **Default**: `multi-domain`
- **Description**: Docker network name
```bash
DOCKER_NETWORK_NAME=greenhouse-network
```

## 📋 Environment Templates

### **Development Template (.env.development)**

```bash
# === CORE SETTINGS ===
NODE_ENV=development
PORT=5000
API_PREFIX=/api

# === DATABASE ===
MONGODB_URI=mongodb://localhost:27017/greenhouse_dev
REDIS_URL=redis://localhost:6379

# === AUTHENTICATION ===
JWT_SECRET=development-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=10

# === MQTT ===
MQTT_HOST=mqtt.noboroto.id.vn
MQTT_PORT=1883

# === EMAIL (Optional for development) ===
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="Smart Greenhouse Dev <dev@yourdomain.com>"

# === WEBSOCKET ===
FRONTEND_URL=http://localhost:3000
WEBSOCKET_PING_TIMEOUT=60000
WEBSOCKET_PING_INTERVAL=25000

# === LOGGING ===
LOG_LEVEL=debug
LOG_TO_FILE=true

# === DEBUG ===
DEBUG=app:*
MOCK_DATA_ENABLED=true
```

### **Production Template (.env.production)**

```bash
# === CORE SETTINGS ===
NODE_ENV=production
PORT=5000
API_PREFIX=/api

# === DATABASE ===
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/greenhouse
REDIS_URL=redis://redis-server:6379

# === AUTHENTICATION ===
JWT_SECRET=your-super-secure-jwt-secret-key-min-32-chars
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12

# === MQTT ===
MQTT_HOST=mqtt.noboroto.id.vn
MQTT_PORT=1883
MQTT_USERNAME=your-mqtt-username
MQTT_PASSWORD=your-mqtt-password

# === EMAIL ===
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your-production-email-password
EMAIL_FROM="Smart Greenhouse <noreply@yourdomain.com>"

# === WEBSOCKET ===
FRONTEND_URL=https://yourdomain.com
WEBSOCKET_PING_TIMEOUT=60000
WEBSOCKET_PING_INTERVAL=25000

# === LOGGING ===
LOG_LEVEL=info
LOG_TO_FILE=true
LOG_MAX_SIZE=50m
LOG_MAX_FILES=30

# === DISABLE DEBUG ===
MOCK_DATA_ENABLED=false
```

### **Frontend Development Template (.env.local)**

```bash
# === API CONFIGURATION ===
VITE_API_URL=http://localhost:5000
VITE_WS_URL=http://localhost:5000

# === APPLICATION ===
VITE_APP_TITLE=Smart Greenhouse (Dev)
VITE_APP_VERSION=1.0.0-dev

# === FEATURES ===
VITE_ENABLE_MOCK_DATA=true
VITE_ENABLE_DEBUG=true
```

## 🔒 Security Best Practices

### **Sensitive Variables**
Những biến này không bao giờ được commit vào Git:
- `JWT_SECRET`
- `EMAIL_PASS`
- `MQTT_PASSWORD`
- Database passwords
- API keys

### **Environment-Specific**
```bash
# Development
JWT_SECRET=dev-secret-key
LOG_LEVEL=debug

# Production  
JWT_SECRET=complex-production-secret-key
LOG_LEVEL=info
```

### **Validation**
Backend sẽ validate các biến môi trường khi khởi động:
```bash
# Missing required variables will cause startup failure
Required: MONGODB_URI, JWT_SECRET, EMAIL_FROM
```

## 📖 Usage Examples

### **Loading Environment Variables**

#### Backend (Node.js)
```typescript
import dotenv from 'dotenv';
dotenv.config();

const config = {
  port: parseInt(process.env.PORT || '5000'),
  mongoUri: process.env.MONGODB_URI!,
  jwtSecret: process.env.JWT_SECRET!
};
```

#### Frontend (Vite)
```typescript
const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  appTitle: import.meta.env.VITE_APP_TITLE || 'Smart Greenhouse'
};
```

### **Docker Compose Override**
```yaml
# docker-compose.override.yml
services:
  backend:
    environment:
      - DEBUG=app:*
      - LOG_LEVEL=debug
      - MOCK_DATA_ENABLED=true
```

## 🆘 Troubleshooting

### **Common Issues**

1. **Missing environment variables**
```bash
Error: JWT_SECRET is required
```
**Solution**: Tạo file `.env` và set `JWT_SECRET`

2. **Database connection failed**
```bash
Error: MongoError: Authentication failed
```
**Solution**: Kiểm tra `MONGODB_URI` credentials

3. **Email sending failed**
```bash
Error: Invalid login
```
**Solution**: Kiểm tra `EMAIL_USER`, `EMAIL_PASS` và enable "Less secure apps"

4. **MQTT connection timeout**
```bash
Error: Connection timeout
```
**Solution**: Kiểm tra `MQTT_HOST`, `MQTT_PORT` và network connectivity

### **Environment Validation**
Sử dụng script để validate:
```bash
cd backend && node scripts/validate-env.js
```

---

💡 **Tip**: Sử dụng `.env.example` files làm template và đảm bảo không bao giờ commit sensitive data!