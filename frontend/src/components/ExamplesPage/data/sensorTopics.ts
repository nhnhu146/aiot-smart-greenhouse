// MQTT Sensor Topics - Matched with embedded.ino (ESP32)
// Updated: August 3, 2025

export const sensorTopics = [
	{
		"name": "Temperature Sensor",
		"topic": "greenhouse/sensors/temperature",
		"description": "DHT11 temperature readings in Celsius (GPIO 15)",
		"dataType": "Float",
		"unit": "°C",
		"examples": [
			{ "value": 30.2, "description": "Current greenhouse temperature" },
			{ "value": 25.5, "description": "Normal room temperature" },
			{ "value": 32.8, "description": "Hot greenhouse condition" }
		]
	},
	{
		"name": "Humidity Sensor",
		"topic": "greenhouse/sensors/humidity",
		"description": "DHT11 humidity readings as percentage (GPIO 15)",
		"dataType": "Float",
		"unit": "%",
		"examples": [
			{ "value": 73.0, "description": "Current greenhouse humidity" },
			{ "value": 65.0, "description": "Optimal humidity level" },
			{ "value": 80.5, "description": "High humidity condition" }
		]
	},
	{
		"name": "Soil Moisture Sensor",
		"topic": "greenhouse/sensors/soil",
		"description": "Binary soil moisture sensor reading (GPIO 36)",
		"dataType": "Binary",
		"unit": "0/1",
		"examples": [
			{ "value": "0", "description": "Dry soil - needs watering" },
			{ "value": "1", "description": "Wet soil - adequately watered" }
		]
	},
	{
		"name": "Light Level Sensor",
		"topic": "greenhouse/sensors/light",
		"description": "Binary light intensity sensor reading (GPIO 34)",
		"dataType": "Binary",
		"unit": "0/1",
		"examples": [
			{ "value": "0", "description": "Dark condition - light needed" },
			{ "value": "1", "description": "Bright condition - sufficient light" }
		]
	},
	{
		"name": "Water Level Sensor",
		"topic": "greenhouse/sensors/water",
		"description": "Binary water tank level sensor reading (GPIO 35)",
		"dataType": "Binary",
		"unit": "0/1",
		"examples": [
			{ "value": "0", "description": "Empty/Low water tank" },
			{ "value": "1", "description": "Full water tank" }
		]
	}
];
