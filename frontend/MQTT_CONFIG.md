# Frontend MQTT Configuration

This document explains how the MQTT configuration is handled in the frontend application.

## Environment Variables

The frontend uses the following environment variables for MQTT configuration:

### Required Variables
- `NEXT_PUBLIC_MQTT_URL`: WebSocket URL for the MQTT broker (e.g., `mqtt://mqtt.noboroto.id.vn:1883`)
- `NEXT_PUBLIC_MQTT_USERNAME`: Username for MQTT authentication
- `NEXT_PUBLIC_MQTT_PASSWORD`: Password for MQTT authentication

### Optional Variables
- `NODE_ENV`: Environment mode (development/production)
- `NEXT_PUBLIC_API_URL`: Backend API URL

## Configuration Files

### Development Configuration
- `.env` - Local development environment variables
- `.env.example` - Template for environment variables

### Production Configuration
- Environment variables are set in `compose.prod.yml`
- Docker containers inherit environment variables from the host

## MQTT Client Configuration

### Files Updated
1. `src/lib/mqttConfig.ts` - Centralized MQTT configuration utility
2. `src/lib/mqttClient.ts` - Main MQTT client with environment-based configuration
3. `src/hooks/publishMQTT.ts` - MQTT publishing hook with environment-based configuration
4. `next.config.js` - Next.js configuration to expose environment variables

### Features
- ✅ Environment-based configuration
- ✅ Automatic authentication with username/password
- ✅ Fallback to default values if environment variables are not set
- ✅ Proper error handling and logging
- ✅ Reconnection support
- ✅ Unique client IDs for each connection

## Usage

### Development
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your MQTT broker details
NEXT_PUBLIC_MQTT_URL=mqtt://mqtt.noboroto.id.vn:1883
NEXT_PUBLIC_MQTT_USERNAME=vision
NEXT_PUBLIC_MQTT_PASSWORD=vision

# Start development server
npm run dev
```

### Production (Docker)
Environment variables are automatically set in `compose.prod.yml`:
```yaml
environment:
  NEXT_PUBLIC_MQTT_URL: mqtt://mqtt.noboroto.id.vn:1883
  NEXT_PUBLIC_MQTT_USERNAME: ${MQTT_USERNAME:-vision}
  NEXT_PUBLIC_MQTT_PASSWORD: ${MQTT_PASSWORD:-vision}
```

## MQTT Topics

The frontend subscribes to and publishes on the following topics:

### Sensor Data (Subscribe)
- `greenhouse/sensors/temperature`
- `greenhouse/sensors/humidity`
- `greenhouse/sensors/soil`
- `greenhouse/sensors/water`
- `greenhouse/sensors/light`
- `greenhouse/sensors/rain`

### Device Control (Publish)
- `greenhouse/devices/light/control`
- `greenhouse/devices/pump/control`
- `greenhouse/devices/door/control`
- `greenhouse/devices/window/control`
- `greenhouse/devices/fan/control`

## Troubleshooting

### Connection Issues
1. Verify MQTT broker is running: `docker ps | grep mqtt`
2. Check WebSocket port is exposed: `mqtt://mqtt.noboroto.id.vn:1883`
3. Verify credentials match those in `.env` file

### Authentication Issues
1. Ensure `NEXT_PUBLIC_MQTT_USERNAME` and `NEXT_PUBLIC_MQTT_PASSWORD` are set
2. Verify credentials match MQTT broker configuration
3. Check MQTT broker logs: `docker logs aiot_greenhouse_mqtt`

### Environment Variable Issues
1. Restart development server after changing `.env` file
2. Verify environment variables are prefixed with `NEXT_PUBLIC_`
3. Check browser console for connection logs

## Security Notes

- Never commit actual credentials to version control
- Use strong passwords in production
- Consider using environment-specific credential management
- MQTT credentials are visible in browser console (development mode)

## Migration from Hardcoded Configuration

The frontend previously used hardcoded MQTT broker URLs pointing to `broker.hivemq.com`. With this update:

1. ✅ MQTT broker URL is now configurable via environment variables
2. ✅ Authentication is properly configured
3. ✅ Local MQTT broker is used by default
4. ✅ Fallback configuration is available for testing
5. ✅ Docker environment variables are properly configured
