# System Overview

The AIoT Smart Greenhouse is a comprehensive IoT-based system for monitoring and automating greenhouse operations.

## Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   IoT Devices   │◄──►│   MQTT Broker   │◄──►│   Backend API   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Web Frontend   │◄──►│   WebSocket     │◄──►│    Database     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Components

#### Backend Services
- **API Server**: RESTful API built with Express.js and TypeScript
- **WebSocket Server**: Real-time communication using Socket.io
- **MQTT Handler**: Device communication through MQTT protocol
- **Database Layer**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based user authentication
- **Automation Engine**: Rule-based automation system

#### Frontend Application
- **React Application**: Modern SPA built with Vite
- **Real-time Dashboard**: Live data visualization
- **Device Control**: Manual device operation interface
- **User Management**: Authentication and user settings
- **Responsive Design**: Mobile-friendly interface

#### IoT Integration
- **Sensor Data Collection**: Temperature, humidity, soil moisture, light levels
- **Device Control**: Pumps, fans, lights, heating systems
- **Communication Protocol**: MQTT for reliable messaging
- **Data Processing**: Real-time sensor data processing

## System Features

### Monitoring
- Real-time sensor data visualization
- Historical data analysis and trends
- Alert system for threshold violations
- Device status monitoring

### Automation
- Rule-based automation triggers
- Scheduled operations
- Conditional logic for complex scenarios
- Manual override capabilities

### User Management
- Multi-user support with role-based access
- User preferences and settings
- Authentication and authorization
- Activity logging

### Data Management
- Time-series sensor data storage
- Device operation history
- Alert and notification logs
- Data export capabilities

### Communication
- RESTful API for client applications
- WebSocket for real-time updates
- MQTT for IoT device communication
- Email notifications for alerts

## Data Flow

### Sensor Data Flow
1. **Collection**: IoT sensors collect environmental data
2. **Transmission**: Data sent via MQTT to broker
3. **Processing**: Backend processes and validates data
4. **Storage**: Data stored in MongoDB with timestamps
5. **Distribution**: Real-time updates sent via WebSocket
6. **Analysis**: Automation rules evaluate data for triggers

### Control Flow
1. **User Input**: Commands from web interface or automation
2. **Validation**: Backend validates commands and permissions
3. **Execution**: Commands sent to devices via MQTT
4. **Confirmation**: Device status updates received
5. **Logging**: Operations logged for audit trail
6. **Notification**: Status updates sent to connected clients

### Alert Flow
1. **Threshold Check**: Continuous monitoring of sensor values
2. **Rule Evaluation**: Automation engine checks configured rules
3. **Alert Generation**: Alerts created for threshold violations
4. **Notification**: Users notified via email and WebSocket
5. **Escalation**: Persistent alerts trigger escalation procedures
6. **Resolution**: Alert resolution tracked and logged

## Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.io
- **IoT Communication**: MQTT.js
- **Authentication**: JWT
- **Testing**: Jest
- **Logging**: Winston

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **State Management**: Context API
- **UI Components**: Custom components
- **Charts**: Chart.js or similar
- **Real-time**: Socket.io-client
- **Testing**: Vitest

### IoT Layer
- **Protocol**: MQTT
- **Message Format**: JSON
- **Security**: TLS encryption
- **Quality of Service**: Configurable QoS levels

### Infrastructure
- **Containerization**: Docker
- **Process Management**: PM2
- **Reverse Proxy**: Nginx (optional)
- **Monitoring**: Custom health checks

## Security Considerations

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- Secure password hashing
- Session management

### Communication Security
- HTTPS for web traffic
- TLS for MQTT communication
- WebSocket secure connections
- API rate limiting

### Data Security
- Database access controls
- Input validation and sanitization
- SQL injection prevention
- XSS protection

## Scalability

### Horizontal Scaling
- Stateless backend design
- Load balancer support
- Database clustering
- Message queue integration

### Performance Optimization
- Database indexing
- Caching strategies
- Connection pooling
- Efficient data structures

## Monitoring & Observability

### Health Checks
- API endpoint health monitoring
- Database connectivity checks
- MQTT broker status
- WebSocket connection status

### Logging
- Structured logging with Winston
- Error tracking and alerting
- Performance metrics
- User activity logs

### Metrics
- Response time monitoring
- Database query performance
- Memory and CPU usage
- IoT device connectivity stats
