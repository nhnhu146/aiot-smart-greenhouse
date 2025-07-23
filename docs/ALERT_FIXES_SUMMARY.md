# 🔧 Alert System Fixes & Template Issues Resolution

## 📋 Vấn đề được xác định và giải quyết

### 1. **Template Mismatch Issue** ❌➡️✅

**Vấn đề**: 
- Template `batch-alert-email.html` sử dụng `{{alertCount}}`, `{{alerts}}`, `{{criticalCount}}`, etc.
- EmailService lại sử dụng `{{totalAlerts}}`, `{{alertsList}}`, `{{highPriority}}`, etc.
- Dẫn đến template không render đúng, hiển thị placeholder thay vì data thực

**Giải pháp**:
- ✅ **Cập nhật EmailService.sendBatchAlertEmail()** để match với template variables
- ✅ **Thêm buildAlertsSection()** method để xử lý `{{#each alerts}}` block
- ✅ **Thêm helper methods** cho formatting: `formatSensorType()`, `formatCurrentValue()`, `formatThreshold()`
- ✅ **Proper variable mapping**:
  ```typescript
  .replace(/{{alertCount}}/g, alertSummary.totalAlerts.toString())
  .replace(/{{criticalCount}}/g, criticalCount.toString())
  .replace(/{{highCount}}/g, highCount.toString())
  .replace(/{{mediumCount}}/g, mediumCount.toString())
  .replace(/{{lowCount}}/g, lowCount.toString())
  ```

### 2. **Alert Duplication (400 alerts trong 15 phút)** ❌➡️✅

**Root Cause Analysis**:
- ❌ **Không có cooldown mechanism**: Cùng 1 sensor có thể gửi alert liên tục
- ❌ **lastCheckedValues bị reset**: Khi service restart, memory state mất
- ❌ **Threshold crossings**: Sensor values dao động quanh threshold gây spam
- ❌ **Binary sensor issues**: Soil moisture có thể flicker giữa 0 và 1

**Giải pháp**:
- ✅ **Thêm Alert Cooldown System**:
  ```typescript
  private lastAlertTimes: Map<string, number> = new Map();
  private alertCooldownMs: number = 5 * 60 * 1000; // 5 minutes
  ```
- ✅ **Helper methods**:
  - `isInCooldown(sensorType)` - Check if in cooldown period
  - `getCooldownRemaining(sensorType)` - Get remaining cooldown time
  - `setAlertTime(sensorType)` - Set alert timestamp
  - `clearAlertTime(sensorType)` - Clear when sensor returns to normal

- ✅ **Improved Alert Logic**:
  ```typescript
  // Check cooldown before sending alert
  if (shouldAlert && this.isInCooldown('soilMoisture')) {
    console.log(`Alert in cooldown: ${this.getCooldownRemaining('soilMoisture')} minutes remaining`);
    return;
  }
  ```

- ✅ **Smart Threshold Handling**:
  - Clear alert time when sensor returns to normal range
  - Only alert on significant value changes
  - Proper binary sensor handling for soil moisture

### 3. **Alert Cleanup Utility** ✅

**New Features**:
- ✅ **Alert Analysis Tool**: `alertCleanup.ts`
- ✅ **Duplicate Detection**: Find alerts within 5-minute windows
- ✅ **Smart Cleanup**: Keep earliest alert, remove duplicates
- ✅ **Comprehensive Stats**:
  - Alerts by type/level/hour
  - Duplicate detection and removal
  - Performance recommendations

**Usage**:
```bash
# Local
npm run alerts:cleanup

# Docker
docker exec aiot_greenhouse_backend npm run alerts:cleanup:build

# API
POST /api/data/alerts/cleanup
```

## 📊 Kết quả cải thiện

### Before (❌):
- 400+ alerts trong 15 phút
- Template hiển thị `{{alertCount}}` thay vì số thực
- Spam alerts không có cooldown
- Không có cách analyze/cleanup duplicates

### After (✅):
- **5-minute cooldown** giữa các alert cùng loại
- **Template render chính xác** với proper data
- **Auto-cleanup duplicates** trong database
- **Smart alert logic** với threshold hysteresis
- **Analysis tools** để monitor alert patterns

## 🔧 Cấu hình và Monitoring

### Alert Cooldown Settings:
```typescript
private alertCooldownMs: number = 5 * 60 * 1000; // 5 minutes
```

### Template Variables (Fixed):
```html
{{alertCount}} - Total alerts
{{criticalCount}} - Critical level alerts  
{{highCount}} - High level alerts
{{mediumCount}} - Medium level alerts
{{lowCount}} - Low level alerts
{{#each alerts}} - Alert loop
```

### API Endpoints:
- `GET /api/data/merge-status` - Data merger status
- `POST /api/data/merge` - Manual data merge
- `POST /api/data/alerts/cleanup` - Clean duplicate alerts

### Scripts Available:
```bash
npm run alerts:cleanup        # Local alert cleanup
npm run data:merge           # Local data merge
npm run alerts:cleanup:build # Production alert cleanup
npm run data:merge:build     # Production data merge
```

## 🎯 Recommendations

1. **Monitor alert patterns** using cleanup utility weekly
2. **Adjust cooldown period** based on sensor behavior (currently 5 minutes)
3. **Review template customization** as needed for different alert types
4. **Set up automated cleanup** as cron job if needed
5. **Monitor batch alert frequency** to optimize email delivery

## ✅ Status: RESOLVED

- ✅ Template rendering fixed
- ✅ Alert duplication eliminated  
- ✅ Cooldown system implemented
- ✅ Cleanup tools provided
- ✅ Monitoring and analysis capabilities added

**Result**: Alert system now properly throttled, templates render correctly, and tools available for ongoing maintenance.
