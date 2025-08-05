# 🚀 Deployment Guide

## 📋 Overview

Hướng dẫn này mô tả các phương pháp deploy AIoT Smart Greenhouse system trong các môi trường khác nhau, từ development đến production scale.

## 🎯 Deployment Options

### 1. 🖥️ Local Development
### 2. 🐳 Docker Production
### 3. ☁️ Cloud Deployment (AWS/GCP/Azure)
### 4. 🏠 Self-hosted VPS
### 5. 📱 Edge/Raspberry Pi

---

## 🖥️ 1. Local Development Deployment

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Git

### Quick Setup
```bash
# Clone repository
git clone https://github.com/nhnhu146/aiot-smart-greenhouse.git
cd aiot-smart-greenhouse

# Setup environment
cp .env.example .env
nano .env  # Configure variables

# Start all services
docker compose up -d

# Initialize database
docker exec -it aiot_greenhouse_backend node scripts/init-mongo.js

# Create admin user
docker exec -it aiot_greenhouse_backend node create-admin.js
```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

---

## 🐳 2. Docker Production Deployment

### Production Docker Setup

#### Step 1: Production Environment File
```bash
# Create production environment
cat > .env.production << 'EOF'
NODE_ENV=production
PORT=5000
API_PREFIX=/api

# Database
MONGODB_URI=mongodb://mongodb:27017/greenhouse_prod
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=your-super-secure-production-jwt-secret-key
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12

# MQTT
MQTT_HOST=mqtt.noboroto.id.vn
MQTT_PORT=1883
MQTT_USERNAME=your-production-mqtt-username
MQTT_PASSWORD=your-production-mqtt-password

# Email
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your-production-email-password
EMAIL_FROM="Smart Greenhouse <noreply@yourdomain.com>"

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Logging
LOG_LEVEL=info
LOG_TO_FILE=true
LOG_MAX_SIZE=50m
LOG_MAX_FILES=30
EOF
```

#### Step 2: Production Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # MongoDB Database with auth
  mongodb:
    image: mongo:7.0
    container_name: greenhouse_prod_db
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: greenhouse_prod
    volumes:
      - mongodb_prod_data:/data/db
      - ./scripts/init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro
    networks:
      - greenhouse-network
    ports:
      - "27017:27017"

  # Redis Cache with persistence
  redis:
    image: redis:7.2-alpine
    container_name: greenhouse_prod_redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_prod_data:/data
    networks:
      - greenhouse-network
    ports:
      - "6379:6379"

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
    container_name: greenhouse_prod_backend
    restart: unless-stopped
    env_file:
      - .env.production
    environment:
      - MONGODB_URI=mongodb://admin:${MONGO_ROOT_PASSWORD}@mongodb:27017/greenhouse_prod?authSource=admin
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
    depends_on:
      - mongodb
      - redis
    volumes:
      - ./backend/logs:/app/logs
    networks:
      - greenhouse-network
    ports:
      - "5000:5000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend Web App
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: production
      args:
        - VITE_API_URL=https://api.yourdomain.com
    container_name: greenhouse_prod_frontend
    restart: unless-stopped
    networks:
      - greenhouse-network
    ports:
      - "3000:80"

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: greenhouse_prod_nginx
    restart: unless-stopped
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
      - frontend
    networks:
      - greenhouse-network

volumes:
  mongodb_prod_data:
    driver: local
  redis_prod_data:
    driver: local

networks:
  greenhouse-network:
    driver: bridge
```

#### Step 3: Nginx Configuration
```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Frontend
    server {
        listen 80;
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # Redirect HTTP to HTTPS
        if ($scheme != "https") {
            return 301 https://$server_name$request_uri;
        }

        location / {
            proxy_pass http://frontend:80;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # Backend API
    server {
        listen 80;
        listen 443 ssl http2;
        server_name api.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # Redirect HTTP to HTTPS
        if ($scheme != "https") {
            return 301 https://$server_name$request_uri;
        }

        # API endpoints
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend:5000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # Auth endpoints with stricter limits
        location /api/auth/ {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://backend:5000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket for real-time updates
        location /socket.io/ {
            proxy_pass http://backend:5000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 86400;
        }
    }
}
```

#### Step 4: SSL Certificate Setup
```bash
# Install certbot
sudo apt install certbot

# Generate SSL certificates
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Copy certificates to nginx directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/
sudo chown $(whoami):$(whoami) ./ssl/*

# Setup auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet && docker compose -f docker-compose.prod.yml restart nginx
```

#### Step 5: Deploy Production
```bash
# Set production passwords
export MONGO_ROOT_PASSWORD=$(openssl rand -base64 32)
export REDIS_PASSWORD=$(openssl rand -base64 32)

# Create production environment file
echo "MONGO_ROOT_PASSWORD=$MONGO_ROOT_PASSWORD" >> .env.production
echo "REDIS_PASSWORD=$REDIS_PASSWORD" >> .env.production

# Build and start production services
docker compose -f docker-compose.prod.yml up -d --build

# Initialize production database
docker exec -it greenhouse_prod_backend node scripts/init-mongo.js

# Create admin user
docker exec -it greenhouse_prod_backend node create-admin.js
```

---

## ☁️ 3. Cloud Deployment (AWS)

### AWS Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CloudFront    │    │   Route 53      │    │      ACM        │
│   (CDN)         │    │   (DNS)         │    │   (SSL Certs)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                ┌─────────────────┴─────────────────┐
                │     Application Load Balancer    │
                └─────────────────┬─────────────────┘
                                 │
         ┌───────────────────────────────────────────────┐
         │               ECS Cluster                     │
         │  ┌─────────────────┐  ┌─────────────────┐    │
         │  │  Frontend       │  │   Backend       │    │
         │  │  (Fargate)      │  │   (Fargate)     │    │
         │  └─────────────────┘  └─────────────────┘    │
         └───────────────────────────────────────────────┘
                                 │
         ┌───────────────────────────────────────────────┐
         │              Data Layer                       │
         │  ┌─────────────────┐  ┌─────────────────┐    │
         │  │   DocumentDB    │  │  ElastiCache    │    │
         │  │   (MongoDB)     │  │   (Redis)       │    │
         │  └─────────────────┘  └─────────────────┘    │
         └───────────────────────────────────────────────┘
```

### AWS Deployment Steps

#### Step 1: Infrastructure Setup with Terraform
```hcl
# terraform/main.tf
provider "aws" {
  region = var.aws_region
}

# VPC and Networking
resource "aws_vpc" "greenhouse_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "greenhouse-vpc"
  }
}

resource "aws_subnet" "private_subnet" {
  count             = 2
  vpc_id            = aws_vpc.greenhouse_vpc.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "greenhouse-private-subnet-${count.index + 1}"
  }
}

resource "aws_subnet" "public_subnet" {
  count                   = 2
  vpc_id                  = aws_vpc.greenhouse_vpc.id
  cidr_block              = "10.0.${count.index + 10}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "greenhouse-public-subnet-${count.index + 1}"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "greenhouse_cluster" {
  name = "greenhouse-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# DocumentDB (MongoDB-compatible)
resource "aws_docdb_cluster" "greenhouse_db" {
  cluster_identifier      = "greenhouse-db"
  engine                  = "docdb"
  master_username         = var.db_username
  master_password         = var.db_password
  backup_retention_period = 7
  preferred_backup_window = "07:00-09:00"
  skip_final_snapshot     = true
  db_subnet_group_name    = aws_docdb_subnet_group.greenhouse_db_subnet_group.name
  vpc_security_group_ids  = [aws_security_group.docdb_sg.id]
}

resource "aws_docdb_cluster_instance" "greenhouse_db_instance" {
  count              = 2
  identifier         = "greenhouse-db-${count.index}"
  cluster_identifier = aws_docdb_cluster.greenhouse_db.id
  instance_class     = "db.t3.medium"
}

# ElastiCache (Redis)
resource "aws_elasticache_subnet_group" "greenhouse_cache_subnet_group" {
  name       = "greenhouse-cache-subnet"
  subnet_ids = aws_subnet.private_subnet[*].id
}

resource "aws_elasticache_replication_group" "greenhouse_redis" {
  replication_group_id         = "greenhouse-redis"
  description                  = "Redis cluster for greenhouse app"
  node_type                    = "cache.t3.micro"
  port                         = 6379
  parameter_group_name         = "default.redis7"
  num_cache_clusters           = 2
  automatic_failover_enabled   = true
  subnet_group_name            = aws_elasticache_subnet_group.greenhouse_cache_subnet_group.name
  security_group_ids           = [aws_security_group.redis_sg.id]
  at_rest_encryption_enabled   = true
  transit_encryption_enabled   = true
}

# Application Load Balancer
resource "aws_lb" "greenhouse_alb" {
  name               = "greenhouse-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = aws_subnet.public_subnet[*].id

  enable_deletion_protection = false
}
```

#### Step 2: ECS Task Definitions
```json
{
  "family": "greenhouse-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "greenhouse-backend",
      "image": "YOUR_ECR_REGISTRY/greenhouse-backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "5000"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:ssm:region:account:parameter/greenhouse/mongodb-uri"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:ssm:region:account:parameter/greenhouse/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/greenhouse-backend",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:5000/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

#### Step 3: Deploy with GitHub Actions
```yaml
# .github/workflows/deploy-aws.yml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-west-2

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1

    - name: Build and push backend image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: greenhouse-backend
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./backend
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

    - name: Build and push frontend image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: greenhouse-frontend
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./frontend
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

    - name: Update ECS services
      run: |
        aws ecs update-service --cluster greenhouse-cluster --service greenhouse-backend-service --force-new-deployment
        aws ecs update-service --cluster greenhouse-cluster --service greenhouse-frontend-service --force-new-deployment
```

---

## 🏠 4. Self-hosted VPS Deployment

### VPS Requirements
- **OS**: Ubuntu 20.04 LTS hoặc newer
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 50GB SSD minimum
- **CPU**: 2 cores minimum
- **Network**: Static IP address

### VPS Setup Steps

#### Step 1: Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install additional tools
sudo apt install -y nginx certbot python3-certbot-nginx htop curl wget git

# Setup firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

#### Step 2: Application Deployment
```bash
# Clone repository
git clone https://github.com/nhnhu146/aiot-smart-greenhouse.git
cd aiot-smart-greenhouse

# Setup production environment
cp .env.example .env.production
nano .env.production

# Generate secure secrets
export JWT_SECRET=$(openssl rand -base64 64)
export MONGO_ROOT_PASSWORD=$(openssl rand -base64 32)
export REDIS_PASSWORD=$(openssl rand -base64 32)

# Update environment file
sed -i "s/your-super-secure-jwt-secret-key/$JWT_SECRET/g" .env.production
echo "MONGO_ROOT_PASSWORD=$MONGO_ROOT_PASSWORD" >> .env.production
echo "REDIS_PASSWORD=$REDIS_PASSWORD" >> .env.production

# Start services
docker compose -f docker-compose.prod.yml up -d --build

# Wait for services to start
sleep 30

# Initialize database
docker exec -it greenhouse_prod_backend node scripts/init-mongo.js

# Create admin user
docker exec -it greenhouse_prod_backend node create-admin.js
```

#### Step 3: Nginx & SSL Setup
```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/greenhouse << 'EOF'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/greenhouse /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### Step 4: Monitoring & Maintenance
```bash
# Create monitoring script
tee ~/monitor-greenhouse.sh << 'EOF'
#!/bin/bash
cd /path/to/aiot-smart-greenhouse

# Check service status
echo "=== Service Status ==="
docker compose -f docker-compose.prod.yml ps

# Check disk usage
echo "=== Disk Usage ==="
df -h

# Check memory usage
echo "=== Memory Usage ==="
free -h

# Check logs for errors
echo "=== Recent Errors ==="
docker compose -f docker-compose.prod.yml logs --tail=50 | grep -i error

# Health check
echo "=== Health Check ==="
curl -f http://localhost:5000/api/health || echo "API health check failed"
EOF

chmod +x ~/monitor-greenhouse.sh

# Setup cron jobs
crontab -e
# Add:
# 0 2 * * * cd /path/to/aiot-smart-greenhouse && docker compose -f docker-compose.prod.yml exec -T mongodb mongodump --out /backup/$(date +\%Y\%m\%d)
# 0 0 * * 0 /usr/bin/certbot renew --quiet && systemctl reload nginx
# */15 * * * * /home/user/monitor-greenhouse.sh >> /var/log/greenhouse-monitor.log 2>&1
```

---

## 📱 5. Edge/Raspberry Pi Deployment

### Raspberry Pi Setup

#### Hardware Requirements
- **Raspberry Pi 4** (4GB RAM minimum)
- **microSD Card**: 64GB Class 10
- **Power Supply**: Official Pi 4 power adapter
- **Network**: Ethernet connection recommended

#### Step 1: OS Installation
```bash
# Flash Raspberry Pi OS Lite to SD card
# Enable SSH and configure WiFi before first boot

# First boot setup
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker pi

# Install Docker Compose
sudo pip3 install docker-compose

# Increase swap file size for compilation
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Change CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

#### Step 2: Application Deployment
```bash
# Clone repository
git clone https://github.com/nhnhu146/aiot-smart-greenhouse.git
cd aiot-smart-greenhouse

# Create ARM-compatible Docker Compose
tee docker-compose.pi.yml << 'EOF'
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: greenhouse_pi_db
    restart: unless-stopped
    volumes:
      - mongodb_pi_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: greenhouse
    ports:
      - "27017:27017"

  redis:
    image: redis:7.2-alpine
    container_name: greenhouse_pi_redis
    restart: unless-stopped
    volumes:
      - redis_pi_data:/data
    ports:
      - "6379:6379"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.pi
    container_name: greenhouse_pi_backend
    restart: unless-stopped
    env_file:
      - .env.pi
    depends_on:
      - mongodb
      - redis
    volumes:
      - ./backend/logs:/app/logs
    ports:
      - "5000:5000"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.pi
    container_name: greenhouse_pi_frontend
    restart: unless-stopped
    ports:
      - "3000:80"

volumes:
  mongodb_pi_data:
  redis_pi_data:
EOF

# Create Pi-specific environment
cp .env.example .env.pi
nano .env.pi

# Build and start (this will take time on Pi)
docker compose -f docker-compose.pi.yml up -d --build
```

#### Step 3: Local MQTT Broker (Optional)
```bash
# Install Mosquitto MQTT broker
sudo apt install mosquitto mosquitto-clients

# Configure Mosquitto
sudo tee /etc/mosquitto/conf.d/greenhouse.conf << 'EOF'
listener 1883
allow_anonymous true
persistence true
persistence_location /var/lib/mosquitto/
log_dest file /var/log/mosquitto/mosquitto.log
EOF

# Start Mosquitto
sudo systemctl enable mosquitto
sudo systemctl start mosquitto

# Test local MQTT
mosquitto_pub -h localhost -t test -m "hello"
mosquitto_sub -h localhost -t test
```

---

## 📊 Monitoring & Observability

### Application Monitoring

#### Docker Health Checks
```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    container_name: greenhouse_prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana
    container_name: greenhouse_grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources

  node_exporter:
    image: prom/node-exporter
    container_name: greenhouse_node_exporter
    ports:
      - "9100:9100"

volumes:
  prometheus_data:
  grafana_data:
```

#### Logging Configuration
```yaml
# Add to docker-compose.prod.yml
x-logging: &default-logging
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"

services:
  backend:
    logging: *default-logging
    # ... other configuration

  frontend:
    logging: *default-logging
    # ... other configuration
```

### Backup Strategy

#### Automated Backup Script
```bash
#!/bin/bash
# backup-greenhouse.sh

BACKUP_DIR="/backup/greenhouse"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup MongoDB
docker exec greenhouse_prod_mongodb mongodump --out $BACKUP_DIR/mongodb_$DATE

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz \
  --exclude='node_modules' \
  --exclude='logs' \
  --exclude='.git' \
  /path/to/aiot-smart-greenhouse

# Backup environment files
cp .env.production $BACKUP_DIR/env_$DATE

# Cleanup old backups
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

# Upload to S3 (optional)
if [ ! -z "$AWS_S3_BUCKET" ]; then
  aws s3 sync $BACKUP_DIR s3://$AWS_S3_BUCKET/greenhouse-backups/
fi

echo "Backup completed: $DATE"
```

---

## 🔒 Security Considerations

### Production Security Checklist

#### Application Security
- [ ] Strong JWT secrets (64+ characters)
- [ ] Secure database passwords
- [ ] HTTPS/WSS encryption
- [ ] Rate limiting configured
- [ ] Input validation enabled
- [ ] CORS properly configured
- [ ] Security headers implemented

#### Infrastructure Security
- [ ] Firewall configured (only necessary ports open)
- [ ] SSH key-based authentication
- [ ] Regular security updates
- [ ] Database access restricted
- [ ] Backup encryption
- [ ] Log monitoring
- [ ] Intrusion detection

#### Network Security
```bash
# Firewall configuration
sudo ufw deny incoming
sudo ufw allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 1883  # MQTT (if needed)
sudo ufw --force enable

# Fail2ban for SSH protection
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 🚀 Performance Optimization

### Database Optimization
```javascript
// MongoDB indexes for better performance
db.sensordatas.createIndex({ "createdAt": -1 })
db.sensordatas.createIndex({ "deviceId": 1, "createdAt": -1 })
db.devicehistories.createIndex({ "timestamp": -1 })
db.devicehistories.createIndex({ "deviceType": 1, "timestamp": -1 })
db.alerts.createIndex({ "createdAt": -1 })
db.alerts.createIndex({ "acknowledged": 1, "createdAt": -1 })
```

### Application Optimization
```yaml
# docker-compose.prod.yml optimizations
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
    environment:
      - NODE_OPTIONS=--max-old-space-size=512
```

### CDN Configuration
```javascript
// CloudFront cache behaviors
const cacheBehaviors = [
  {
    pathPattern: "/static/*",
    cachePolicyId: "managed-caching-optimized",
    ttl: 31536000  // 1 year
  },
  {
    pathPattern: "/api/*",
    cachePolicyId: "managed-caching-disabled"
  }
];
```

---

## 📈 Scaling Strategies

### Horizontal Scaling
```yaml
# docker-compose.scale.yml
version: '3.8'

services:
  backend:
    image: greenhouse-backend:latest
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/nginx-loadbalancer.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
```

### Load Balancer Configuration
```nginx
# nginx-loadbalancer.conf
upstream backend_servers {
    least_conn;
    server backend_1:5000;
    server backend_2:5000;
    server backend_3:5000;
}

server {
    listen 80;
    
    location /api/ {
        proxy_pass http://backend_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 🔄 Update & Maintenance

### Rolling Updates
```bash
#!/bin/bash
# rolling-update.sh

# Build new images
docker compose -f docker-compose.prod.yml build

# Update backend with zero downtime
docker compose -f docker-compose.prod.yml up -d --no-deps backend

# Wait for health check
sleep 30

# Update frontend
docker compose -f docker-compose.prod.yml up -d --no-deps frontend

# Cleanup old images
docker image prune -f

echo "Rolling update completed"
```

### Maintenance Mode
```bash
# Enable maintenance mode
docker run --rm -d -p 80:80 --name maintenance nginx:alpine
docker exec maintenance sh -c 'echo "<h1>Maintenance Mode</h1><p>System will be back shortly.</p>" > /usr/share/nginx/html/index.html'

# Perform maintenance
docker compose -f docker-compose.prod.yml down
# ... perform maintenance tasks ...
docker compose -f docker-compose.prod.yml up -d

# Disable maintenance mode
docker stop maintenance
```

---

💡 **Final Notes**:
- Always test deployments in staging environment first
- Monitor logs và metrics after deployment
- Have rollback plans ready
- Regular security updates essential
- Document all customizations cho team

Chúc bạn deploy thành công! 🎉