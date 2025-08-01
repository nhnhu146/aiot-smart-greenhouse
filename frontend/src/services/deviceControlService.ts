export interface DeviceControlRequest {
	deviceType: 'light' | 'pump' | 'door' | 'window';
	action: 'on' | 'off' | 'open' | 'close';
	duration?: number;
}

export interface DeviceControlResponse {
	success: boolean;
	message: string;
	data?: {
		deviceType: string;
		action: string;
		status: boolean;
		timestamp: string;
	};
	error?: string;
}

class DeviceControlService {
	private apiBaseUrl: string;

	constructor() {
		this.apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
	}

	/**
	 * Gửi lệnh điều khiển thiết bị qua API đơn giản
	 */
	async sendDeviceControl(request: DeviceControlRequest): Promise<DeviceControlResponse> {
		try {
			const response = await fetch(`${this.apiBaseUrl}/api/devices/control`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(request)
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || `HTTP ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			console.error('Device control failed:', error);
			throw error;
		}
	}
}

// Singleton instance
export const deviceControlService = new DeviceControlService();
export default deviceControlService;
