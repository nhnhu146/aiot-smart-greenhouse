# Troubleshooting Guide

## Quick Diagnostics

### System Health Check
```bash
# Check all services status
docker compose ps

# View service logs
docker compose logs backend
docker compose logs frontend
docker compose logs mongodb
docker compose logs redis

# API health check
curl http://localhost:5000/api/health
```

### Common Issues Quick Reference
| Issue | Symptom | Quick Fix |
|-------|---------|-----------|
| Frontend won't load | Blank page, console errors | Check API_URL in .env |
| API errors | 500 responses | Check MongoDB connection |
| WebSocket disconnected | No real-time updates | Check CORS_ORIGIN setting |
| Mock data not working | Toggle doesn't work | Check browser local storage |
| Device control fails | Commands not executing | Check MQTT broker connection |

## Frontend Issues

### 1. Application Won't Start

**Symptoms**:
- `yarn dev` fails
- Build errors during startup
- Blank page in browser

**Diagnostic Steps**:
```bash
# Check Node.js version
node --version  # Should be 18+

# Check package dependencies
cd frontend
yarn list --depth=0

# Clear cache and reinstall
rm -rf node_modules
yarn install

# Check environment configuration
cat .env
```

**Common Solutions**:

**Missing Environment Variables**:
```bash
# Create .env file with required variables
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
VITE_APP_TITLE=Smart Greenhouse
VITE_ENABLE_MOCK_DATA=true
```

**Node.js Version Issues**:
```bash
# Update to Node.js 18+
nvm install 18
nvm use 18
yarn install
```

**Build Configuration Errors**:
```bash
# Check TypeScript configuration
yarn type-check

# Check Vite configuration
yarn build --dry-run
```

### 2. API Connection Issues

**Symptoms**:
- "Network Error" messages
- API calls timing out
- Authentication failures

**Diagnostic Steps**:
```bash
# Test API connectivity
curl http://localhost:5000/api/health

# Check frontend API configuration
grep -r "API_URL" frontend/src/

# Test WebSocket connection
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Key: test" \
     -H "Sec-WebSocket-Version: 13" \
     http://localhost:5000/socket.io/
```

**Solutions**:

**CORS Issues**:
```typescript
// backend/src/config/AppConfig.ts - Check CORS configuration
cors: {
  origin: env.CORS_ORIGIN, // Must match frontend URL
}
```

**API URL Mismatch**:
```bash
# Frontend .env
VITE_API_URL=http://localhost:5000  # Backend URL
VITE_WS_URL=ws://localhost:5000     # WebSocket URL
```

**Network Connectivity**:
```bash
# Check if backend is running
netstat -an | findstr :5000

# Check Docker network
docker network ls
docker network inspect multi-domain
```

### 3. Real-time Updates Not Working

**Symptoms**:
- Dashboard data doesn't update automatically
- WebSocket connection shows as disconnected
- No toast notifications

**Solutions**:

**WebSocket Configuration**:
```typescript
// frontend/src/config/AppConfig.ts
export const Config = {
  api: {
    wsUrl: getWebSocketUrl(), // Must be correct WebSocket URL
    timeout: AppConstants.API.TIMEOUT
  }
};
```

**Connection Status Check**:
```typescript
// Check WebSocket context in browser dev tools
// Look for connection status indicators
// Verify WebSocket events in Network tab
```

**Backend WebSocket Setup**:
```bash
# Check backend WebSocket configuration
grep -r "socket.io" backend/src/
docker compose logs backend | grep -i websocket
```

### 4. Mock Data Toggle Issues

**Symptoms**:
- Toggle switch doesn't work
- Mock data not generating
- Settings not persisting

**Solutions**:

**Local Storage Check**:
```javascript
// Browser console
localStorage.getItem('useMockData')
localStorage.setItem('useMockData', 'true')
```

**Component State Debugging**:
```typescript
// MockDataToggle.tsx - Check state management
const [isMockEnabled, setIsMockEnabled] = useState<boolean>(false);

// Verify MockDataConfig service
import { MockDataConfig } from '../services/MockDataConfig';
// Debug mock data status  
const mockStatus = MockDataConfig.isEnabled();
console.log('Mock enabled:', mockStatus);
```

**Feature Flag Check**:
```bash
# Check if mock data feature is enabled
grep VITE_ENABLE_MOCK_DATA frontend/.env
```

## Backend Issues

### 1. Server Won't Start

**Symptoms**:
- `yarn dev` fails immediately
- Environment validation errors
- Port already in use errors

**Diagnostic Steps**:
```bash
# Check Node.js and yarn versions
node --version  # Should be 18+
yarn --version

# Check port usage
netstat -an | findstr :5000
# Kill process if needed: taskkill /PID <PID> /F

# Environment validation
cd backend
yarn type-check
```

**Solutions**:

**Environment Validation Errors**:
```bash
# Common validation failures
❌ Environment validation failed:
  - JWT_SECRET: Required
  - MONGODB_URI: Required
  - MQTT_BROKER_URL: Required

# Fix by setting required variables in .env
JWT_SECRET=your-secure-secret-key-here
MONGODB_URI=mongodb://localhost:27017/greenhouse
MQTT_BROKER_URL=mqtt://mqtt.noboroto.id.vn:1883
```

**Port Conflicts**:
```bash
# Change port in .env
PORT=5001

# Or kill existing process
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**TypeScript Compilation Errors**:
```bash
# Fix TypeScript errors
yarn type-check
yarn lint
```

### 2. Database Connection Issues

**Symptoms**:
- "MongooseServerSelectionError"
- "Connection refused"
- API endpoints returning 500 errors

**Diagnostic Steps**:
```bash
# Check MongoDB status
docker compose ps | findstr mongodb
docker compose logs mongodb

# Test MongoDB connection
mongo mongodb://localhost:27017/greenhouse
# Or use MongoDB Compass

# Check MongoDB configuration
cat backend/.env | grep MONGODB
```

**Solutions**:

**MongoDB Not Running**:
```bash
# Start MongoDB service
docker compose up -d mongodb

# Check MongoDB logs
docker compose logs mongodb

# Restart if needed
docker compose restart mongodb
```

**Connection String Issues**:
```bash
# Correct format for local development
MONGODB_URI=mongodb://localhost:27017/greenhouse

# For Docker containers
MONGODB_URI=mongodb://mongodb:27017/greenhouse

# With authentication
MONGODB_URI=mongodb://username:password@localhost:27017/greenhouse
```

**Network Issues**:
```bash
# Check Docker network
docker network ls
docker network inspect multi-domain

# Recreate network if needed
docker network rm multi-domain
./create-network.ps1
```

### 3. Redis Connection Issues

**Symptoms**:
- Session management not working
- Rate limiting failures
- Cache-related errors

**Solutions**:

**Redis Not Running**:
```bash
# Start Redis service
docker compose up -d redis

# Check Redis status
docker compose exec redis redis-cli ping
# Should return: PONG
```

**Connection Configuration**:
```bash
# Local development
REDIS_URL=redis://localhost:6379

# Docker environment
REDIS_URL=redis://redis:6379

# With password
REDIS_URL=redis://:password@localhost:6379
```

### 4. MQTT Connection Issues

**Symptoms**:
- Device commands not working
- Sensor data not updating
- MQTT connection errors in logs

**Solutions**:

**Broker Connectivity**:
```bash
# Test MQTT broker connection
# Install MQTT client: yarn install -g mqtt
mqtt pub -h mqtt.noboroto.id.vn -p 1883 -t test/topic -m "test message"
mqtt sub -h mqtt.noboroto.id.vn -p 1883 -t test/topic
```

**Configuration Check**:
```bash
# Verify MQTT settings in .env
MQTT_BROKER_URL=mqtt://mqtt.noboroto.id.vn:1883
MQTT_HOST=mqtt.noboroto.id.vn
MQTT_PORT=1883
```

**Authentication Issues**:
```bash
# If broker requires authentication
MQTT_USERNAME=your-username
MQTT_PASSWORD=your-password
```

### 5. Authentication Issues

**Symptoms**:
- Login failures
- JWT token errors
- Session expired messages

**Solutions**:

**JWT Secret Configuration**:
```bash
# Ensure JWT_SECRET is set and consistent
JWT_SECRET=your-very-secure-secret-key-minimum-32-characters

# Check token generation
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

**User Account Issues**:
```bash
# Create admin user
cd backend
node create-admin.js

# Check user in database
mongo mongodb://localhost:27017/greenhouse
> db.users.find()
```

## Docker Issues

### 1. Container Build Failures

**Symptoms**:
- `docker compose build` fails
- Image build errors
- Dependency installation failures

**Solutions**:

**Clear Docker Cache**:
```bash
# Remove all containers and images
docker compose down --rmi all --volumes

# Clean Docker system
docker system prune -a

# Rebuild from scratch
docker compose build --no-cache
docker compose up -d
```

**Node.js Build Issues**:
```bash
# Check Dockerfile configuration
# Ensure correct Node.js version
FROM node:18-alpine

# Clear npm cache in container
RUN yarn cache clean
```

### 2. Container Communication Issues

**Symptoms**:
- Services can't reach each other
- DNS resolution failures
- Network timeouts

**Solutions**:

**Network Configuration**:
```bash
# Check Docker network
docker network ls
docker network inspect multi-domain

# Recreate network
docker network rm multi-domain
./create-network.ps1
docker compose up -d
```

**Service Discovery**:
```yaml
# Use service names in docker-compose.yml
MONGODB_URI=mongodb://mongodb:27017/greenhouse
REDIS_URL=redis://redis:6379
```

### 3. Volume and Data Persistence Issues

**Symptoms**:
- Data lost after container restart
- Volume mount failures
- Permission issues

**Solutions**:

**Volume Management**:
```bash
# Check volumes
docker volume ls

# Backup data before cleanup
docker compose down
docker volume ls

# Create fresh volumes
docker volume rm $(docker volume ls -q)
docker compose up -d
```

**Permission Issues**:
```bash
# Fix file permissions
chmod -R 755 ./logs
chown -R $USER:$USER ./logs
```

## Performance Issues

### 1. Slow API Responses

**Symptoms**:
- API calls taking > 5 seconds
- Database query timeouts
- High memory usage

**Diagnostic Steps**:
```bash
# Check system resources
docker stats

# Monitor database performance
docker compose exec mongodb mongostat

# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5000/api/sensors/latest
```

**Solutions**:

**Database Optimization**:
```javascript
// Add database indexes
db.sensorData.createIndex({ "timestamp": -1 })
db.deviceStatus.createIndex({ "deviceId": 1, "lastUpdate": -1 })
db.alerts.createIndex({ "createdAt": -1, "acknowledged": 1 })
```

**Query Optimization**:
```typescript
// Limit large queries
const sensors = await SensorData.find()
  .sort({ timestamp: -1 })
  .limit(AppConstants.MAX_SENSOR_RECORDS_PER_QUERY)
  .lean(); // Use lean() for read-only queries
```

**Memory Management**:
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096"
```

### 2. WebSocket Performance Issues

**Symptoms**:
- Delayed real-time updates
- Connection drops
- High CPU usage

**Solutions**:

**Connection Optimization**:
```typescript
// backend/src/services/WebSocketService.ts
const io = new Server(server, {
  pingTimeout: Config.websocket.pingTimeout,
  pingInterval: Config.websocket.pingInterval,
  transports: ['websocket'], // Disable polling
});
```

**Event Throttling**:
```typescript
// Throttle high-frequency events
const throttledBroadcast = throttle((event, data) => {
  io.emit(event, data);
}, 100); // Max 10 events per second
```

## Security Issues

### 1. Authentication Bypass

**Symptoms**:
- Unauthorized API access
- JWT token validation failures
- Session hijacking

**Solutions**:

**Token Validation**:
```typescript
// Verify JWT middleware is properly configured
app.use('/api', authenticateToken);

// Check token expiration
JWT_EXPIRES_IN=24h  // Adjust as needed
```

**CORS Configuration**:
```typescript
// Restrict CORS to specific origins
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com
```

### 2. Rate Limiting Issues

**Symptoms**:
- API abuse
- DDoS-like behavior
- Resource exhaustion

**Solutions**:

**Rate Limit Configuration**:
```bash
# Adjust rate limits in .env
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
AUTOMATION_RATE_LIMIT=100      # Max requests per window
```

**IP-based Limiting**:
```typescript
// Configure express-rate-limit
const limiter = rateLimit({
  windowMs: Config.rateLimit.windowMs,
  max: Config.rateLimit.automationLimit,
  standardHeaders: true,
  legacyHeaders: false,
});
```

## Monitoring and Debugging

### 1. Log Analysis

**Backend Logs**:
```bash
# View real-time logs
docker compose logs -f backend

# Search for specific errors
docker compose logs backend | grep -i error

# Check log files
tail -f backend/logs/error.log
tail -f backend/logs/combined.log
```

**Frontend Debugging**:
```bash
# Browser console for client-side issues
# Network tab for API call debugging
# Application tab for local storage inspection
```

### 2. Database Debugging

**MongoDB**:
```javascript
// Connect to MongoDB shell
mongo mongodb://localhost:27017/greenhouse

// Check collection counts
db.sensorData.count()
db.users.count()
db.alerts.count()

// Find recent errors
db.sensorData.find().sort({timestamp: -1}).limit(10)
```

**Redis**:
```bash
# Connect to Redis CLI
docker compose exec redis redis-cli

# Check keys and values
KEYS *
GET session:*
INFO memory
```

### 3. Performance Monitoring

**System Metrics**:
```bash
# Container resource usage
docker stats

# System resource usage
htop
iostat -x 1

# Network statistics
netstat -i
ss -tuln
```

**Application Metrics**:
```bash
# API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5000/api/health

# WebSocket connections
# Check browser dev tools -> Network -> WS
```

## Emergency Procedures

### 1. Complete System Reset

```bash
# Stop all services
docker compose down --rmi all --volumes

# Clean Docker system
docker system prune -a -f

# Remove all data
rm -rf backend/logs/*
docker volume prune -f

# Restart from scratch
./create-network.ps1
docker compose up -d --build

# Create admin user
cd backend && node create-admin.js
```

### 2. Data Recovery

```bash
# Backup before recovery
docker compose exec mongodb mongodump --out /backup

# Restore from backup
docker compose exec mongodb mongorestore /backup
```

### 3. Configuration Reset

```bash
# Reset to default configuration
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit with your specific values
# Restart services
docker compose restart
```

## Getting Help

### 1. Enable Debug Mode

```bash
# Backend debugging
DEBUG=greenhouse:* yarn dev

# Frontend debugging
VITE_ENABLE_DEBUG=true yarn dev
```

### 2. Collect System Information

```bash
# System information script
echo "=== System Information ===" > debug-info.txt
echo "Node.js version: $(node --version)" >> debug-info.txt
echo "Yarn version: $(yarn --version)" >> debug-info.txt
echo "Docker version: $(docker --version)" >> debug-info.txt
echo "Docker Compose version: $(docker compose version)" >> debug-info.txt
echo "" >> debug-info.txt

echo "=== Service Status ===" >> debug-info.txt
docker compose ps >> debug-info.txt
echo "" >> debug-info.txt

echo "=== Recent Logs ===" >> debug-info.txt
docker compose logs --tail=50 backend >> debug-info.txt
```

### 3. Common Support Resources

- **Configuration Issues**: Check ENVIRONMENT_VARIABLES.md
- **Setup Problems**: Review LOCAL_DEVELOPMENT_SETUP.md
- **Architecture Questions**: See SYSTEM_OVERVIEW.md
- **Feature Usage**: Consult USE_CASES.md

### 4. Report Issues

When reporting issues, include:
1. **Environment**: OS, Node.js version, Docker version
2. **Steps to reproduce**: Exact commands and actions
3. **Expected vs actual behavior**: What should happen vs what happens
4. **Error messages**: Complete error output
5. **Configuration**: Relevant environment variables (without secrets)
6. **Logs**: Recent log entries from affected services

This troubleshooting guide should help resolve most common issues. For complex problems, systematic debugging using the diagnostic steps will help identify the root cause.# Troubleshooting Guide

## Quick Diagnostics

### System Health Check
```bash
# Check all services status
docker compose ps

# View service logs
docker compose logs backend
docker compose logs frontend
docker compose logs mongodb
docker compose logs redis

# API health check
curl http://localhost:5000/api/health
```

### Common Issues Quick Reference
| Issue | Symptom | Quick Fix |
|-------|---------|-----------|
| Frontend won't load | Blank page, console errors | Check API_URL in .env |
| API errors | 500 responses | Check MongoDB connection |
| WebSocket disconnected | No real-time updates | Check CORS_ORIGIN setting |
| Mock data not working | Toggle doesn't work | Check browser local storage |
| Device control fails | Commands not executing | Check MQTT broker connection |

## Frontend Issues

### 1. Application Won't Start

**Symptoms**:
- `yarn dev` fails
- Build errors during startup
- Blank page in browser

**Diagnostic Steps**:
```bash
# Check Node.js version
node --version  # Should be 18+

# Check package dependencies
cd frontend
yarn list --depth=0

# Clear cache and reinstall
rm -rf node_modules
yarn install

# Check environment configuration
cat .env
```

**Common Solutions**:

**Missing Environment Variables**:
```bash
# Create .env file with required variables
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
VITE_APP_TITLE=Smart Greenhouse
VITE_ENABLE_MOCK_DATA=true
```

**Node.js Version Issues**:
```bash
# Update to Node.js 18+
nvm install 18
nvm use 18
yarn install
```

**Build Configuration Errors**:
```bash
# Check TypeScript configuration
yarn type-check

# Check Vite configuration
yarn build --dry-run
```

### 2. API Connection Issues

**Symptoms**:
- "Network Error" messages
- API calls timing out
- Authentication failures

**Diagnostic Steps**:
```bash
# Test API connectivity
curl http://localhost:5000/api/health

# Check frontend API configuration
grep -r "API_URL" frontend/src/

# Test WebSocket connection
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Key: test" \
     -H "Sec-WebSocket-Version: 13" \
     http://localhost:5000/socket.io/
```

**Solutions**:

**CORS Issues**:
```typescript
// backend/src/config/AppConfig.ts - Check CORS configuration
cors: {
  origin: env.CORS_ORIGIN, // Must match frontend URL
}
```

**API URL Mismatch**:
```bash
# Frontend .env
VITE_API_URL=http://localhost:5000  # Backend URL
VITE_WS_URL=ws://localhost:5000     # WebSocket URL
```

**Network Connectivity**:
```bash
# Check if backend is running
netstat -an | findstr :5000

# Check Docker network
docker network ls
docker network inspect multi-domain
```

### 3. Real-time Updates Not Working

**Symptoms**:
- Dashboard data doesn't update automatically
- WebSocket connection shows as disconnected
- No toast notifications

**Solutions**:

**WebSocket Configuration**:
```typescript
// frontend/src/config/AppConfig.ts
export const Config = {
  api: {
    wsUrl: getWebSocketUrl(), // Must be correct WebSocket URL
    timeout: AppConstants.API.TIMEOUT
  }
};
```

**Connection Status Check**:
```typescript
// Check WebSocket context in browser dev tools
// Look for connection status indicators
// Verify WebSocket events in Network tab
```

**Backend WebSocket Setup**:
```bash
# Check backend WebSocket configuration
grep -r "socket.io" backend/src/
docker compose logs backend | grep -i websocket
```

### 4. Mock Data Toggle Issues

**Symptoms**:
- Toggle switch doesn't work
- Mock data not generating
- Settings not persisting

**Solutions**:

**Local Storage Check**:
```javascript
// Browser console
localStorage.getItem('useMockData')
localStorage.setItem('useMockData', 'true')
```

**Component State Debugging**:
```typescript
// MockDataToggle.tsx - Check state management
const [isMockEnabled, setIsMockEnabled] = useState<boolean>(false);

// Verify MockDataConfig service
import { MockDataConfig } from '../services/MockDataConfig';
// Debug mock data status  
const mockStatus = MockDataConfig.isEnabled();
console.log('Mock enabled:', mockStatus);
```

**Feature Flag Check**:
```bash
# Check if mock data feature is enabled
grep VITE_ENABLE_MOCK_DATA frontend/.env
```

## Backend Issues

### 1. Server Won't Start

**Symptoms**:
- `yarn dev` fails immediately
- Environment validation errors
- Port already in use errors

**Diagnostic Steps**:
```bash
# Check Node.js and yarn versions
node --version  # Should be 18+
yarn --version

# Check port usage
netstat -an | findstr :5000
# Kill process if needed: taskkill /PID <PID> /F

# Environment validation
cd backend
yarn type-check
```

**Solutions**:

**Environment Validation Errors**:
```bash
# Common validation failures
❌ Environment validation failed:
  - JWT_SECRET: Required
  - MONGODB_URI: Required
  - MQTT_BROKER_URL: Required

# Fix by setting required variables in .env
JWT_SECRET=your-secure-secret-key-here
MONGODB_URI=mongodb://localhost:27017/greenhouse
MQTT_BROKER_URL=mqtt://mqtt.noboroto.id.vn:1883
```

**Port Conflicts**:
```bash
# Change port in .env
PORT=5001

# Or kill existing process
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**TypeScript Compilation Errors**:
```bash
# Fix TypeScript errors
yarn type-check
yarn lint
```

### 2. Database Connection Issues

**Symptoms**:
- "MongooseServerSelectionError"
- "Connection refused"
- API endpoints returning 500 errors

**Diagnostic Steps**:
```bash
# Check MongoDB status
docker compose ps | findstr mongodb
docker compose logs mongodb

# Test MongoDB connection
mongo mongodb://localhost:27017/greenhouse
# Or use MongoDB Compass

# Check MongoDB configuration
cat backend/.env | grep MONGODB
```

**Solutions**:

**MongoDB Not Running**:
```bash
# Start MongoDB service
docker compose up -d mongodb

# Check MongoDB logs
docker compose logs mongodb

# Restart if needed
docker compose restart mongodb
```

**Connection String Issues**:
```bash
# Correct format for local development
MONGODB_URI=mongodb://localhost:27017/greenhouse

# For Docker containers
MONGODB_URI=mongodb://mongodb:27017/greenhouse

# With authentication
MONGODB_URI=mongodb://username:password@localhost:27017/greenhouse
```

**Network Issues**:
```bash
# Check Docker network
docker network ls
docker network inspect multi-domain

# Recreate network if needed
docker network rm multi-domain
./create-network.ps1
```

### 3. Redis Connection Issues

**Symptoms**:
- Session management not working
- Rate limiting failures
- Cache-related errors

**Solutions**:

**Redis Not Running**:
```bash
# Start Redis service
docker compose up -d redis

# Check Redis status
docker compose exec redis redis-cli ping
# Should return: PONG
```

**Connection Configuration**:
```bash
# Local development
REDIS_URL=redis://localhost:6379

# Docker environment
REDIS_URL=redis://redis:6379

# With password
REDIS_URL=redis://:password@localhost:6379
```

### 4. MQTT Connection Issues

**Symptoms**:
- Device commands not working
- Sensor data not updating
- MQTT connection errors in logs

**Solutions**:

**Broker Connectivity**:
```bash
# Test MQTT broker connection
# Install MQTT client: yarn install -g mqtt
mqtt pub -h mqtt.noboroto.id.vn -p 1883 -t test/topic -m "test message"
mqtt sub -h mqtt.noboroto.id.vn -p 1883 -t test/topic
```

**Configuration Check**:
```bash
# Verify MQTT settings in .env
MQTT_BROKER_URL=mqtt://mqtt.noboroto.id.vn:1883
MQTT_HOST=mqtt.noboroto.id.vn
MQTT_PORT=1883
```

**Authentication Issues**:
```bash
# If broker requires authentication
MQTT_USERNAME=your-username
MQTT_PASSWORD=your-password
```

### 5. Authentication Issues

**Symptoms**:
- Login failures
- JWT token errors
- Session expired messages

**Solutions**:

**JWT Secret Configuration**:
```bash
# Ensure JWT_SECRET is set and consistent
JWT_SECRET=your-very-secure-secret-key-minimum-32-characters

# Check token generation
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

**User Account Issues**:
```bash
# Create admin user
cd backend
node create-admin.js

# Check user in database
mongo mongodb://localhost:27017/greenhouse
> db.users.find()
```

## Docker Issues

### 1. Container Build Failures

**Symptoms**:
- `docker compose build` fails
- Image build errors
- Dependency installation failures

**Solutions**:

**Clear Docker Cache**:
```bash
# Remove all containers and images
docker compose down --rmi all --volumes

# Clean Docker system
docker system prune -a

# Rebuild from scratch
docker compose build --no-cache
docker compose up -d
```

**Node.js Build Issues**:
```bash
# Check Dockerfile configuration
# Ensure correct Node.js version
FROM node:18-alpine

# Clear npm cache in container
RUN yarn cache clean
```

### 2. Container Communication Issues

**Symptoms**:
- Services can't reach each other
- DNS resolution failures
- Network timeouts

**Solutions**:

**Network Configuration**:
```bash
# Check Docker network
docker network ls
docker network inspect multi-domain

# Recreate network
docker network rm multi-domain
./create-network.ps1
docker compose up -d
```

**Service Discovery**:
```yaml
# Use service names in docker-compose.yml
MONGODB_URI=mongodb://mongodb:27017/greenhouse
REDIS_URL=redis://redis:6379
```

### 3. Volume and Data Persistence Issues

**Symptoms**:
- Data lost after container restart
- Volume mount failures
- Permission issues

**Solutions**:

**Volume Management**:
```bash
# Check volumes
docker volume ls

# Backup data before cleanup
docker compose down
docker volume ls

# Create fresh volumes
docker volume rm $(docker volume ls -q)
docker compose up -d
```

**Permission Issues**:
```bash
# Fix file permissions
chmod -R 755 ./logs
chown -R $USER:$USER ./logs
```

## Performance Issues

### 1. Slow API Responses

**Symptoms**:
- API calls taking > 5 seconds
- Database query timeouts
- High memory usage

**Diagnostic Steps**:
```bash
# Check system resources
docker stats

# Monitor database performance
docker compose exec mongodb mongostat

# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5000/api/sensors/latest
```

**Solutions**:

**Database Optimization**:
```javascript
// Add database indexes
db.sensorData.createIndex({ "timestamp": -1 })
db.deviceStatus.createIndex({ "deviceId": 1, "lastUpdate": -1 })
db.alerts.createIndex({ "createdAt": -1, "acknowledged": 1 })
```

**Query Optimization**:
```typescript
// Limit large queries
const sensors = await SensorData.find()
  .sort({ timestamp: -1 })
  .limit(AppConstants.MAX_SENSOR_RECORDS_PER_QUERY)
  .lean(); // Use lean() for read-only queries
```

**Memory Management**:
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096"
```

### 2. WebSocket Performance Issues

**Symptoms**:
- Delayed real-time updates
- Connection drops
- High CPU usage

**Solutions**:

**Connection Optimization**:
```typescript
// backend/src/services/WebSocketService.ts
const io = new Server(server, {
  pingTimeout: Config.websocket.pingTimeout,
  pingInterval: Config.websocket.pingInterval,
  transports: ['websocket'], // Disable polling
});
```

**Event Throttling**:
```typescript
// Throttle high-frequency events
const throttledBroadcast = throttle((event, data) => {
  io.emit(event, data);
}, 100); // Max 10 events per second
```

## Security Issues

### 1. Authentication Bypass

**Symptoms**:
- Unauthorized API access
- JWT token validation failures
- Session hijacking

**Solutions**:

**Token Validation**:
```typescript
// Verify JWT middleware is properly configured
app.use('/api', authenticateToken);

// Check token expiration
JWT_EXPIRES_IN=24h  // Adjust as needed
```

**CORS Configuration**:
```typescript
// Restrict CORS to specific origins
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com
```

### 2. Rate Limiting Issues

**Symptoms**:
- API abuse
- DDoS-like behavior
- Resource exhaustion

**Solutions**:

**Rate Limit Configuration**:
```bash
# Adjust rate limits in .env
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
AUTOMATION_RATE_LIMIT=100      # Max requests per window
```

**IP-based Limiting**:
```typescript
// Configure express-rate-limit
const limiter = rateLimit({
  windowMs: Config.rateLimit.windowMs,
  max: Config.rateLimit.automationLimit,
  standardHeaders: true,
  legacyHeaders: false,
});
```

## Monitoring and Debugging

### 1. Log Analysis

**Backend Logs**:
```bash
# View real-time logs
docker compose logs -f backend

# Search for specific errors
docker compose logs backend | grep -i error

# Check log files
tail -f backend/logs/error.log
tail -f backend/logs/combined.log
```

**Frontend Debugging**:
```bash
# Browser console for client-side issues
# Network tab for API call debugging
# Application tab for local storage inspection
```

### 2. Database Debugging

**MongoDB**:
```javascript
// Connect to MongoDB shell
mongo mongodb://localhost:27017/greenhouse

// Check collection counts
db.sensorData.count()
db.users.count()
db.alerts.count()

// Find recent errors
db.sensorData.find().sort({timestamp: -1}).limit(10)
```

**Redis**:
```bash
# Connect to Redis CLI
docker compose exec redis redis-cli

# Check keys and values
KEYS *
GET session:*
INFO memory
```

### 3. Performance Monitoring

**System Metrics**:
```bash
# Container resource usage
docker stats

# System resource usage
htop
iostat -x 1

# Network statistics
netstat -i
ss -tuln
```

**Application Metrics**:
```bash
# API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5000/api/health

# WebSocket connections
# Check browser dev tools -> Network -> WS
```

## Emergency Procedures

### 1. Complete System Reset

```bash
# Stop all services
docker compose down --rmi all --volumes

# Clean Docker system
docker system prune -a -f

# Remove all data
rm -rf backend/logs/*
docker volume prune -f

# Restart from scratch
./create-network.ps1
docker compose up -d --build

# Create admin user
cd backend && node create-admin.js
```

### 2. Data Recovery

```bash
# Backup before recovery
docker compose exec mongodb mongodump --out /backup

# Restore from backup
docker compose exec mongodb mongorestore /backup
```

### 3. Configuration Reset

```bash
# Reset to default configuration
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit with your specific values
# Restart services
docker compose restart
```

## Getting Help

### 1. Enable Debug Mode

```bash
# Backend debugging
DEBUG=greenhouse:* yarn dev

# Frontend debugging
VITE_ENABLE_DEBUG=true yarn dev
```

### 2. Collect System Information

```bash
# System information script
echo "=== System Information ===" > debug-info.txt
echo "Node.js version: $(node --version)" >> debug-info.txt
echo "Yarn version: $(yarn --version)" >> debug-info.txt
echo "Docker version: $(docker --version)" >> debug-info.txt
echo "Docker Compose version: $(docker compose version)" >> debug-info.txt
echo "" >> debug-info.txt

echo "=== Service Status ===" >> debug-info.txt
docker compose ps >> debug-info.txt
echo "" >> debug-info.txt

echo "=== Recent Logs ===" >> debug-info.txt
docker compose logs --tail=50 backend >> debug-info.txt
```

### 3. Common Support Resources

- **Configuration Issues**: Check ENVIRONMENT_VARIABLES.md
- **Setup Problems**: Review LOCAL_DEVELOPMENT_SETUP.md
- **Architecture Questions**: See SYSTEM_OVERVIEW.md
- **Feature Usage**: Consult USE_CASES.md

### 4. Report Issues

When reporting issues, include:
1. **Environment**: OS, Node.js version, Docker version
2. **Steps to reproduce**: Exact commands and actions
3. **Expected vs actual behavior**: What should happen vs what happens
4. **Error messages**: Complete error output
5. **Configuration**: Relevant environment variables (without secrets)
6. **Logs**: Recent log entries from affected services

This troubleshooting guide should help resolve most common issues. For complex problems, systematic debugging using the diagnostic steps will help identify the root cause.