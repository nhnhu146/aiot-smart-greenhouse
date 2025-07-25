import React, { useState } from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { DeviceControlRequest } from '@/services/deviceControlService';

interface DeviceControlDemoProps {
	className?: string;
}

const DeviceControlDemo: React.FC<DeviceControlDemoProps> = ({ className }) => {
	const { sendDeviceControlHybrid, isConnected } = useWebSocketContext();
	const [loading, setLoading] = useState<string | null>(null);
	const [responses, setResponses] = useState<any[]>([]);

	const handleDeviceControl = async (deviceType: string, action: string) => {
		const controlKey = `${deviceType}_${action}`;
		setLoading(controlKey);

		try {
			const request: DeviceControlRequest = {
				deviceType: deviceType as any,
				action: action as any
			};

			console.log('🚀 Sending hybrid device control:', request);

			// Use hybrid approach: POST API + WebSocket
			const response = await sendDeviceControlHybrid(request, {
				useWebSocket: true,
				waitForConfirmation: true,
				timeout: 8000
			});

			console.log('✅ Device control response:', response);

			setResponses(prev => [{
				id: Date.now(),
				request,
				response,
				timestamp: new Date().toISOString()
			}, ...prev.slice(0, 9)]);

		} catch (error) {
			console.error('❌ Device control failed:', error);
			setResponses(prev => [{
				id: Date.now(),
				request: { deviceType, action },
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString()
			}, ...prev.slice(0, 9)]);
		} finally {
			setLoading(null);
		}
	};

	const clearResponses = () => {
		setResponses([]);
	};

	return (
		<div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
			<div className="flex items-center justify-between mb-6">
				<h3 className="text-lg font-semibold text-gray-800">
					Device Control Demo (Hybrid API + WebSocket)
				</h3>
				<div className="flex items-center gap-2">
					<div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
					<span className="text-sm text-gray-600">
						{isConnected ? 'Connected' : 'Disconnected'}
					</span>
				</div>
			</div>

			{/* Device Controls */}
			<div className="grid grid-cols-2 gap-4 mb-6">
				{/* Light Controls */}
				<div className="border rounded-lg p-4">
					<h4 className="font-medium text-gray-700 mb-3">💡 Light</h4>
					<div className="flex gap-2">
						<button
							onClick={() => handleDeviceControl('light', 'on')}
							disabled={loading !== null}
							className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors
								${loading === 'light_on'
									? 'bg-gray-400 cursor-not-allowed'
									: 'bg-green-500 hover:bg-green-600 text-white'
								}`}
						>
							{loading === 'light_on' ? 'Sending...' : 'Turn ON'}
						</button>
						<button
							onClick={() => handleDeviceControl('light', 'off')}
							disabled={loading !== null}
							className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors
								${loading === 'light_off'
									? 'bg-gray-400 cursor-not-allowed'
									: 'bg-red-500 hover:bg-red-600 text-white'
								}`}
						>
							{loading === 'light_off' ? 'Sending...' : 'Turn OFF'}
						</button>
					</div>
				</div>

				{/* Pump Controls */}
				<div className="border rounded-lg p-4">
					<h4 className="font-medium text-gray-700 mb-3">💧 Pump</h4>
					<div className="flex gap-2">
						<button
							onClick={() => handleDeviceControl('pump', 'on')}
							disabled={loading !== null}
							className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors
								${loading === 'pump_on'
									? 'bg-gray-400 cursor-not-allowed'
									: 'bg-blue-500 hover:bg-blue-600 text-white'
								}`}
						>
							{loading === 'pump_on' ? 'Sending...' : 'Turn ON'}
						</button>
						<button
							onClick={() => handleDeviceControl('pump', 'off')}
							disabled={loading !== null}
							className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors
								${loading === 'pump_off'
									? 'bg-gray-400 cursor-not-allowed'
									: 'bg-gray-500 hover:bg-gray-600 text-white'
								}`}
						>
							{loading === 'pump_off' ? 'Sending...' : 'Turn OFF'}
						</button>
					</div>
				</div>

				{/* Door Controls */}
				<div className="border rounded-lg p-4">
					<h4 className="font-medium text-gray-700 mb-3">🚪 Door</h4>
					<div className="flex gap-2">
						<button
							onClick={() => handleDeviceControl('door', 'open')}
							disabled={loading !== null}
							className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors
								${loading === 'door_open'
									? 'bg-gray-400 cursor-not-allowed'
									: 'bg-yellow-500 hover:bg-yellow-600 text-white'
								}`}
						>
							{loading === 'door_open' ? 'Sending...' : 'Open'}
						</button>
						<button
							onClick={() => handleDeviceControl('door', 'close')}
							disabled={loading !== null}
							className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors
								${loading === 'door_close'
									? 'bg-gray-400 cursor-not-allowed'
									: 'bg-orange-500 hover:bg-orange-600 text-white'
								}`}
						>
							{loading === 'door_close' ? 'Sending...' : 'Close'}
						</button>
					</div>
				</div>

				{/* Window Controls */}
				<div className="border rounded-lg p-4">
					<h4 className="font-medium text-gray-700 mb-3">🪟 Window</h4>
					<div className="flex gap-2">
						<button
							onClick={() => handleDeviceControl('window', 'open')}
							disabled={loading !== null}
							className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors
								${loading === 'window_open'
									? 'bg-gray-400 cursor-not-allowed'
									: 'bg-purple-500 hover:bg-purple-600 text-white'
								}`}
						>
							{loading === 'window_open' ? 'Sending...' : 'Open'}
						</button>
						<button
							onClick={() => handleDeviceControl('window', 'close')}
							disabled={loading !== null}
							className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors
								${loading === 'window_close'
									? 'bg-gray-400 cursor-not-allowed'
									: 'bg-indigo-500 hover:bg-indigo-600 text-white'
								}`}
						>
							{loading === 'window_close' ? 'Sending...' : 'Close'}
						</button>
					</div>
				</div>
			</div>

			{/* Response Log */}
			<div className="border-t pt-4">
				<div className="flex items-center justify-between mb-3">
					<h4 className="font-medium text-gray-700">📋 Response Log</h4>
					<button
						onClick={clearResponses}
						className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
					>
						Clear
					</button>
				</div>
				<div className="max-h-64 overflow-y-auto space-y-2">
					{responses.length === 0 ? (
						<p className="text-sm text-gray-500 italic">No responses yet...</p>
					) : (
						responses.map((item) => (
							<div key={item.id} className="text-xs bg-gray-50 rounded p-2">
								<div className="flex items-center justify-between mb-1">
									<span className="font-medium">
										{item.request.deviceType} → {item.request.action}
									</span>
									<span className="text-gray-500">
										{new Date(item.timestamp).toLocaleTimeString()}
									</span>
								</div>
								{item.error ? (
									<div className="text-red-600">❌ Error: {item.error}</div>
								) : (
									<div className="text-green-600">
										✅ {item.response?.message || 'Success'}
										{item.response?.data?.realTimeConfirmed && (
											<span className="ml-2 text-blue-600">⚡ Real-time confirmed</span>
										)}
									</div>
								)}
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
};

export default DeviceControlDemo;
