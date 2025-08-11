import axios from 'axios';
import { Config } from '../config/AppConfig';
// Simple cache to avoid sending duplicate notifications
const sentMessages = new Map<string, number>();
const PUSH_COOLDOWN = 5 * 60 * 1000; // 5 phút

export async function sendPushNotification(title: string, message: string) {
	const PUSHSAFER_PRIVATE_KEY = Config.pushNotifications.pushsaferPrivateKey;
	// Check if PUSHSAFER is disabled or not configured
	if (!PUSHSAFER_PRIVATE_KEY || PUSHSAFER_PRIVATE_KEY.toLowerCase() === 'off') {
		console.log('ℹ️ Pushsafer notifications disabled (not configured or set to OFF)');
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