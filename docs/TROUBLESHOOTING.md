# 🛠️ Troubleshooting Guide

## 🚨 Common Issues & Solutions

### 🗃️ Database Issues

#### MongoDB Connection Failed
**Symptoms**: 
- Application fails to start
- Error: "MongoError: Authentication failed"
- Error: "Connection timeout"

**Solutions**:
```bash
# 1. Check MongoDB service status
docker ps | grep mongo
# or
systemctl status mongod

# 2. Verify connection string
echo $MONGODB_URI

# 3. Test connection manually
mongosh $MONGODB_URI

# 4. Reset MongoDB container
docker compose down
docker volume rm aiot-smart-greenhouse_mongodb_data
docker compose up -d mongodb
```

#### Redis Connection Issues
**Symptoms**:
- Caching not working
- Session data lost
- WebSocket scaling issues

**Solutions**:
```bash
# 1. Test Redis connection
docker exec -it aiot_greenhouse_redis redis-cli ping

# 2. Check Redis logs
docker logs aiot_greenhouse_redis

# 3. Restart Redis
docker compose restart redis
```

---

### 🌐 Network & Connectivity

#### MQTT Connection Timeout
**Symptoms**:
- IoT devices not sending data
- Voice commands not working
- Error: "MQTT connection timeout"

**Solutions**:
```bash
# 1. Test MQTT broker connectivity
telnet mqtt.noboroto.id.vn 1883

# 2. Check MQTT credentials
mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -t "test/topic" -m "test"

# 3. Verify firewall settings
# Allow outbound port 1883

# 4. Check backend MQTT configuration
grep MQTT backend/.env
```

#### WebSocket Connection Drops
**Symptoms**:
- Real-time data stops updating
- Connection indicator shows disconnected
- Frequent reconnection attempts

**Solutions**:
```bash
# 1. Check WebSocket endpoint accessibility
curl -I http://localhost:5000/socket.io/

# 2. Verify CORS configuration
# Check FRONTEND_URL in backend/.env

# 3. Monitor WebSocket events in browser DevTools
# Network tab -> WS/WSS connections

# 4. Adjust connection timeout settings
# In backend: WEBSOCKET_PING_TIMEOUT=60000
```

#### API Requests Failing
**Symptoms**:
- Frontend shows "Network error"
- HTTP 500/502/503 errors
- API endpoints not responding

**Solutions**:
```bash
# 1. Test API health endpoint
curl http://localhost:5000/api/health

# 2. Check backend service status
docker compose ps backend

# 3. View backend logs
docker compose logs -f backend

# 4. Verify API URL configuration
echo $VITE_API_URL  # Frontend
echo $API_PREFIX    # Backend
```

---

### 🔐 Authentication Issues

#### JWT Token Expired
**Symptoms**:
- User logged out unexpectedly
- API returns 401 Unauthorized
- "Token expired" messages

**Solutions**:
```bash
# 1. Check JWT configuration
grep JWT backend/.env

# 2. Clear browser localStorage
localStorage.clear()  # In browser console

# 3. Verify JWT secret is set
echo $JWT_SECRET

# 4. Check token expiration settings
# JWT_EXPIRES_IN=24h in .env
```

#### Login Fails with Correct Credentials
**Symptoms**:
- "Invalid email or password" with correct info
- User exists but cannot login
- Authentication service errors

**Solutions**:
```bash
# 1. Check user in database
mongosh $MONGODB_URI
use greenhouse
db.users.find({email: "user@example.com"})

# 2. Create admin user if needed
cd backend && node create-admin.js

# 3. Reset password
# Use forgot password feature

# 4. Check bcrypt configuration
grep BCRYPT backend/.env
```

---

### 📧 Email Service Issues

#### Email Notifications Not Sending
**Symptoms**:
- No alert emails received
- SMTP authentication errors
- Email test fails

**Solutions**:
```bash
# 1. Test email configuration
curl -X POST http://localhost:5000/api/settings/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# 2. Verify SMTP settings
grep EMAIL backend/.env

# 3. Check Gmail app password (if using Gmail)
# Enable 2FA and generate app password

# 4. Test SMTP connectivity
telnet smtp.gmail.com 587
```

#### Email Templates Not Loading
**Symptoms**:
- Plain text emails instead of HTML
- Template not found errors
- Formatting issues

**Solutions**:
```bash
# 1. Check template files exist
ls -la backend/src/templates/

# 2. Copy templates if missing
cd backend && node copy-templates.js

# 3. Verify template loader path
# Check TemplateLoader.ts configuration
```

---

### 🎛️ Device Control Issues

#### Devices Not Responding
**Symptoms**:
- Device control buttons don't work
- No status feedback from devices
- MQTT commands not reaching devices

**Solutions**:
```bash
# 1. Check MQTT topic publishing
mosquitto_sub -h mqtt.noboroto.id.vn -p 1883 -t "greenhouse/controls/+"

# 2. Verify device MQTT configuration
# Check ESP32 code for topic subscriptions

# 3. Test manual MQTT command
mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 \
  -t "greenhouse/controls/light" -m "ON"

# 4. Check device power and WiFi connection
```

#### Automation Not Working
**Symptoms**:
- Automation rules don't trigger
- Sensor data not triggering actions
- Manual automation check fails

**Solutions**:
```bash
# 1. Check automation status
curl http://localhost:5000/api/automation/status

# 2. Verify threshold settings
curl http://localhost:5000/api/automation/settings

# 3. Test manual automation trigger
curl -X POST http://localhost:5000/api/automation/trigger

# 4. Check automation logs
docker compose logs -f backend | grep automation
```

---

### 📊 Data & Visualization Issues

#### Charts Not Loading
**Symptoms**:
- Empty chart areas
- "No data available" messages
- Chart.js errors in console

**Solutions**:
```bash
# 1. Check sensor data in database
mongosh $MONGODB_URI
use greenhouse
db.sensordatas.find().sort({createdAt: -1}).limit(5)

# 2. Test chart data API
curl http://localhost:5000/api/sensors/chart-data?range=24h

# 3. Clear browser cache
# Hard refresh (Ctrl+Shift+R)

# 4. Check Chart.js version compatibility
# npm list chart.js react-chartjs-2
```

#### Historical Data Missing
**Symptoms**:
- History page shows empty results
- Export functions return no data
- Database queries timeout

**Solutions**:
```bash
# 1. Check database indexes
mongosh $MONGODB_URI
use greenhouse
db.sensordatas.getIndexes()

# 2. Verify data retention settings
# Check if old data was cleaned up

# 3. Re-seed database if needed
node scripts/init-mongo.js

# 4. Check query filters
# Verify date ranges and filters
```

---

### 🖥️ Frontend Issues

#### White Screen / Application Won't Load
**Symptoms**:
- Blank page after loading
- JavaScript errors in console
- Bundle loading failures

**Solutions**:
```bash
# 1. Check browser console for errors
# F12 -> Console tab

# 2. Clear browser cache and cookies
# Ctrl+Shift+Delete

# 3. Verify build configuration
cd frontend && yarn build

# 4. Check environment variables
cat frontend/.env.local
```

#### WebSocket Connection Failed
**Symptoms**:
- Real-time updates not working
- Connection status shows offline
- Frequent reconnection attempts

**Solutions**:
```bash
# 1. Check WebSocket URL configuration
echo $VITE_API_URL

# 2. Test WebSocket endpoint
# Browser DevTools -> Network -> WS

# 3. Verify backend WebSocket service
curl http://localhost:5000/socket.io/

# 4. Check firewall/proxy settings
# Ensure WebSocket upgrade headers allowed
```

---

### 🐳 Docker Issues

#### Container Won't Start
**Symptoms**:
- "docker compose up" fails
- Container exits immediately
- Port binding errors

**Solutions**:
```bash
# 1. Check container logs
docker compose logs [service-name]

# 2. Verify port availability
netstat -tlnp | grep :5000
lsof -i :5000

# 3. Check Docker daemon status
systemctl status docker

# 4. Clean up Docker resources
docker system prune -a
docker volume prune
```

#### Build Failures
**Symptoms**:
- Docker build errors
- Missing dependencies
- Out of disk space

**Solutions**:
```bash
# 1. Clean Docker cache
docker builder prune

# 2. Check available disk space
df -h

# 3. Force rebuild without cache
docker compose build --no-cache

# 4. Check Dockerfile syntax
docker compose config
```

---

### ⚡ Performance Issues

#### Slow API Response Times
**Symptoms**:
- Pages load slowly
- API calls take >5 seconds
- Database query timeouts

**Solutions**:
```bash
# 1. Check system resources
top
htop
docker stats

# 2. Monitor database performance
mongosh $MONGODB_URI
use greenhouse
db.runCommand({collStats: "sensordatas"})

# 3. Optimize database queries
# Add indexes for frequently queried fields

# 4. Check network latency
ping localhost
ping api-server
```

#### High Memory Usage
**Symptoms**:
- System running out of memory
- Docker containers being killed
- Slow response times

**Solutions**:
```bash
# 1. Check memory usage by container
docker stats --no-stream

# 2. Monitor Node.js memory
# Add --max-old-space-size=4096 to node command

# 3. Check for memory leaks
# Use Node.js profiling tools

# 4. Optimize database connection pool
# Reduce maxPoolSize in MongoDB connection
```

---

## 🔧 Development Troubleshooting

### Hot Reload Not Working
**Symptoms**:
- Changes don't reflect immediately
- Need to manually refresh browser
- File watcher not detecting changes

**Solutions**:
```bash
# 1. Check file system limits (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# 2. Restart development server
yarn dev

# 3. Clear node_modules and reinstall
rm -rf node_modules yarn.lock
yarn install

# 4. Check file permissions
chmod -R 755 src/
```

### TypeScript Compilation Errors
**Symptoms**:
- Build fails with TS errors
- Type checking issues
- Module resolution problems

**Solutions**:
```bash
# 1. Check TypeScript configuration
cat tsconfig.json

# 2. Clear TypeScript cache
rm -rf .tsc-cache
npx tsc --build --clean

# 3. Update type definitions
yarn add -D @types/node @types/react

# 4. Fix path mapping issues
# Check baseUrl and paths in tsconfig.json
```

---

## 📋 Diagnostic Commands

### Health Check Script
```bash
#!/bin/bash
echo "=== AIoT Greenhouse Health Check ==="

# Check services
echo "Checking Docker services..."
docker compose ps

# Check database connectivity
echo "Testing MongoDB connection..."
mongosh $MONGODB_URI --eval "db.runCommand('ping')"

# Check Redis
echo "Testing Redis connection..."
docker exec -it aiot_greenhouse_redis redis-cli ping

# Check API health
echo "Testing API health..."
curl -f http://localhost:5000/api/health || echo "API health check failed"

# Check MQTT connectivity
echo "Testing MQTT connection..."
timeout 5 mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -t "test" -m "test" && echo "MQTT OK" || echo "MQTT failed"

echo "Health check completed!"
```

### Log Analysis
```bash
# View all service logs
docker compose logs -f --tail=100

# Filter specific service logs
docker compose logs -f backend | grep ERROR
docker compose logs -f frontend | grep console

# Search for specific patterns
docker compose logs | grep -i authentication
docker compose logs | grep -i mqtt
docker compose logs | grep -i websocket
```

### Database Diagnostics
```bash
# MongoDB status
mongosh $MONGODB_URI --eval "
  db.adminCommand('serverStatus');
  db.stats();
  db.sensordatas.stats();
"

# Check recent data
mongosh $MONGODB_URI --eval "
  use greenhouse;
  db.sensordatas.find().sort({createdAt: -1}).limit(5);
  db.devicehistories.find().sort({timestamp: -1}).limit(5);
"

# Index analysis
mongosh $MONGODB_URI --eval "
  use greenhouse;
  db.sensordatas.getIndexes();
  db.sensordatas.explain().find({createdAt: {\$gte: new Date(Date.now() - 24*60*60*1000)}});
"
```

---

## 🆘 Emergency Procedures

### Complete System Reset
```bash
# 1. Stop all services
docker compose down -v

# 2. Remove all data (CAUTION!)
docker volume rm aiot-smart-greenhouse_mongodb_data
docker volume rm aiot-smart-greenhouse_redis_data

# 3. Rebuild all containers
docker compose build --no-cache

# 4. Start services
docker compose up -d

# 5. Initialize database
node scripts/init-mongo.js

# 6. Create admin user
cd backend && node create-admin.js
```

### Data Recovery
```bash
# 1. Stop application
docker compose stop backend frontend

# 2. Backup current database
mongodump --uri=$MONGODB_URI --out=./backup-$(date +%Y%m%d-%H%M%S)

# 3. Restore from backup
mongorestore --uri=$MONGODB_URI --drop ./backup-directory/

# 4. Restart services
docker compose start backend frontend
```

### Emergency Contacts
- **System Administrator**: admin@yourdomain.com
- **MQTT Broker Support**: mqtt.noboroto.id.vn support
- **Hosting Provider**: [Your hosting provider]

---

## 📖 Additional Resources

### Log Locations
- **Backend Logs**: `backend/logs/`
- **Docker Logs**: `docker compose logs [service]`
- **Database Logs**: `docker logs aiot_greenhouse_db`
- **Browser Logs**: F12 -> Console

### Useful Links
- [MongoDB Troubleshooting](https://docs.mongodb.com/manual/faq/diagnostics/)
- [Redis Troubleshooting](https://redis.io/topics/problems)
- [Docker Troubleshooting](https://docs.docker.com/config/troubleshooting/)
- [Node.js Debugging](https://nodejs.org/en/docs/guides/debugging-getting-started/)

### Community Support
- [GitHub Issues](https://github.com/nhnhu146/aiot-smart-greenhouse/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/iot+greenhouse)
- [Discord Community](#) (if available)

---

💡 **Pro Tip**: Tạo backup trước khi thực hiện bất kỳ major changes nào!