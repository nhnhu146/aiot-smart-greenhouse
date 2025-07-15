# Deployment Guide

## Development Setup

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- yarn (recommended) or npm

### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd aiot-smart-greenhouse

# Start development environment
.\scripts\start-dev.ps1
```

## Production Deployment

### Using Docker (Recommended)
```bash
# Start production environment
.\scripts\start-prod.ps1

# Stop services
.\scripts\stop-prod.ps1
```

### Manual Deployment
```bash
# Backend
cd backend
npm install
npm run build
npm start

# Frontend  
cd frontend
npm install
npm run build
npm start
```

## Environment Configuration

Copy `.env.example` to `.env` and configure:

### Required Variables
- `MONGODB_URI`: MongoDB connection string
- `MQTT_BROKER_URL`: MQTT broker URL
- `JWT_SECRET`: JWT signing secret
- `EMAIL_USER`: SMTP email address
- `EMAIL_PASS`: SMTP password

### Optional Variables  
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 5000)
- `CORS_ORIGIN`: Frontend URL for CORS

## Health Checks

Check system status:
```bash
curl http://localhost:5000/api/health
```
