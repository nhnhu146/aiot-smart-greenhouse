# MQTT Device Control Migration: HIGH/LOW → 1/0 

## Overview
Successfully migrated MQTT device control messages from using "HIGH"/"LOW" strings to numeric "1"/"0" values for better compatibility and consistency with sensor data format.

## Changes Made

### 1. ESP32 Embedded Code Updates
**File: `embeded/aiot-greenhouse-embedded.ino`**
- Updated `controlLights()` function to accept "1"/"0" (with backward compatibility)
- Updated `controlWindow()` function to accept "1"/"0" (with backward compatibility)  
- Updated `controlDoor()` function to accept "1"/"0" (with backward compatibility)
- Updated `controlPump()` function to accept "1"/"0" (with backward compatibility)
- Updated `controlmicrophone()` function to accept "1"/"0" (with backward compatibility)

**Logic:**
- "1" = ON/OPEN (equivalent to previous "HIGH")
- "0" = OFF/CLOSE (equivalent to previous "LOW")
- Maintains backward compatibility with "HIGH"/"LOW" for gradual migration

### 2. Frontend MQTT Examples Updates
**File: `frontend/src/app/(default)/mqtt-examples/page.tsx`**
- Changed control topics dataType from "String" to "Number"
- Updated examples to show numeric values (1/0) instead of strings ("HIGH"/"LOW")
- Updated test commands to use "1"/"0" in mosquitto_pub examples
- Updated descriptions to reflect new format
- Added CSS module for proper styling

**File: `frontend/src/app/(default)/api-examples/api-examples.module.scss`**
- Created CSS module for API examples page styling

### 3. Backend Service Updates
**File: `backend/src/services/WebSocketService.ts`**
- Updated MQTT action conversion: 'on'/'true' → '1', 'off'/'false' → '0'
- Updated device history mapping to support both new (1/0) and legacy (HIGH/LOW) formats
- Maintained backward compatibility in status tracking

**File: `backend/src/routes/devices.ts`**
- Updated immediate device control to send "1"/"0" instead of "HIGH"/"LOW"
- Updated scheduled device control to send "1"/"0" instead of "HIGH"/"LOW"
- Kept action validation and database storage logic unchanged

### 4. Sidebar Navigation Update
**File: `frontend/src/components/Sidebar/Sidebar.tsx`**
- Updated navigation label from "MQTT Examples" to "API Examples"
- Combined MQTT and HTTP API examples under single menu item

## Compatibility Notes

### ESP32 Compatibility
✅ **NEW FORMAT (Recommended):**
```bash
# Turn device ON/OPEN
mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/devices/light/control -m "1"

# Turn device OFF/CLOSE  
mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/devices/light/control -m "0"
```

🔄 **LEGACY FORMAT (Still Supported):**
```bash
# Still works for backward compatibility
mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/devices/light/control -m "HIGH"
mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/devices/light/control -m "LOW"
```

### Data Consistency
- **Sensor Data**: Continues to send raw numeric values (temperature: 25.5, binary sensors: 0/1)
- **Device Control**: Now uses numeric strings "1"/"0" instead of "HIGH"/"LOW"
- **Database Storage**: Device actions still stored as semantic names (on/off, open/close)

## Benefits
1. **Consistency**: Device control now matches sensor data format (numeric values)
2. **Simplicity**: Easier to parse and validate numeric values
3. **IoT Standard**: Numeric 1/0 is more standard in IoT communications
4. **Future-Proof**: Easier to extend with PWM values (0-255, 0-100%, etc.)
5. **Backward Compatible**: Old "HIGH"/"LOW" commands still work during transition

## Testing Verified
✅ Backend builds successfully with TypeScript  
✅ Frontend builds successfully with Next.js  
✅ Docker Compose starts all services correctly  
✅ MQTT Examples page displays new format  
✅ ESP32 code handles both new and legacy formats  

## Migration Status
- **Complete**: All core functionality migrated to 1/0 format
- **Backward Compatible**: Legacy HIGH/LOW still supported
- **Production Ready**: Tested and verified working
- **Documentation Updated**: Examples and comments reflect new format

Date: January 25, 2025
