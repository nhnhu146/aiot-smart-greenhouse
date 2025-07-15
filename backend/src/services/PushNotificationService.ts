import axios from 'axios';

// Thêm một bộ nhớ đệm đơn giản để tránh gửi trùng lặp
const sentMessages = new Map<string, number>();
const PUSH_COOLDOWN = 5 * 60 * 1000; // 5 phút

export async function sendPushNotification(title: string, message: string) {
  const PUSHSAFER_PRIVATE_KEY = process.env.PUSHSAFER_PRIVATE_KEY;
  if (!PUSHSAFER_PRIVATE_KEY) {
    console.error("❌ Pushsafer private key not configured.");
    return;
  }

  // Tạo key duy nhất từ title và message
  const messageKey = `${title}|${message}`;
  const now = Date.now();
  
  // Kiểm tra xem thông báo này đã được gửi gần đây chưa
  const lastSent = sentMessages.get(messageKey);
  if (lastSent && (now - lastSent) < PUSH_COOLDOWN) {
    console.log(`🔄 Push notification cooldown active for: ${title}`);
    return;
  }
  
  try {
    // Đánh dấu đã gửi trước khi thực sự gửi để tránh race condition
    sentMessages.set(messageKey, now);
    
    await axios.post('https://www.pushsafer.com/api', null, {
      params: {
        k: PUSHSAFER_PRIVATE_KEY,
        t: title,
        m: message,
        i: 1,       // icon
        c: '#ff0000', // icon color
        s: 3,       // sound
        v: 3        // vibration
      }
    });
    console.log('✅ Push notification sent:', title);
  } catch (err) {
    console.error('❌ Error sending push notification:', err);
    // Xóa khỏi sentMessages nếu gửi thất bại để cho phép thử lại
    sentMessages.delete(messageKey);
  }
}