# 📋 AIoT Smart Greenhouse - Use Cases Documentation

## 📖 Overview

Tài liệu này mô tả chi tiết tất cả các use cases (trường hợp sử dụng) của hệ thống AIoT Smart Greenhouse. Mỗi use case bao gồm mô tả, preconditions, flow chính, exception flows và expected outcomes.

## 🎯 Primary Actors

- **👤 Greenhouse Owner**: Người sở hữu/quản lý nhà kính
- **🔧 System Administrator**: Quản trị viên hệ thống
- **🌱 IoT Devices**: Các thiết bị cảm biến và actuator
- **🤖 Automation System**: Hệ thống tự động hóa
- **📧 Notification System**: Hệ thống thông báo

---

## 🔐 1. User Authentication & Management

### UC1.1: User Registration
**Actor**: New User  
**Goal**: Tạo tài khoản mới để truy cập hệ thống

**Preconditions**:
- User chưa có tài khoản
- Email chưa được đăng ký

**Main Flow**:
1. User truy cập trang Sign Up
2. User nhập email, password, confirm password
3. System validate email format và password strength
4. System kiểm tra email chưa tồn tại
5. System tạo tài khoản với encrypted password
6. System gửi email xác nhận (optional)
7. User được redirect đến Dashboard

**Alternative Flows**:
- **3a**: Email format không hợp lệ → Hiển thị error message
- **3b**: Password không đủ mạnh → Hiển thị yêu cầu password
- **4a**: Email đã tồn tại → Hiển thị "Email already registered"

**Expected Outcome**: User có tài khoản mới và được đăng nhập

---

### UC1.2: User Authentication
**Actor**: Registered User  
**Goal**: Đăng nhập vào hệ thống

**Preconditions**:
- User đã có tài khoản
- User chưa đăng nhập

**Main Flow**:
1. User truy cập trang Sign In
2. User nhập email và password
3. System validate credentials
4. System tạo JWT token
5. System redirect user đến Dashboard
6. System lưu session state

**Alternative Flows**:
- **3a**: Sai email/password → Hiển thị "Invalid credentials"
- **3b**: Tài khoản bị khóa → Hiển thị thông báo tài khoản bị khóa

**Expected Outcome**: User được đăng nhập và truy cập Dashboard

---

### UC1.3: Password Recovery
**Actor**: Registered User  
**Goal**: Khôi phục mật khẩu khi quên

**Preconditions**:
- User đã có tài khoản
- User có quyền truy cập email

**Main Flow**:
1. User click "Forgot Password" trên trang Sign In
2. User nhập email address
3. System tìm tài khoản với email đó
4. System tạo password reset token
5. System gửi email với reset link
6. User click reset link trong email
7. User nhập password mới
8. System validate và update password
9. System gửi email xác nhận thay đổi

**Alternative Flows**:
- **3a**: Email không tồn tại → Vẫn hiển thị "Email sent" (security)
- **6a**: Reset token expired → Yêu cầu request reset mới
- **7a**: Password không hợp lệ → Hiển thị yêu cầu password

**Expected Outcome**: User có password mới và có thể đăng nhập

---

## 📊 2. Dashboard & Monitoring

### UC2.1: Real-time Sensor Data Monitoring
**Actor**: Greenhouse Owner  
**Goal**: Theo dõi dữ liệu cảm biến real-time

**Preconditions**:
- User đã đăng nhập
- Có ít nhất 1 IoT device kết nối
- WebSocket connection established

**Main Flow**:
1. User truy cập Dashboard
2. System load initial sensor data từ database
3. System establish WebSocket connection
4. IoT devices publish data qua MQTT
5. Backend receive MQTT messages
6. Backend process và validate sensor data
7. Backend broadcast data qua WebSocket
8. Frontend receive và update UI real-time
9. System store data vào database

**Alternative Flows**:
- **3a**: WebSocket connection fail → Fallback to polling
- **4a**: MQTT connection lost → Show connection warning
- **6a**: Invalid sensor data → Log error, skip update

**Expected Outcome**: User thấy sensor data cập nhật real-time

---

### UC2.2: Historical Data Visualization
**Actor**: Greenhouse Owner  
**Goal**: Xem biểu đồ dữ liệu lịch sử

**Preconditions**:
- User đã đăng nhập
- Có dữ liệu lịch sử trong database

**Main Flow**:
1. User truy cập Dashboard hoặc History page
2. User chọn time range (1h, 24h, 7d, 30d)
3. User chọn metrics để hiển thị
4. System query database với filters
5. System aggregate data theo time range
6. System return formatted chart data
7. Frontend render interactive charts
8. User có thể hover để xem chi tiết

**Alternative Flows**:
- **4a**: No data in range → Show "No data available"
- **4b**: Query timeout → Show error message
- **6a**: Too much data → Implement pagination

**Expected Outcome**: User thấy charts trực quan về dữ liệu lịch sử

---

### UC2.3: System Status Monitoring
**Actor**: Greenhouse Owner  
**Goal**: Theo dõi trạng thái hệ thống và kết nối

**Preconditions**:
- User đã đăng nhập

**Main Flow**:
1. System continuously monitor service health
2. System check WebSocket connection status
3. System check MQTT broker connectivity
4. System check database connection
5. System display status indicators on UI
6. System update connection status real-time

**Status Indicators**:
- 🟢 Connected: All services operational
- 🟡 Warning: Some services degraded
- 🔴 Error: Critical services down

**Expected Outcome**: User biết trạng thái hệ thống hiện tại

---

## 🎛️ 3. Device Control

### UC3.1: Manual Device Control
**Actor**: Greenhouse Owner  
**Goal**: Điều khiển thiết bị thủ công

**Preconditions**:
- User đã đăng nhập
- Thiết bị IoT đã kết nối
- MQTT connection available

**Main Flow**:
1. User truy cập Device Control page
2. User chọn device (light, pump, fan, door, window)
3. User click toggle button để thay đổi trạng thái
4. Frontend gửi control request đến backend
5. Backend validate request và permissions
6. Backend publish MQTT command đến device
7. Device receive command và thực hiện action
8. Device publish status feedback
9. Backend update device state trong database
10. Backend broadcast status update qua WebSocket
11. Frontend update UI với trạng thái mới

**Device Types & Actions**:
- **Light**: ON/OFF
- **Pump**: ON/OFF  
- **Fan**: ON/OFF
- **Door**: OPEN/CLOSE
- **Window**: OPEN/CLOSE

**Alternative Flows**:
- **5a**: Permission denied → Show error message
- **6a**: MQTT publish failed → Show connection error
- **8a**: Device không response → Show timeout warning

**Expected Outcome**: Device thay đổi trạng thái theo yêu cầu

---

### UC3.2: Scheduled Device Control
**Actor**: Greenhouse Owner  
**Goal**: Lên lịch điều khiển thiết bị

**Preconditions**:
- User đã đăng nhập
- Valid device available

**Main Flow**:
1. User truy cập Device Control page
2. User click "Schedule" button for device
3. User chọn action (ON/OFF/OPEN/CLOSE)
4. User set delay time (0-86400 seconds)
5. System validate delay range
6. System create scheduled task
7. System show confirmation với countdown
8. System execute command after delay
9. System update device state
10. System notify user về completion

**Alternative Flows**:
- **5a**: Invalid delay → Show validation error
- **8a**: System restart trước scheduled time → Cancel task

**Expected Outcome**: Device được điều khiển theo lịch đã đặt

---

### UC3.3: Bulk Device Operations
**Actor**: Greenhouse Owner  
**Goal**: Điều khiển nhiều thiết bị cùng lúc

**Preconditions**:
- User đã đăng nhập
- Multiple devices available

**Main Flow**:
1. User truy cập Device Control page
2. User select multiple devices using checkboxes
3. User chọn common action từ dropdown
4. User click "Apply to Selected" button
5. System validate action compatibility
6. System send commands đến all selected devices
7. System track execution status
8. System show progress indicator
9. System display results summary

**Alternative Flows**:
- **5a**: Incompatible action → Show which devices can't perform action
- **6a**: Some commands fail → Show partial success status

**Expected Outcome**: Multiple devices được điều khiển simultaneously

---

## 🤖 4. Automation System

### UC4.1: Configure Automation Rules
**Actor**: Greenhouse Owner  
**Goal**: Thiết lập quy tắc tự động hóa

**Preconditions**:
- User đã đăng nhập
- Sensors và actuators available

**Main Flow**:
1. User truy cập AutoMode page
2. User configure threshold settings:
   - Temperature thresholds (min/max)
   - Humidity thresholds (min/max)
   - Soil moisture thresholds (min/max)
   - Light level thresholds (min/max)
   - Water level thresholds (min/max)
3. User configure automation rules:
   - Pump automation (based on soil moisture)
   - Light automation (based on light level)
   - Fan automation (based on temperature)
   - Rain protection (auto close doors/windows)
4. User set automation cooldown periods
5. User save configuration
6. System validate all settings
7. System store configuration
8. System activate automation engine

**Configuration Options**:
```yaml
Temperature Control:
  - Min: 15°C, Max: 35°C
  - Action: Turn on fan if > max
  
Pump Control:
  - Threshold: < 30% soil moisture
  - Duration: 10 seconds
  - Cooldown: 15 seconds
  
Light Control:
  - Threshold: < 500 lux
  - Schedule: 6AM - 6PM only
```

**Expected Outcome**: Automation rules được lưu và kích hoạt

---

### UC4.2: Enable/Disable Automation
**Actor**: Greenhouse Owner  
**Goal**: Bật/tắt chế độ tự động

**Preconditions**:
- User đã đăng nhập
- Automation rules đã được configure

**Main Flow**:
1. User truy cập AutoMode page hoặc Dashboard
2. User click AutoMode toggle switch
3. System validate current automation state
4. System toggle automation status
5. System broadcast status change
6. System update UI với trạng thái mới
7. If enabled: System start monitoring sensors
8. If disabled: System stop automated actions

**Alternative Flows**:
- **4a**: Toggle during active automation → Wait for current action to complete

**Expected Outcome**: Automation được enable/disable theo yêu cầu

---

### UC4.3: Automated Sensor Response
**Actor**: Automation System  
**Goal**: Tự động phản ứng với dữ liệu sensor

**Preconditions**:
- Automation mode enabled
- Sensor data available
- Devices operational

**Main Flow**:
1. IoT device publish sensor data
2. Backend receive và process data
3. Automation engine evaluate rules
4. If threshold violated:
   a. Check cooldown period
   b. Determine appropriate action
   c. Execute device command
   d. Log automation action
   e. Update device state
   f. Broadcast update
5. Continue monitoring

**Automation Rules**:
- **Low Soil Moisture** → Turn on pump for 10s
- **High Temperature** → Turn on fan
- **Low Light** → Turn on grow light (daytime only)
- **Rain Detected** → Close doors and windows
- **Low Water Level** → Send alert, disable pump

**Alternative Flows**:
- **4a**: Device unavailable → Log error, skip action
- **4b**: In cooldown period → Skip action, log

**Expected Outcome**: System tự động phản ứng với sensor data

---

### UC4.4: Manual Automation Trigger
**Actor**: Greenhouse Owner  
**Goal**: Trigger automation check thủ công

**Preconditions**:
- User đã đăng nhập
- Automation configured

**Main Flow**:
1. User truy cập AutoMode page
2. User click "Run Check" button
3. System gather current sensor data
4. System evaluate all automation rules
5. System execute necessary actions
6. System show execution results
7. System display which rules were triggered

**Expected Outcome**: Automation rules được execute immediately

---

## 📊 5. Data Management & History

### UC5.1: View Historical Data
**Actor**: Greenhouse Owner  
**Goal**: Xem dữ liệu lịch sử chi tiết

**Preconditions**:
- User đã đăng nhập
- Historical data exists

**Main Flow**:
1. User truy cập History page
2. User chọn data type tab:
   - Sensor Data
   - Device Controls
   - Voice Commands
   - Alerts
3. User apply filters:
   - Date range
   - Device type
   - Value ranges
4. System query database với filters
5. System return paginated results
6. User có thể sort theo columns
7. User có thể export data

**Filter Options**:
- **Date Range**: Last hour, 24h, 7 days, 30 days, custom
- **Sensor Type**: Temperature, humidity, soil moisture, etc.
- **Device Type**: Light, pump, fan, door, window
- **Status**: Success, error, warning

**Expected Outcome**: User thấy historical data theo filters

---

### UC5.2: Export Historical Data
**Actor**: Greenhouse Owner  
**Goal**: Export dữ liệu để phân tích ngoài hệ thống

**Preconditions**:
- User đã đăng nhập
- Data available for export

**Main Flow**:
1. User truy cập History page
2. User apply filters for data to export
3. User click "Export" button
4. User chọn format (JSON, CSV)
5. System query và format data
6. System generate export file
7. System trigger file download
8. User save file to local machine

**Export Formats**:
- **CSV**: Spreadsheet-compatible format
- **JSON**: Structured data for programming

**Alternative Flows**:
- **5a**: Too much data → Implement chunked export
- **6a**: Export fails → Show error message

**Expected Outcome**: User có file chứa historical data

---

### UC5.3: Data Cleanup & Optimization
**Actor**: System Administrator  
**Goal**: Dọn dẹp và tối ưu database

**Preconditions**:
- Admin privileges
- Database accessible

**Main Flow**:
1. Admin truy cập Data Management page
2. Admin view database statistics
3. Admin configure cleanup settings:
   - Data retention period
   - Duplicate detection rules
4. Admin trigger cleanup operations:
   - Remove old data
   - Merge duplicate entries
   - Optimize indexes
5. System execute cleanup process
6. System show cleanup results
7. System update database statistics

**Cleanup Operations**:
- Remove sensor data older than X days
- Merge duplicate entries within 5-second window
- Remove orphaned device control records
- Archive old alert records

**Expected Outcome**: Database được optimize và dọn dẹp

---

## 🔔 6. Alert & Notification System

### UC6.1: Configure Alert Thresholds
**Actor**: Greenhouse Owner  
**Goal**: Thiết lập ngưỡng cảnh báo

**Preconditions**:
- User đã đăng nhập

**Main Flow**:
1. User truy cập Settings page
2. User navigate đến Alert Settings section
3. User configure thresholds:
   - Temperature: min/max values
   - Humidity: min/max values  
   - Soil Moisture: min value
   - Water Level: min value
4. User set alert frequency (immediate, hourly, daily)
5. User configure notification channels:
   - Email recipients
   - Push notifications
6. User save settings
7. System validate thresholds
8. System store alert configuration

**Threshold Examples**:
```yaml
Temperature: 10°C - 40°C
Humidity: 30% - 80%
Soil Moisture: > 20%
Water Level: > 10%
```

**Expected Outcome**: Alert thresholds được configure

---

### UC6.2: Real-time Alert Generation
**Actor**: Alert System  
**Goal**: Tạo cảnh báo khi sensor vượt ngưỡng

**Preconditions**:
- Alert thresholds configured
- Sensor data incoming

**Main Flow**:
1. System receive sensor data
2. System compare với configured thresholds
3. If threshold violated:
   a. Generate alert record
   b. Determine alert severity
   c. Check alert frequency rules
   d. Send notifications
   e. Store alert in database
   f. Broadcast via WebSocket
4. Continue monitoring

**Alert Severities**:
- 🟢 **Info**: Minor deviations
- 🟡 **Warning**: Moderate issues
- 🔴 **Error**: Critical problems

**Notification Channels**:
- Real-time UI notifications
- Email notifications
- Push notifications (if configured)

**Expected Outcome**: Alerts được tạo và gửi khi cần

---

### UC6.3: Alert Management
**Actor**: Greenhouse Owner  
**Goal**: Quản lý và xử lý alerts

**Preconditions**:
- User đã đăng nhập
- Alerts exist in system

**Main Flow**:
1. User truy cập Alert History page
2. User view list of active alerts
3. User có thể:
   - Acknowledge alerts
   - Filter by type/severity/date
   - View alert details
   - Export alert history
4. For each alert, user can:
   - Mark as resolved
   - Add notes/comments
   - Take corrective action

**Alert Actions**:
- **Acknowledge**: Mark alert as seen
- **Resolve**: Mark issue as fixed
- **Snooze**: Temporarily disable similar alerts

**Expected Outcome**: Alerts được manage và resolve

---

### UC6.4: Email Notification System
**Actor**: Notification System  
**Goal**: Gửi email alerts đến users

**Preconditions**:
- Email configuration setup
- Recipients configured
- SMTP server accessible

**Main Flow**:
1. Alert system trigger email notification
2. System load email template
3. System populate template với alert data
4. System send email đến configured recipients
5. System log email delivery status
6. If delivery fails, system retry với backoff

**Email Templates**:
- Critical alert template
- Daily summary template
- System status template

**Alternative Flows**:
- **4a**: SMTP server unavailable → Queue for later delivery
- **4b**: Invalid recipient → Log error, continue với others

**Expected Outcome**: Email notifications được gửi successfully

---

## 🎤 7. Voice Command System

### UC7.1: Process Voice Commands
**Actor**: Greenhouse Owner  
**Goal**: Điều khiển thiết bị bằng voice commands

**Preconditions**:
- Voice input device available
- MQTT connection established

**Main Flow**:
1. User speak command to voice input device
2. Device process audio và extract text
3. Device publish command via MQTT
4. Backend receive voice command
5. Backend parse và validate command
6. Backend execute device action
7. Backend store command history
8. Backend send feedback đến device
9. Device provide audio/visual confirmation

**Supported Commands**:
```
"Turn on the lights"
"Turn off the pump"  
"Open the door"
"Close the window"
"Start the fan"
"Stop the fan"
```

**Alternative Flows**:
- **3a**: Audio unclear → Request repeat
- **5a**: Command not recognized → Send error feedback
- **6a**: Device unavailable → Report device offline

**Expected Outcome**: Device action được thực hiện via voice

---

### UC7.2: Voice Command History
**Actor**: Greenhouse Owner  
**Goal**: Xem lịch sử voice commands

**Preconditions**:
- User đã đăng nhập
- Voice commands đã được processed

**Main Flow**:
1. User truy cập History page
2. User select "Voice Commands" tab
3. System display command history with:
   - Command text
   - Timestamp
   - Confidence score
   - Processing status
   - Error messages (if any)
4. User có thể filter và sort data

**History Data**:
- Original command text
- Processing confidence (0-100%)
- Success/failure status
- Execution time
- Device response

**Expected Outcome**: User thấy complete voice command history

---

## ⚙️ 8. System Configuration

### UC8.1: General System Settings
**Actor**: Greenhouse Owner  
**Goal**: Configure hệ thống settings

**Preconditions**:
- User đã đăng nhập

**Main Flow**:
1. User truy cập Settings page
2. User configure general settings:
   - System timezone
   - Temperature units (°C/°F)
   - Language preferences
   - Auto-refresh intervals
3. User save settings
4. System validate settings
5. System apply configuration
6. System show confirmation

**Settings Categories**:
- **Display**: Units, language, theme
- **Notifications**: Email, push, frequency
- **Data**: Retention period, export format
- **Security**: Session timeout, password policy

**Expected Outcome**: System settings được apply

---

### UC8.2: Email Configuration
**Actor**: System Administrator  
**Goal**: Configure email service settings

**Preconditions**:
- Admin privileges
- SMTP server details available

**Main Flow**:
1. Admin truy cập Settings page
2. Admin navigate đến Email Configuration
3. Admin input SMTP settings:
   - Server host và port
   - Authentication credentials
   - Security options (TLS/SSL)
   - Sender information
4. Admin test email configuration
5. System attempt test email
6. System show test results
7. If successful, admin save configuration

**SMTP Settings**:
- Host: smtp.gmail.com
- Port: 587 (TLS) hoặc 465 (SSL)
- Username/Password
- Encryption method

**Expected Outcome**: Email service được configure và test

---

### UC8.3: MQTT Configuration
**Actor**: System Administrator  
**Goal**: Configure MQTT broker settings

**Preconditions**:
- Admin privileges
- MQTT broker accessible

**Main Flow**:
1. Admin truy cập Settings page
2. Admin configure MQTT settings:
   - Broker host và port
   - Authentication (if required)
   - Topic prefixes
   - Connection options
3. Admin test MQTT connection
4. System attempt broker connection
5. System show connection status
6. If successful, admin save configuration

**MQTT Settings**:
- Broker: mqtt.noboroto.id.vn:1883
- Topics: greenhouse/sensors/*, greenhouse/controls/*
- QoS levels, retain messages
- Keep-alive intervals

**Expected Outcome**: MQTT connection được configure

---

## 🔍 9. Monitoring & Analytics

### UC9.1: System Health Monitoring
**Actor**: System Administrator  
**Goal**: Monitor system health và performance

**Preconditions**:
- Admin privileges
- System metrics available

**Main Flow**:
1. Admin truy cập System Monitor page
2. System display health metrics:
   - CPU và memory usage
   - Database performance
   - WebSocket connections
   - MQTT message rates
   - Error rates
3. System show historical trends
4. System highlight issues requiring attention

**Health Metrics**:
- **Services**: Online/offline status
- **Performance**: Response times, throughput
- **Errors**: Error rates, recent failures
- **Resources**: CPU, memory, disk usage

**Expected Outcome**: Admin có visibility vào system health

---

### UC9.2: Usage Analytics
**Actor**: Greenhouse Owner  
**Goal**: Analyze usage patterns và trends

**Preconditions**:
- User đã đăng nhập
- Historical data available

**Main Flow**:
1. User truy cập Analytics page
2. System generate reports:
   - Device usage frequency
   - Sensor data trends
   - Automation effectiveness
   - Alert patterns
3. System display interactive charts
4. User có thể customize time ranges
5. User có thể export reports

**Analytics Reports**:
- Most controlled devices
- Peak usage times
- Environmental trends
- System reliability metrics

**Expected Outcome**: User có insights về system usage

---

## 🚨 10. Error Handling & Recovery

### UC10.1: Handle Service Failures
**Actor**: System  
**Goal**: Gracefully handle service failures

**Preconditions**:
- Service monitoring active

**Main Flow**:
1. System detect service failure
2. System log error details
3. System attempt automatic recovery:
   - Restart service
   - Switch to backup
   - Degrade gracefully
4. If recovery fails:
   - Alert administrators
   - Show user-friendly errors
   - Maintain core functionality
5. System continue monitoring for recovery

**Recovery Strategies**:
- **Database**: Connection pooling, retry logic
- **MQTT**: Auto-reconnect, message queuing
- **WebSocket**: Fallback to polling
- **Email**: Queue messages, retry later

**Expected Outcome**: System continues operating với minimal disruption

---

### UC10.2: Data Loss Prevention
**Actor**: System  
**Goal**: Prevent và recover từ data loss

**Preconditions**:
- Backup systems configured

**Main Flow**:
1. System continuously backup critical data
2. System detect potential data loss scenarios
3. System implement prevention measures:
   - Transaction rollbacks
   - Data validation
   - Redundant storage
4. If data loss occurs:
   - Stop further operations
   - Assess damage extent
   - Restore from backups
   - Verify data integrity
5. System resume normal operations

**Data Protection**:
- Regular database backups
- Transaction logging
- Redundant data storage
- Integrity checks

**Expected Outcome**: Critical data được protected và recoverable

---

## 📱 11. Mobile & Responsive Features

### UC11.1: Mobile Dashboard Access
**Actor**: Greenhouse Owner (Mobile User)  
**Goal**: Access dashboard trên mobile device

**Preconditions**:
- User có mobile device
- Internet connection available

**Main Flow**:
1. User mở web browser trên mobile
2. User navigate đến application URL
3. System detect mobile device
4. System serve responsive layout
5. User có thể:
   - View sensor data
   - Control devices
   - Receive notifications
   - Access basic features

**Mobile Optimizations**:
- Touch-friendly controls
- Responsive charts
- Simplified navigation
- Offline capability (limited)

**Expected Outcome**: Full functionality available trên mobile

---

### UC11.2: Push Notifications
**Actor**: Notification System  
**Goal**: Send push notifications đến mobile devices

**Preconditions**:
- User granted notification permissions
- Service worker registered

**Main Flow**:
1. Alert condition triggered
2. System generate push notification
3. System send notification đến user's devices
4. Device display notification
5. User có thể click để open application
6. System log notification delivery

**Notification Types**:
- Critical alerts (temperature, water level)
- Device status changes
- System maintenance notices
- Daily summaries

**Expected Outcome**: Users receive timely mobile notifications

---

## 🔄 12. Integration & API

### UC12.1: Third-party API Integration
**Actor**: External System  
**Goal**: Integrate với greenhouse system via API

**Preconditions**:
- API authentication configured
- External system có valid credentials

**Main Flow**:
1. External system authenticate với API
2. External system request data hoặc actions:
   - Get sensor data
   - Control devices
   - Subscribe to events
3. System validate request và permissions
4. System process request
5. System return response
6. System log API usage

**API Endpoints**:
```
GET /api/sensors/data
POST /api/devices/{type}/control
GET /api/history/export
POST /api/automation/trigger
```

**Expected Outcome**: External systems có thể integrate seamlessly

---

### UC12.2: Webhook Notifications
**Actor**: System  
**Goal**: Send webhook notifications đến external services

**Preconditions**:
- Webhook URLs configured
- External services listening

**Main Flow**:
1. Event occurs trong system (alert, device change)
2. System check webhook configuration
3. System prepare webhook payload
4. System send HTTP POST đến configured URLs
5. System handle delivery confirmations
6. System retry failed deliveries

**Webhook Events**:
- Critical alerts generated
- Device state changes
- System status changes
- Data export completed

**Expected Outcome**: External services receive real-time event notifications

---

## 📊 Success Metrics & KPIs

### System Performance
- **Response Time**: <2s cho API calls
- **Uptime**: >99.5% system availability
- **Data Accuracy**: >99% sensor data validity

### User Experience
- **Login Success Rate**: >98%
- **Feature Usage**: Track most/least used features
- **Error Rates**: <1% user-facing errors

### Business Value
- **Automation Effectiveness**: % of manual interventions reduced
- **Alert Response Time**: Average time to acknowledge alerts
- **System ROI**: Cost savings from automation

---

## 🔮 Future Enhancements

### Planned Features
1. **Machine Learning**: Predictive analytics cho plant health
2. **Advanced Automation**: Rule-based automation engine
3. **Multi-Greenhouse**: Support multiple greenhouse locations
4. **Mobile App**: Native mobile applications
5. **Weather Integration**: External weather data integration
6. **Energy Monitoring**: Power consumption tracking
7. **Crop Management**: Plant lifecycle tracking
8. **Social Features**: Share data với community

### Technical Improvements
1. **Microservices**: Break monolithic backend
2. **GraphQL**: More flexible API layer
3. **Edge Computing**: Local processing capabilities
4. **Blockchain**: Data integrity và traceability
5. **AI/ML**: Intelligent automation decisions

---

💡 **Note**: Tài liệu này là living document và sẽ được update khi có features mới hoặc changes trong requirements.