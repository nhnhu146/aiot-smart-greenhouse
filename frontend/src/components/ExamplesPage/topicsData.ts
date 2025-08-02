// Real IoT Smart Greenhouse MQTT Topics and API Data
// Updated from embedded.ino and backend API verification (Aug 2025)

export const sensorTopics = [
	{
		"name": "Temperature Sensor",
		"topic": "greenhouse/sensors/temperature",
		"description": "DHT11 temperature readings in Celsius (GPIO 15)",
		"dataType": "Float",
		"unit": "°C",
		"examples": [
			{
				"value": 30.2,
				"description": "Current greenhouse temperature (verified data)"
			},
			{
				"value": 25.5,
				"description": "Normal room temperature"
			},
			{
				"value": 32.8,
				"description": "Hot greenhouse condition"
			}
		]
	},
	{
		"name": "Humidity Sensor",
		"topic": "greenhouse/sensors/humidity",
		"description": "DHT11 humidity readings as percentage (GPIO 15)",
		"dataType": "Float",
		"unit": "%",
		"examples": [
			{
				"value": 73.0,
				"description": "Current greenhouse humidity (verified data)"
			},
			{
				"value": 65.0,
				"description": "Optimal humidity level"
			},
			{
				"value": 80.5,
				"description": "High humidity condition"
			}
		]
	},
	{
		"name": "Soil Moisture Sensor",
		"topic": "greenhouse/sensors/soil",
		"description": "Soil moisture level reading (GPIO 36)",
		"dataType": "Integer",
		"unit": "level",
		"examples": [
			{
				"value": 0,
				"description": "Current soil moisture level (verified data)"
			},
			{
				"value": 1,
				"description": "Wet soil detected"
			}
		]
	},
	{
		"name": "Light Level Sensor",
		"topic": "greenhouse/sensors/light",
		"description": "Photoresistor light level reading (GPIO 35)",
		"dataType": "Integer",
		"unit": "ADC",
		"examples": [
			{
				"value": 0,
				"description": "Current light level (verified data)"
			},
			{
				"value": 3500,
				"description": "Bright daylight"
			},
			{
				"value": 1200,
				"description": "Indoor lighting"
			}
		]
	},
	{
		"name": "Water Level Sensor",
		"topic": "greenhouse/sensors/water",
		"description": "Float switch water level detection (GPIO 14)",
		"dataType": "Integer",
		"unit": "level",
		"examples": [
			{
				"value": 1,
				"description": "Current water level (verified data)"
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
		"description": "Rain detection sensor reading (GPIO 39)",
		"dataType": "Integer",
		"unit": "status",
		"examples": [
			{
				"value": 0,
				"description": "Current rain status (verified data)"
			},
			{
				"value": 1,
				"description": "Rain detected"
			}
		]
	},
	{
		"name": "Height Sensor",
		"topic": "greenhouse/sensors/height",
		"description": "Ultrasonic distance measurement (GPIO 33 echo, GPIO 25 trig)",
		"dataType": "Float",
		"unit": "cm",
		"examples": [
			{
				"value": 0,
				"description": "Current plant height (verified data)"
			},
			{
				"value": 15.5,
				"description": "Object distance"
			},
			{
				"value": 50.0,
				"description": "Clear path"
			}
		]
	}
];

export const controlTopics = [
	{
		"name": "Light Control",
		"topic": "greenhouse/devices/light/control",
		"description": "LED light on/off control (GPIO 32)",
		"examples": [
			{
				"command": "1",
				"description": "Turn light on (current verified command format)"
			},
			{
				"command": "0",
				"description": "Turn light off (current verified command format)"
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
		"description": "Servo motor window open/close control (GPIO 26)",
		"examples": [
			{
				"command": "1",
				"description": "Open window using servo (verified format)"
			},
			{
				"command": "0",
				"description": "Close window using servo (verified format)"
			}
		]
	},
	{
		"name": "Door Control",
		"topic": "greenhouse/devices/door/control",
		"description": "Door open/close control (GPIO 27)",
		"examples": [
			{
				"command": "1",
				"description": "Open door (verified format)"
			},
			{
				"command": "0",
				"description": "Close door (verified format)"
			}
		]
	},
	{
		"name": "Water Pump Control",
		"topic": "greenhouse/devices/pump/control",
		"description": "Water pump on/off control (GPIO 4)",
		"examples": [
			{
				"command": "1",
				"description": "Start water pump (verified format)"
			},
			{
				"command": "0",
				"description": "Stop water pump (verified format)"
			}
		]
	},
	{
		"name": "Microphone Control",
		"topic": "greenhouse/devices/microphone/control",
		"description": "Voice recording microphone control (I2S GPIO 18,5,19)",
		"examples": [
			{
				"command": "1",
				"description": "Enable voice recording (verified format)"
			},
			{
				"command": "0",
				"description": "Disable voice recording (verified format)"
			}
		]
	},
	{
		"name": "Voice Command",
		"topic": "greenhouse/command",
		"description": "Voice command processing from ESP32 (Edge Impulse ML model)",
		"examples": [
			{
				"command": "mocua; 0.99",
				"description": "Open door command (verified data from API)"
			},
			{
				"command": "dongcua; 1.00",
				"description": "Close door command (verified data from API)"
			},
			{
				"command": "dongcua; 0.98",
				"description": "Close door command with confidence score"
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
				"path": "/api/sensors/latest",
				"description": "Get latest sensor readings",
				"example": {
					"success": true,
					"data": {
						"temperature": 30.2,
						"humidity": 73.0,
						"soilMoisture": 0,
						"waterLevel": 1,
						"lightLevel": 0,
						"rainStatus": 0,
						"plantHeight": 0
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
						"sensors": [
							{
								"_id": "688d5dfdfc236fd9bfd6a4a3",
								"temperature": 30.2,
								"humidity": 73,
								"soilMoisture": 0,
								"waterLevel": 1,
								"plantHeight": 0,
								"rainStatus": 0,
								"lightLevel": 0,
								"deviceId": "esp32-greenhouse-01",
								"dataQuality": "merged_enhanced",
								"createdAt": "2025-08-02T00:38:21.078Z"
							}
						],
						"pagination": {
							"page": 1,
							"limit": 20,
							"total": 2920,
							"totalPages": 146,
							"hasNext": true,
							"hasPrev": false
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
				"path": "/api/history/devices",
				"description": "Get device control history with pagination",
				"example": {
					"success": true,
					"data": {
						"devices": [
							{
								"_id": "688d61599038aba63ad53b62",
								"deviceId": "greenhouse_pump",
								"deviceType": "pump",
								"action": "on",
								"status": true,
								"controlType": "manual",
								"userId": "api-user",
								"timestamp": "2025-08-02T00:52:41.444Z",
								"success": true
							}
						],
						"pagination": {
							"page": 1,
							"limit": 20,
							"total": 15,
							"totalPages": 1,
							"hasNext": false,
							"hasPrev": false
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
				"description": "Get voice command history with pagination",
				"example": {
					"success": true,
					"data": {
						"voiceCommands": [
							{
								"_id": "688d5dedfc236fd9bfd6a45b",
								"command": "mocua",
								"confidence": 0.99,
								"timestamp": "2025-08-02T00:38:05.266Z",
								"processed": true,
								"createdAt": "2025-08-02T00:38:05.267Z"
							}
						],
						"pagination": {
							"page": 1,
							"limit": 20,
							"total": 2985,
							"totalPages": 150,
							"hasNext": true,
							"hasPrev": false
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
