// Development utilities component
'use client'
import { useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import mockDataService from '@/services/mockDataService';

const DevUtils: React.FC = () => {
	const [isMockEnabled, setIsMockEnabled] = useState(true);
	useEffect(() => {
		// On mount, check the current mock data status
		setIsMockEnabled(mockDataService.isUsingMockData());

		// Log developer instructions (always available now)
		console.log(`
🚀 GreenHouse Development Mode
==============================

Mock Data Controls:
- mockDataService.setUseMockData(true)  // Enable mock data
- mockDataService.setUseMockData(false) // Disable mock data (use real API)
- mockDataService.isUsingMockData()     // Check current mode

Mock Data Manipulation:
- mockDataService.updateMockSensorData({ temperature: 35, humidity: 80 })
- mockDataService.startMockDataUpdates(5000) // Start 5s interval updates

Examples:
> mockDataService.setUseMockData(false)  // Switch to real API
> mockDataService.updateMockSensorData({ temperature: 40 }) // Set temperature to 40°C
      `);
	}, []);

	// Toggle mock data function
	const toggleMockData = () => {
		const newState = !isMockEnabled;
		mockDataService.setUseMockData(newState);
		setIsMockEnabled(newState);
		// Force refresh the page to apply changes immediately
		window.location.reload();
	};

	// Always render now (removed production check)
	return null; // Will be moved to settings page
};

export default DevUtils;
