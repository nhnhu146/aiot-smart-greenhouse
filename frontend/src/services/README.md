# Mock Data System

## Overview
The mock data system provides a flexible way to develop and test the GreenHouse dashboard without requiring a live backend API. It automatically falls back to mock data when the real API is unavailable.

## Features
- **Automatic fallback**: Uses real API when available, mock data when not
- **Developer control**: Can be toggled on/off programmatically
- **Realistic simulation**: Mock data updates with realistic variations
- **Browser console access**: Easy control via browser developer tools

## Usage

### Development Mode
By default, mock data is enabled in development mode. The system will:
1. Try to fetch real data from the API
2. Fall back to mock data if API is unavailable
3. Display a badge indicating when mock data is being used

### Browser Console Commands

```javascript
// Toggle mock data mode
mockDataService.setUseMockData(true)   // Force mock data
mockDataService.setUseMockData(false)  // Force real API calls

// Check current mode
mockDataService.isUsingMockData()

// Update mock sensor values
mockDataService.updateMockSensorData({
  temperature: 35,
  humidity: 80,
  moisture: 45
})

// Start/stop automatic mock data updates
const cleanup = mockDataService.startMockDataUpdates(5000) // Update every 5 seconds
cleanup() // Stop updates
```

### Mock Data Types

#### Sensor Data
```typescript
{
  humidity: number;     // 0-100%
  moisture: number;     // 0-100%  
  temperature: number;  // 0-50°C
  timestamp?: string;
}
```

#### Chart Data
```typescript
{
  time: string;         // HH:MM format
  temperature: number;  // 20-35°C
  humidity: number;     // 40-80%
  soilMoisture: number; // 30-70%
}
```

## Developer Guidelines

### When to Use Mock Data
- ✅ Frontend development without backend
- ✅ UI/UX testing with different data scenarios
- ✅ Demo presentations
- ✅ Unit testing components

### When to Disable Mock Data
- ✅ Integration testing with real API
- ✅ Production deployment
- ✅ Backend API testing

### Customizing Mock Data

To modify default mock values, edit `/src/services/mockDataService.ts`:

```typescript
// Change default sensor values
private mockSensorData: SensorData = {
  humidity: 65,    // Change this
  moisture: 45,    // Change this
  temperature: 25, // Change this
  timestamp: new Date().toISOString()
};
```

### Adding New Mock Data Types

1. Define the interface in `mockDataService.ts`
2. Add mock data generation logic
3. Add getter method with fallback
4. Update components to use the new service method

## File Structure

```
src/
├── services/
│   └── mockDataService.ts     # Main mock data service
├── components/
│   ├── DevUtils/
│   │   └── DevUtils.tsx       # Development utilities
│   ├── LineChart/
│   │   └── LineChart.tsx      # Chart with mock data support
│   └── ...
└── app/
    └── (default)/
        └── dashboard/
            └── page.tsx       # Dashboard using mock data
```

## Best Practices

1. **Always provide fallback**: Mock data should never break the app
2. **Make it obvious**: Show when mock data is being used
3. **Keep it realistic**: Mock data should represent real scenarios
4. **Easy to toggle**: Developers should easily switch modes
5. **Document well**: Clear instructions for team members

## Troubleshooting

### Mock data not updating
- Check if `useMockData` flag is enabled
- Verify `startMockDataUpdates()` was called
- Check browser console for errors

### Real API not being called
- Disable mock data: `mockDataService.setUseMockData(false)`
- Check network tab in browser dev tools
- Verify API endpoint is correct and accessible

### Mock data values unrealistic
- Adjust the variance in `generateMockChartData()`
- Modify default values in `mockSensorData`
- Check the update intervals and ranges
