export const sensorTopicsData = [
	{
		name: "Temperature",
		topic: "greenhouse/sensors/temperature",
		dataType: "Float",
		unit: "°C",
		description: "Environmental temperature from DHT11 sensor",
		examples: [
			{ description: "Normal temperature", value: 25.5 },
			{ description: "High temperature", value: 35.0 },
			{ description: "Low temperature", value: 15.2 }
		]
	},
	{
		name: "Humidity",
		topic: "greenhouse/sensors/humidity",
		dataType: "Float",
		unit: "%",
		description: "Air humidity from DHT11 sensor",
		examples: [
			{ description: "Optimal humidity", value: 65.0 },
			{ description: "High humidity", value: 80.0 },
			{ description: "Low humidity", value: 40.0 }
		]
	},
	{
		name: "Soil Moisture",
		topic: "greenhouse/sensors/soil",
		dataType: "Binary",
		unit: "0/1",
		description: "Soil moisture status (0=dry, 1=wet)",
		examples: [
			{ description: "Dry soil", value: 0 },
			{ description: "Wet soil", value: 1 }
		]
	},
	{
		name: "Water Level",
		topic: "greenhouse/sensors/water",
		dataType: "Binary",
		unit: "0/1",
		description: "Water level in tank (0=low, 1=sufficient)",
		examples: [
			{ description: "Low water level", value: 0 },
			{ description: "Sufficient water level", value: 1 }
		]
	},
	{
		name: "Light Level",
		topic: "greenhouse/sensors/light",
		dataType: "Binary",
		unit: "0/1",
		description: "Light intensity (0=dark, 1=bright)",
		examples: [
			{ description: "Dark environment", value: 0 },
			{ description: "Bright environment", value: 1 }
		]
	},
	{
		name: "Rain Status",
		topic: "greenhouse/sensors/rain",
		dataType: "Binary",
		unit: "0/1",
		description: "Rain status (0=no rain, 1=raining)",
		examples: [
			{ description: "No rain", value: 0 },
			{ description: "Raining", value: 1 }
		]
	},
	{
		name: "Plant Height",
		topic: "greenhouse/sensors/height",
		dataType: "Integer",
		unit: "cm",
		description: "Plant height measured by ultrasonic sensor",
		examples: [
			{ description: "Small plant", value: 15 },
			{ description: "Medium plant", value: 25 },
			{ description: "Large plant", value: 35 }
		]
	}
];

export const controlTopicsData = [
	{
		name: "Light Control",
		topic: "greenhouse/devices/light/control",
		dataType: "Binary",
		unit: "0/1",
		description: "Control LED lights (ESP32 receives binary values)",
		examples: [
			{ description: "Turn on light", value: "1" },
			{ description: "Turn off light", value: "0" }
		]
	},
	{
		name: "Pump Control",
		topic: "greenhouse/devices/pump/control",
		dataType: "Binary",
		unit: "0/1",
		description: "Control water pump (ESP32 receives binary values)",
		examples: [
			{ description: "Turn on pump", value: "1" },
			{ description: "Turn off pump", value: "0" }
		]
	},
	{
		name: "Window Control",
		topic: "greenhouse/devices/window/control",
		dataType: "Binary",
		unit: "0/1",
		description: "Control automatic window (ESP32 receives binary values)",
		examples: [
			{ description: "Open window", value: "1" },
			{ description: "Close window", value: "0" }
		]
	},
	{
		name: "Door Control",
		topic: "greenhouse/devices/door/control",
		dataType: "Binary",
		unit: "0/1",
		description: "Control entrance door (ESP32 receives binary values)",
		examples: [
			{ description: "Open door", value: "1" },
			{ description: "Close door", value: "0" }
		]
	},
	{
		name: "Microphone Control",
		topic: "greenhouse/devices/microphone/control",
		dataType: "Binary",
		unit: "0/1",
		description: "Control microphone for voice commands (ESP32 receives binary values)",
		examples: [
			{ description: "Turn on microphone", value: "1" },
			{ description: "Turn off microphone", value: "0" }
		]
	}
];
