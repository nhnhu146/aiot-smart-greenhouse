import { Socket } from 'socket.io';

export class WebSocketConnectionManager {
	private connectedClients: Map<string, Socket> = new Map();

	// Handle new client connection
	handleConnection(socket: Socket) {
		console.log(`📡 WebSocket client connected: ${socket.id}`);
		this.connectedClients.set(socket.id, socket);

		// Send welcome message with current status
		socket.emit('connection-status', {
			status: 'connected',
			clientId: socket.id,
			timestamp: new Date().toISOString()
		});

		// Set up event handlers
		this.setupSocketHandlers(socket);
	}

	// Handle client disconnect
	handleDisconnection(socketId: string, reason: string) {
		console.log(`📡 WebSocket client disconnected: ${socketId} - ${reason}`);
		this.connectedClients.delete(socketId);
	}

	// Get connection statistics
	getStats() {
		return {
			connectedClients: this.connectedClients.size,
			clientIds: Array.from(this.connectedClients.keys()),
			isActive: this.connectedClients.size > 0
		};
	}

	// Get connected clients map
	getConnectedClients() {
		return this.connectedClients;
	}

	// Clear all connections
	clearConnections() {
		this.connectedClients.clear();
	}

	// Set up socket event handlers
	private setupSocketHandlers(socket: Socket) {
		// Handle real-time chart data requests
		socket.on('request-chart-data', () => {
			console.log(`📊 Chart data requested by ${socket.id}`);
			this.sendLatestChartData(socket);
		});

		// Handle client disconnect
		socket.on('disconnect', (reason) => {
			this.handleDisconnection(socket.id, reason);
		});

		// Handle ping requests for connection health
		socket.on('ping', () => {
			socket.emit('pong', { timestamp: new Date().toISOString() });
		});
	}

	// Send latest chart data to specific client
	private sendLatestChartData(socket: Socket) {
		// This would fetch latest sensor data from database
		// For now, send a placeholder response
		socket.emit('chart-data-response', {
			timestamp: new Date().toISOString(),
			message: 'Chart data request received - implement database fetch here'
		});
	}
}
