# 🛠️ Development Guide

## Môi trường Development

### Prerequisites
- **Node.js** 18+ (LTS recommended)
- **Docker** & **Docker Compose**
- **Git**
- **VS Code** (recommended) với extensions:
  - ES7+ React/Redux/React-Native snippets
  - TypeScript Importer
  - Prettier
  - ESLint
  - Thunder Client (API testing)

### IDE Setup
```bash
# VS Code extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.thunder-client
```

---

## 🚀 Quick Development Setup

### 1. Clone & Install
```bash
git clone https://github.com/nhnhu146/aiot-smart-greenhouse.git
cd aiot-smart-greenhouse

# Backend dependencies
cd backend
yarn install

# Frontend dependencies  
cd ../frontend
yarn install

cd ..
```

### 2. Environment Configuration
```bash
# Copy environment files
cp .env.example .env

# Edit .env file với cấu hình local
```

**Required .env variables:**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/greenhouse

# MQTT
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_CLIENT_ID=greenhouse_backend_dev
MQTT_USERNAME=
MQTT_PASSWORD=

# Email (optional for development)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Security
JWT_SECRET=dev-secret-key-change-in-production
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=admin

# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### 3. Start Development Environment
```bash
# Option 1: Using Docker (Recommended)
docker-compose -f compose.dev.yml up -d

# Option 2: Manual startup
# Terminal 1: Backend
cd backend && yarn dev

# Terminal 2: Frontend
cd frontend && yarn dev

# Terminal 3: MQTT Broker
docker run -it -p 1883:1883 eclipse-mosquitto
```

### 4. Verify Setup
- Frontend: http://localhost:3000
- Backend: http://localhost:5000/api/health
- Default login: admin@gmail.com / admin

---

## 📁 Project Structure

```
aiot-smart-greenhouse/
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── index.ts        # Application entry point
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic services
│   │   ├── schemas/        # Validation schemas
│   │   └── types/          # TypeScript type definitions
│   ├── logs/               # Application logs
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/               # Next.js React application
│   ├── src/
│   │   ├── app/           # Next.js 13+ app directory
│   │   │   ├── (auth)/    # Authentication pages
│   │   │   └── (default)/ # Main application pages
│   │   ├── components/    # Reusable React components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility libraries
│   │   └── styles/        # SCSS stylesheets
│   ├── public/            # Static assets
│   └── package.json
│
├── embedded/              # ESP32 Arduino code
│   └── aiot-greenhouse-embedded.ino
│
├── docs/                  # Project documentation
│   ├── getting-started.md
│   ├── architecture.md
│   ├── api-documentation.md
│   └── development-guide.md
│
├── scripts/               # Utility scripts
│   ├── start-dev.ps1     # Development startup
│   ├── system-check.ps1  # System health check
│   └── setup-email-alerts.ps1
│
├── compose.yml            # Production Docker Compose
├── compose.dev.yml        # Development Docker Compose
└── README.md
```

---

## 🔧 Backend Development

### Tech Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB
- **Communication**: MQTT, WebSocket
- **Authentication**: JWT
- **Email**: Nodemailer

### Code Organization

#### **Services Layer**
```typescript
// src/services/index.ts
export { databaseService } from './DatabaseService';
export { mqttService } from './MQTTService';
export { alertService } from './AlertService';
export { webSocketService } from './WebSocketService';
export { emailService } from './EmailService';
```

#### **Models (MongoDB Schemas)**
```typescript
// src/models/SensorData.ts
import mongoose from 'mongoose';

const sensorDataSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    temperature: Number,
    humidity: Number,
    soilMoisture: Number,
    waterLevel: Number,
    plantHeight: Number,
    rainStatus: Boolean,
    lightLevel: Number,
    motionDetected: Boolean,
    dataQuality: { type: String, enum: ['complete', 'partial'] }
});

export const SensorData = mongoose.model('SensorData', sensorDataSchema);
```

#### **Route Handlers**
```typescript
// src/routes/sensors.ts
import { Router } from 'express';
import { SensorData } from '../models';
import { authMiddleware } from '../middleware';

const router = Router();

router.get('/latest', authMiddleware, async (req, res) => {
    try {
        const latest = await SensorData.findOne().sort({ timestamp: -1 });
        res.json({ success: true, data: latest });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
```

### MQTT Service Development

**Key Integration Points:**
```typescript
// src/services/MQTTService.ts - Line 165
public async processSensorData(topic: string, value: number, timestamp?: Date): Promise<void> {
    const sensorType = this.getSensorTypeFromTopic(topic);
    
    if (sensorType) {
        // 1. Buffer sensor data
        this.sensorDataBuffer.set(sensorType, value);
        
        // 2. Save immediately (prevent data loss)
        await this.saveIndividualSensorData(sensorType, value);
        
        // 3. Handle special events
        if (sensorType === 'motionDetected' && value === 1) {
            await this.alertService.handleMotionDetected();
        }
        
        // 4. Check for complete dataset
        const hasAllRequiredData = this.checkDataCompleteness();
        if (hasAllRequiredData) {
            await this.alertService.checkSensorThresholds(this.getBufferedData());
            await this.saveSensorData(this.getBufferedData());
        }
    }
}
```

### Testing Backend

#### **Unit Tests**
```bash
# Install testing dependencies
yarn add -D jest @types/jest supertest

# Run tests
yarn test

# Watch mode
yarn test:watch
```

#### **API Testing with Thunder Client**
```json
// Save in .thunder-tests/
{
  "name": "Get Latest Sensors",
  "method": "GET",
  "url": "http://localhost:5000/api/sensors/latest",
  "headers": [
    {
      "name": "Authorization",
      "value": "Bearer {{token}}"
    }
  ]
}
```

---

## 🎨 Frontend Development

### Tech Stack
- **Framework**: Next.js 13+ (App Router)
- **Language**: TypeScript
- **Styling**: SCSS Modules
- **Charts**: Chart.js/React-Chartjs-2
- **Real-time**: Socket.IO Client
- **HTTP Client**: Axios
- **State Management**: React Context

### Component Architecture

#### **Page Structure**
```typescript
// src/app/(default)/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { SensorDashboard } from '@/components/SensorDashboard';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function DashboardPage() {
    const [sensorData, setSensorData] = useState(null);
    const { isConnected, lastMessage } = useWebSocket();
    
    useEffect(() => {
        // Real-time sensor data updates
        if (lastMessage?.type === 'sensor_data') {
            setSensorData(lastMessage.data);
        }
    }, [lastMessage]);
    
    return (
        <div className="dashboard">
            <SensorDashboard data={sensorData} />
        </div>
    );
}
```

#### **Component Example**
```typescript
// src/components/SensorDashboard/SensorDashboard.tsx
import { FC } from 'react';
import { LineChart } from '@/components/LineChart';
import styles from './SensorDashboard.module.scss';

interface SensorDashboardProps {
    data: SensorData | null;
}

export const SensorDashboard: FC<SensorDashboardProps> = ({ data }) => {
    if (!data) return <div>Loading...</div>;
    
    return (
        <div className={styles.dashboard}>
            <div className={styles.sensorGrid}>
                <div className={styles.sensorCard}>
                    <h3>Temperature</h3>
                    <span className={styles.value}>{data.temperature}°C</span>
                </div>
                {/* More sensor cards */}
            </div>
            
            <LineChart data={data.history} />
        </div>
    );
};
```

#### **Custom Hooks**
```typescript
// src/hooks/useWebSocket.ts
import { useContext } from 'react';
import { WebSocketContext } from '@/contexts/WebSocketContext';

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within WebSocketProvider');
    }
    return context;
};
```

### Styling Guidelines

#### **SCSS Modules**
```scss
// SensorDashboard.module.scss
.dashboard {
  padding: 2rem;
  background: var(--bg-primary);
  
  .sensorGrid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .sensorCard {
    background: var(--bg-secondary);
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    h3 {
      margin: 0 0 0.5rem 0;
      color: var(--text-secondary);
      font-size: 0.9rem;
      text-transform: uppercase;
    }
    
    .value {
      font-size: 2rem;
      font-weight: bold;
      color: var(--text-primary);
    }
  }
}
```

#### **CSS Variables**
```scss
// src/styles/globals.scss
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --text-primary: #2d3748;
  --text-secondary: #718096;
  --accent: #4299e1;
  --success: #48bb78;
  --warning: #ed8936;
  --error: #f56565;
}

[data-theme="dark"] {
  --bg-primary: #1a202c;
  --bg-secondary: #2d3748;
  --text-primary: #f7fafc;
  --text-secondary: #e2e8f0;
}
```

---

## 🧪 Testing Strategy

### Backend Testing
```typescript
// tests/services/MQTTService.test.ts
import { MQTTService } from '../../src/services/MQTTService';

describe('MQTTService', () => {
    let mqttService: MQTTService;
    
    beforeEach(() => {
        mqttService = new MQTTService();
    });
    
    test('should process sensor data correctly', async () => {
        const topic = 'greenhouse/sensors/temperature';
        const value = 25.5;
        
        await mqttService.processSensorData(topic, value);
        
        expect(mqttService.sensorDataBuffer.get('temperature')).toBe(25.5);
    });
    
    test('should trigger motion alert on motion detection', async () => {
        const alertSpy = jest.spyOn(mqttService.alertService, 'handleMotionDetected');
        
        await mqttService.processSensorData('greenhouse/sensors/motion', 1);
        
        expect(alertSpy).toHaveBeenCalled();
    });
});
```

### Frontend Testing
```typescript
// src/components/SensorDashboard/SensorDashboard.test.tsx
import { render, screen } from '@testing-library/react';
import { SensorDashboard } from './SensorDashboard';

const mockData = {
    temperature: 25.5,
    humidity: 65.2,
    timestamp: new Date().toISOString()
};

test('renders sensor data correctly', () => {
    render(<SensorDashboard data={mockData} />);
    
    expect(screen.getByText('25.5°C')).toBeInTheDocument();
    expect(screen.getByText('65.2%')).toBeInTheDocument();
});
```

---

## 🔧 Development Workflow

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-sensor-support

# Make changes and commit
git add .
git commit -m "feat: add support for pH sensor"

# Push and create PR
git push origin feature/new-sensor-support
```

### Code Quality Tools

#### **ESLint Configuration**
```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error"
  }
}
```

#### **Prettier Configuration**
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### Development Scripts
```json
// package.json scripts
{
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write src/**/*.ts"
  }
}
```

---

## 🐛 Debugging

### Backend Debugging
```typescript
// src/middleware/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

// Usage in services
logger.info('MQTT message received', { topic, message });
logger.error('Database connection failed', { error: error.message });
```

### Frontend Debugging
```typescript
// Debug hooks
const useDebugValue = (value: any, label: string) => {
    useEffect(() => {
        console.log(`[DEBUG] ${label}:`, value);
    }, [value, label]);
};

// Usage
const MyComponent = () => {
    const [data, setData] = useState(null);
    useDebugValue(data, 'Sensor Data');
    
    return <div>{/* component */}</div>;
};
```

### MQTT Debugging
```bash
# Monitor all greenhouse topics
mosquitto_sub -h localhost -t "greenhouse/+/+" -v

# Debug specific sensor
mosquitto_sub -h localhost -t "greenhouse/sensors/temperature" -v

# Test device control
mosquitto_pub -h localhost -t "greenhouse/devices/light/control" -m "on"
```

---

## 📦 Build & Deployment

### Development Build
```bash
# Backend
cd backend
yarn build

# Frontend
cd frontend
yarn build
```

### Production Build
```bash
# Using Docker
docker-compose build

# Manual build
yarn build:prod
```

### Environment-specific Configs
```typescript
// config/index.ts
const config = {
    development: {
        mqtt: { broker: 'mqtt://localhost:1883' },
        db: { uri: 'mongodb://localhost:27017/greenhouse_dev' }
    },
    production: {
        mqtt: { broker: process.env.MQTT_BROKER_URL },
        db: { uri: process.env.MONGODB_URI }
    }
};

export default config[process.env.NODE_ENV || 'development'];
```

---

## 🚀 Performance Optimization

### Backend Optimization
- **Database indexing** for time-series queries
- **MQTT message batching** for high-frequency sensors
- **WebSocket connection pooling**
- **Caching** với Redis cho frequently accessed data

### Frontend Optimization
- **Code splitting** với Next.js dynamic imports
- **Image optimization** với next/image
- **Bundle analysis** với @next/bundle-analyzer
- **Performance monitoring** với Web Vitals

---

## 📚 Learning Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [MongoDB Manual](https://docs.mongodb.com/)
- [MQTT Specification](https://mqtt.org/mqtt-specification/)

### Tools
- [Postman/Thunder Client](https://www.thunderclient.com/) - API testing
- [MongoDB Compass](https://www.mongodb.com/products/compass) - Database GUI
- [MQTT Explorer](http://mqtt-explorer.com/) - MQTT debugging

---

**Happy coding! 🚀 Hãy tuân thủ coding standards và best practices để đảm bảo code quality tốt nhất.**
