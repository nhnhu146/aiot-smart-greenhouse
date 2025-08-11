# AIoT Smart Greenhouse - Complete API & WebSocket Reference

## Overview
This document provides the **SINGLE SOURCE OF TRUTH** for all REST API endpoints and WebSocket events in the AIoT Smart Greenhouse Management System. All endpoints strictly follow REST principles with standardized response formats.

## Standards & Conventions

### Base URLs
- **API Base URL**: `http://localhost:5000/api`
- **WebSocket URL**: `ws://localhost:5000`
- **Production**: Update according to deployment environment

### Protocol Standards
- **REST API**: All HTTP endpoints follow RESTful principles
- **WebSocket**: Real-time bidirectional communication for live data
- **Authentication**: JWT Bearer token required for protected endpoints

### Authentication
All protected endpoints require JWT authentication:
```http
Authorization: Bearer <jwt-token>
```

### Standard Response Format
All API responses follow this exact format:

#### Success Response
```typescript
interface APISuccessResponse<T = any> {
  success: true;
  data?: T;              // Response payload (optional)
  message?: string;      // Success message (optional)
  timestamp: string;     // ISO 8601 timestamp
}
```

#### Error Response
```typescript
interface APIErrorResponse {
  success: false;
  message: string;       // Error description
  error?: any;          // Additional error details (development only)
  timestamp: string;     // ISO 8601 timestamp
}
```

#### Paginated Response
```typescript
interface PaginatedResponse<T> extends APISuccessResponse<T> {
  data: {
    items: T[];          // Array of data items
    pagination: {
      page: number;      // Current page (1-based)
      limit: number;     // Items per page
      total: number;     // Total items count
      pages: number;     // Total pages count
    };
  };
}
```

---

## Authentication Endpoints

### POST /api/auth/signin
Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_id",
      "email": "user@example.com"
    }
  },
  "message": "Authentication successful",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### POST /api/auth/signup
Register new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

### POST /api/auth/forgot-password
Request password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

### POST /api/auth/reset-password
Reset password using token from email.

**Request:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "new_password123"
}
```

---

## Sensor Data Endpoints

### GET /api/sensors/latest
Get the most recent sensor reading.

**Response:**
```json
{
  "success": true,
  "data": {
    "sensors": [{
      "_id": "sensor_id",
      "temperature": 25.5,
      "humidity": 65.2,
      "soilMoisture": 45.8,
      "waterLevel": 80.0,
      "lightLevel": 750,
      "plantHeight": 15.5,
      "rainStatus": 0,
      "timestamp": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }]
  },
  "timestamp": "2024-01-15T10:30:01.000Z"
}
```

### GET /api/sensors/current
Get current sensor status with quality indicators.

### GET /api/sensors/stats
Get sensor statistics for time period.

**Query Parameters:**
- `period` ('hour' | 'day' | 'week' | 'month'): Statistical period
- `from` (ISO date): Start date filter
- `to` (ISO date): End date filter

---

## Device Control Endpoints

### GET /api/devices/status
Get status of all devices.

**Response:**
```json
{
  "success": true,
  "data": {
    "devices": {
      "light": {
        "status": true,
        "lastUpdate": "2024-01-15T10:30:00.000Z",
        "isOnline": true
      },
      "pump": {
        "status": false,
        "lastUpdate": "2024-01-15T09:15:00.000Z",
        "isOnline": true
      }
    },
    "summary": {
      "total": 4,
      "online": 4,
      "active": 1
    }
  },
  "timestamp": "2024-01-15T10:30:01.000Z"
}
```

### GET /api/devices/states
Get current device states from state management system.

### GET /api/devices/states/:deviceType
Get specific device state.

**Path Parameters:**
- `deviceType`: 'light' | 'pump' | 'door' | 'window'

### PUT /api/devices/states/:deviceType
Update device state.

**Request:**
```json
{
  "status": true,
  "lastCommand": "manual_control",
  "metadata": {
    "user": "admin",
    "reason": "manual_override"
  }
}
```

### POST /api/devices/control
Control device manually.

**Request:**
```json
{
  "deviceType": "light",
  "action": "on"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deviceType": "light",
    "action": "on",
    "status": true,
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "message": "Device controlled successfully",
  "timestamp": "2024-01-15T10:30:01.000Z"
}
```

---

## Automation Endpoints

### GET /api/automation
Get current automation configuration.

**Response:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "settings": {
      "lightControl": {
        "enabled": true,
        "threshold": { "min": 300, "max": 800 },
        "schedule": { "on": "06:00", "off": "20:00" }
      },
      "pumpControl": {
        "enabled": true,
        "soilMoistureThreshold": { "min": 30, "max": 70 },
        "maxRunTime": 300000
      },
      "temperatureControl": {
        "enabled": true,
        "threshold": { "min": 18, "max": 28 }
      }
    }
  },
  "timestamp": "2024-01-15T10:30:01.000Z"
}
```

### PUT /api/automation
Update automation configuration.

**Request:**
```json
{
  "enabled": true,
  "settings": {
    "lightControl": {
      "enabled": true,
      "threshold": { "min": 350, "max": 750 }
    }
  }
}
```

### POST /api/automation/toggle
Toggle automation on/off.

**Request:**
```json
{
  "enabled": false
}
```

### GET /api/automation/status
Get current automation status and recent actions.

---

## Alert Management Endpoints

### GET /api/alerts
Get alerts with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `resolved` (boolean): Filter by resolution status
- `severity` ('low' | 'medium' | 'high' | 'critical'): Filter by severity
- `type` (string): Filter by alert type

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [{
      "_id": "alert_id",
      "type": "temperature_high",
      "message": "Temperature exceeds threshold",
      "severity": "high",
      "value": 32.5,
      "threshold": 28.0,
      "resolved": false,
      "timestamp": "2024-01-15T10:30:00.000Z",
      "resolvedAt": null
    }],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  },
  "timestamp": "2024-01-15T10:30:01.000Z"
}
```

### GET /api/alerts/active
Get all unresolved alerts.

### POST /api/alerts
Create new alert manually.

**Request:**
```json
{
  "type": "manual_alert",
  "message": "Manual inspection required",
  "severity": "medium"
}
```

### PUT /api/alerts/:id/resolve
Mark alert as resolved.

### DELETE /api/alerts/:id
Delete alert.

---

## History Endpoints

### GET /api/history/sensors
Get sensor data history with filtering.

**Query Parameters:**
- `page`, `limit`: Pagination
- `sortBy`, `sortOrder`: Sorting ('createdAt', 'desc')
- `from`, `to`: Date range (ISO dates)
- `deviceId` (string): Filter by device
- `sensorType` ('temperature' | 'humidity' | 'soilMoisture' | 'waterLevel' | 'lightLevel'): Filter by sensor

**Response:** Uses PaginatedResponse format with sensor data array.

### GET /api/history/devices
Get device control history.

### GET /api/history/export
Export all historical data.

**Query Parameters:**
- `format` ('csv' | 'json'): Export format (default: 'csv')
- `from`, `to`: Date range
- `type` ('sensors' | 'devices' | 'all'): Data type to export

---

## Settings Endpoints

### GET /api/settings
Get all system settings.

**Response:**
```json
{
  "success": true,
  "data": {
    "thresholds": {
      "temperature": { "min": 18, "max": 28 },
      "humidity": { "min": 40, "max": 80 },
      "soilMoisture": { "min": 30, "max": 70 }
    },
    "emailAlerts": {
      "enabled": true,
      "recipients": ["admin@example.com"]
    },
    "alertFrequency": {
      "debounceTime": 60000,
      "batchAlerts": true
    }
  },
  "timestamp": "2024-01-15T10:30:01.000Z"
}
```

### POST /api/settings
Save complete settings configuration.

### POST /api/settings/thresholds
Update alert thresholds only.

### POST /api/settings/email-alerts
Update email alert configuration.

### POST /api/settings/thresholds
Update alert thresholds only.

**Request:**
```json
{
  "thresholds": {
    "temperature": { "min": 18, "max": 28 },
    "humidity": { "min": 40, "max": 80 },
    "soilMoisture": { "min": 30, "max": 70 }
  }
}
```

### POST /api/settings/email-recipients
Update email recipients for alerts.

**Request:**
```json
{
  "recipients": ["admin@example.com", "user@example.com"]
}
```

### POST /api/settings/email-alerts
Update email alert configuration.

**Request:**
```json
{
  "enabled": true,
  "alertTypes": ["critical", "high"]
}
```

### POST /api/settings/test-email
Send test email.

**Request:**
```json
{
  "recipients": ["test@example.com"]
}
```

### GET /api/settings/email-status
Get email service status.

### POST /api/settings/alert-frequency
Update alert frequency settings.

**Request:**
```json
{
  "debounceTime": 60000,
  "batchAlerts": true
}
```

### POST /api/settings/reset
Reset all settings to defaults.

---

## Advanced Alert Endpoints

### GET /api/alerts/stats
Get alert statistics.

### GET /api/alerts/email/status
Get email service status for alerts.

### POST /api/alerts/email/test
Send test alert email.

### GET /api/alerts/thresholds
Get current alert thresholds.

### POST /api/alerts/reload
Reload thresholds and email settings from database.

### POST /api/alerts/system-error
Manually trigger system error alert (for testing).

### POST /api/alerts/resolve-all
Resolve all active alerts.

---

## Device Scheduling Endpoints

### POST /api/devices/schedule
Schedule device control with delay.

**Request:**
```json
{
  "deviceType": "light",
  "action": "on",
  "duration": 3600,
  "delay": 30
}
```

### POST /api/devices/states/sync
Synchronize all device states.

---

## Advanced History Endpoints

### GET /api/history/summary
Get sensor data summary statistics.

### GET /api/history/trends
Get sensor data trends analysis.

### GET /api/history/device-controls
Get device control history.

### GET /api/history/device-controls/count
Get device control count statistics.

### GET /api/history/export/sensors
Export sensor data only.

### GET /api/history/export/device-controls
Export device control history.

### GET /api/history/export/voice-commands
Export voice command history.

---

## Dashboard & System Endpoints

### GET /api/dashboard
Get comprehensive dashboard overview data.

### GET /api/test-email
Send test email (main endpoint).

**Request:**
```json
{
  "recipients": ["test@example.com"]
}
```

---

## Voice Command Endpoints

### GET /api/voice-commands
Get voice command history.

**Query Parameters:**
- `page`, `limit`: Pagination
- `processed` (boolean): Filter by processing status
- `from`, `to`: Date range
- `minConfidence` (number): Minimum confidence level

### POST /api/voice-commands/process
Process voice command manually.

**Request:**
```json
{
  "command": "turn on the lights",
  "confidence": 0.95
}
```

---

## Data Management Endpoints

### POST /api/data/merge
Trigger data merge for duplicate timestamps.

### POST /api/data/alerts/cleanup
Clean up duplicate alerts.

### POST /api/data/sensor/cleanup
Clean up duplicate sensor data.

---

## Chat Endpoint

### POST /api/chat
Ask question to rule-based chatbot.

**Request:**
```json
{
  "question": "What's the current temperature?"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "question": "What's the current temperature?",
    "answer": "The current temperature is 25.5°C",
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:01.000Z"
}
```

---

## Health Check Endpoint

### GET /api/health
Get system health status.

**Response:**
```json
{
  "success": true,
  "message": "API is healthy",
  "data": {
    "status": "healthy",
    "uptime": 3600.5,
    "version": "1.0.0"
  },
  "timestamp": "2024-01-15T10:30:01.000Z"
}
```

---

## WebSocket Real-Time Communication

### Connection
Connect to WebSocket server for real-time updates:
```javascript
const ws = new WebSocket('ws://localhost:5000');
```

### Authentication
Send JWT token immediately after connection:
```javascript
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-jwt-token'
  }));
};
```

### Message Format
All WebSocket messages follow this format:
```typescript
interface WebSocketMessage {
  type: string;           // Message type identifier
  data?: any;            // Message payload
  timestamp: string;     // ISO 8601 timestamp
  id?: string;           // Optional message ID
}
```

### Real-Time Events

#### 1. Sensor Data Updates
**Sent by server** when new sensor data is received:
```json
{
  "type": "sensor_data",
  "data": {
    "deviceId": "greenhouse_01",
    "sensorType": "temperature",
    "value": 25.5,
    "unit": "°C",
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:01.000Z"
}
```

#### 2. Device Status Changes
**Sent by server** when device status changes:
```json
{
  "type": "device_status",
  "data": {
    "deviceId": "fan_01",
    "status": "on",
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:01.000Z"
}
```

#### 3. System Alerts
**Sent by server** for critical alerts:
```json
{
  "type": "alert",
  "data": {
    "id": "alert_001",
    "type": "critical",
    "message": "Temperature too high: 35°C",
    "deviceId": "greenhouse_01",
    "threshold": 30,
    "currentValue": 35,
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:01.000Z"
}
```

#### 4. Device Control Commands
**Sent by client** to control devices:
```json
{
  "type": "device_control",
  "data": {
    "deviceId": "fan_01",
    "action": "toggle",
    "parameters": {
      "speed": 75
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "id": "req_001"
}
```

**Server response**:
```json
{
  "type": "device_control_response",
  "data": {
    "success": true,
    "deviceId": "fan_01",
    "newStatus": "on",
    "message": "Device controlled successfully"
  },
  "timestamp": "2024-01-15T10:30:01.000Z",
  "id": "req_001"
}
```

#### 5. Automation Triggers
**Sent by server** when automation rules are triggered:
```json
{
  "type": "automation_triggered",
  "data": {
    "ruleId": "rule_001",
    "ruleName": "Temperature Control",
    "trigger": "temperature > 30",
    "actions": ["turn_on_fan", "send_alert"],
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:01.000Z"
}
```

#### 6. Connection Events
**Server acknowledgment** messages:
```json
{
  "type": "connection_ack",
  "data": {
    "status": "authenticated",
    "userId": "user_001",
    "sessionId": "session_001"
  },
  "timestamp": "2024-01-15T10:30:01.000Z"
}
```

### WebSocket Error Handling
```json
{
  "type": "error",
  "data": {
    "message": "Authentication failed",
    "code": "AUTH_ERROR",
    "details": "Invalid or expired token"
  },
  "timestamp": "2024-01-15T10:30:01.000Z"
}
```

### Client Implementation Example
```javascript
const ws = new WebSocket('ws://localhost:5000');

ws.onopen = () => {
  // Authenticate immediately
  ws.send(JSON.stringify({
    type: 'auth',
    token: localStorage.getItem('jwt-token')
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'sensor_data':
      updateSensorDisplay(message.data);
      break;
    case 'device_status':
      updateDeviceStatus(message.data);
      break;
    case 'alert':
      showAlert(message.data);
      break;
    case 'error':
      handleError(message.data);
      break;
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket connection closed');
  // Implement reconnection logic
};
```

---

## Error Codes

| HTTP Status | Error Type | Description |
|-------------|------------|-------------|
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## Rate Limiting

- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 5 requests per 15 minutes  
- **Data export endpoints**: 10 requests per hour
- **WebSocket connections**: 10 attempts per minute

---

This API reference represents the authoritative specification. All implementations must conform to these exact formats and endpoints.