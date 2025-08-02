// Real IoT Smart Greenhouse MQTT Topics and API Data
// Generated from embedded.ino and backend API analysis

export const sensorTopics = [
  {
    "name": "Temperature Sensor",
    "topic": "greenhouse/sensors/temperature",
    "description": "DHT11 temperature readings in Celsius",
    "dataType": "Float",
    "unit": "\u00b0C",
    "examples": [
      {
        "value": 25.5,
        "description": "Normal room temperature"
      },
      {
        "value": 32.8,
        "description": "Hot greenhouse condition"
      },
      {
        "value": 18.2,
        "description": "Cool morning temperature"
      }
    ]
  },
  {
    "name": "Humidity Sensor",
    "topic": "greenhouse/sensors/humidity",
    "description": "DHT11 humidity readings as percentage",
    "dataType": "Float",
    "unit": "%",
    "examples": [
      {
        "value": 65.0,
        "description": "Optimal humidity level"
      },
      {
        "value": 80.5,
        "description": "High humidity condition"
      },
      {
        "value": 45.2,
        "description": "Low humidity condition"
      }
    ]
  },
  {
    "name": "Soil Moisture Sensor",
    "topic": "greenhouse/sensors/soil",
    "description": "Soil moisture level reading",
    "dataType": "Integer",
    "unit": "level",
    "examples": [
      {
        "value": 1,
        "description": "Wet soil detected"
      },
      {
        "value": 0,
        "description": "Dry soil detected"
      }
    ]
  },
  {
    "name": "Light Level Sensor",
    "topic": "greenhouse/sensors/light",
    "description": "Photoresistor light level reading",
    "dataType": "Integer",
    "unit": "ADC",
    "examples": [
      {
        "value": 3500,
        "description": "Bright daylight"
      },
      {
        "value": 1200,
        "description": "Indoor lighting"
      },
      {
        "value": 200,
        "description": "Low light/night"
      }
    ]
  },
  {
    "name": "Water Level Sensor",
    "topic": "greenhouse/sensors/water",
    "description": "Float switch water level detection",
    "dataType": "Integer",
    "unit": "level",
    "examples": [
      {
        "value": 1,
        "description": "Water level sufficient"
      },
      {
        "value": 0,
        "description": "Water level low"
      }
    ]
  },
  {
    "name": "Rain Sensor",
    "topic": "greenhouse/sensors/rain",
    "description": "Rain detection sensor reading",
    "dataType": "Integer",
    "unit": "status",
    "examples": [
      {
        "value": 1,
        "description": "Rain detected"
      },
      {
        "value": 0,
        "description": "No rain detected"
      }
    ]
  },
  {
    "name": "Height Sensor",
    "topic": "greenhouse/sensors/height",
    "description": "Ultrasonic distance measurement",
    "dataType": "Float",
    "unit": "cm",
    "examples": [
      {
        "value": 15.5,
        "description": "Object distance"
      },
      {
        "value": 50.0,
        "description": "Clear path"
      },
      {
        "value": 5.2,
        "description": "Close object detected"
      }
    ]
  }
];

export const controlTopics = [
  {
    "name": "Light Control",
    "topic": "greenhouse/devices/light/control",
    "description": "LED light on/off control",
    "examples": [
      {
        "command": "on",
        "description": "Turn light on"
      },
      {
        "command": "off",
        "description": "Turn light off"
      }
    ]
  },
  {
    "name": "Window Control",
    "topic": "greenhouse/devices/window/control",
    "description": "Servo motor window open/close control",
    "examples": [
      {
        "command": "open",
        "description": "Open window using servo"
      },
      {
        "command": "close",
        "description": "Close window using servo"
      }
    ]
  },
  {
    "name": "Door Control",
    "topic": "greenhouse/devices/door/control",
    "description": "Door open/close control",
    "examples": [
      {
        "command": "open",
        "description": "Open door"
      },
      {
        "command": "close",
        "description": "Close door"
      }
    ]
  },
  {
    "name": "Water Pump Control",
    "topic": "greenhouse/devices/pump/control",
    "description": "Water pump on/off control",
    "examples": [
      {
        "command": "on",
        "description": "Start water pump"
      },
      {
        "command": "off",
        "description": "Stop water pump"
      }
    ]
  },
  {
    "name": "Microphone Control",
    "topic": "greenhouse/devices/microphone/control",
    "description": "Voice recording microphone control",
    "examples": [
      {
        "command": "on",
        "description": "Enable voice recording"
      },
      {
        "command": "off",
        "description": "Disable voice recording"
      }
    ]
  },
  {
    "name": "Voice Command",
    "topic": "greenhouse/command",
    "description": "Voice command processing from ESP32",
    "examples": [
      {
        "command": "turn on light",
        "description": "Voice command to control light"
      },
      {
        "command": "open window",
        "description": "Voice command to control window"
      },
      {
        "command": "start pump",
        "description": "Voice command to control pump"
      }
    ]
  },
  {
    "name": "System Mode",
    "topic": "greenhouse/system/mode",
    "description": "System operation mode control",
    "examples": [
      {
        "command": "auto",
        "description": "Enable automatic mode"
      },
      {
        "command": "manual",
        "description": "Enable manual mode"
      }
    ]
  }
];

export const apiEndpoints = [
  {
    "title": "Sensor Data",
    "endpoints": [
      {
        "method": "GET",
        "path": "/api/sensors",
        "description": "Get latest sensor readings",
        "example": {
          "success": true,
          "data": {
            "temperature": 25.5,
            "humidity": 65.0,
            "soilMoisture": 1,
            "waterLevel": 1,
            "lightLevel": 3500,
            "rainStatus": 0
          }
        }
      },
      {
        "method": "GET",
        "path": "/api/history/sensors",
        "description": "Get sensor data history with pagination",
        "example": {
          "success": true,
          "data": {
            "sensors": [],
            "pagination": {
              "page": 1,
              "limit": 20,
              "total": 150,
              "totalPages": 8
            }
          }
        }
      }
    ]
  },
  {
    "title": "Device Control",
    "endpoints": [
      {
        "method": "GET",
        "path": "/api/devices",
        "description": "Get current device states",
        "example": {
          "success": true,
          "data": {
            "light": {
              "status": "on",
              "lastUpdated": "2025-01-01T10:00:00Z"
            },
            "pump": {
              "status": "off",
              "lastUpdated": "2025-01-01T09:30:00Z"
            },
            "window": {
              "status": "open",
              "lastUpdated": "2025-01-01T08:00:00Z"
            }
          }
        }
      },
      {
        "method": "POST",
        "path": "/api/devices/{deviceType}/control",
        "description": "Control device (light, pump, window, door)",
        "example": {
          "request": {
            "action": "on"
          },
          "response": {
            "success": true,
            "message": "Device controlled successfully"
          }
        }
      }
    ]
  },
  {
    "title": "Voice Commands",
    "endpoints": [
      {
        "method": "GET",
        "path": "/api/voice-commands",
        "description": "Get voice command history",
        "example": {
          "success": true,
          "data": {
            "voiceCommands": [],
            "pagination": {
              "page": 1,
              "total": 50
            }
          }
        }
      },
      {
        "method": "POST",
        "path": "/api/voice-commands/process",
        "description": "Process voice command text",
        "example": {
          "request": {
            "command": "turn on light",
            "confidence": 0.95
          },
          "response": {
            "success": true,
            "processed": true
          }
        }
      }
    ]
  },
  {
    "title": "Automation",
    "endpoints": [
      {
        "method": "GET",
        "path": "/api/automation/settings",
        "description": "Get automation configuration",
        "example": {
          "success": true,
          "data": {
            "autoMode": true,
            "thresholds": {
              "temperature": {
                "min": 20,
                "max": 30
              },
              "humidity": {
                "min": 40,
                "max": 80
              }
            }
          }
        }
      },
      {
        "method": "PUT",
        "path": "/api/automation/settings",
        "description": "Update automation settings",
        "example": {
          "request": {
            "autoMode": true,
            "tempThreshold": 25
          },
          "response": {
            "success": true,
            "message": "Settings updated"
          }
        }
      }
    ]
  }
];

export const websocketEvents = [
  {
    "title": "Real-time Sensor Data",
    "events": [
      {
        "event": "sensor_data",
        "description": "Real-time sensor readings broadcast",
        "example": {
          "type": "sensor_data",
          "data": {
            "temperature": 25.5,
            "humidity": 65.0,
            "timestamp": "2025-01-01T10:00:00Z"
          }
        }
      },
      {
        "event": "device_status",
        "description": "Device state changes broadcast",
        "example": {
          "type": "device_status",
          "data": {
            "deviceType": "light",
            "status": "on",
            "timestamp": "2025-01-01T10:00:00Z"
          }
        }
      }
    ]
  },
  {
    "title": "Voice Commands",
    "events": [
      {
        "event": "voice_command",
        "description": "Voice command processing events",
        "example": {
          "type": "voice_command",
          "data": {
            "command": "turn on light",
            "confidence": 0.95,
            "processed": true,
            "timestamp": "2025-01-01T10:00:00Z"
          }
        }
      }
    ]
  },
  {
    "title": "System Alerts",
    "events": [
      {
        "event": "alert",
        "description": "System alerts and notifications",
        "example": {
          "type": "alert",
          "data": {
            "level": "warning",
            "message": "Temperature threshold exceeded",
            "value": 35.5,
            "timestamp": "2025-01-01T10:00:00Z"
          }
        }
      }
    ]
  }
];
