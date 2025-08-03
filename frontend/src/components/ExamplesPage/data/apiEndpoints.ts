// REST API Endpoints - Matched with backend routes
// Updated: August 3, 2025

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
						"soilMoisture": 2.8,
						"lightLevel": 1.2,
						"waterLevel": 2.1,
						"timestamp": "2025-08-03T10:20:29.537Z"
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
						"data": [],
						"pagination": { "page": 1, "totalPages": 5 }
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
		"title": "Device Control",
		"endpoints": [
			{
				"method": "GET",
				"path": "/api/devices",
				"description": "Get all device statuses",
				"example": {
					"success": true,
					"data": [
						{ "deviceType": "pump", "status": false },
						{ "deviceType": "light", "status": true }
					]
				}
			},
			{
				"method": "POST",
				"path": "/api/devices/control",
				"description": "Control device actions",
				"example": {
					"request": {
						"deviceType": "pump",
						"action": "on"
					},
					"response": {
						"success": true,
						"message": "Device control successful"
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
						"automationEnabled": true,
						"lightThresholds": { "min": 1.0, "max": 2.0 },
						"pumpThresholds": { "min": 1.5, "max": 3.0 }
					}
				}
			},
			{
				"method": "PUT",
				"path": "/api/automation",
				"description": "Update automation settings",
				"example": {
					"request": {
						"automationEnabled": true,
						"lightThresholds": { "min": 1.2, "max": 2.2 }
					},
					"response": {
						"success": true,
						"message": "Automation updated"
					}
				}
			}
		]
	}
];
