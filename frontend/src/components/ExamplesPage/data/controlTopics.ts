// MQTT Device Control Topics - Matched with embedded.ino (ESP32)
// Updated: August 3, 2025

export const controlTopics = [
	{
		"name": "Light Control",
		"topic": "greenhouse/devices/light/control",
		"description": "LED light control (GPIO 2)",
		"dataType": "Binary",
		"unit": "0/1",
		"examples": [
			{ "command": "1", "description": "Turn light ON" },
			{ "command": "0", "description": "Turn light OFF" }
		]
	},
	{
		"name": "Pump Control",
		"topic": "greenhouse/devices/pump/control",
		"description": "Water pump control (GPIO 4)",
		"dataType": "Binary",
		"unit": "0/1",
		"examples": [
			{ "command": "1", "description": "Turn pump ON" },
			{ "command": "0", "description": "Turn pump OFF" }
		]
	},
	{
		"name": "Window Control",
		"topic": "greenhouse/devices/window/control",
		"description": "Window servo control (GPIO 12)",
		"dataType": "Binary",
		"unit": "0/1",
		"examples": [
			{ "command": "1", "description": "Open window" },
			{ "command": "0", "description": "Close window" }
		]
	},
	{
		"name": "Door Control",
		"topic": "greenhouse/devices/door/control",
		"description": "Door servo control (GPIO 13)",
		"dataType": "Binary",
		"unit": "0/1",
		"examples": [
			{ "command": "1", "description": "Open door" },
			{ "command": "0", "description": "Close door" }
		]
	},
	{
		"name": "Microphone Control",
		"topic": "greenhouse/devices/microphone/control",
		"description": "Voice command microphone (GPIO 5, 18, 19)",
		"dataType": "Binary",
		"unit": "0/1",
		"examples": [
			{ "command": "1", "description": "Enable microphone" },
			{ "command": "0", "description": "Disable microphone" }
		]
	}
];
