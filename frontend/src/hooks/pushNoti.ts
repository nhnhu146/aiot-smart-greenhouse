// Conditional import for client-side only
let push: any = null;

if (typeof window !== 'undefined') {
	try {
		push = require('pushsafer-notifications');
	} catch (error) {
		console.warn('pushsafer-notifications not available:', error);
	}
}

const pushNoti = (message: string, title: string) => {
	if (!push || typeof window === 'undefined') {
		console.log('Push notification disabled or not available');
		return;
	}

	try {
		const p = new push({
			k: 'bydK4Sl6cNGxFvxs2V7W',
			debug: true
		});

		p.send({
			m: message,
			t: title,
			s: "8", // sound
			v: "3", // vibration
			i: "1", // icon
		});
	} catch (error) {
		console.error('Failed to send push notification:', error);
	}
}

export default pushNoti;