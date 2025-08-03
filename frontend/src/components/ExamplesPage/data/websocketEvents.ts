// WebSocket Events - Standardized Format
// Updated: August 3, 2025 - Aligned with REST API format standards

export const websocketEvents = [
	{
		"title": "Real-time Sensor Data",
		"events": [
			{
				"event": "sensor:data",
				"description": "Real-time sensor readings broadcast",
				"example": {
					"success": true,
					"data": {
						"sensors": [
							{
								"temperature": 30.2,
								"humidity": 73.0,
								"soilMoisture": 2.8,
								"lightLevel": 1.2,
								"waterLevel": 2.1,
								"timestamp": "2025-08-03T10:20:29.537Z",
								"createdAt": "2025-08-03T10:20:29.537Z"
							}
						]
					},
					"eventType": "sensor:data"
				}
			},
			{
				"event": "sensor:update",
				"description": "Individual sensor value updates",
				"example": {
					"success": true,
					"data": {
						"sensorType": "temperature",
						"value": 30.2,
						"timestamp": "2025-08-03T10:20:29.537Z"
					},
					"eventType": "sensor:update"
				}
			}
		]
	},
	{
		"title": "Device Management",
		"events": [
			{
				"event": "device:control",
				"description": "Device control confirmations",
				"example": {
					"success": true,
					"data": {
						"deviceId": "pump",
						"state": "ON",
						"action": "turn_on",
						"controlId": "ctrl_12345",
						"timestamp": "2025-08-03T10:20:29.537Z",
						"source": "api"
					},
					"eventType": "device:control"
				}
			},
			{
				"event": "device:status",
				"description": "Device status updates",
				"example": {
					"success": true,
					"data": {
						"devices": [
							{
								"deviceId": "pump",
								"state": "OFF",
								"lastUpdated": "2025-08-03T10:20:29.537Z"
							}
						]
					},
					"eventType": "device:status"
				}
			}
		]
	},
	{
		"title": "Alerts & Notifications",
		"events": [
			{
				"event": "alert",
				"description": "System alerts broadcast",
				"example": {
					"success": true,
					"data": {
						"alert": {
							"id": "alert_12345",
							"type": "warning",
							"message": "Soil moisture low",
							"priority": "medium",
							"timestamp": "2025-08-03T10:20:29.537Z"
						}
					},
					"eventType": "alert"
				}
			},
			{
				"event": "alert:priority",
				"description": "High priority alerts",
				"example": {
					"success": true,
					"data": {
						"alert": {
							"id": "alert_67890",
							"type": "critical",
							"message": "Water level critically low",
							"priority": "high",
							"timestamp": "2025-08-03T10:20:29.537Z"
						}
					},
					"eventType": "alert:priority"
				}
			}
		]
	},
	{
		"title": "Automation Events",
		"events": [
			{
				"event": "automation:update",
				"description": "Automation settings changes",
				"example": {
					"success": true,
					"data": {
						"automation": {
							"automationEnabled": true,
							"lightThresholds": { "min": 1.2, "max": 2.2 },
							"pumpThresholds": { "min": 1.5, "max": 3.0 },
							"updatedAt": "2025-08-03T10:20:29.537Z"
						}
					},
					"eventType": "automation:update"
				}
			}
		]
	}
];
