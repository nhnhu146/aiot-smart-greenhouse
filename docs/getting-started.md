# 🚀 Getting Started Guide - AIOT Smart Greenhouse

## Mục lục
1. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
2. [Cài đặt nhanh](#cài-đặt-nhanh)
3. [Cấu hình môi trường](#cấu-hình-môi-trường)
4. [Khởi chạy ứng dụng](#khởi-chạy-ứng-dụng)
5. [Kết nối Hardware](#kết-nối-hardware)
6. [MQTT Topics và Triggers](#mqtt-topics-và-triggers)
7. [Xử lý sự cố](#xử-lý-sự-cố)

---

## Yêu cầu hệ thống

### Phần mềm bắt buộc
- **Docker** và **Docker Compose** (khuyến nghị)
- **Node.js** 18+ (cho development)
- **MongoDB** (hoặc sử dụng Docker)
- **Mosquitto MQTT Broker** (hoặc sử dụng Docker)

### Hardware
- **ESP32** với các cảm biến:
  - DHT22 (nhiệt độ, độ ẩm)
  - Soil moisture sensor
  - Ultrasonic sensor (mức nước)
  - PIR motion sensor
  - Rain sensor
  - LDR (ánh sáng)

---

## Cài đặt nhanh

### Bước 1: Clone repository
```bash
git clone https://github.com/nhnhu146/aiot-smart-greenhouse.git
cd aiot-smart-greenhouse
```

### Bước 2: Cấu hình môi trường
```bash
# Tạo file .env từ template
cp .env.example .env

# Chỉnh sửa file .env theo cấu hình của bạn
```

### Bước 3: Khởi chạy với Docker (Khuyến nghị)
```bash
# Development mode
docker-compose -f compose.dev.yml up -d

# Production mode
docker-compose up -d
```

### Bước 4: Truy cập ứng dụng
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

---

## Cấu hình môi trường

### File .env cần thiết
```env
# Database
MONGODB_URI=mongodb://localhost:27017/greenhouse

# MQTT Broker
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_CLIENT_ID=greenhouse_backend
MQTT_USERNAME=your_username
MQTT_PASSWORD=your_password

# Email Alerts
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
ALERT_RECIPIENTS=admin@example.com,manager@example.com

# Security
JWT_SECRET=your-super-secret-jwt-key
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=your-admin-password

# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Cấu hình Email Alerts
```bash
# Chạy script setup email
.\scripts\setup-email-alerts.ps1

# Test email functionality
curl -X POST http://localhost:5000/api/alerts/email/test
```

---

## Khởi chạy ứng dụng

### Option 1: Sử dụng Docker (Khuyến nghị)
```bash
# Development
docker-compose -f compose.dev.yml up -d

# Production
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng services
docker-compose down
```

### Option 2: Chạy manual (Development)
```bash
# Backend
cd backend
yarn install
yarn dev

# Frontend (terminal mới)
cd frontend
yarn install
yarn dev

# MQTT Broker (nếu chưa có)
docker run -it -p 1883:1883 -p 9001:9001 eclipse-mosquitto
```

### Sử dụng scripts có sẵn
```bash
# Khởi chạy development
.\scripts\start-dev.ps1

# Khởi chạy production
.\scripts\start-prod.ps1

# Dừng development
.\scripts\stop-dev.ps1

# System check
.\scripts\system-check.ps1
```

---

## Kết nối Hardware

### ESP32 Code Setup
1. Mở file `embeded/aiot-greenhouse-embedded.ino`
2. Cấu hình WiFi và MQTT:
```cpp
// WiFi credentials
const char* ssid = "your-wifi-name";
const char* password = "your-wifi-password";

// MQTT Broker
const char* mqtt_broker = "your-broker-ip";
const int mqtt_port = 1883;
const char* mqtt_username = "your-username";
const char* mqtt_password = "your-password";
```

### Pin Configuration
```cpp
// Sensor pins
#define DHT_PIN 4          // DHT22
#define SOIL_PIN A0        // Soil moisture
#define TRIG_PIN 5         // Ultrasonic trigger
#define ECHO_PIN 18        // Ultrasonic echo
#define PIR_PIN 19         // Motion sensor
#define RAIN_PIN 21        // Rain sensor
#define LDR_PIN A3         // Light sensor

// Control pins
#define LIGHT_PIN 2        // LED/Light control
#define PUMP_PIN 14        // Water pump
#define DOOR_PIN 12        // Door servo
#define WINDOW_PIN 13      // Window servo
```

---

## MQTT Topics và Triggers

### 📡 MQTT Topics Structure

#### Sensor Topics (ESP32 → Backend)
```
greenhouse/sensors/temperature     # Nhiệt độ (°C)
greenhouse/sensors/humidity        # Độ ẩm (%)
greenhouse/sensors/soil           # Độ ẩm đất (%)
greenhouse/sensors/water          # Mức nước (%)
greenhouse/sensors/height         # Chiều cao cây (cm)
greenhouse/sensors/rain           # Cảm biến mưa (0/1)
greenhouse/sensors/light          # Ánh sáng (lux)
greenhouse/sensors/motion         # Chuyển động (0/1)
```

#### Device Control Topics (Backend → ESP32)
```
greenhouse/devices/light/control   # Điều khiển đèn (on/off)
greenhouse/devices/pump/control    # Điều khiển bơm (on/off)
greenhouse/devices/door/control    # Điều khiển cửa (open/close)
greenhouse/devices/window/control  # Điều khiển cửa sổ (open/close)
```

### 🔥 MQTT Triggers trong Code

#### 1. **Sensor Data Processing** - `backend/src/services/MQTTService.ts:165`
```typescript
// Dòng 165: Xử lý dữ liệu cảm biến
public async processSensorData(topic: string, value: number, receivedTimestamp?: Date): Promise<void> {
    // Trigger: Nhận dữ liệu từ cảm biến
    const sensorType = this.getSensorTypeFromTopic(topic);
    if (sensorType) {
        this.sensorDataBuffer.set(sensorType, value);
        
        // Trigger: Lưu dữ liệu ngay lập tức
        await this.saveIndividualSensorData(sensorType, value);
        
        // Trigger: Phát hiện chuyển động
        if (sensorType === 'motionDetected' && value === 1 && this.alertService) {
            await this.alertService.handleMotionDetected();
        }
    }
}
```

#### 2. **Message Handler** - `backend/src/services/MQTTService.ts:107`
```typescript
// Dòng 107: Handler chính cho tất cả MQTT messages
private handleMessage(topic: string, message: Buffer): void {
    try {
        const data = JSON.parse(message.toString());
        
        // Trigger: Dữ liệu cảm biến
        if (topic.includes('/sensors/')) {
            this.sensorDataCallbacks.forEach(callback => callback(topic, data));
            this.processSensorData(topic, typeof data === 'number' ? data : data.value, receivedTimestamp);
        }
        
        // Trigger: Trạng thái thiết bị
        if (topic.includes('/devices/') && topic.includes('/status')) {
            this.deviceStatusCallbacks.forEach(callback => callback(topic, data));
        }
    } catch (error) {
        // Handle non-JSON messages
    }
}
```

#### 3. **Threshold Checking** - `backend/src/services/MQTTService.ts:200`
```typescript
// Dòng 200: Kiểm tra ngưỡng cảnh báo
if (hasAllData && this.alertService) {
    const sensorData = {
        temperature: this.sensorDataBuffer.get('temperature')!,
        humidity: this.sensorDataBuffer.get('humidity')!,
        soilMoisture: this.sensorDataBuffer.get('soilMoisture')!,
        waterLevel: this.sensorDataBuffer.get('waterLevel')!
    };
    
    // Trigger: Kiểm tra ngưỡng và gửi cảnh báo
    await this.alertService.checkSensorThresholds(sensorData);
    
    // Trigger: Lưu bộ dữ liệu hoàn chỉnh
    await this.saveSensorData(sensorData);
}
```

#### 4. **Device Control** - `backend/src/services/MQTTService.ts:127`
```typescript
// Dòng 127: Điều khiển thiết bị
public publishDeviceControl(deviceType: 'light' | 'pump' | 'door' | 'window', command: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const topic = this.getDeviceControlTopic(deviceType);
        
        // Trigger: Gửi lệnh điều khiển
        this.client.publish(topic, command, { qos: 1 }, (error) => {
            if (error) {
                console.error(`❌ Failed to publish to ${topic}:`, error);
                reject(error);
            } else {
                console.log(`📤 Published to ${topic}: ${command}`);
                resolve();
            }
        });
    });
}
```

#### 5. **Connection Events** - `backend/src/services/MQTTService.ts:42`
```typescript
// Dòng 42: Xử lý kết nối MQTT
private setupEventHandlers(): void {
    this.client.on('connect', () => {
        console.log('✅ MQTT Client connected successfully');
        
        // Trigger: Subscribe tất cả sensor topics
        Object.values(this.topics.SENSORS).forEach(topic => {
            this.client.subscribe(topic, { qos: 1 });
        });
        
        // Trigger: Publish trạng thái online
        this.client.publish('greenhouse/backend/status', 'online', { qos: 1, retain: true });
    });
    
    // Trigger: Xử lý tin nhắn
    this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
    });
}
```

### 🎯 Alert Service Integration - `backend/src/services/AlertService.ts`

#### Email Triggers:
- **Temperature alerts**: Khi nhiệt độ vượt ngưỡng
- **Humidity alerts**: Khi độ ẩm bất thường
- **Soil moisture alerts**: Khi đất khô cần tưới
- **Water level alerts**: Khi mức nước thấp
- **Motion detection**: Khi phát hiện chuyển động
- **System errors**: Khi có lỗi hệ thống

### 📱 WebSocket Integration - `backend/src/services/WebSocketService.ts`

Real-time triggers cho frontend:
- Sensor data updates
- Device status changes
- Alert notifications
- System status updates

---

## Xử lý sự cố

### Kiểm tra trạng thái hệ thống
```bash
# System health check
.\scripts\system-check.ps1

# Kiểm tra logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### MQTT Debugging
```bash
# Test MQTT connection
mosquitto_pub -h localhost -t "test/topic" -m "Hello MQTT"
mosquitto_sub -h localhost -t "greenhouse/sensors/+"

# Trong Docker
docker exec -it mosquitto mosquitto_pub -t "test" -m "hello"
```

### Database Access
```bash
# MongoDB connection
docker exec -it mongodb mongo
use greenhouse
db.sensordatas.find().limit(5)
```

### Common Issues

1. **MQTT Connection Failed**
   - Kiểm tra broker có chạy không
   - Verify username/password
   - Check firewall settings

2. **Email Alerts Not Working**
   - Verify Gmail app password
   - Check SMTP settings
   - Run email test: `curl -X POST http://localhost:5000/api/alerts/email/test`

3. **Frontend Not Loading**
   - Check if backend is running
   - Verify CORS settings
   - Check browser console for errors

4. **Sensor Data Not Updating**
   - Verify ESP32 WiFi connection
   - Check MQTT topics match
   - Monitor MQTT logs

---

## Đăng nhập mặc định

- **Email**: admin@gmail.com
- **Password**: admin

---

## Liên hệ hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra [Documentation](../DOCUMENTATION.md)
2. Chạy `.\scripts\system-check.ps1`
3. Xem logs: `docker-compose logs -f`
4. Tạo issue trên GitHub

---

**Chúc bạn thành công với dự án AIOT Smart Greenhouse! 🌱**
