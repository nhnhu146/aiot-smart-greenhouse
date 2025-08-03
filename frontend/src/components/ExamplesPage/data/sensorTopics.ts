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
		"description": "Soil moisture level reading (GPIO 36)",
		"dataType": "Float",
		"unit": "V",
		"examples": [
			{ "value": 2.8, "description": "Current soil moisture" },
			{ "value": 1.5, "description": "Dry soil condition" },
			{ "value": 3.2, "description": "Wet soil condition" }
		]
	},
	{
		"name": "Light Level Sensor",
		"topic": "greenhouse/sensors/light",
		"description": "Light intensity reading (GPIO 34)",
		"dataType": "Float",
		"unit": "V",
		"examples": [
			{ "value": 1.2, "description": "Current light level" },
			{ "value": 0.5, "description": "Low light condition" },
			{ "value": 2.0, "description": "Bright light condition" }
		]
	},
	{
		"name": "Water Level Sensor",
		"topic": "greenhouse/sensors/water",
		"description": "Water tank level reading (GPIO 35)",
		"dataType": "Float",
		"unit": "V",
		"examples": [
			{ "value": 2.1, "description": "Current water level" },
			{ "value": 0.8, "description": "Low water level" },
			{ "value": 3.0, "description": "Full water tank" }
		]
	}
];
