# 🚀 Local Development Setup Guide

## Prerequisites

Trước khi bắt đầu, đảm bảo máy tính của bạn đã cài đặt:

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **Docker & Docker Compose** ([Download](https://www.docker.com/get-started))
- **Git** ([Download](https://git-scm.com/))
- **Yarn** (npm install -g yarn)

## 📁 Project Structure

```
aiot-smart-greenhouse/
├── backend/          # Node.js/TypeScript API server
├── frontend/         # React/TypeScript web app
├── embedded/         # ESP32 IoT firmware  
├── scripts/          # Database & utility scripts
├── docs/             # Documentation
└── compose.yml       # Docker Compose configuration
```

## 🛠️ Quick Setup (Recommended)

### 1. Clone Repository
```bash
git clone https://github.com/nhnhu146/aiot-smart-greenhouse.git
cd aiot-smart-greenhouse
```

### 2. Environment Setup
Tạo file `.env` trong thư mục gốc:
```bash
# Copy from template
cp .env.example .env

# Edit với editor của bạn
nano .env  # hoặc code .env
```

### 3. Start All Services
```bash
# Khởi động tất cả services với Docker
docker compose up -d

# Hoặc chạy development servers
npm run dev:all
```

### 4. Access Applications
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

## 🔧 Manual Development Setup

### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
yarn install
```

3. **Setup environment variables**
```bash
# Tạo file .env trong backend/
cp .env.example .env

# Cấu hình các biến môi trường cần thiết
```

4. **Start development server**
```bash
# Development mode với hot reload
yarn dev

# Production mode
yarn build && yarn start
```

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
yarn install
```

3. **Setup environment variables**
```bash
# Tạo file .env.local trong frontend/
cp .env.example .env.local
```

4. **Start development server**
```bash
# Development mode
yarn dev

# Production build
yarn build && yarn preview
```

### Database Setup

1. **Start MongoDB với Docker**
```bash
docker run -d \
  --name greenhouse-mongo \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:7.0
```

2. **Initialize database**
```bash
# Run initialization script
node scripts/init-mongo.js
```

3. **Create admin user**
```bash
cd backend && node create-admin.js
```

### Redis Setup

1. **Start Redis với Docker**
```bash
docker run -d \
  --name greenhouse-redis \
  -p 6379:6379 \
  -v redis_data:/data \
  redis:7.2
```

## 🌐 Network Configuration

### Docker Network Setup
```bash
# Tạo custom network cho inter-service communication
docker network create multi-domain

# Hoặc sử dụng script có sẵn
./create-network.ps1  # Windows
```

### MQTT Broker Setup
Dự án sử dụng external MQTT broker:
- **Host**: mqtt.noboroto.id.vn
- **Port**: 1883
- **Topics**: Xem file `docs/MQTT_TOPICS.md`

## 📱 IoT Device Setup

### ESP32 Configuration

1. **Install Arduino IDE & Libraries**
   - ESP32 Board Package
   - PubSubClient (MQTT)
   - ArduinoJson
   - WiFi library

2. **Configure embedded/embedded.ino**
```cpp
// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT configuration
const char* mqtt_server = "mqtt.noboroto.id.vn";
const int mqtt_port = 1883;
```

3. **Upload firmware**
```bash
# Sử dụng Arduino IDE hoặc PlatformIO
```

## 🧪 Testing & Development

### Running Tests
```bash
# Backend tests
cd backend && yarn test

# Frontend tests  
cd frontend && yarn test

# E2E tests
yarn test:e2e
```

### Development Scripts
```bash
# Start all development servers
yarn dev:all

# Start only backend
yarn dev:backend

# Start only frontend
yarn dev:frontend

# Database operations
yarn db:seed      # Seed test data
yarn db:reset     # Reset database
yarn db:migrate   # Run migrations
```

### Debugging

1. **Backend Debugging**
   - Logs: `backend/logs/`
   - Debug mode: `DEBUG=* yarn dev`
   - VSCode debugger supported

2. **Frontend Debugging**
   - Browser DevTools
   - React DevTools extension
   - Redux DevTools (if applicable)

## 🔍 Health Checks

### System Status
```bash
# Check all services
docker compose ps

# Check backend health
curl http://localhost:5000/api/health

# Check frontend
curl http://localhost:3000
```

### Database Connectivity
```bash
# MongoDB
docker exec -it greenhouse-mongo mongosh

# Redis
docker exec -it greenhouse-redis redis-cli ping
```

### MQTT Testing
```bash
# Sử dụng MQTT client để test
mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -t "greenhouse/sensors/temperature" -m "25.5"
```

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**
```bash
# Find và kill processes using ports
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:5000 | xargs kill -9  # Backend
```

2. **Docker issues**
```bash
# Reset Docker containers
docker compose down -v
docker compose up -d --build
```

3. **Database connection errors**
```bash
# Check MongoDB status
docker logs greenhouse-mongo

# Reset database
docker compose down
docker volume rm greenhouse_mongodb_data
docker compose up -d
```

4. **MQTT connection issues**
```bash
# Test MQTT connectivity
telnet mqtt.noboroto.id.vn 1883
```

### Log Locations
- Backend: `backend/logs/`
- Frontend: Browser console
- Database: Docker logs
- MQTT: Backend logs

## 📚 Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Environment Variables](./ENVIRONMENT_VARIABLES.md)
- [Use Cases](./USE_CASES.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

## 🆘 Support

Nếu gặp vấn đề:
1. Kiểm tra [Troubleshooting Guide](./TROUBLESHOOTING.md)
2. Xem [Issues trên GitHub](https://github.com/nhnhu146/aiot-smart-greenhouse/issues)
3. Tạo issue mới với template phù hợp

---

💡 **Tip**: Sử dụng `docker compose logs -f [service-name]` để theo dõi logs real-time của bất kỳ service nào!