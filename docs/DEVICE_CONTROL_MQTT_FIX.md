# Device Control MQTT Communication Fix

## Vấn đề phát hiện

UI không điều khiển được thiết bị bằng MQTT do **Backend API gửi JSON payload** thay vì **simple string values** mà ESP32 embedded device mong đợi.

## Nguyên nhân

### Trước khi sửa:
```typescript
// ❌ SAI: Backend gửi JSON object
const command = {
    action: "on",
    timestamp: "2025-01-24T...",
    duration: 30
};
await mqttService.publishDeviceControl(deviceType, JSON.stringify(command));
```

**MQTT Message gửi:** `{"action":"on","timestamp":"2025-01-24T...","duration":30}`

### ESP32 mong đợi:
```arduino
// ESP32 chỉ hiểu simple string values
void mqttCallback(char* topic, byte* payload, unsigned int length) {
    if (strcmp(topic, lights_topic) == 0) {
        controlLights(message); // message should be "HIGH" or "LOW"
    }
}

void controlLights(char* value) {
    if (strcmp(value, "LOW") == 0) {
        digitalWrite(Led, LOW);
    } else {
        digitalWrite(Led, HIGH);
    }
}
```

**ESP32 cần:** `"HIGH"` hoặc `"LOW"` (simple string)

## Giải pháp đã thực hiện

### 1. Sửa API Route `/api/devices/control`

**File:** `backend/src/routes/devices.ts`

```typescript
// ✅ ĐÚNG: Gửi simple string values
try {
    // Convert action to MQTT format that ESP32 understands
    let mqttCommand = 'LOW'; // Default to OFF/LOW
    if (action === 'on' || action === 'open') {
        mqttCommand = 'HIGH';
    }

    // Send simple MQTT command (not JSON - ESP32 expects simple strings)
    await mqttService.publishDeviceControl(deviceType, mqttCommand);
}
```

### 2. Sửa Scheduled Commands

**File:** `backend/src/routes/devices.ts` (schedule endpoint)

```typescript
// ✅ ĐÚNG: Scheduled commands cũng gửi simple strings
setTimeout(async () => {
    try {
        // Convert action to MQTT format that ESP32 understands
        let mqttCommand = 'LOW'; // Default to OFF/LOW
        if (action === 'on' || action === 'open') {
            mqttCommand = 'HIGH';
        }

        // Send simple MQTT command (not JSON - ESP32 expects simple strings)
        await mqttService.publishDeviceControl(deviceType, mqttCommand);
    }
}, delay * 1000);
```

### 3. WebSocket Handler đã đúng

**File:** `backend/src/services/WebSocketService.ts`

```typescript
// ✅ ĐÃ ĐÚNG: WebSocket handler đã gửi đúng format
let mqttAction = data.action;
if (data.action === 'on' || data.action === 'true') {
    mqttAction = 'HIGH';
} else if (data.action === 'off' || data.action === 'false') {
    mqttAction = 'LOW';
}

mqttService.publishDeviceControl(data.device, mqttAction);
```

## Kiểm tra hoạt động

### MQTT Topics & Messages
```bash
# Đèn bật
Topic: greenhouse/devices/light/control
Message: "HIGH"

# Đèn tắt  
Topic: greenhouse/devices/light/control
Message: "LOW"

# Máy bơm bật
Topic: greenhouse/devices/pump/control
Message: "HIGH"

# Máy bơm tắt
Topic: greenhouse/devices/pump/control
Message: "LOW"

# Cửa mở
Topic: greenhouse/devices/door/control
Message: "HIGH"

# Cửa đóng
Topic: greenhouse/devices/door/control
Message: "LOW"

# Cửa sổ mở
Topic: greenhouse/devices/window/control
Message: "HIGH"

# Cửa sổ đóng
Topic: greenhouse/devices/window/control
Message: "LOW"
```

### Test Commands
```bash
# Test bằng mosquitto_pub
mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/devices/light/control -m "HIGH"
mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/devices/pump/control -m "LOW"
```

## Luồng điều khiển thiết bị

```
Frontend Dashboard
    ↓ (sendDeviceControl)
WebSocket Connection
    ↓ (device:control event)
WebSocketService.handleDeviceControl()
    ↓ (convert to HIGH/LOW)
MQTTService.publishDeviceControl()
    ↓ (MQTT publish)
MQTT Broker (mqtt.noboroto.id.vn)
    ↓ (MQTT subscribe)
ESP32 Embedded Device
    ↓ (mqttCallback)
Device Control Functions
    ↓ (digitalWrite/servo)
Physical Device Action
```

## Kết quả

- ✅ **API Route** sửa: Gửi "HIGH"/"LOW" thay vì JSON
- ✅ **Scheduled Commands** sửa: Tương tự như API route  
- ✅ **WebSocket Handler** đã đúng: Không cần sửa
- ✅ **MQTT Format** chính xác: ESP32 hiểu được
- ✅ **Build** thành công: Không có lỗi TypeScript

## Test

Chạy script test để kiểm tra:
```bash
python test_device_control.py
```

Hoặc test thủ công qua dashboard UI hoặc Postman với:
```json
POST /api/devices/control
{
    "deviceType": "light",
    "action": "on"
}
```

ESP32 sẽ nhận được message `"HIGH"` trên topic `greenhouse/devices/light/control`.
