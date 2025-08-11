# 🌐 Tổng Quan Các Trang Frontend - AIoT Smart Greenhouse

| STT | Tên Trang | Mô Tả Các Thành Phần Chính |
|-----|-----------|----------------------------|
| 2 | **Bảng Điều Khiển** 🏠 | - Giám sát cảm biến theo thời gian thực (nhiệt độ, độ ẩm, ánh sáng)<br>- Bảng điều khiển thiết bị (quạt, đèn, bơm nước)<br>- Biểu đồ trực tiếp với Chart.js<br>- Cập nhật qua WebSocket<br>- Thông báo cảnh báo |
| 3 | **Lịch Sử** 📊 | - Giao diện đa tab với 4 sub-page chính<br>- Hệ thống lọc nâng cao<br>- Xuất dữ liệu (CSV/JSON)<br>- Điều khiển phân trang<br>- Chức năng sắp xếp<br>- Xử lý lỗi biên |
| 3.1 | &nbsp;&nbsp;&nbsp;&nbsp;→ **Cảm Biến** 🌡️ | - Lịch sử dữ liệu nhiệt độ, độ ẩm, ánh sáng<br>- Biểu đồ xu hướng theo thời gian<br>- Tìm kiếm theo khoảng thời gian<br>- Export dữ liệu cảm biến |
| 3.2 | &nbsp;&nbsp;&nbsp;&nbsp;→ **Điều Khiển** 🎛️ | - Lịch sử bật/tắt thiết bị<br>- Log hoạt động quạt, đèn, bơm nước<br>- Thống kê thời gian hoạt động<br>- Phân tích hiệu suất thiết bị |
| 3.3 | &nbsp;&nbsp;&nbsp;&nbsp;→ **Giọng Nói** 🗣️ | - Lịch sử lệnh giọng nói<br>- Kết quả nhận dạng<br>- Thời gian thực hiện lệnh<br>- Thống kê độ chính xác |
| 3.4 | &nbsp;&nbsp;&nbsp;&nbsp;→ **Cảnh Báo** ⚠️ | - Log các cảnh báo hệ thống<br>- Ngưỡng vượt quá<br>- Thông báo lỗi thiết bị<br>- Trạng thái giải quyết |
| 4 | **Cài Đặt** ⚙️ | - Cấu hình ngưỡng cảnh báo<br>- Cài đặt thông báo email<br>- Tùy chỉnh hệ thống<br>- Cấu hình thiết bị<br>- Quản lý hồ sơ người dùng |
| 5 | **Chế Độ Tự Động** 🤖 | - Thiết lập quy tắc tự động hóa<br>- Điều kiện kích hoạt<br>- Lập lịch thiết bị<br>- Giám sát trạng thái thời gian thực<br>- Lưu trữ cấu hình |
| 6 | **Ví Dụ** 📚 | - Tài liệu API<br>- Ví dụ sự kiện WebSocket<br>- Đoạn mã code<br>- Kiểm thử tương tác<br>- Chức năng sao chép vào clipboard |

## 🛠️ Các Thành Phần Công Nghệ

### Công Nghệ Cốt Lõi
- **Framework**: React 18 với TypeScript
- **Build Tool**: Vite
- **Styling**: Bootstrap 5.3
- **Biểu Đồ**: Chart.js với date-fns adapter
- **HTTP Client**: Axios
- **Real-time**: Socket.io-client
- **Testing**: Vitest + jsdom

### Tính Năng Chính
- **Thiết Kế Responsive**: Bootstrap responsive grid
- **Cập Nhật Thời Gian Thực**: Tích hợp WebSocket
- **Trực Quan Hóa Dữ Liệu**: Biểu đồ tương tác
- **Xác Thực Form**: Xác thực phía client
- **Xử Lý Lỗi**: Error boundaries và try-catch
- **Chức Năng Export**: Xuất CSV/JSON
- **Xác Thực**: Xác thực dựa trên JWT
- **Progressive Web App**: Khả năng PWA

### Cấu Hình
- **Environment**: Biến môi trường Vite
- **API Base URL**: Endpoint backend có thể cấu hình
- **WebSocket**: Giao tiếp thời gian thực
- **Local Storage**: Lưu trữ cài đặt bền vững