# Unit Test Documentation

This document describes the unit testing strategy and implementation for the AIoT Smart Greenhouse project.

## Testing Philosophy

### Test-Driven Development (TDD)
- Write tests before implementing features
- Red-Green-Refactor cycle
- Comprehensive test coverage
- Maintainable and readable tests

### Testing Pyramid
```
        ┌─────────────┐
        │     E2E     │  ← Few, high-value integration tests
        ├─────────────┤
        │ Integration │  ← Medium number of service tests
        ├─────────────┤
        │    Unit     │  ← Many, fast, isolated tests
        └─────────────┘
```

## Test Structure

### Backend Tests

#### Service Layer Tests
Located in `backend/tests/services/`

**Purpose**: Test business logic and service interactions

**Example**: `AlertService.test.ts`
```typescript
describe('AlertService', () => {
  describe('createAlert', () => {
    it('should create alert with valid data', async () => {
      // Test implementation
    });
    
    it('should reject invalid alert data', async () => {
      // Test implementation
    });
  });
});
```

#### Controller Tests
Located in `backend/tests/controllers/`

**Purpose**: Test HTTP request/response handling

**Example**: `DeviceStateController.test.ts`
```typescript
describe('DeviceStateController', () => {
  describe('GET /api/devices/states', () => {
    it('should return all device states', async () => {
      const response = await request(app)
        .get('/api/devices/states')
        .expect(200);
      
      expect(response.body).toHaveProperty('devices');
    });
  });
});
```

#### Middleware Tests
Located in `backend/tests/middleware/`

**Purpose**: Test request processing middleware

**Example**: `auth.test.ts`
```typescript
describe('auth middleware', () => {
  it('should authenticate valid JWT token', () => {
    // Test implementation
  });
  
  it('should reject invalid token', () => {
    // Test implementation
  });
});
```

#### Utility Tests
Located in `backend/tests/utils/`

**Purpose**: Test utility functions and helpers

### Frontend Tests

#### Component Tests
Located in `frontend/src/test/components/`

**Purpose**: Test React component behavior

**Example**: `Dashboard.test.tsx`
```typescript
describe('Dashboard Component', () => {
  it('should render sensor data', () => {
    render(<Dashboard />);
    expect(screen.getByText('Temperature')).toBeInTheDocument();
  });
});
```

#### Service Tests
Located in `frontend/src/test/services/`

**Purpose**: Test API communication and data processing

#### Hook Tests
Located in `frontend/src/test/hooks/`

**Purpose**: Test custom React hooks

## Test Configuration

### Backend Jest Configuration
```json
{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "setupFilesAfterEnv": ["<rootDir>/tests/setup.ts"],
  "testMatch": ["<rootDir>/tests/**/*.test.ts"],
  "collectCoverageFrom": [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/index.ts"
  ],
  "coverageDirectory": "coverage",
  "coverageReporters": ["text", "lcov", "html"]
}
```

### Frontend Vitest Configuration
```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true
  }
});
```

## Testing Patterns

### Mocking Strategies

#### Database Mocking
```typescript
// Setup
beforeEach(() => {
  jest.clearAllMocks();
  mockMongoose.connect.mockResolvedValue(undefined);
});
```

#### MQTT Mocking
```typescript
const mockMqttClient = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  on: jest.fn()
};
```

#### WebSocket Mocking
```typescript
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  join: jest.fn()
};
```

### Test Data Management

#### Test Fixtures
```typescript
// fixtures/sensorData.ts
export const mockSensorData = {
  temperature: 23.5,
  humidity: 65.2,
  timestamp: new Date('2024-01-01T12:00:00Z')
};
```

#### Factory Functions
```typescript
// factories/userFactory.ts
export const createTestUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'operator',
  ...overrides
});
```

### Async Testing

#### Promise Testing
```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

#### Error Handling
```typescript
it('should handle errors gracefully', async () => {
  await expect(failingFunction()).rejects.toThrow('Expected error');
});
```

## Coverage Requirements

### Minimum Coverage Targets
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 85%
- **Lines**: 80%

### Critical Components (100% Coverage)
- Authentication middleware
- Database connection logic
- Error handling
- Security-related functions

### Coverage Exclusions
- Configuration files
- Type definitions
- Third-party integrations
- Generated files

## Running Tests

### Backend Tests
```bash
cd backend

# Run all tests
yarn test

# Run with coverage
yarn test --coverage

# Run specific test file
yarn test AlertService.test.ts

# Run tests in watch mode
yarn test --watch

# Run tests with verbose output
yarn test --verbose
```

### Frontend Tests
```bash
cd frontend

# Run all tests
yarn test

# Run with coverage
yarn test --coverage

# Run specific test
yarn test Dashboard.test.tsx

# Run tests in watch mode
yarn test --watch
```

### Continuous Integration
```bash
# Pre-commit hook
yarn test --coverage --watchAll=false

# CI pipeline
yarn test:ci
yarn lint
yarn build
```

## Test Best Practices

### Writing Good Tests

#### Test Naming
```typescript
// Good: Descriptive test names
it('should create alert when temperature exceeds threshold', () => {});

// Bad: Vague test names
it('should work', () => {});
```

#### Test Structure (AAA Pattern)
```typescript
it('should calculate average temperature', () => {
  // Arrange
  const temperatures = [20, 22, 24, 26];
  
  // Act
  const average = calculateAverage(temperatures);
  
  // Assert
  expect(average).toBe(23);
});
```

#### Single Responsibility
```typescript
// Good: One assertion per test
it('should return 200 status code', async () => {
  const response = await request(app).get('/api/health');
  expect(response.status).toBe(200);
});

it('should return health status in response body', async () => {
  const response = await request(app).get('/api/health');
  expect(response.body).toHaveProperty('status', 'healthy');
});
```

### Avoiding Common Pitfalls

#### Flaky Tests
- Use deterministic test data
- Mock time-dependent functions
- Avoid race conditions
- Clean up after tests

#### Test Coupling
- Independent test execution
- No shared state between tests
- Proper setup and teardown

#### Over-mocking
- Mock only external dependencies
- Test behavior, not implementation
- Use real objects when possible

## Test Utilities

### Custom Matchers
```typescript
expect.extend({
  toBeValidDate(received) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    return {
      message: () => `expected ${received} to be a valid date`,
      pass
    };
  }
});
```

### Test Helpers
```typescript
// helpers/testUtils.ts
export const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  ...overrides
});
```

## Performance Testing

### Load Testing
```typescript
describe('Performance Tests', () => {
  it('should handle 100 concurrent requests', async () => {
    const promises = Array(100).fill(null).map(() => 
      request(app).get('/api/sensors/data')
    );
    
    const responses = await Promise.all(promises);
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });
});
```

### Memory Testing
```typescript
it('should not leak memory during sensor data processing', () => {
  const initialMemory = process.memoryUsage();
  
  // Process large dataset
  processSensorData(largeSensorDataset);
  
  // Force garbage collection
  if (global.gc) global.gc();
  
  const finalMemory = process.memoryUsage();
  const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
  
  expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB threshold
});
```

## Debugging Tests

### Debug Configuration
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Jest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```

### Logging in Tests
```typescript
it('should process data correctly', () => {
  // Debug test data when needed
console.log('Test data:', testData);
  const result = processData(testData);
  expect(result).toBeDefined();
});
```

## Documentation Standards

### Test Documentation
- Document complex test scenarios
- Explain mock setups
- Document performance test rationale
- Maintain test README files

### Code Comments
```typescript
describe('AlertService', () => {
  // Test the core alert creation functionality
  // This covers validation, database storage, and notification sending
  describe('createAlert', () => {
    it('should create alert with all required fields', async () => {
      // Given valid alert data with all required fields
      const alertData = createValidAlertData();
      
      // When creating the alert
      const result = await alertService.createAlert(alertData);
      
      // Then the alert should be created successfully
      expect(result).toMatchObject(expectedAlertStructure);
    });
  });
});
```
