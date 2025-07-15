# IoT Device Integration Guide

## Hardware Setup

### ESP32 Configuration
The system uses ESP32 microcontroller for sensor data collection and device control.

#### Required Components
- **ESP32 Development Board**
- **Sensors**:
  - DHT22 (Temperature & Humidity)
  - Soil Moisture Sensor
  - Water Level Sensor
  - Light Sensor (LDR)
  - Rain Sensor
  - Ultrasonic Sensor (Plant Height)
- **Actuators**:
  - Relay modules for device control
  - LED lights
  - Water pump
  - Servo motors (door/window control)

#### Pin Configuration
```cpp
// Sensor Pins
#define DHT_PIN 4
#define SOIL_MOISTURE_PIN A0
#define WATER_LEVEL_PIN A1
#define LIGHT_SENSOR_PIN A2
#define RAIN_SENSOR_PIN 5
#define ULTRASONIC_TRIG_PIN 2
#define ULTRASONIC_ECHO_PIN 3

// Actuator Pins
#define LIGHT_RELAY_PIN 12
#define PUMP_RELAY_PIN 13
#define FAN_RELAY_PIN 14
#define DOOR_SERVO_PIN 15
```

## MQTT Communication

### Topic Structure
```
greenhouse/
├── sensors/
│   ├── temperature
│   ├── humidity
│   ├── soil_moisture
│   ├── water_level
│   ├── light_level
│   ├── rain_status
│   └── plant_height
├── devices/
│   ├── light/control
│   ├── pump/control
│   ├── fan/control
│   └── door/control
└── status/
    ├── connection
    └── heartbeat
```

### Message Formats

#### Sensor Data
```json
{
  "timestamp": "2025-07-15T00:00:00.000Z",
  "temperature": 25.5,
  "humidity": 60.2,
  "soilMoisture": 45.8,
  "waterLevel": 75.0,
  "lightLevel": 300,
  "rainStatus": false,
  "plantHeight": 15.2
}
```

#### Device Control
```json
{
  "deviceId": "greenhouse_light",
  "action": "turn_on",
  "timestamp": "2025-07-15T00:00:00.000Z"
}
```

### MQTT Broker Configuration
```env
MQTT_BROKER_URL=mqtt://mqtt.noboroto.id.vn:1883
MQTT_USERNAME=vision
MQTT_PASSWORD=vision
MQTT_CLIENT_ID=greenhouse_backend
```

## ESP32 Code Structure

### Main Features
1. **WiFi Connection**: Connects to local network
2. **MQTT Client**: Publishes sensor data and subscribes to control commands
3. **Sensor Reading**: Reads all sensors every 30 seconds
4. **Device Control**: Controls actuators based on MQTT commands
5. **Auto Control**: Implements basic automation logic

### Key Code Snippets

#### WiFi Setup
```cpp
void setupWiFi() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("WiFi connected");
}
```

#### MQTT Connection
```cpp
void reconnectMQTT() {
  while (!client.connected()) {
    if (client.connect("ESP32Client", mqtt_user, mqtt_pass)) {
      Serial.println("MQTT connected");
      // Subscribe to control topics
      client.subscribe("greenhouse/devices/+/control");
    } else {
      delay(5000);
    }
  }
}
```

#### Sensor Reading
```cpp
void readSensors() {
  float temp = dht.readTemperature();
  float humidity = dht.readHumidity();
  int soilMoisture = analogRead(SOIL_MOISTURE_PIN);
  int waterLevel = analogRead(WATER_LEVEL_PIN);
  // ... read other sensors
  
  // Create JSON payload
  String payload = createSensorPayload(temp, humidity, soilMoisture, waterLevel);
  client.publish("greenhouse/sensors/data", payload.c_str());
}
```

## Backend Integration

### MQTT Service
The backend MQTT service handles:
- Subscribing to sensor data topics
- Publishing device control commands
- Storing sensor data in MongoDB
- Triggering alerts based on thresholds

### Device Control Flow
1. User clicks device control in frontend
2. Frontend sends API request to backend
3. Backend validates request and publishes MQTT command
4. ESP32 receives command and controls device
5. ESP32 publishes status update
6. Backend receives status and updates database
7. Frontend receives real-time update via WebSocket

### Auto Control Logic
```javascript
// Example: Auto water pump control
if (soilMoisture < SOIL_MOISTURE_MIN_THRESHOLD && waterLevel > WATER_LEVEL_MIN_THRESHOLD) {
  // Turn on pump
  mqttService.publish('greenhouse/devices/pump/control', {
    action: 'turn_on',
    duration: 30000 // 30 seconds
  });
}
```

## Calibration & Testing

### Sensor Calibration
1. **Soil Moisture**: Calibrate dry (air) and wet (water) values
2. **Water Level**: Set minimum and maximum tank levels
3. **Light Sensor**: Calibrate for day/night detection
4. **Temperature/Humidity**: Compare with reference sensor

### Testing Procedures
1. **Connectivity Test**: Verify WiFi and MQTT connections
2. **Sensor Test**: Check all sensor readings
3. **Actuator Test**: Test all device controls
4. **Integration Test**: End-to-end system test
5. **Auto Control Test**: Verify automation logic

### Debug Commands
```cpp
// Enable debug mode
#define DEBUG_MODE true

// Debug output
void debugSensors() {
  Serial.println("=== Sensor Debug ===");
  Serial.printf("Temperature: %.2f°C\n", temperature);
  Serial.printf("Humidity: %.2f%%\n", humidity);
  Serial.printf("Soil Moisture: %d\n", soilMoisture);
  // ... print all sensor values
}
```

## Troubleshooting

### Common Issues

**WiFi Connection Failed**
- Check SSID and password
- Verify network is 2.4GHz (ESP32 doesn't support 5GHz)
- Check signal strength

**MQTT Connection Failed**
- Verify broker URL and credentials
- Check firewall settings
- Test with MQTT client tools

**Sensor Reading Errors**
- Check wiring connections
- Verify power supply (3.3V/5V)
- Test sensors individually

**Device Control Not Working**
- Check relay wiring
- Verify power supply for actuators
- Test MQTT topic subscription

### Performance Optimization
- Use deep sleep mode when possible
- Batch sensor readings
- Implement watchdog timer
- Use OTA updates for remote firmware updates

## Maintenance

### Regular Checks
- Clean sensors monthly
- Check wiring connections
- Update firmware as needed
- Monitor battery levels (if battery powered)

### Sensor Replacement
- Keep spare sensors
- Document replacement procedures
- Update calibration after replacement
