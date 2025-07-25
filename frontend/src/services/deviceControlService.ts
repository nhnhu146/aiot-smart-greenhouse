import { io, Socket } from 'socket.io-client';
import { getWebSocketUrl } from '@/lib/websocketConfig';

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
		controlId: string;
		timestamp: string;
		realTimeConfirmed?: boolean;
		[key: string]: any; // Allow additional properties
	};
	error?: string;
}

export interface DeviceControlOptions {
	useWebSocket?: boolean;
	timeout?: number;
	waitForConfirmation?: boolean;
}

class DeviceControlService {
	private socket: Socket | null = null;
	private apiBaseUrl: string;
	private pendingControls: Map<string, {
		resolve: (value: DeviceControlResponse) => void;
		reject: (error: Error) => void;
		timeout: NodeJS.Timeout;
	}> = new Map();

	constructor() {
		this.apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
		this.initializeWebSocket();
	}

	private initializeWebSocket() {
		const socketUrl = getWebSocketUrl();
		this.socket = io(socketUrl, {
			autoConnect: false,
			transports: ['websocket', 'polling']
		});

		this.socket.on('device-control-response', (response: any) => {
			this.handleWebSocketResponse(response);
		});

		this.socket.on('device-control-confirmation', (confirmation: any) => {
			this.handleDeviceConfirmation(confirmation);
		});
	}

	private handleWebSocketResponse(response: any) {
		const controlId = response.controlId;
		if (controlId && this.pendingControls.has(controlId)) {
			const pending = this.pendingControls.get(controlId)!;
			clearTimeout(pending.timeout);
			this.pendingControls.delete(controlId);

			if (response.success) {
				pending.resolve({
					success: true,
					message: response.message || 'Command sent successfully',
					data: response.data
				});
			} else {
				pending.reject(new Error(response.error || 'Command failed'));
			}
		}
	}

	private handleDeviceConfirmation(confirmation: any) {
		console.log('📡 Device confirmation received:', confirmation);
		// Emit custom event for UI updates
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('deviceConfirmation', {
				detail: confirmation
			}));
		}
	}

	/**
	 * Gửi lệnh điều khiển thiết bị sử dụng kết hợp POST API và WebSocket
	 */
	async sendDeviceControl(
		request: DeviceControlRequest,
		options: DeviceControlOptions = {}
	): Promise<DeviceControlResponse> {
		const {
			useWebSocket = true,
			timeout = 10000,
			waitForConfirmation = true
		} = options;

		const controlId = `control_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		try {
			// Bước 1: Gửi POST API để đảm bảo lệnh được ghi nhận
			const apiResponse = await this.sendPostRequest(request, controlId);

			if (!apiResponse.success) {
				throw new Error(apiResponse.message || 'API request failed');
			}

			// Bước 2: Nếu sử dụng WebSocket, gửi thêm qua WebSocket để real-time
			if (useWebSocket && this.socket?.connected) {
				const socketPromise = this.sendWebSocketRequest(request, controlId, timeout);

				if (waitForConfirmation) {
					// Đợi cả API và WebSocket response
					const socketResponse = await socketPromise;
					return {
						...apiResponse,
						data: apiResponse.data ? {
							...apiResponse.data,
							realTimeConfirmed: true
						} : undefined
					};
				} else {
					// Fire and forget WebSocket
					socketPromise.catch(error => {
						console.warn('WebSocket request failed, but API succeeded:', error);
					});
				}
			}

			return {
				...apiResponse,
				data: apiResponse.data ? {
					...apiResponse.data,
					realTimeConfirmed: false
				} : undefined
			};

		} catch (error) {
			console.error('Device control failed:', error);
			throw error;
		}
	}

	private async sendPostRequest(
		request: DeviceControlRequest,
		controlId: string
	): Promise<DeviceControlResponse> {
		const response = await fetch(`${this.apiBaseUrl}/api/devices/control`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				...request,
				controlId,
				source: 'hybrid' // Đánh dấu đây là hybrid request
			})
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.message || `HTTP ${response.status}`);
		}

		return await response.json();
	}

	private async sendWebSocketRequest(
		request: DeviceControlRequest,
		controlId: string,
		timeout: number
	): Promise<DeviceControlResponse> {
		if (!this.socket?.connected) {
			throw new Error('WebSocket not connected');
		}

		return new Promise((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				this.pendingControls.delete(controlId);
				reject(new Error('WebSocket request timeout'));
			}, timeout);

			this.pendingControls.set(controlId, {
				resolve,
				reject,
				timeout: timeoutId
			});

			// Gửi qua WebSocket với controlId để track
			this.socket!.emit('device:control', {
				...request,
				device: request.deviceType, // Map deviceType to device for compatibility
				controlId,
				source: 'hybrid',
				timestamp: new Date().toISOString()
			});
		});
	}

	/**
	 * Kết nối WebSocket (nếu chưa connected)
	 */
	connect(): void {
		if (this.socket && !this.socket.connected) {
			this.socket.connect();
		}
	}

	/**
	 * Ngắt kết nối WebSocket
	 */
	disconnect(): void {
		if (this.socket) {
			this.socket.disconnect();
		}
		// Clear pending requests
		this.pendingControls.forEach(({ reject, timeout }) => {
			clearTimeout(timeout);
			reject(new Error('Service disconnected'));
		});
		this.pendingControls.clear();
	}

	/**
	 * Kiểm tra trạng thái kết nối
	 */
	get isConnected(): boolean {
		return this.socket?.connected || false;
	}

	/**
	 * Chỉ gửi qua API (không dùng WebSocket)
	 */
	async sendDeviceControlAPI(request: DeviceControlRequest): Promise<DeviceControlResponse> {
		return this.sendDeviceControl(request, { useWebSocket: false });
	}

	/**
	 * Chỉ gửi qua WebSocket (không dùng API)
	 */
	async sendDeviceControlSocket(request: DeviceControlRequest): Promise<DeviceControlResponse> {
		if (!this.socket?.connected) {
			throw new Error('WebSocket not connected');
		}

		const controlId = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		return this.sendWebSocketRequest(request, controlId, 10000);
	}
}

// Singleton instance
export const deviceControlService = new DeviceControlService();
export default deviceControlService;
