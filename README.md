# 🌱 AIOT Smart Greenhouse System

Hệ thống nhà kính thông minh sử dụng công nghệ AIOT (Artificial Intelligence of Things) để giám sát và điều khiển tự động môi trường nhà kính với khả năng điều khiển bằng giọng nói.

## 👥 MEMBERS
1. Nguyen Van Le Ba Thanh - 22127390
2. Nguyen Gia Kiet - 22127221
3. Nguyen Hoang Nhu - 22127314
4. Vo Thanh Tu - 21127469

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       
         │                       │                       
         │              ┌─────────────────┐              
         │              │   MQTT Broker   │              
         └──────────────►│   (Mosquitto)   │              
                        │   Port: 1883    │              
                        └─────────────────┘              
                                 │                        
                                 │                        
                        ┌─────────────────┐              
                        │   IoT Devices   │              
                        │   (Arduino/ESP) │              
                        └─────────────────┘              
```

## 🚀 Tính năng chính

### 📊 Giám sát thời gian thực
- **Nhiệt độ**: Theo dõi nhiệt độ môi trường
- **Độ ẩm**: Giám sát độ ẩm không khí
- **Độ ẩm đất**: Đo độ ẩm trong đất
- **Mực nước**: Kiểm tra mực nước trong bồn
- **Chiều cao cây**: Theo dõi sự phát triển của cây
- **Trạng thái mưa**: Cảm biến phát hiện mưa

### 🎛️ Điều khiển tự động
- **Đèn LED**: Tự động bật/tắt theo lịch và cường độ ánh sáng
- **Hệ thống tưới**: Điều khiển bơm nước dựa trên độ ẩm đất
- **Cửa thông gió**: Mở/đóng tự động để điều hòa nhiệt độ
- **Điều khiển giọng nói**: Tích hợp AI voice control

### 🔔 Hệ thống cảnh báo thông minh
- **Giám sát ngưỡng**: Kiểm tra thời gian thực các thông số cảm biến
- **Cảnh báo email**: Gửi email HTML đẹp mắt khi vượt ngưỡng
- **Nhiều mức độ**: Critical, High, Medium, Low alerts
- **Chống spam**: Cooldown 5 phút giữa các cảnh báo
- **Đa người nhận**: Hỗ trợ nhiều email recipients
- **Test email**: Kiểm tra cấu hình email
- **Lưu trữ lịch sử**: Theo dõi tất cả cảnh báo trong database
- **Cấu hình linh hoạt**: Điều chỉnh ngưỡng từ frontend

### 📈 Báo cáo và thống kê
- Biểu đồ thời gian thực
- Báo cáo lịch sử
- Thống kê theo ngày/tuần/tháng
- Export dữ liệu

## 🛠️ Công nghệ sử dụng

### Frontend
- **Next.js 13**: React framework với App Router
- **TypeScript**: Type-safe development
- **Bootstrap**: UI framework
- **Chart.js**: Biểu đồ và visualization
- **React**: User interface library

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **TypeScript**: Type-safe server development
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **MQTT**: IoT messaging protocol
- **Zod**: Schema validation
- **JWT**: Authentication (thay thế Firebase Auth)

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-container deployment
- **Mosquitto**: MQTT broker
- **MongoDB**: Database storage (thay thế ThingSpeak)

### Hardware
- **Arduino/ESP32**: Microcontroller
- **DHT22**: Temperature & humidity sensor
- **Soil moisture sensor**: Cảm biến độ ẩm đất
- **Ultrasonic sensor**: Đo khoảng cách/mực nước
- **Rain sensor**: Cảm biến mưa
- **Relay modules**: Điều khiển thiết bị

## 📋 Yêu cầu hệ thống

- **Docker & Docker Compose**
- **Node.js 18+** (cho development)
- **Git**
- **Web browser** hỗ trợ modern JavaScript

## 🚀 Cài đặt và chạy

### 1. Clone repository
```bash
git clone <repository-url>
cd aiot-smart-greenhouse
```

### 2. Cấu hình môi trường
```bash
# Copy file cấu hình
cp .env.example .env

# Chỉnh sửa file .env theo nhu cầu
```

### 3. Chạy hệ thống

#### 🐳 Sử dụng Docker (Khuyến nghị)
```bash
# Chạy toàn bộ hệ thống
docker compose up -d

# Xem logs
docker compose logs -f
```

### 🛠️ Available Scripts

#### � Development
```bash
# Windows - Start development environment
.\scripts\start-dev.ps1

# Stop development environment  
.\scripts\stop-dev.ps1

# Test system health
.\scripts\test-system.ps1
```

#### 🏭 Production
```bash
# Start production environment
.\scripts\start-prod.ps1

# Stop production environment
.\scripts\stop-prod.ps1

# Create production backup
.\scripts\backup-prod.ps1
```

#### 🧹 Maintenance
```bash
# Clean project artifacts
.\scripts\clean-project.ps1

# Initialize system with admin user
.\scripts\init-system.ps1

# Setup MQTT user authentication
.\scripts\setup-mqtt-user.ps1

# Test MQTT authentication
.\scripts\test-mqtt-auth.ps1
```

### 🔐 MQTT Authentication Process

The MQTT setup follows a secure process:

1. **Initial Setup**: MQTT starts with anonymous access enabled
2. **User Creation**: Default user 'vision' is created with password authentication
3. **Security Lock**: Anonymous access is disabled, authentication required
4. **Verification**: Connection is tested to ensure proper authentication

This ensures MQTT broker is always properly secured after initialization.

### 4. Đăng nhập hệ thống

**Default Admin Account:**
- 👤 **Username:** `admin`
- 🔐 **Password:** `admin`

**URLs:**
- 🌐 **Frontend:** http://localhost:3000
- 🔧 **Backend API:** http://localhost:5000
- 📊 **Health Check:** http://localhost:5000/api/health

**MQTT Credentials (Development):**
- 👤 **Username:** `vision`
- 🔐 **Password:** `vision`

> ⚠️ **Lưu ý:** Trong môi trường production, hãy thay đổi mật khẩu admin và MQTT ngay lập tức!

## 📡 API Endpoints

### Sensors
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/sensors` | Lấy dữ liệu cảm biến |
| GET | `/api/sensors/latest` | Dữ liệu cảm biến mới nhất |
| GET | `/api/sensors/stats` | Thống kê cảm biến |

### Devices
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/devices` | Lấy trạng thái thiết bị |
| POST | `/api/devices/control` | Điều khiển thiết bị |

### History
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/history` | Lấy dữ liệu lịch sử |
| GET | `/api/history/summary` | Tóm tắt lịch sử |

### Settings
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/settings` | Lấy cài đặt |
| POST | `/api/settings` | Cập nhật cài đặt |

### Alerts
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/alerts` | Lấy danh sách cảnh báo |
| GET | `/api/alerts/active` | Cảnh báo chưa xử lý |

## 🦟 MQTT Topics

### Sensor Data (Subscribe)
| Topic | Mô tả |
|-------|-------|
| `greenhouse/sensors/temperature` | Nhiệt độ |
| `greenhouse/sensors/humidity` | Độ ẩm không khí |
| `greenhouse/sensors/soil` | Độ ẩm đất |
| `greenhouse/sensors/water` | Mực nước |
| `greenhouse/sensors/height` | Chiều cao cây |
| `greenhouse/sensors/rain` | Trạng thái mưa |

### Device Control (Publish)
| Topic | Mô tả |
|-------|-------|
| `greenhouse/devices/light/control` | Điều khiển đèn |
| `greenhouse/devices/pump/control` | Điều khiển bơm |
| `greenhouse/devices/door/control` | Điều khiển cửa |

## 🔧 Cấu hình

### Biến môi trường chính
```env
# Database
MONGODB_USER=greenhouse_user
MONGODB_PASSWORD=greenhouse_password

# MQTT (Bảo mật với authentication)
MQTT_USERNAME=vision
MQTT_PASSWORD=vision

# Application
NODE_ENV=development
```

### 🔐 MQTT Authentication

Hệ thống sử dụng MQTT authentication để bảo mật:

- **Default Username**: `vision`
- **Default Password**: `vision`
- **Anonymous access**: Đã bị tắt
- **Password file**: `mosquitto/config/passwd`

#### Thay đổi MQTT password:

```bash
# Tạo password mới với mosquitto_passwd
mosquitto_passwd -c mosquitto/config/passwd your_username

# Cập nhật .env file
MQTT_USERNAME=your_username
MQTT_PASSWORD=your_new_password
```

#### Test MQTT connection:

```bash
# Test publish
mosquitto_pub -h localhost -u vision -P vision -t "test/topic" -m "Hello"

# Test subscribe
mosquitto_sub -h localhost -u vision -P vision -t "test/topic"
```

## 📚 Tài liệu

- [Backend API Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)
- [Hardware Setup Guide](./embedded/README.md)
- [MQTT Authentication Guide](./docs/MQTT_AUTH.md)

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

---

⭐ **Nếu dự án này hữu ích, hãy cho một star để ủng hộ!** ⭐
