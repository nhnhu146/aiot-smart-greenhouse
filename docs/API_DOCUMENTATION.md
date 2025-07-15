# API Documentation

## Authentication Endpoints

### POST /api/auth/signin
Sign in user with email and password.

### POST /api/auth/signup  
Register new user account.

### POST /api/auth/forgot-password
Request password reset email.

### POST /api/auth/reset-password
Reset password with token.

## Sensor Endpoints

### GET /api/sensors
Get latest sensor data.

### GET /api/sensors/history
Get sensor data history with pagination.

### POST /api/sensors
Save new sensor data (from IoT devices).

## Device Control Endpoints

### GET /api/devices
Get all device statuses.

### POST /api/devices/:deviceId
Control device state (on/off).

## Settings Endpoints

### GET /api/settings
Get system settings.

### POST /api/settings
Update system settings.

### GET /api/user-settings
Get user-specific settings.

### POST /api/user-settings
Update user settings.

## Alert Endpoints

### GET /api/alerts
Get alerts with filtering and pagination.

### GET /api/alerts/stats
Get alert statistics.

### PUT /api/alerts/:id/resolve
Mark alert as resolved.

## History & Analytics

### GET /api/history
Get comprehensive history data.

### GET /api/history/summary  
Get daily/weekly/monthly summaries.

### GET /api/history/export
Export data as JSON/CSV.
