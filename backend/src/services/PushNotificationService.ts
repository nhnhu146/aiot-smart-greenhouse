import axios from 'axios';

export async function sendPushNotification(title: string, message: string) {
  const PUSHSAFER_PRIVATE_KEY = process.env.PUSHSAFER_PRIVATE_KEY;
  if (!PUSHSAFER_PRIVATE_KEY) {
    console.error("❌ Pushsafer private key not configured.");
    return;
  }

  try {
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
    console.log('✅ Push notification sent.');
  } catch (err) {
    console.error('❌ Error sending push notification:', err);
  }
}