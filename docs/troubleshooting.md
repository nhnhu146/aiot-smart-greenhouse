# 🛠️ Troubleshooting Guide

## Mục lục
1. [Vấn đề thường gặp](#vấn-đề-thường-gặp)
2. [MQTT Issues](#mqtt-issues)
3. [Database Problems](#database-problems)
4. [Email Alert Issues](#email-alert-issues)
5. [Frontend Problems](#frontend-problems)
6. [Hardware/ESP32 Issues](#hardwareesp32-issues)
7. [Docker Issues](#docker-issues)
8. [Performance Issues](#performance-issues)
9. [Debug Tools](#debug-tools)

---

## Vấn đề thường gặp

### ❌ Application không khởi động được

#### **Symptoms:**
- Container exits với error code
- Port already in use
- Connection refused errors

#### **Solutions:**
```bash
# 1. Kiểm tra ports đang được sử dụng
netstat -tulpn | grep :3000
netstat -tulpn | grep :5000

# 2. Stop các services đang chạy
docker-compose down
.\scripts\stop-dev.ps1

# 3. Clean up Docker
docker system prune -f
docker volume prune -f

# 4. Restart với clean state
.\scripts\start-dev.ps1
```

#### **Check logs:**
```bash
# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend

# System status
.\scripts\system-check.ps1
```

---

## MQTT Issues

### ❌ MQTT Connection Failed

#### **Symptoms:**
```
❌ MQTT Client error: Error: Connection refused
⚠️ MQTT Client offline
```

#### **Diagnosis:**
```bash
# 1. Kiểm tra MQTT broker có chạy không
docker ps | grep mosquitto

# 2. Test connection
mosquitto_pub -h localhost -t "test" -m "hello"

# 3. Kiểm tra logs
docker logs mosquitto
```

#### **Solutions:**
```bash
# 1. Restart MQTT broker
docker-compose restart mosquitto

# 2. Kiểm tra configuration
docker exec -it mosquitto cat /mosquitto/config/mosquitto.conf

# 3. Reset MQTT service
docker-compose down
docker volume rm $(docker volume ls -q | grep mosquitto)
docker-compose up -d mosquitto
```

### ❌ Messages không được nhận

#### **Debug Steps:**
```bash
# 1. Subscribe để xem có message không
mosquitto_sub -h localhost -t "greenhouse/sensors/+" -v

# 2. Manual publish test
mosquitto_pub -h localhost -t "greenhouse/sensors/temperature" -m "25.5"

# 3. Kiểm tra topic pattern
mosquitto_sub -h localhost -t "greenhouse/+/+" -v
```

#### **Common Fixes:**
- Verify topic names match exactly
- Check QoS settings (use QoS 1)
- Ensure retained messages are published
- Validate JSON format for complex messages

### ❌ ESP32 không kết nối được MQTT

#### **Arduino Serial Monitor:**
```
WiFi connected, IP address: 192.168.1.xxx
Attempting MQTT connection...failed, rc=-2 try again in 5 seconds
```

#### **Solutions:**
```cpp
// 1. Kiểm tra broker IP trong code
const char* mqtt_broker = "192.168.1.100";  // Đảm bảo đúng IP

// 2. Disable authentication tạm thời
// Comment out username/password

// 3. Tăng timeout
client.setSocketTimeout(30);

// 4. Debug connection
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();
}
```

---

## Database Problems

### ❌ MongoDB Connection Failed

#### **Symptoms:**
```
❌ MongoDB connection error: MongoNetworkError
Database connection failed
```

#### **Solutions:**
```bash
# 1. Kiểm tra MongoDB container
docker ps | grep mongodb

# 2. Restart MongoDB
docker-compose restart mongodb

# 3. Kiểm tra logs
docker logs mongodb

# 4. Test connection
docker exec -it mongodb mongo --eval "db.adminCommand('ismaster')"
```

#### **Connection String Issues:**
```env
# Incorrect
MONGODB_URI=mongodb://localhost:27017/greenhouse

# Correct for Docker
MONGODB_URI=mongodb://mongodb:27017/greenhouse

# Correct for local development
MONGODB_URI=mongodb://localhost:27017/greenhouse
```

### ❌ Data không được lưu

#### **Check Database:**
```bash
# 1. Connect to MongoDB
docker exec -it mongodb mongo

# 2. Check database
use greenhouse
show collections
db.sensordatas.find().limit(5)

# 3. Check indexes
db.sensordatas.getIndexes()
```

#### **Common Issues:**
- Schema validation errors
- Missing required fields
- Duplicate key errors
- Connection timeout

---

## Email Alert Issues

### ❌ Email không được gửi

#### **Symptoms:**
```
❌ Email service error: Authentication failed
Email alert test failed
```

#### **Solutions:**
```bash
# 1. Test email configuration
curl -X POST http://localhost:5000/api/alerts/email/test

# 2. Kiểm tra email service status
curl http://localhost:5000/api/alerts/email/status
```

#### **Gmail Configuration:**
```env
# 1. Enable 2-factor authentication
# 2. Generate App Password (not regular password)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password  # NOT regular password
ALERT_RECIPIENTS=admin@example.com,manager@example.com
```

#### **Debug Email Service:**
```bash
# Check email service logs
docker-compose logs -f backend | grep -i email

# Manual email test
.\scripts\setup-email-alerts.ps1
```

### ❌ Email templates không hiển thị đúng

#### **Check Template Path:**
```typescript
// Ensure email templates exist
const templatePath = path.join(__dirname, '../templates/email');
console.log('Template path:', templatePath);
console.log('Files:', fs.readdirSync(templatePath));
```

---

## Frontend Problems

### ❌ Frontend không load

#### **Symptoms:**
- Blank page
- Loading spinner không biến mất
- Console errors

#### **Debug Steps:**
```bash
# 1. Check frontend logs
docker-compose logs -f frontend

# 2. Check browser console
# F12 -> Console tab

# 3. Network tab
# F12 -> Network tab để xem API calls
```

#### **Common Issues:**
```javascript
// 1. API endpoint incorrect
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// 2. CORS issues
// Check backend CORS_ORIGIN setting

// 3. Authentication issues
// Check JWT token in localStorage
console.log('Token:', localStorage.getItem('token'));
```

### ❌ WebSocket không kết nối

#### **Debug WebSocket:**
```javascript
// Check WebSocket connection in browser console
const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('✅ WebSocket connected');
});

socket.on('disconnect', () => {
  console.log('❌ WebSocket disconnected');
});

socket.on('connect_error', (error) => {
  console.error('WebSocket connection error:', error);
});
```

### ❌ Charts không hiển thị

#### **Chart.js Issues:**
```javascript
// 1. Ensure Chart.js is imported correctly
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// 2. Check data format
const chartData = {
  labels: ['Jan', 'Feb', 'Mar'],
  datasets: [{
    label: 'Temperature',
    data: [20, 25, 22],
    borderColor: 'rgb(75, 192, 192)',
  }]
};
```

---

## Hardware/ESP32 Issues

### ❌ ESP32 không kết nối WiFi

#### **Serial Monitor Debug:**
```
WiFi.begin(ssid, password);
while (WiFi.status() != WL_CONNECTED) {
  delay(500);
  Serial.print(".");
  
  // Timeout after 30 seconds
  if (millis() > 30000) {
    Serial.println("WiFi connection timeout!");
    ESP.restart();
  }
}
```

#### **Solutions:**
```cpp
// 1. Kiểm tra WiFi credentials
const char* ssid = "Your-WiFi-Name";
const char* password = "Your-WiFi-Password";

// 2. WiFi power management
WiFi.setSleep(false);

// 3. Static IP (if DHCP fails)
IPAddress local_IP(192, 168, 1, 200);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);
WiFi.config(local_IP, gateway, subnet);

// 4. Restart WiFi if connection lost
void checkWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    WiFi.disconnect();
    WiFi.begin(ssid, password);
  }
}
```

### ❌ Sensor readings không chính xác

#### **DHT22 Issues:**
```cpp
// 1. Add delays between readings
delay(2000);  // DHT22 needs 2s between readings

// 2. Validate readings
float temperature = dht.readTemperature();
if (isnan(temperature)) {
  Serial.println("Failed to read temperature!");
  return;
}

// 3. Filter outliers
float filterTemperature(float newValue) {
  static float lastValue = 0;
  if (abs(newValue - lastValue) > 10) {  // Threshold for outliers
    return lastValue;  // Keep previous value
  }
  lastValue = newValue;
  return newValue;
}
```

#### **Soil Moisture Calibration:**
```cpp
// Calibrate soil moisture sensor
int soilValue = analogRead(SOIL_PIN);
int soilPercent = map(soilValue, 0, 1023, 100, 0);  // Invert scale

// Add calibration values
const int DRY_VALUE = 1023;    // Sensor in dry soil
const int WET_VALUE = 300;     // Sensor in wet soil
int soilPercent = map(soilValue, WET_VALUE, DRY_VALUE, 100, 0);
soilPercent = constrain(soilPercent, 0, 100);
```

### ❌ ESP32 restart liên tục

#### **Watchdog Timer Issues:**
```cpp
// 1. Feed watchdog timer
#include "esp_task_wdt.h"

void setup() {
  esp_task_wdt_init(30, true);  // 30 second timeout
  esp_task_wdt_add(NULL);
}

void loop() {
  esp_task_wdt_reset();  // Reset watchdog
  
  // Your code here
  
  delay(1000);
}

// 2. Check for infinite loops
// Ensure all while loops have timeouts

// 3. Memory issues
void checkMemory() {
  Serial.printf("Free heap: %d bytes\n", ESP.getFreeHeap());
}
```

---

## Docker Issues

### ❌ Docker containers không start

#### **Common Commands:**
```bash
# 1. Check container status
docker ps -a

# 2. Check logs
docker logs container_name

# 3. Remove problematic containers
docker-compose down
docker system prune -f

# 4. Rebuild containers
docker-compose build --no-cache
docker-compose up -d
```

### ❌ Volume/Mount Issues

#### **Volume Problems:**
```bash
# 1. List volumes
docker volume ls

# 2. Remove unused volumes
docker volume prune

# 3. Inspect volume
docker volume inspect volume_name

# 4. Reset specific volume
docker volume rm aiot-smart-greenhouse_mongodb_data
docker-compose up -d
```

### ❌ Network Issues

#### **Container Communication:**
```bash
# 1. Check networks
docker network ls

# 2. Inspect network
docker network inspect bridge

# 3. Test container connectivity
docker exec -it backend ping mongodb
docker exec -it backend ping mosquitto

# 4. Port conflicts
netstat -tulpn | grep :5000
```

---

## Performance Issues

### ❌ High CPU/Memory Usage

#### **MongoDB Performance:**
```bash
# 1. Check database stats
docker exec -it mongodb mongo --eval "db.stats()"

# 2. Add indexes for time-series queries
db.sensordatas.createIndex({ "timestamp": -1 })
db.sensordatas.createIndex({ "timestamp": -1, "dataQuality": 1 })

# 3. Clean old data
db.sensordatas.deleteMany({
  "timestamp": { 
    $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
  }
})
```

#### **MQTT Performance:**
```typescript
// 1. Batch sensor data
private sensorBuffer: Map<string, number> = new Map();
private bufferTimeout: NodeJS.Timeout | null = null;

private batchSensorData(sensorType: string, value: number) {
  this.sensorBuffer.set(sensorType, value);
  
  if (this.bufferTimeout) clearTimeout(this.bufferTimeout);
  
  this.bufferTimeout = setTimeout(() => {
    this.processBatchedData();
  }, 5000);  // Process every 5 seconds
}

// 2. Limit message frequency
private lastMessageTime: Map<string, number> = new Map();

private shouldProcessMessage(topic: string): boolean {
  const now = Date.now();
  const lastTime = this.lastMessageTime.get(topic) || 0;
  
  if (now - lastTime < 1000) {  // Limit to 1 message per second
    return false;
  }
  
  this.lastMessageTime.set(topic, now);
  return true;
}
```

### ❌ Slow API Responses

#### **Database Optimization:**
```typescript
// 1. Use lean queries
const sensorData = await SensorData.find()
  .sort({ timestamp: -1 })
  .limit(100)
  .lean();  // Returns plain objects, not Mongoose documents

// 2. Project only needed fields
const sensorData = await SensorData.find()
  .select('timestamp temperature humidity -_id')
  .sort({ timestamp: -1 })
  .limit(100);

// 3. Use aggregation for complex queries
const stats = await SensorData.aggregate([
  { $match: { timestamp: { $gte: startDate } } },
  { $group: {
    _id: null,
    avgTemp: { $avg: '$temperature' },
    maxTemp: { $max: '$temperature' },
    minTemp: { $min: '$temperature' }
  }}
]);
```

---

## Debug Tools

### **System Health Check**
```bash
# Comprehensive system check
.\scripts\system-check.ps1

# Manual health check
curl http://localhost:5000/api/health
```

### **MQTT Debug Tools**
```bash
# 1. mosquitto_sub - Monitor messages
mosquitto_sub -h localhost -t "greenhouse/+/+" -v

# 2. mosquitto_pub - Send test messages
mosquitto_pub -h localhost -t "greenhouse/sensors/temperature" -m "25.5"

# 3. MQTT Explorer (GUI)
# Download from: http://mqtt-explorer.com/
```

### **Database Debug Tools**
```bash
# 1. MongoDB Compass (GUI)
# Download from: https://www.mongodb.com/products/compass

# 2. Command line
docker exec -it mongodb mongo
use greenhouse
db.sensordatas.find().sort({timestamp: -1}).limit(5)

# 3. Database stats
db.stats()
db.sensordatas.getIndexes()
```

### **API Debug Tools**
```bash
# 1. Thunder Client (VS Code extension)
# 2. Postman
# 3. curl commands

# Test authentication
curl -X POST http://localhost:5000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"admin"}'

# Test sensor data
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/sensors/latest
```

### **Log Analysis**
```bash
# 1. Backend logs
docker-compose logs -f backend | grep -i error

# 2. MQTT logs
docker-compose logs -f mosquitto

# 3. Database logs
docker-compose logs -f mongodb

# 4. System logs (Windows)
Get-EventLog -LogName Application -Source "Docker Desktop" -Newest 10
```

---

## 📞 Getting Help

### **Priority Order:**
1. ✅ Check this troubleshooting guide
2. 🔍 Run `.\scripts\system-check.ps1`
3. 📋 Check logs: `docker-compose logs -f`
4. 📚 Review [API Documentation](./api-documentation.md)
5. 🏗️ Check [Architecture](./architecture.md)
6. 🆘 Create GitHub issue với logs và error details

### **When Creating Issues:**
- Include system specs (OS, Docker version)
- Attach relevant logs
- Describe steps to reproduce
- Include environment configuration (without sensitive data)

---

**Nhớ rằng hầu hết issues đều có thể resolve bằng cách restart services và kiểm tra configuration! 🔧**
