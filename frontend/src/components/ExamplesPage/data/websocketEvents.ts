// WebSocket Events - Matched with backend WebSocketService
// Updated: August 3, 2025

export const websocketEvents = [
	{
		"title": "Real-time Sensor Data",
		"events": [
			{
				"event": "sensor:data",
				"description": "Real-time sensor readings broadcast",
				"example": {
					"topic": "greenhouse/sensors/temperature",
					"sensor": "temperature",
					"data": {
						"value": 30.2,
						"timestamp": "2025-08-03T10:20:29.537Z",
						"quality": "merged",
						"merged": true
					}
				}
			},
			{
				"event": "sensor:temperature",
				"description": "Temperature-specific updates"
			},
			{
				"event": "sensor:humidity",
				"description": "Humidity-specific updates"
			}
		]
	},
	{
		"title": "Device Control",
		"events": [
			{
				"event": "device:control",
				"description": "Device control confirmations",
				"example": {
					"controlId": "ctrl_12345",
					"deviceType": "pump",
					"action": "on",
					"status": true,
					"source": "api",
					"timestamp": "2025-08-03T10:20:29.537Z",
					"success": true
				}
			},
			{
				"event": "device:status",
				"description": "Device status updates"
			}
		]
	},
	{
		"title": "Alerts & Notifications",
		"events": [
			{
				"event": "alert",
				"description": "System alerts broadcast"
			},
			{
				"event": "priority-alert",
				"description": "High priority alerts"
			}
		]
	},
	{
		"title": "Automation Events",
		"events": [
			{
				"event": "automation:settings-update",
				"description": "Automation settings changes"
			},
			{
				"event": "automation:status-update",
				"description": "Automation status changes"
			}
		]
	}
];
