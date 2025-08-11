# Environment Variables

This document describes all environment variables used in the AIoT Smart Greenhouse system.

## Required Environment Variables

### Database Configuration
- `MONGODB_URI` - MongoDB connection string
  - Example: `mongodb://localhost:27017/greenhouse`
  - Required for database connectivity

### Authentication
- `JWT_SECRET` - Secret key for JWT token generation
  - Example: `your-super-secret-jwt-key`
  - Must be a strong, random string

### MQTT Configuration
- `MQTT_BROKER_URL` - MQTT broker connection URL
  - Example: `mqtt://localhost:1883`
  - Required for IoT device communication

### ⭐ Email Configuration (CRITICAL FOR ALERTS) ⭐
- `EMAIL_ENABLED` - Enable/disable email functionality (true/false)
- `EMAIL_HOST` - SMTP server hostname (default: smtp.gmail.com)
- `EMAIL_PORT` - SMTP server port (default: 587)
- `EMAIL_SECURE` - Use SSL/TLS (true/false, default: false for port 587)
- `EMAIL_USER` - SMTP username (your email address)
- `EMAIL_PASS` - SMTP password (use App Password for Gmail)
- `EMAIL_FROM` - Default sender email address

**Gmail Setup Instructions:**
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an "App Password" for the greenhouse system
3. Use the App Password (not your regular password) in EMAIL_PASS
4. Set EMAIL_USER to your Gmail address

### Optional Environment Variables

### Server Configuration
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment mode (development/production/test)

### WebSocket Configuration
- `WS_PORT` - WebSocket server port (default: 3002)

### Push Notifications
- `VAPID_PUBLIC_KEY` - Public key for push notifications
- `VAPID_PRIVATE_KEY` - Private key for push notifications

## Example .env File

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/greenhouse

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# MQTT
MQTT_BROKER_URL=mqtt://localhost:1883

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=greenhouse@yourdomain.com

# Server
PORT=3001
NODE_ENV=development

# WebSocket
WS_PORT=3002

# Push Notifications (optional)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

## Security Notes

1. Never commit `.env` files to version control
2. Use strong, unique secrets for production
3. Rotate secrets regularly
4. Use environment-specific configurations
5. Consider using a secrets management service for production
