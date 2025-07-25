"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import useWebSocket from '@/hooks/useWebSocket';
import { DeviceControlRequest, DeviceControlOptions } from '@/services/deviceControlService';

interface WebSocketContextType {
	socket: any;
	isConnected: boolean;
	sensorData: any;
	persistentSensorData: any;
	deviceStatus: any;
	alerts: any[];
	sendDeviceControl: (device: string, action: string, value?: any, options?: DeviceControlOptions) => Promise<any>;
	sendDeviceControlHybrid: (request: DeviceControlRequest, options?: DeviceControlOptions) => Promise<any>;
	clearAlerts: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
	children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
	const webSocket = useWebSocket();

	return (
		<WebSocketContext.Provider value={webSocket}>
			{children}
		</WebSocketContext.Provider>
	);
}

export function useWebSocketContext() {
	const context = useContext(WebSocketContext);
	if (context === undefined) {
		throw new Error('useWebSocketContext must be used within a WebSocketProvider');
	}
	return context;
}
