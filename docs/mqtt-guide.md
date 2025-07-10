# 📡 MQTT Configuration Guide

## Tổng quan MQTT trong Smart Greenhouse

MQTT (Message Queuing Telemetry Transport) là giao thức giao tiếp chính giữa các thành phần IoT trong hệ thống. Đây là guide chi tiết về cấu hình và sử dụng MQTT.

---

## 🏗️ MQTT Architecture

```
ESP32 Devices ◄──── MQTT Broker (Mosquitto) ────► Backend Services
      │                       │                          │
   Publish                Subscribe                  Process &
  Sensor Data             All Topics                Store Data
      │                       │                          │
   Subscribe               Publish                 Publish
 Control Topics           Control Commands        Status Updates
```

---

## 📋 Topic Structure

### **Naming Convention**
```
greenhouse/{component}/{sensor|device}/{action}
```

### **Complete Topic Map**

#### **🔍 Sensor Topics (ESP32 → Backend)**
| Topic | Data Type | Unit | Description | Frequency |
|-------|-----------|------|-------------|-----------|
| `greenhouse/sensors/temperature` | Number | °C | Nhiệt độ môi trường | 30s |
| `greenhouse/sensors/humidity` | Number | % | Độ ẩm không khí | 30s |
| `greenhouse/sensors/soil` | Number | % | Độ ẩm đất | 60s |
| `greenhouse/sensors/water` | Number | % | Mức nước trong bình | 120s |
| `greenhouse/sensors/height` | Number | cm | Chiều cao cây | 300s |
| `greenhouse/sensors/rain` | Boolean | 0/1 | Cảm biến mưa | Event |
| `greenhouse/sensors/light` | Number | lux | Cường độ ánh sáng | 60s |
| `greenhouse/sensors/motion` | Boolean | 0/1 | Phát hiện chuyển động | Event |

#### **🎛️ Device Control Topics (Backend → ESP32)**
| Topic | Command | Description | Response Topic |
|-------|---------|-------------|----------------|
| `greenhouse/devices/light/control` | `on`/`off` | Điều khiển đèn LED | `greenhouse/devices/light/status` |
| `greenhouse/devices/pump/control` | `on`/`off`/`auto` | Điều khiển bơm nước | `greenhouse/devices/pump/status` |
| `greenhouse/devices/door/control` | `open`/`close` | Điều khiển cửa chính | `greenhouse/devices/door/status` |
| `greenhouse/devices/window/control` | `open`/`close` | Điều khiển cửa sổ | `greenhouse/devices/window/status` |

#### **📊 System Topics**
| Topic | Description | Publisher |
|-------|-------------|-----------|
| `greenhouse/backend/status` | Backend online/offline | Backend |
| `greenhouse/esp32/status` | ESP32 connection status | ESP32 |
| `greenhouse/system/health` | System health check | Backend |

---

## ⚙️ MQTT Broker Configuration

### **Mosquitto Setup (Docker)**
```yaml
# docker-compose.yml
services:
  mosquitto:
    image: eclipse-mosquitto:2.0
    container_name: mosquitto
    ports:
      - "1883:1883"      # MQTT
      - "9001:9001"      # WebSocket
    volumes:
      - ./config/mosquitto.conf:/mosquitto/config/mosquitto.conf
      - mosquitto_data:/mosquitto/data
      - mosquitto_logs:/mosquitto/log
    restart: unless-stopped
```

### **Mosquitto Configuration File**
```conf
# mosquitto.conf
listener 1883
allow_anonymous true
persistence true
persistence_location /mosquitto/data/
log_dest file /mosquitto/log/mosquitto.log
log_type error
log_type warning
log_type notice
log_type information

# WebSocket support
listener 9001
protocol websockets
```

### **Production Security**
```conf
# mosquitto-secure.conf
listener 1883
allow_anonymous false
password_file /mosquitto/config/passwd
acl_file /mosquitto/config/acl.conf

# SSL/TLS
listener 8883
certfile /mosquitto/certs/server.crt
keyfile /mosquitto/certs/server.key
cafile /mosquitto/certs/ca.crt
```

---

## 🔧 Backend MQTT Integration

### **Connection Setup**
```typescript
// backend/src/services/MQTTService.ts
export class MQTTService {
    constructor() {
        this.client = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883', {
            clientId: process.env.MQTT_CLIENT_ID || 'greenhouse_backend',
            username: process.env.MQTT_USERNAME,
            password: process.env.MQTT_PASSWORD,
            keepalive: 60,
            reconnectPeriod: 1000,
            connectTimeout: 30 * 1000,
            will: {
                topic: 'greenhouse/backend/status',
                payload: 'offline',
                qos: 1,
                retain: true
            }
        });
    }
}
```

### **Message Processing Pipeline**
```typescript
// 1. Message Reception (Line 107)
private handleMessage(topic: string, message: Buffer): void {
    const receivedTimestamp = new Date();
    
    try {
        const data = JSON.parse(message.toString());
        
        // Route to appropriate handler
        if (topic.includes('/sensors/')) {
            this.processSensorData(topic, data.value || data, receivedTimestamp);
        }
        
        if (topic.includes('/devices/') && topic.includes('/status')) {
            this.handleDeviceStatus(topic, data);
        }
    } catch (error) {
        // Handle non-JSON numeric values
        const value = parseFloat(message.toString());
        if (!isNaN(value) && topic.includes('/sensors/')) {
            this.processSensorData(topic, value, receivedTimestamp);
        }
    }
}

// 2. Sensor Data Processing (Line 165)
public async processSensorData(topic: string, value: number, timestamp?: Date): Promise<void> {
    const sensorType = this.getSensorTypeFromTopic(topic);
    
    if (sensorType) {
        // Buffer data for batch processing
        this.sensorDataBuffer.set(sensorType, value);
        
        // Save individual reading immediately
        await this.saveIndividualSensorData(sensorType, value);
        
        // Handle special events
        if (sensorType === 'motionDetected' && value === 1) {
            await this.alertService.handleMotionDetected();
        }
        
        // Check for complete data set
        const requiredSensors = ['temperature', 'humidity', 'soilMoisture', 'waterLevel'];
        const hasAllData = requiredSensors.every(sensor => 
            this.sensorDataBuffer.has(sensor)
        );
        
        if (hasAllData) {
            // Trigger threshold checking and alerts
            await this.alertService.checkSensorThresholds(this.getBufferedData());
            await this.saveSensorData(this.getBufferedData());
        }
    }
}

// 3. Device Control (Line 127)
public publishDeviceControl(deviceType: string, command: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const topic = this.getDeviceControlTopic(deviceType);
        
        this.client.publish(topic, command, { qos: 1 }, (error) => {
            if (error) {
                reject(error);
            } else {
                console.log(`📤 Device control sent: ${topic} = ${command}`);
                resolve();
            }
        });
    });
}
```

---

## 📱 ESP32 MQTT Implementation

### **Connection Setup**
```cpp
// ESP32 MQTT Configuration
#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "your-wifi-ssid";
const char* password = "your-wifi-password";
const char* mqtt_broker = "192.168.1.100";  // Your broker IP
const int mqtt_port = 1883;
const char* mqtt_username = "greenhouse_esp32";
const char* mqtt_password = "your-password";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
    // WiFi connection
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    
    // MQTT setup
    client.setServer(mqtt_broker, mqtt_port);
    client.setCallback(onMqttMessage);
    
    // Connect to MQTT
    connectToMQTT();
}

void connectToMQTT() {
    while (!client.connected()) {
        String client_id = "esp32-client-" + String(WiFi.macAddress());
        
        if (client.connect(client_id.c_str(), mqtt_username, mqtt_password)) {
            Serial.println("✅ MQTT Connected");
            
            // Subscribe to control topics
            client.subscribe("greenhouse/devices/light/control");
            client.subscribe("greenhouse/devices/pump/control");
            client.subscribe("greenhouse/devices/door/control");
            client.subscribe("greenhouse/devices/window/control");
            
            // Publish online status
            client.publish("greenhouse/esp32/status", "online", true);
        } else {
            Serial.print("❌ MQTT Connection failed: ");
            Serial.println(client.state());
            delay(2000);
        }
    }
}
```

### **Sensor Data Publishing**
```cpp
void publishSensorData() {
    // Read sensors
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();
    int soilMoisture = analogRead(SOIL_PIN);
    int waterLevel = getWaterLevel();
    
    // Publish to MQTT (QoS 1 for reliability)
    if (!isnan(temperature)) {
        client.publish("greenhouse/sensors/temperature", String(temperature).c_str(), true);
    }
    
    if (!isnan(humidity)) {
        client.publish("greenhouse/sensors/humidity", String(humidity).c_str(), true);
    }
    
    client.publish("greenhouse/sensors/soil", String(soilMoisture).c_str(), true);
    client.publish("greenhouse/sensors/water", String(waterLevel).c_str(), true);
    
    // Optional sensors
    if (hasMotionSensor) {
        int motion = digitalRead(PIR_PIN);
        client.publish("greenhouse/sensors/motion", String(motion).c_str(), true);
    }
    
    if (hasRainSensor) {
        int rain = digitalRead(RAIN_PIN);
        client.publish("greenhouse/sensors/rain", String(rain).c_str(), true);
    }
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
    String command = "";
    for (int i = 0; i < length; i++) {
        command += (char)payload[i];
    }
    
    String topicStr = String(topic);
    
    // Handle device control commands
    if (topicStr == "greenhouse/devices/light/control") {
        controlLight(command);
        client.publish("greenhouse/devices/light/status", command.c_str(), true);
    }
    else if (topicStr == "greenhouse/devices/pump/control") {
        controlPump(command);
        client.publish("greenhouse/devices/pump/status", command.c_str(), true);
    }
    else if (topicStr == "greenhouse/devices/door/control") {
        controlDoor(command);
        client.publish("greenhouse/devices/door/status", command.c_str(), true);
    }
    else if (topicStr == "greenhouse/devices/window/control") {
        controlWindow(command);
        client.publish("greenhouse/devices/window/status", command.c_str(), true);
    }
}
```

---

## 🔍 Testing & Debugging

### **MQTT Testing Tools**

#### **1. Command Line Tools**
```bash
# Subscribe to all greenhouse topics
mosquitto_sub -h localhost -t "greenhouse/+/+"

# Subscribe to sensor data only
mosquitto_sub -h localhost -t "greenhouse/sensors/+"

# Publish test data
mosquitto_pub -h localhost -t "greenhouse/sensors/temperature" -m "25.5"

# Test device control
mosquitto_pub -h localhost -t "greenhouse/devices/light/control" -m "on"
```

#### **2. MQTT Explorer (GUI Tool)**
- Download: http://mqtt-explorer.com/
- Connect to: `mqtt://localhost:1883`
- Real-time topic monitoring
- Message publishing interface

#### **3. Backend Testing**
```bash
# Test MQTT service status
curl http://localhost:5000/api/health

# Check MQTT connection
curl http://localhost:5000/api/system/status

# Test device control via API
curl -X POST http://localhost:5000/api/devices/light/control \
  -H "Content-Type: application/json" \
  -d '{"command": "on"}'
```

### **Common Issues & Solutions**

#### **1. Connection Refused**
```bash
# Check if Mosquitto is running
docker ps | grep mosquitto

# Restart MQTT broker
docker-compose restart mosquitto

# Check logs
docker logs mosquitto
```

#### **2. Authentication Failed**
```bash
# Verify credentials in .env
MQTT_USERNAME=your_username
MQTT_PASSWORD=your_password

# Test with mosquitto tools
mosquitto_pub -h localhost -u your_username -P your_password -t "test" -m "hello"
```

#### **3. Message Not Received**
```bash
# Check topic subscription
mosquitto_sub -h localhost -t "greenhouse/sensors/temperature" -v

# Verify QoS settings
mosquitto_pub -h localhost -t "test" -m "hello" -q 1

# Check retained messages
mosquitto_sub -h localhost -t "greenhouse/+/+" -R
```

---

## 🚀 Performance Optimization

### **Message Frequency**
```javascript
// Recommended publishing intervals
const SENSOR_INTERVALS = {
    temperature: 30000,    // 30 seconds
    humidity: 30000,       // 30 seconds
    soil: 60000,          // 1 minute
    water: 120000,        // 2 minutes
    height: 300000,       // 5 minutes
    motion: 'event',      // Immediate
    rain: 'event'         // Immediate
};
```

### **QoS Strategy**
- **QoS 0**: Status updates, non-critical data
- **QoS 1**: Sensor data, device control (recommended)
- **QoS 2**: Critical alerts, system commands

### **Retained Messages**
```cpp
// Use retained for latest status
client.publish("greenhouse/esp32/status", "online", true);      // Retained
client.publish("greenhouse/devices/light/status", "on", true);  // Retained
client.publish("greenhouse/sensors/temperature", "25.5", false); // Not retained
```

---

## 📊 Monitoring & Logging

### **MQTT Metrics**
- Message throughput: ~50 messages/minute
- Average latency: < 100ms
- Connection uptime: > 99.5%
- Queue depth: Monitor for backlog

### **Backend Logging**
```typescript
// Enhanced MQTT logging
this.client.on('connect', () => {
    console.log('✅ MQTT Client connected successfully');
    this.logConnectionEvent('connected');
});

this.client.on('message', (topic, message) => {
    console.log(`📡 Received: ${topic} = ${message.toString()}`);
    this.logMessageReceived(topic, message.length);
});

this.client.on('error', (error) => {
    console.error('❌ MQTT Client error:', error);
    this.logConnectionEvent('error', error.message);
});
```

---

**MQTT là backbone của hệ thống IoT. Configuration đúng cách đảm bảo giao tiếp real-time, đáng tin cậy giữa tất cả components.**
