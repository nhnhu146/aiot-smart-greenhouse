# Use Cases

This document describes the primary use cases for the AIoT Smart Greenhouse system.

## User Roles

### Greenhouse Owner/Manager
- Primary system administrator
- Full access to all features
- Responsible for system configuration
- Receives all alerts and notifications

### Greenhouse Operator
- Day-to-day system user
- Can monitor conditions and control devices
- Limited configuration access
- Receives operational alerts

### Maintenance Technician
- Focuses on device health and troubleshooting
- Access to diagnostic information
- Can perform system maintenance tasks
- Receives technical alerts

## Core Use Cases

### UC-01: Monitor Environmental Conditions

**Actor**: Greenhouse Operator

**Description**: Monitor real-time environmental conditions in the greenhouse

**Preconditions**:
- User is authenticated
- Sensors are connected and operational

**Main Flow**:
1. User accesses the dashboard
2. System displays current temperature, humidity, soil moisture, and light levels
3. User views historical data trends
4. User checks sensor status and connectivity

**Alternative Flows**:
- If sensors are offline, system shows last known values with timestamp
- User can switch between different greenhouse zones

**Postconditions**:
- User has current environmental awareness
- System logs user activity

### UC-02: Control Greenhouse Devices

**Actor**: Greenhouse Operator

**Description**: Manually control greenhouse devices (pumps, fans, lights, heaters)

**Preconditions**:
- User is authenticated with control permissions
- Devices are connected and responsive

**Main Flow**:
1. User navigates to device control panel
2. User selects device to control
3. User sets desired state (on/off, speed, intensity)
4. System sends command to device via MQTT
5. Device confirms state change
6. System updates UI with new device status

**Alternative Flows**:
- If device is unresponsive, system shows error message
- If automation is active, user receives override confirmation

**Postconditions**:
- Device state is updated
- Action is logged in system history

### UC-03: Configure Automation Rules

**Actor**: Greenhouse Owner/Manager

**Description**: Set up automated responses to environmental conditions

**Preconditions**:
- User has administrator privileges
- System is operational

**Main Flow**:
1. User accesses automation configuration
2. User defines trigger conditions (e.g., temperature > 25°C)
3. User specifies actions (e.g., turn on fan)
4. User sets rule priority and schedule
5. System validates and saves automation rule
6. System begins monitoring for trigger conditions

**Alternative Flows**:
- If conflicting rules exist, system requests prioritization
- User can test rules in simulation mode

**Postconditions**:
- Automation rule is active
- System monitors conditions continuously

### UC-04: Receive and Manage Alerts

**Actor**: All Users

**Description**: Receive notifications when conditions exceed thresholds

**Preconditions**:
- Alert thresholds are configured
- User notification preferences are set

**Main Flow**:
1. System detects threshold violation
2. System generates alert with severity level
3. System sends notifications based on user preferences
4. User receives alert via email and/or dashboard
5. User acknowledges alert
6. User takes corrective action if needed

**Alternative Flows**:
- If alert persists, system escalates to higher severity
- User can temporarily disable specific alert types

**Postconditions**:
- Alert is logged in system
- User is informed of system status

### UC-05: Analyze Historical Data

**Actor**: Greenhouse Owner/Manager

**Description**: Review historical data to optimize greenhouse operations

**Preconditions**:
- Historical data is available
- User has analytical access

**Main Flow**:
1. User accesses data analysis interface
2. User selects date range and metrics
3. System generates charts and reports
4. User identifies trends and patterns
5. User exports data for external analysis

**Alternative Flows**:
- User can compare data across different time periods
- System provides automated insights and recommendations

**Postconditions**:
- User gains operational insights
- Data export is available for further analysis

### UC-06: Manage User Access

**Actor**: Greenhouse Owner/Manager

**Description**: Control user access and permissions

**Preconditions**:
- Administrator is authenticated
- User management interface is accessible

**Main Flow**:
1. Administrator accesses user management
2. Administrator creates/modifies user accounts
3. Administrator sets role-based permissions
4. Administrator configures notification preferences
5. System updates access controls

**Alternative Flows**:
- Administrator can temporarily disable user accounts
- System requires confirmation for permission changes

**Postconditions**:
- User access is properly controlled
- Changes are logged for audit trail

## Advanced Use Cases

<!-- ### UC-07: Predictive Analytics

**Actor**: System (Automated)

**Description**: Use machine learning to predict optimal conditions

**Main Flow**:
1. System analyzes historical data patterns
2. System identifies optimal condition ranges
3. System predicts future environmental needs
4. System suggests automation rule adjustments
5. System learns from user feedback and outcomes -->

### UC-08: Remote Monitoring

**Actor**: Greenhouse Owner/Manager

**Description**: Monitor greenhouse remotely via mobile devices

**Main Flow**:
1. User accesses system via mobile browser
2. System provides responsive mobile interface
3. User monitors conditions and receives alerts
4. User can perform basic device control
5. Critical alerts trigger push notifications

### UC-09: Integration with External Systems

**Actor**: System Administrator

**Description**: Integrate with weather services and other IoT systems

**Main Flow**:
1. Administrator configures external API connections
2. System pulls weather forecast data
3. System adjusts automation rules based on predictions
4. System shares data with connected systems
5. System maintains integration health monitoring

### UC-10: Data Backup and Recovery

**Actor**: System Administrator

**Description**: Ensure data integrity and system continuity

**Main Flow**:
1. System performs automated backups
2. Administrator configures backup schedules
3. System verifies backup integrity
4. In case of failure, system restores from backup
5. Administrator monitors backup status

## Error Scenarios

### ES-01: Sensor Failure
- System detects sensor disconnection
- Alert is generated for maintenance
- System continues operation with remaining sensors
- Historical data is preserved

### ES-02: Network Connectivity Loss
- System buffers data locally
- Reconnection triggers data synchronization
- Users are notified of connectivity issues
- Critical operations continue in offline mode

### ES-03: Device Control Failure
- System retries device commands
- User is notified of control failures
- Manual override options are provided
- Maintenance alerts are generated

### ES-04: Database Connectivity Issues
- System uses local caching
- Operations are queued for later processing
- Critical alerts are still delivered
- System attempts automatic recovery

## Success Metrics

### Operational Metrics
- **Uptime**: System availability > 99.5%
- **Response Time**: API responses < 500ms
- **Data Accuracy**: Sensor readings within 2% tolerance
- **Alert Response**: Critical alerts delivered within 30 seconds

### User Satisfaction Metrics
- **User Adoption**: Active user sessions
- **Feature Usage**: Most used features and interfaces
- **Support Requests**: Reduction in support tickets
- **User Feedback**: Regular satisfaction surveys

### Business Metrics
- **Crop Yield**: Improvement in greenhouse productivity
- **Resource Efficiency**: Reduction in water and energy usage
- **Cost Savings**: Operational cost reductions
- **ROI**: Return on investment tracking
