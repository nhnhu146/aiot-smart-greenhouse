# Development Guide

## Getting Started

### Development Environment Setup

#### Prerequisites
- **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
- **yarn**: `npm install -g yarn` (recommended over npm)
- **Docker Desktop**: For database and services
- **VS Code**: Recommended editor with extensions:
  - TypeScript and JavaScript Language Features
  - Prettier - Code formatter
  - ES7+ React/Redux/React-Native snippets
  - Docker

#### Project Setup
```bash
# Clone the repository
git clone <repository-url>
cd aiot-smart-greenhouse

# Install dependencies
cd backend && yarn install
cd ../frontend && yarn install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start development services
.\scripts\start-dev.ps1
```

## Project Structure

### Backend Architecture
```
backend/
├── src/
│   ├── index.ts                 # Main application entry
│   ├── middleware/              # Express middleware
│   │   ├── auth.ts             # JWT authentication
│   │   ├── errorHandler.ts     # Global error handling
│   │   └── validation.ts       # Request validation
│   ├── models/                  # MongoDB models
│   │   ├── SensorData.ts       # Sensor data schema
│   │   ├── Settings.ts         # System settings
│   │   ├── Alert.ts            # Alert management
│   │   └── UserSettings.ts     # User preferences
│   ├── routes/                  # API route handlers
│   │   ├── auth.ts             # Authentication routes
│   │   ├── sensors.ts          # Sensor data endpoints
│   │   ├── devices.ts          # Device control
│   │   ├── settings.ts         # Settings management
│   │   └── alerts.ts           # Alert system
│   ├── services/                # Business logic services
│   │   ├── DatabaseService.ts  # MongoDB connection
│   │   ├── MQTTService.ts      # MQTT communication
│   │   ├── EmailService.ts     # Email notifications
│   │   ├── AlertService.ts     # Alert processing
│   │   └── WebSocketService.ts # Real-time updates
│   └── types/                   # TypeScript type definitions
└── package.json
```

### Frontend Architecture
```
frontend/
├── src/
│   ├── app/                     # Next.js 13 app directory
│   │   ├── (auth)/             # Authentication pages
│   │   │   ├── signin/
│   │   │   ├── signup/
│   │   │   └── forgot-password/
│   │   └── (default)/          # Main application pages
│   │       ├── dashboard/      # Main dashboard
│   │       ├── control/        # Device control
│   │       ├── settings/       # User settings
│   │       └── history/        # Data history
│   ├── components/              # Reusable React components
│   │   ├── SensorDashboard/    # Sensor display
│   │   ├── LineChart/          # Data visualization
│   │   ├── Sidebar/            # Navigation
│   │   └── DeviceControl/      # Device control widgets
│   ├── contexts/                # React contexts
│   │   ├── WebSocketContext.tsx # Real-time data
│   │   └── UserSettingsContext.tsx # User preferences
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utility libraries
│   │   ├── apiClient.ts        # API communication
│   │   ├── authService.ts      # Authentication logic
│   │   └── mqttClient.ts       # MQTT client
│   └── styles/                  # CSS and styling
└── package.json
```

## Development Workflow

### Code Standards

#### TypeScript Configuration
- Strict mode enabled
- No implicit any
- Consistent import/export patterns
- Path aliases configured (@/ for src/)

#### Code Style
```typescript
// Use interfaces for object types
interface SensorData {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  timestamp: Date;
}

// Use async/await instead of promises
const fetchSensorData = async (): Promise<SensorData> => {
  try {
    const response = await apiClient.get('/sensors');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch sensor data:', error);
    throw error;
  }
};

// Use proper error handling
const handleApiError = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
};
```

### Git Workflow

#### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Critical production fixes

#### Commit Messages
Use conventional commits:
```
feat: add sensor data export functionality
fix: resolve MQTT connection timeout issue
docs: update API documentation
refactor: improve error handling in auth middleware
test: add unit tests for alert service
```

### Testing Strategy

#### Backend Testing
```bash
# Run all tests
cd backend && yarn test

# Run with coverage
yarn test --coverage

# Run specific test file
yarn test src/services/AlertService.test.ts
```

#### Frontend Testing
```bash
# Run component tests
cd frontend && yarn test

# Run E2E tests
yarn test:e2e
```

### Debugging

#### Backend Debugging
```typescript
// Enable debug logging
process.env.DEBUG = 'greenhouse:*';

// Use structured logging
import { logger } from './utils/logger';

logger.info('Processing sensor data', {
  sensorId: 'temp_01',
  value: 25.5,
  timestamp: new Date()
});
```

#### Frontend Debugging
```typescript
// React DevTools
// Component debugging
useEffect(() => {
  console.log('Sensor data updated:', sensorData);
}, [sensorData]);

// Redux DevTools (if using Redux)
// Network debugging in browser DevTools
```

## API Development

### Adding New Endpoints

1. **Define Route Handler**
```typescript
// src/routes/newFeature.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/data', authenticateToken, async (req, res) => {
  try {
    // Implementation
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
```

2. **Add to Main Router**
```typescript
// src/routes/index.ts
import newFeatureRoutes from './newFeature';

router.use('/new-feature', newFeatureRoutes);
```

3. **Update API Documentation**
```markdown
### GET /api/new-feature/data
Description: Get new feature data
```

### Database Models

#### Creating New Models
```typescript
// src/models/NewModel.ts
import mongoose, { Schema, Document } from 'mongoose';

interface INewModel extends Document {
  name: string;
  value: number;
  createdAt: Date;
}

const NewModelSchema = new Schema({
  name: { type: String, required: true },
  value: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<INewModel>('NewModel', NewModelSchema);
```

## Frontend Development

### Component Development

#### Creating React Components
```typescript
// src/components/NewComponent/NewComponent.tsx
import React, { useState, useEffect } from 'react';
import styles from './NewComponent.module.scss';

interface NewComponentProps {
  data: any[];
  onUpdate: (item: any) => void;
}

const NewComponent: React.FC<NewComponentProps> = ({ data, onUpdate }) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Component logic
  }, [data]);

  return (
    <div className={styles.container}>
      {/* Component JSX */}
    </div>
  );
};

export default NewComponent;
```

#### Styling with SCSS Modules
```scss
// src/components/NewComponent/NewComponent.module.scss
.container {
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
}
```

### State Management

#### Using React Context
```typescript
// src/contexts/NewContext.tsx
import React, { createContext, useContext, useReducer } from 'react';

interface State {
  data: any[];
  loading: boolean;
}

const initialState: State = {
  data: [],
  loading: false
};

const NewContext = createContext<{
  state: State;
  dispatch: React.Dispatch<any>;
}>({
  state: initialState,
  dispatch: () => null
});

export const useNewContext = () => useContext(NewContext);
```

## Performance Optimization

### Backend Optimization
- Use database indexing for frequently queried fields
- Implement connection pooling
- Use compression middleware
- Cache frequently accessed data
- Optimize MQTT message handling

### Frontend Optimization
- Use React.memo for component optimization
- Implement lazy loading for routes
- Optimize bundle size with tree shaking
- Use service workers for caching
- Implement virtual scrolling for large lists

## Environment Management

### Development Environment
```env
NODE_ENV=development
DEBUG=true
MOCK_SENSOR_DATA=true
HOT_RELOAD=true
```

### Testing Environment
```env
NODE_ENV=test
TEST_DATABASE_URI=mongodb://localhost:27017/greenhouse_test
MOCK_EMAIL_SENDING=true
```

### Production Environment
```env
NODE_ENV=production
DEBUG=false
COMPRESS_RESPONSES=true
ENABLE_CACHING=true
```

## Deployment

### Development Deployment
```bash
# Local development
yarn dev

# Docker development
docker compose -f compose.dev.yml up
```

### Production Deployment
```bash
# Build for production
yarn build

# Start production server
yarn start

# Docker production
docker compose -f compose.yml up -d
```

## Contributing

### Pull Request Process
1. Create feature branch from `develop`
2. Implement changes with tests
3. Update documentation
4. Submit pull request
5. Code review and approval
6. Merge to `develop`

### Code Review Checklist
- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No breaking changes (or properly documented)
- [ ] Performance impact considered
- [ ] Security implications reviewed
