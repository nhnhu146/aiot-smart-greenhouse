# 🚀 AIoT Smart Greenhouse - Docker Deployment Guide

## 📋 Prerequisites

### System Requirements
- **Docker**: 20.10+ with Docker Compose v2
- **Hardware**: Minimum 4GB RAM, 20GB disk space
- **Network**: Internet access for MQTT broker and email services
- **OS**: Linux (Ubuntu 20.04+), Windows 10+, or macOS 10.15+

### Required Services
- MongoDB 7.0+ (included in Docker setup)
- MQTT Broker (external: mqtt.noboroto.id.vn)
- Email Service (optional SMTP credentials)

## 🔧 Quick Start (Local Development)

### 1. Clone Repository
```bash
git clone https://github.com/nhnhu146/aiot-smart-greenhouse.git
cd aiot-smart-greenhouse
```

### 2. Environment Configuration

Create `.env` file in the root directory:
```env
# Database Configuration
MONGODB_USER=greenhouse_user
MONGODB_PASSWORD=greenhouse_secure_2024

# MQTT Configuration
MQTT_BROKER_URL=mqtt://mqtt.noboroto.id.vn:1883
MQTT_USERNAME=vision
MQTT_PASSWORD=vision

# Application Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Security
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-64-characters-long
CORS_ORIGIN=http://localhost:3000
```

### 3. Start Services (Local Development)

**Option A: Full Local Development Stack**
```bash
# Stop any existing containers and remove images
docker compose down --rmi all

# Start with local development configuration
docker compose -f ./compose.local.yml up -d

# Check status
docker compose -f ./compose.local.yml ps
```

**Option B: Production-like Local Setup**
```bash
# Stop any existing containers
docker compose down --rmi all

# Start with production configuration
docker compose up -d

# Check status
docker compose ps
```

## 🏗️ Deployment Options

### Option 1: Local Development (Recommended for Testing)

```bash
# Start services with local development configuration
docker compose down --rmi all
docker compose -f compose.local.yml up -d --build

# Verify services are running
docker compose ps

# View logs
docker compose logs -f
```

**Access Points:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- MongoDB: localhost:27017

**Default Login:**
- Email: `admin@greenhouse.com`
- Password: `admin123`

### Option 2: Production Deployment

```bash
# Build and deploy production containers
docker compose down --rmi all
docker compose -f compose.yml up -d --build

# Check deployment status
docker compose ps
docker compose logs -f backend
```

**Production Differences:**
- Optimized build sizes
- Production logging
- Security headers enabled
- CORS restrictions applied

### Option 3: Manual Development Setup

For active development with hot reloading:

```bash
# Terminal 1: Start MongoDB
docker run --name greenhouse-mongo -d \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=greenhouse_user \
  -e MONGO_INITDB_ROOT_PASSWORD=greenhouse_password \
  mongo:7.0

# Terminal 2: Start Backend
cd backend
npm install
npm run dev

# Terminal 3: Start Frontend  
cd frontend
npm install
npm run dev
```

## ✅ Service Verification

### 1. Container Health Check
```bash
# Check all containers are running
docker compose ps

# Expected output:
# NAME                    STATUS              PORTS
# greenhouse-frontend     Up 2 minutes        0.0.0.0:3000->3000/tcp
# greenhouse-backend      Up 2 minutes        0.0.0.0:5000->5000/tcp
# greenhouse-mongo        Up 2 minutes        0.0.0.0:27017->27017/tcp
```

### 2. Application Health
```bash
# Test backend API
curl http://localhost:5000/api/health

# Expected response:
# {"status":"healthy","timestamp":"2024-...","services":{"database":"connected","mqtt":"connected"}}

# Test frontend
curl http://localhost:3000

# Should return HTML content
```

### 3. Database Connection
```bash
# Access MongoDB directly
docker exec -it greenhouse-mongo mongosh \
  -u greenhouse_user \
  -p greenhouse_secure_2024 \
  --authenticationDatabase greenhouse

# Check collections
use greenhouse
show collections
```

### 4. MQTT Connection Test
```bash
# Check backend logs for MQTT connection
docker compose logs backend | grep -i mqtt

# Expected: "MQTT client connected to mqtt.noboroto.id.vn"
```

### 5. Application Login Test
1. Navigate to http://localhost:3000
2. Sign in with default credentials:
   - **Email**: `admin@gmail.com`
   - **Password**: `admin`
3. Verify dashboard loads with sensor data

## 🚨 Troubleshooting

### Common Issues

#### 1. Containers Not Starting
```bash
# Check container logs
docker compose logs <service-name>

# Restart specific service
docker compose restart <service-name>

# Complete restart
docker compose down
docker compose up -d
```

#### 2. Port Already in Use
```bash
# Find process using port
netstat -tulpn | grep :3000
# or
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### 3. Database Connection Issues
```bash
# Check MongoDB container
docker exec -it greenhouse-mongo mongosh

# Check network connectivity
docker network ls
docker network inspect <network-name>
```

#### 4. MQTT Connection Problems
```bash
# Test MQTT broker connectivity
docker run --rm efrecon/mqtt-client \
  pub -h mqtt.noboroto.id.vn -p 1883 \
  -u vision -P vision \
  -t "test/topic" -m "test message"
```

#### 5. Build Failures
```bash
# Clean Docker cache
docker system prune -a

# Force rebuild
docker compose build --no-cache
docker compose up -d
```

### Log Analysis
```bash
# Backend logs
docker compose logs -f backend

# Frontend logs  
docker compose logs -f frontend

# Database logs
docker compose logs -f mongo

# All services
docker compose logs -f
```

## ⚙️ Configuration Details

### Docker Compose Files

#### `compose.local.yml` - Local Development
```yaml
# Includes:
# - MongoDB with initialization scripts
# - Backend with development settings
# - Frontend with hot reloading
# - Shared network for service communication
# - Volume mounts for live code updates
```

#### `compose.yml` - Production
```yaml
# Includes:
# - Optimized container builds
# - Production environment variables
# - Health checks and restart policies
# - Security configurations
# - Logging configurations
```

### Service Configuration

#### Backend Service
- **Port**: 5000 (internal), mapped to host
- **Environment**: Production/Development specific
- **Dependencies**: MongoDB, MQTT broker
- **Health Check**: `/api/health` endpoint
- **Restart Policy**: `unless-stopped`

#### Frontend Service
- **Port**: 3000 (internal), mapped to host  
- **Build**: Next.js optimized production build
- **Dependencies**: Backend API availability
- **Serving**: Static files via Next.js server

#### MongoDB Service
- **Port**: 27017 (internal), optionally exposed
- **Data Persistence**: Volume mounted to `mongodb_data`
- **Initialization**: Automatic database and user setup
- **Health Check**: MongoDB ping command

## 🔍 Verification Steps

### 1. Service Health Check
```bash
# Check all services are running
docker compose ps

# Expected output:
# NAME                      STATUS          PORTS
# aiot_greenhouse_backend   Up 2 minutes    0.0.0.0:5000->5000/tcp
# aiot_greenhouse_frontend  Up 2 minutes    0.0.0.0:3000->3000/tcp  
# aiot_greenhouse_db        Up 2 minutes    0.0.0.0:27017->27017/tcp
```

### 2. API Connectivity
```bash
# Test backend health
curl http://localhost:5000/api/health

# Expected response:
{
  "success": true,
  "message": "API is healthy",
  "timestamp": "2025-01-17T10:30:00.000Z",
  "services": {
    "database": "connected",
    "mqtt": "connected"
  }
}
```

### 3. Frontend Access
- Open browser to http://localhost:3000
- Should see greenhouse dashboard
- Login with default credentials
- Verify real-time data updates

### 4. MQTT Connection Test
```bash
# Check backend logs for MQTT connection
docker compose logs backend | grep MQTT

# Expected log entries:
# [MQTT] Successfully connected to broker
# [MQTT] Successfully subscribed to greenhouse/sensors/+
```

### 5. Database Verification
```bash
# Connect to MongoDB
docker compose exec mongodb mongosh -u greenhouse_user -p greenhouse_password aiot_greenhouse

# Check collections
> show collections
> db.sensordata.find().limit(5)
> db.settings.find()
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Port Conflicts
**Problem**: Port 3000 or 5000 already in use
```bash
# Check port usage
netstat -tulpn | grep :3000
netstat -tulpn | grep :5000

# Kill conflicting processes
sudo kill -9 <PID>

# Or use different ports in docker-compose
```

#### 2. MongoDB Connection Issues
**Problem**: Database connection failed
```bash
# Check MongoDB container status
docker compose logs mongodb

# Restart MongoDB
docker compose restart mongodb

# Verify MongoDB is accessible
docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

#### 3. MQTT Connection Problems
**Problem**: No sensor data received
```bash
# Check MQTT logs
docker compose logs backend | grep MQTT

# Test MQTT broker connectivity
docker run --rm -it eclipse-mosquitto:2.0 mosquitto_sub \
  -h mqtt.noboroto.id.vn -p 1883 \
  -u vision -P vision \
  -t "greenhouse/sensors/+"
```

#### 4. Frontend Build Errors
**Problem**: Next.js build failures
```bash
# Clear build cache
docker compose down
docker system prune -f

# Rebuild with verbose output
docker compose -f compose.local.yml up --build frontend
```

#### 5. WebSocket Connection Issues
**Problem**: Real-time updates not working
```bash
# Check WebSocket connection in browser console
# Should see: "✅ Connected to WebSocket server"

# Verify backend WebSocket service
curl -I http://localhost:5000

# Check CORS configuration in backend logs
```

### Debug Commands

```bash
# View all container logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb

# Execute commands in containers
docker compose exec backend npm run test
docker compose exec mongodb mongosh

# Monitor resource usage
docker stats

# Inspect network connectivity
docker compose exec backend ping mongodb
docker compose exec frontend ping backend
```

## 📊 Monitoring & Maintenance

### Log Management
```bash
# Rotate and cleanup logs
docker compose logs --since 1h backend > backend_logs.txt
docker system prune -f

# Set log retention policies
# Edit docker-compose.yml:
logging:
  options:
    max-size: "10m"
    max-file: "3"
```

### Backup Procedures
```bash
# Backup MongoDB data
docker compose exec mongodb mongodump --uri="mongodb://greenhouse_user:greenhouse_password@localhost:27017/aiot_greenhouse" --out=/backup

# Copy backup from container
docker cp aiot_greenhouse_db:/backup ./mongodb_backup_$(date +%Y%m%d)

# Restore from backup
docker compose exec mongodb mongorestore --uri="mongodb://greenhouse_user:greenhouse_password@localhost:27017/aiot_greenhouse" /backup/aiot_greenhouse
```

### Updates and Upgrades
```bash
# Update to latest version
git pull origin main

# Rebuild and restart services
docker compose down
docker compose -f compose.local.yml up -d --build

# Verify update success
curl http://localhost:5000/api/health
```

## 🌐 Production Deployment

### SSL/HTTPS Setup
```bash
# Add SSL certificates to nginx
# Update compose.yml with nginx service
# Configure Let's Encrypt for automatic renewal
```

### Domain Configuration
```bash
# Update environment variables
CORS_ORIGIN=https://greenhouse.yourdomain.com
NEXT_PUBLIC_API_URL=https://api.greenhouse.yourdomain.com

# Configure reverse proxy (nginx/traefik)
# Set up DNS records
```

### Security Hardening
```bash
# Change default passwords
# Update JWT secrets
# Configure firewall rules
# Enable container security scanning
# Set up monitoring and alerting
```

## 📞 Support

### Getting Help
- **Documentation**: Check `/docs` directory
- **Issues**: Create GitHub issue with logs
- **Logs**: Always include relevant container logs
- **Environment**: Specify OS, Docker version, deployment method

### Useful Resources
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Docker Image](https://hub.docker.com/_/mongo)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

---

**Last Updated**: January 2025
**Version**: 2.0.0
