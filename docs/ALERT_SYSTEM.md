# Alert System Configuration Guide

## Overview

The AIOT Smart Greenhouse system now includes a comprehensive alert system that monitors sensor thresholds and sends email notifications when values go out of range.

## Features

### 🚨 **Alert Trigger System**
- **Centralized trigger function**: `triggerAlert()` in `NotificationService`
- **Extensible design**: Easy to add SMS, push notifications, webhooks, etc.
- **Anti-spam protection**: 5-minute cooldown between same alert types
- **Multiple severity levels**: low, medium, high, critical

### 📊 **Threshold Monitoring**
- **Temperature**: Min/Max range monitoring
- **Humidity**: Min/Max range monitoring  
- **Soil Moisture**: Critical for plant health
- **Water Level**: Prevents pump damage
- **Real-time checking**: Triggers when MQTT sensor data received

### 📧 **Email Notifications**
- **HTML formatted emails** with severity color coding
- **Multiple recipients** support
- **Email testing** functionality
- **Sender configuration** via environment variables

## Configuration

### Backend Environment Variables

Add these to your `.env` file:

```bash
# Email Configuration
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Gmail Setup

1. **Enable 2FA** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Select "Other" and name it "Smart Greenhouse"
   - Use the generated password in `SMTP_PASS`

### Frontend Configuration

1. **Access Settings**: Navigate to `/settings` in your frontend
2. **Configure Thresholds**: Set min/max values for each sensor type
3. **Add Email Recipients**: Add multiple email addresses for alerts
4. **Test Email**: Use the test button to verify email delivery

## API Endpoints

### Settings Management
```bash
# Get current settings
GET /api/settings

# Update thresholds
POST /api/settings
{
  "temperatureThreshold": { "min": 18, "max": 30 },
  "humidityThreshold": { "min": 40, "max": 80 },
  "soilMoistureThreshold": { "min": 30, "max": 70 },
  "waterLevelThreshold": { "min": 20, "max": 90 }
}

# Update email recipients
POST /api/settings/email-recipients
{
  "emailRecipients": ["user1@example.com", "user2@example.com"]
}

# Test email configuration
POST /api/settings/test-email
{
  "email": "test@example.com"
}
```

## How It Works

### 1. **Sensor Data Flow**
```
Arduino/ESP32 → MQTT → Backend → AlertService → NotificationService
```

### 2. **Threshold Checking Logic**
- MQTT receives sensor data
- `MQTTService.processSensorData()` buffers values
- When all required sensors have data, triggers `AlertService.checkSensorThresholds()`
- `AlertService` compares values against database thresholds
- If threshold exceeded, calls `NotificationService.triggerAlert()`

### 3. **Alert Processing**
- **Database storage**: Alert saved to MongoDB
- **Email sending**: HTML email sent to all recipients
- **Cooldown tracking**: Prevents spam alerts
- **Extensibility point**: Easy to add more notification methods

## Alert Severity Levels

| Level | Color | Trigger Conditions |
|-------|-------|-------------------|
| **Critical** | Red | Temperature ±5°C from threshold, Water level <10% |
| **High** | Orange | Outside normal threshold range |
| **Medium** | Yellow | Humidity issues, Soil moisture high |
| **Low** | Blue | Minor deviations |

## Email Template

Emails include:
- **Alert severity** with color coding
- **Sensor type** and current value
- **Threshold information**
- **Timestamp**
- **Professional formatting**

## Troubleshooting

### Email Not Sending

1. **Check environment variables**:
   ```bash
   echo $SMTP_USER $SMTP_PASS
   ```

2. **Test email configuration**:
   ```bash
   curl -X POST http://localhost:5000/api/settings/test-email \
     -H "Content-Type: application/json" \
     -d '{"email":"your-email@gmail.com"}'
   ```

3. **Check Gmail security**:
   - Ensure 2FA is enabled
   - Use App Password, not regular password
   - Check "Less secure app access" if needed

### Alerts Not Triggering

1. **Check MQTT connection**:
   ```bash
   # Check MQTT logs in backend console
   # Should see: "📨 Received MQTT message on topic: greenhouse/sensors/..."
   ```

2. **Verify thresholds in database**:
   ```bash
   # Use MongoDB Compass or CLI to check Settings collection
   ```

3. **Check alert cooldown**:
   - Alerts have 5-minute cooldown
   - Different severity levels have separate cooldowns

## Development Extensions

### Adding SMS Notifications

1. **Install Twilio**:
   ```bash
   npm install twilio
   ```

2. **Add to `NotificationService.triggerAlert()`**:
   ```typescript
   // After email sending
   if (this.smsConfig.enabled) {
     await this.sendSMSAlert(alertData);
   }
   ```

### Adding Webhook Support

```typescript
// In triggerAlert()
if (this.webhookConfig.enabled) {
  await fetch(this.webhookConfig.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alertData)
  });
}
```

### Adding Push Notifications

```typescript
// Using Firebase Cloud Messaging or similar
if (this.pushConfig.enabled) {
  await this.sendPushNotification(alertData);
}
```

## Testing

### Manual Alert Testing

```typescript
// Add temporary test endpoint in development
router.post('/test-alert', async (req, res) => {
  await notificationService.triggerAlert({
    type: 'temperature',
    level: 'high',
    message: 'Test alert - Temperature too high: 35°C',
    currentValue: 35,
    threshold: { min: 18, max: 30 }
  });
  res.json({ success: true });
});
```

### Load Testing

```bash
# Send multiple sensor readings rapidly
for i in {1..10}; do
  mosquitto_pub -h localhost -t "greenhouse/sensors/temperature" -m "40"
  sleep 1
done
```

## Security Considerations

1. **Email credentials**: Use App Passwords, not regular passwords
2. **Rate limiting**: Built-in 5-minute cooldown prevents spam
3. **Input validation**: All email addresses validated
4. **Environment variables**: Never commit credentials to version control
5. **MQTT security**: Use authentication (already configured)

## Monitoring

### Log Messages to Watch
```
🚨 Alert triggered: temperature - Temperature too high: 35°C
📧 Email alerts sent to 2 recipients
⚠️ Alert cooldown active for temperature_high
```

### Database Collections
- `settings`: Threshold configuration
- `alerts`: Alert history
- `sensordata`: Sensor readings

This alert system provides a robust foundation for monitoring your greenhouse and can be easily extended with additional notification methods as needed.
