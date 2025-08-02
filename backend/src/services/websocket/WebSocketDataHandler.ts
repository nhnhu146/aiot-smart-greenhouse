import { DataMergerService } from '../DataMergerService';
import { SensorData } from '../../models';
import { SensorData as SensorDataType } from './WebSocketTypes';

export class WebSocketDataHandler {
	// Merge sensor data before broadcasting
	async prepareSensorDataForBroadcast(data: SensorDataType): Promise<number | undefined> {
		try {
			// Ensure data is merged before broadcasting
			const dataMergerService = DataMergerService.getInstance();

			// Get the latest merged sensor data from database
			const latestData = await SensorData.findOne()
				.sort({ createdAt: -1 })
				.lean();

			if (!latestData) {
				console.warn('⚠️ No sensor data found in database');
				return undefined;
			}

			// Extract the relevant sensor value from merged data
			const sensorType = data.type;

			// Use the merged value from database if available
			switch (sensorType) {
				case 'temperature':
					return latestData.temperature ?? data.value;
				case 'humidity':
					return latestData.humidity ?? data.value;
				case 'soil':
					return latestData.soilMoisture ?? data.value;
				case 'water':
					return latestData.waterLevel ?? data.value;
				case 'light':
					return latestData.lightLevel ?? data.value;
				case 'height':
					return latestData.plantHeight ?? data.value;
				case 'rain':
					return latestData.rainStatus ?? data.value;
				default:
					return data.value;
			}

		} catch (error) {
			console.error('❌ Error preparing merged sensor data:', error);
			return undefined;
		}
	}
}
