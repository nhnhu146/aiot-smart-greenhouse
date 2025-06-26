// Development utilities component
'use client'
import { useEffect } from 'react';
import mockDataService from '@/services/mockDataService';

const DevUtils: React.FC = () => {
	useEffect(() => {
		if (process.env.NODE_ENV === 'development') {
			// Log developer instructions
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
		}
	}, []);

	// Don't render anything in production
	if (process.env.NODE_ENV !== 'development') {
		return null;
	}

	return null; // This component doesn't render UI, just provides dev tools
};

export default DevUtils;
