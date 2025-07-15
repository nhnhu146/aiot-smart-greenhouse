# MQTT Test Scripts

Các script này giúp test hệ thống MQTT của AIoT Smart Greenhouse.

## 📋 Prerequisites

1. **Python 3.7+** - Cài đặt từ https://python.org
2. **MQTT Broker** - Mosquitto hoặc broker khác chạy trên localhost:1883
3. **Backend API** - Đảm bảo backend đang chạy để nhận dữ liệu MQTT

## 🚀 Quick Start

### 1. Cài đặt dependencies

```powershell
.\test-mqtt.ps1 -Action install
```

### 2. Test nhanh - gửi tất cả sensor data một lần

```powershell
.\test-mqtt.ps1 -Action quick
```

### 3. Chạy simulation tự động (5 phút)

```powershell
.\test-mqtt.ps1 -Action simulate
```

### 4. Chạy simulation với thời gian tùy chỉnh

```powershell
.\test-mqtt.ps1 -Action simulate -Duration 10
```

### 5. Chạy test interactive

```powershell
.\test-mqtt.ps1 -Action test
```

## 📊 Các loại dữ liệu sensor được test

### Sensor Topics
- `greenhouse/sensors/temperature` - Nhiệt độ (°C)
- `greenhouse/sensors/humidity` - Độ ẩm (%)
- `greenhouse/sensors/soil` - Độ ẩm đất (%)
- `greenhouse/sensors/water` - Mức nước (%)
- `greenhouse/sensors/light` - Cường độ ánh sáng (lux)
- `greenhouse/sensors/height` - Chiều cao cây (cm)
- `greenhouse/sensors/rain` - Cảm biến mưa (0/1)
- `greenhouse/sensors/motion` - Cảm biến chuyển động (0/1)

### Device Control Topics
- `greenhouse/devices/light/control` - Điều khiển đèn
- `greenhouse/devices/pump/control` - Điều khiển máy bơm
- `greenhouse/devices/door/control` - Điều khiển cửa
- `greenhouse/devices/window/control` - Điều khiển cửa sổ

## 🔧 Manual MQTT Commands

Sử dụng mosquitto_pub để test thủ công:

```bash
# Gửi dữ liệu nhiệt độ
mosquitto_pub -h localhost -t "greenhouse/sensors/temperature" -m "25.5"

# Gửi lệnh bật đèn
mosquitto_pub -h localhost -t "greenhouse/devices/light/control" -m '{"action":"turn_on","value":100,"timestamp":"2025-07-15T10:30:00Z"}'
```

## 📝 Files

- `mqtt_test_publisher.py` - Script Python chính để test MQTT
- `test-mqtt.ps1` - PowerShell wrapper script
- `requirements.txt` - Python dependencies
- `README.md` - Tài liệu này

## ⚠️ Troubleshooting

### MQTT Broker Connection Failed
- Đảm bảo MQTT broker đang chạy trên localhost:1883
- Kiểm tra firewall settings
- Thử với broker public: `test.mosquitto.org`

### Backend không nhận dữ liệu
- Kiểm tra backend đang chạy trên port 4000
- Kiểm tra logs trong backend console
- Đảm bảo WebSocket service đã khởi động

### Frontend không hiển thị dữ liệu real-time
- Tắt "Mock Data" trong Settings
- Kiểm tra WebSocket connection trong browser console
- Refresh trang để áp dụng thay đổi settings

## 🌟 Tips

1. **Theo dõi logs**: Kiểm tra console của backend để xem dữ liệu MQTT được nhận
2. **WebSocket**: Theo dõi Network tab trong browser để xem WebSocket messages
3. **Database**: Dữ liệu được lưu vào MongoDB, kiểm tra collection `sensordatas`
