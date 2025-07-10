# 📚 Documentation Index

Chào mừng đến với tài liệu hệ thống AIOT Smart Greenhouse! Đây là hub trung tâm cho tất cả documentation của dự án.

---

## 📋 Danh mục Tài liệu

### 🚀 **Quick Start**
- **[Getting Started Guide](./getting-started.md)** - Hướng dẫn bắt đầu nhanh
  - Cài đặt và chạy ứng dụng
  - Cấu hình môi trường
  - MQTT topics và triggers
  - Kết nối hardware

### 🏗️ **System Architecture**  
- **[Architecture Overview](./architecture.md)** - Tổng quan kiến trúc hệ thống
  - Component diagram
  - Data flow
  - Technology stack
  - Database schema

### 📡 **Communication**
- **[MQTT Configuration Guide](./mqtt-guide.md)** - Hướng dẫn cấu hình MQTT
  - Topic structure
  - Message handling
  - ESP32 integration
  - Debugging tools

### 🔧 **API Reference**
- **[API Documentation](./api-documentation.md)** - Tài liệu API chi tiết
  - Authentication endpoints
  - Sensor data APIs
  - Device control APIs
  - WebSocket events

### 👨‍💻 **Development**
- **[Development Guide](./development-guide.md)** - Hướng dẫn phát triển
  - Setup môi trường dev
  - Code structure
  - Testing strategy
  - Best practices

### 🛠️ **Troubleshooting**
- **[Troubleshooting Guide](./troubleshooting.md)** - Xử lý sự cố
  - Common issues
  - Debug tools
  - Performance optimization
  - Error handling

---

## 🎯 Quick Navigation

### Cho người mới bắt đầu:
1. **[Getting Started](./getting-started.md)** - Bắt đầu tại đây
2. **[Architecture](./architecture.md)** - Hiểu hệ thống
3. **[API Docs](./api-documentation.md)** - Tích hợp API

### Cho developers:
1. **[Development Guide](./development-guide.md)** - Setup dev environment
2. **[MQTT Guide](./mqtt-guide.md)** - Hiểu communication layer
3. **[Troubleshooting](./troubleshooting.md)** - Debug issues

### Cho system administrators:
1. **[Architecture](./architecture.md)** - System overview
2. **[MQTT Guide](./mqtt-guide.md)** - Network configuration  
3. **[Troubleshooting](./troubleshooting.md)** - Operations guide

---

## 📊 System Overview

### **What is AIOT Smart Greenhouse?**
Hệ thống nhà kính thông minh sử dụng IoT và AI để:
- 🌡️ **Monitor**: Nhiệt độ, độ ẩm, độ ẩm đất, mức nước
- 🎛️ **Control**: Đèn, bơm nước, cửa, cửa sổ
- 🚨 **Alert**: Email notifications cho các ngưỡng cảnh báo
- 📱 **Visualize**: Real-time dashboard và historical data

### **Key Features:**
- ✅ Real-time sensor monitoring
- ✅ Automated device control
- ✅ Email alert system
- ✅ Historical data analytics
- ✅ Mobile-responsive interface
- ✅ MQTT communication
- ✅ WebSocket real-time updates

---

## 🏗️ Architecture Quick View

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   ESP32     │◄──►│    MQTT     │◄──►│   Backend   │
│  Hardware   │    │   Broker    │    │   Node.js   │
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
┌─────────────┐    ┌─────────────┐           │
│  Frontend   │◄──►│  Database   │◄──────────┘
│  Next.js    │    │  MongoDB    │
└─────────────┘    └─────────────┘
```

### **Technology Stack:**
- **Frontend**: Next.js 13+, TypeScript, SCSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB
- **Communication**: MQTT (Mosquitto), WebSocket
- **Hardware**: ESP32, Various sensors
- **Deployment**: Docker, Docker Compose

---

## 🚀 Quick Start Commands

```bash
# Clone repository
git clone https://github.com/nhnhu146/aiot-smart-greenhouse.git
cd aiot-smart-greenhouse

# Start with Docker (Recommended)
docker-compose -f compose.dev.yml up -d

# Or use scripts
.\scripts\start-dev.ps1

# Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000/api/health
# Login: admin@gmail.com / admin
```

---

## 📡 MQTT Topics Quick Reference

### **Sensor Data (ESP32 → Backend)**
```
greenhouse/sensors/temperature    # Nhiệt độ (°C)
greenhouse/sensors/humidity       # Độ ẩm (%)
greenhouse/sensors/soil          # Độ ẩm đất (%)
greenhouse/sensors/water         # Mức nước (%)
greenhouse/sensors/motion        # Chuyển động (0/1)
```

### **Device Control (Backend → ESP32)**
```
greenhouse/devices/light/control   # on/off
greenhouse/devices/pump/control    # on/off/auto
greenhouse/devices/door/control    # open/close
greenhouse/devices/window/control  # open/close
```

---

## 🔧 Development Quick Setup

### **Prerequisites:**
- Node.js 18+
- Docker & Docker Compose
- VS Code (recommended)

### **Environment:**
```env
MONGODB_URI=mongodb://localhost:27017/greenhouse
MQTT_BROKER_URL=mqtt://localhost:1883
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
JWT_SECRET=your-secret-key
```

### **Development Commands:**
```bash
# Backend development
cd backend && yarn dev

# Frontend development  
cd frontend && yarn dev

# Run tests
yarn test

# Check system health
.\scripts\system-check.ps1
```

---

## 🚨 Common Issues & Quick Fixes

### **Connection Issues:**
```bash
# Check services
docker ps

# Restart MQTT
docker-compose restart mosquitto

# Check logs
docker-compose logs -f backend
```

### **MQTT Debug:**
```bash
# Monitor messages
mosquitto_sub -h localhost -t "greenhouse/+/+"

# Test publish
mosquitto_pub -h localhost -t "greenhouse/sensors/temperature" -m "25.5"
```

### **Database Issues:**
```bash
# Connect to MongoDB
docker exec -it mongodb mongo
use greenhouse
db.sensordatas.find().limit(5)
```

---

## 📞 Support & Contributing

### **Getting Help:**
1. ✅ Check [Troubleshooting Guide](./troubleshooting.md)
2. 🔍 Run system health check: `.\scripts\system-check.ps1`
3. 📋 Review relevant documentation
4. 🆘 Create GitHub issue với detailed logs

### **Contributing:**
1. Fork repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Follow [Development Guide](./development-guide.md)
4. Submit pull request

### **Documentation Updates:**
- Documentation được viết bằng Markdown
- Follow existing structure và style
- Include code examples và screenshots
- Test all commands và procedures

---

## 📈 What's Next?

### **Advanced Topics:**
- **Deployment Guide**: Production deployment với Docker Swarm/Kubernetes
- **Security Guide**: Authentication, authorization, và data protection
- **Performance Tuning**: Optimization strategies cho large-scale deployments
- **Integration Guide**: Tích hợp với external systems và APIs

### **Hardware Expansion:**
- **Camera Integration**: Visual monitoring với computer vision
- **Additional Sensors**: pH, EC, CO2 sensors
- **Actuator Control**: Advanced irrigation systems
- **Edge Computing**: Local AI processing trên ESP32

---

## 📝 Documentation Standards

### **Writing Style:**
- ✅ Clear, concise instructions
- ✅ Code examples với explanations
- ✅ Screenshots cho UI components
- ✅ Troubleshooting steps
- ✅ Vietnamese với English technical terms

### **File Structure:**
```
docs/
├── README.md                  # Documentation index (this file)
├── getting-started.md         # Quick start guide
├── architecture.md            # System architecture
├── mqtt-guide.md             # MQTT configuration
├── api-documentation.md       # API reference
├── development-guide.md       # Development setup
└── troubleshooting.md        # Issue resolution
```

---

**Welcome to AIOT Smart Greenhouse! Hãy bắt đầu với [Getting Started Guide](./getting-started.md) để khởi chạy hệ thống của bạn. 🌱**
