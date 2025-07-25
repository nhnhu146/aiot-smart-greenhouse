# Enhanced Data Management & UI Updates

## Vấn đề đã giải quyết

### 1. Data Duplication Issue
**Vấn đề:** Có rất nhiều duplicate data trùng datetime sau khi merge
**Nguyên nhân:** Logic merge chỉ group theo giây, không xử lý exact timestamp và millisecond duplicates

### 2. UI Examples không chính xác
**Vấn đề:** MQTT Examples UI không phản ánh đúng thực tế ESP32 và sensor data format
**Nguyên nhân:** UI hiển thị Boolean thay vì String format, thiếu sensors, examples không realistic

## Giải pháp thực hiện

### 1. Enhanced Data Merger Service

#### A. Improved Aggregation Logic
**Trước:**
```typescript
// Group by hour, minute, second only
$group: {
    _id: {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' },
        hour: { $hour: '$createdAt' },
        minute: { $minute: '$createdAt' },
        second: { $second: '$createdAt' }
    }
}
```

**Sau:**
```typescript
// Group by exact timestamp (including milliseconds)
$group: {
    _id: '$createdAt', // Exact timestamp
    docs: { $push: '$$ROOT' },
    count: { $sum: 1 }
}
```

#### B. Enhanced Document Merging
**Features mới:**
- `mergeDocumentGroupEnhanced()`: Smart merging với scoring system
- `calculateCompletenessScore()`: Tính điểm dữ liệu hoàn chỉnh
- `mergeDocumentDataComplete()`: Merge với priority handling

**Scoring Algorithm:**
```typescript
const sensorFields = ['temperature', 'humidity', 'soilMoisture', 'waterLevel', 'plantHeight', 'lightLevel', 'rainStatus', 'motionDetected'];
let score = 0;
for (const field of sensorFields) {
    if (doc[field] !== null && doc[field] !== undefined && doc[field] !== '') {
        score++;
    }
}
```

#### C. Enhanced Metadata
**Merge metadata tracking:**
```typescript
merged.dataQuality = 'merged_enhanced';
merged.mergedFrom = docs.length;
merged.mergedAt = new Date();
merged.originalTimestamp = baseDoc.createdAt;
merged.duplicatesRemoved = docs.length - 1;
```

#### D. Improved Processing
- **Batch size**: 500 groups (từ 200)
- **Sort priority**: Số duplicates cao nhất trước
- **Progress logging**: Mỗi 20 groups (từ 10)

### 2. Updated MQTT Examples UI

#### A. Sensor Topics - Accurate Data Types

**Soil Moisture:**
```typescript
// Trước: Number (%)
{
    name: "Soil Moisture",
    dataType: "Number",
    unit: "%",
    examples: [
        { description: "Đất ẩm tốt", value: 70 },
        { description: "Đất khô", value: 30 }
    ]
}

// Sau: Binary (0/1)
{
    name: "Soil Moisture (Binary)", 
    dataType: "Binary",
    unit: "0/1",
    description: "Độ ẩm đất (nhị phân: 0=khô, 1=ẩm)",
    examples: [
        { description: "Đất khô (cần tưới)", value: 0 },
        { description: "Đất ẩm (đủ nước)", value: 1 }
    ]
}
```

**Rain Detection:**
```typescript
// Trước: Boolean
{
    dataType: "Boolean",
    examples: [
        { description: "Có mưa", value: true },
        { description: "Không mưa", value: false }
    ]
}

// Sau: Binary (0/1)
{
    dataType: "Binary",
    unit: "0/1",
    description: "Phát hiện mưa (0=không mưa, 1=có mưa)",
    examples: [
        { description: "Trời khô ráo", value: 0 },
        { description: "Đang có mưa", value: 1 }
    ]
}
```

**Plant Height - Added:**
```typescript
{
    name: "Plant Height",
    topic: "greenhouse/sensors/height", 
    dataType: "Number",
    unit: "cm",
    description: "Chiều cao cây trồng (đo bằng siêu âm)",
    examples: [
        { description: "Cây con", value: 15 },
        { description: "Cây phát triển", value: 45 },
        { description: "Cây trưởng thành", value: 80 }
    ]
}
```

#### B. Control Topics - ESP32 Compatible

**Trước (Boolean):**
```typescript
{
    name: "Light Control",
    dataType: "Boolean", 
    examples: [
        { description: "Bật đèn", value: true },
        { description: "Tắt đèn", value: false }
    ]
}
```

**Sau (String HIGH/LOW):**
```typescript
{
    name: "Light Control",
    dataType: "String",
    description: "Điều khiển đèn LED chiếu sáng (ESP32 nhận HIGH/LOW)",
    examples: [
        { description: "Bật đèn", value: "HIGH" },
        { description: "Tắt đèn", value: "LOW" }
    ]
}
```

#### C. Enhanced Value Formatting

**getValueForMQTT() Function:**
```typescript
const getValueForMQTT = (value: any, dataType: string): string => {
    if (dataType === "Boolean" || dataType === "Binary") {
        return value ? "1" : "0";
    }
    if (dataType === "String") {
        return value; // Return as-is for HIGH/LOW strings
    }
    return value.toString();
};
```

#### D. Realistic Test Commands

**Sensor Data:**
```bash
# Binary sensors (0/1)
mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/sensors/soil -m "0"
mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/sensors/rain -m "1"

# Numeric sensors (realistic values)
mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/sensors/temperature -m "25.5"
mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/sensors/light -m "15000"
mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/sensors/height -m "35"
```

**Device Control:**
```bash
# ESP32 format (HIGH/LOW strings)
mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/devices/light/control -m "HIGH"
mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/devices/pump/control -m "LOW"
mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/devices/door/control -m "HIGH"
```

## API Endpoints

### Data Merger Endpoints

```bash
# Get merge status
GET /api/data/merge-status

# Trigger manual merge
POST /api/data/merge

# Cleanup duplicate alerts  
POST /api/data/alerts/cleanup
```

## Testing

### Backend Data Merger
```bash
python test_enhanced_features.py
```

### Frontend MQTT Examples
- Navigate to `/mqtt-examples` in browser
- Verify updated sensor types and examples
- Test copy-to-clipboard functionality
- Check realistic value ranges

## Kết quả

### ✅ Data Management Improvements
- **Exact timestamp matching**: Loại bỏ duplicates chính xác hơn
- **Smart document scoring**: Giữ data hoàn chỉnh nhất
- **Enhanced metadata**: Tracking merge history chi tiết
- **Better performance**: Process 500 groups thay vì 200

### ✅ UI/UX Improvements  
- **Accurate data types**: Binary cho soil/rain, String cho controls
- **ESP32 compatibility**: HIGH/LOW format thay vì Boolean
- **Realistic examples**: Giá trị sensor thực tế
- **Complete sensor coverage**: Thêm plant height sensor

### ✅ System Integration
- **Build successful**: Cả backend và frontend
- **Type safety**: TypeScript compilation không lỗi
- **API compatibility**: Backward compatible với existing system

## Workflow sau khi update

```
Duplicate Data Detection
    ↓ (Exact timestamp grouping)
Enhanced Data Merger
    ↓ (Smart scoring & merging)
Clean Database
    ↓ (Single record per timestamp)
Improved Data Quality

MQTT Examples UI
    ↓ (Accurate formats)
ESP32 Compatible Commands
    ↓ (HIGH/LOW strings)
Successful Device Control
```
