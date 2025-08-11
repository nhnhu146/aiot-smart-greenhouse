# Local Development Setup

This guide will help you set up the AIoT Smart Greenhouse project for local development.

## Prerequisites

### Required Software
- **Node.js** (v18.0.0 or higher)
- **Yarn** package manager
- **MongoDB** (v5.0 or higher)
- **Git**
- **Python** (v3.8+ for scripts)

### Optional Software
- **Docker** (for containerized setup)
- **MQTT Broker** (Mosquitto recommended)
- **VS Code** (recommended IDE)

## Installation Steps

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/aiot-smart-greenhouse.git
cd aiot-smart-greenhouse
```

### 2. Install Dependencies

#### Backend Setup
```bash
cd backend
yarn install
```

#### Frontend Setup
```bash
cd ../frontend
yarn install
```

### 3. Environment Configuration

#### Create Backend Environment File
```bash
cd backend
cp .env.example .env
```

Edit `.env` with your configuration:
```bash
MONGODB_URI=mongodb://localhost:27017/greenhouse
JWT_SECRET=your-development-secret-key
MQTT_BROKER_URL=mqtt://localhost:1883
# Add other variables as needed
```

#### Create Frontend Environment File
```bash
cd ../frontend
cp .env.example .env
```

### 4. Database Setup

#### Start MongoDB
```bash
# Using system service
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### Initialize Database
```bash
cd backend
yarn run init-db
```

### 5. MQTT Broker Setup (Optional)

#### Install Mosquitto
```bash
# Ubuntu/Debian
sudo apt-get install mosquitto mosquitto-clients

# macOS
brew install mosquitto

# Windows
# Download from https://mosquitto.org/download/
```

#### Start Mosquitto
```bash
mosquitto -c /usr/local/etc/mosquitto/mosquitto.conf
```

### 6. Development Server Startup

#### Start Backend
```bash
cd backend
yarn dev
```

#### Start Frontend (in new terminal)
```bash
cd frontend
yarn dev
```

### 7. Verify Installation

1. **Backend API**: Visit `http://localhost:3001/api/health`
2. **Frontend**: Visit `http://localhost:5173`
3. **WebSocket**: Check browser console for connection status

## Development Workflow

### Code Style
- Use ESLint and Prettier for code formatting
- Follow TypeScript best practices
- Write unit tests for new features

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: description of changes"

# Push and create PR
git push origin feature/your-feature-name
```

### Testing
```bash
# Run backend tests
cd backend
yarn test

# Run frontend tests
cd frontend
yarn test

# Run linting
yarn lint
```

### Database Management
```bash
# Create admin user
cd backend
yarn run create-admin

# Reset database
yarn run reset-db

# Backup database
yarn run backup-db
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill processes on specific ports
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

#### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify network connectivity

#### MQTT Connection Issues
- Start MQTT broker
- Check broker URL configuration
- Verify firewall settings

#### Build Errors
```bash
# Clear node modules and reinstall
rm -rf node_modules yarn.lock
yarn install

# Clear Vite cache (frontend)
yarn vite --force
```

## IDE Configuration

### VS Code Extensions
- TypeScript and JavaScript Language Features
- ESLint
- Prettier
- MongoDB for VS Code
- Thunder Client (for API testing)

### VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## Next Steps

After setup is complete:
1. Read the [System Overview](SYSTEM_OVERVIEW.md)
2. Review the [API Reference](API_REFERENCE.md)
3. Check the [WebSocket Reference](WEBSOCKET_REFERENCE.md)
4. Explore [Use Cases](USE_CASES.md)
