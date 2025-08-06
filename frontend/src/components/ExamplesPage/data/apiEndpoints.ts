// REST API Endpoints - Standardized Format Only
// Updated: August 3, 2025 - Current API endpoints configuration

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
						"sensors": [
							{
								"temperature": 30.2,
								"humidity": 73.0,
								"soilMoisture": 2.8,
								"lightLevel": 1.2,
								"waterLevel": 2.1,
								"createdAt": "2025-08-03T10:20:29.537Z",
								"timestamp": "2025-08-03T10:20:29.537Z"
							}
						]
					}
				}
			},
			{
				"method": "GET",
				"path": "/api/sensors",
				"description": "Get sensor data with pagination",
				"example": {
					"params": "?page=1&limit=20&dateFrom=2025-08-01&dateTo=2025-08-03",
					"response": {
						"success": true,
						"data": {
							"sensors": [],
							"pagination": { "page": 1, "totalPages": 5, "total": 100 }
						}
					}
				}
			},
			{
				"method": "GET",
				"path": "/api/history/sensors",
				"description": "Get sensor history with filtering",
				"example": {
					"params": "?from=2025-08-01T00:00:00Z&to=2025-08-03T23:59:59Z&limit=50",
					"response": {
						"success": true,
						"data": {
							"sensors": [],
							"pagination": { "page": 1, "totalPages": 5, "total": 100 }
						}
					}
				}
			},
			{
				"method": "POST",
				"path": "/api/sensors",
				"description": "Submit new sensor data",
				"example": {
					"request": {
						"temperature": 25.5,
						"humidity": 65.0,
						"soilMoisture": 2.5
					},
					"response": {
						"success": true,
						"message": "Sensor data saved"
					}
				}
			}
		]
	},
	{
		"title": "Device Management",
		"endpoints": [
			{
				"method": "GET",
				"path": "/api/devices",
				"description": "Get all device states",
				"example": {
					"success": true,
					"data": {
						"devices": [
							{
								"deviceId": "pump",
								"state": "OFF",
								"lastUpdated": "2025-08-03T10:20:29.537Z"
							},
							{
								"deviceId": "fan",
								"state": "ON",
								"lastUpdated": "2025-08-03T10:19:15.123Z"
							}
						]
					}
				}
			},
			{
				"method": "POST",
				"path": "/api/devices/{deviceId}/control",
				"description": "Control device state",
				"example": {
					"body": { "action": "turn_on" },
					"response": {
						"success": true,
						"data": {
							"deviceId": "pump",
							"state": "ON",
							"message": "Device controlled successfully"
						}
					}
				}
			},
			{
				"method": "GET",
				"path": "/api/devices/states",
				"description": "Get device states",
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
				"path": "/api/automation",
				"description": "Get automation configuration",
				"example": {
					"success": true,
					"data": {
						"automation": {
							"automationEnabled": true,
							"lightThresholds": { "min": 1.0, "max": 2.0 },
							"pumpThresholds": { "min": 1.5, "max": 3.0 }
						}
					}
				}
			},
			{
				"method": "PUT",
				"path": "/api/automation",
				"description": "Update automation settings",
				"example": {
					"body": {
						"automationEnabled": true,
						"lightThresholds": { "min": 1.2, "max": 2.2 }
					},
					"response": {
						"success": true,
						"data": {
							"automation": {
								"automationEnabled": true,
								"lightThresholds": { "min": 1.2, "max": 2.2 }
							},
							"message": "Automation updated successfully"
						}
					}
				}
			}
		]
	}
];
