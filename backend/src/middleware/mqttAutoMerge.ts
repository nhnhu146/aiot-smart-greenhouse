import { DataMergerService } from '../services/DataMergerService';
import { SensorData } from '../models';
import { SensorData as MQTTSensorData } from '../services/websocket/WebSocketTypes';

interface MQTTDataOptions {
	skipMerge?: boolean;
	forceImmediate?: boolean;
	quality?: string;
}

/**
 * MQTT Auto-Merge Middleware
 * Handles data merging before saving MQTT data to database
 */
export class MQTTAutoMergeMiddleware {
	private static instance: MQTTAutoMergeMiddleware;
	private mergerService: DataMergerService;
	private lastMergeTime: number = 0;
	private mergeInterval: number = 1000; // 1 second minimum between merges
	private pendingMerge: Promise<void> | null = null;

	private constructor() {
		this.mergerService = DataMergerService.getInstance();
	}

	public static getInstance(): MQTTAutoMergeMiddleware {
		if (!MQTTAutoMergeMiddleware.instance) {
			MQTTAutoMergeMiddleware.instance = new MQTTAutoMergeMiddleware();
		}
		return MQTTAutoMergeMiddleware.instance;
	}

	/**
	 * Process MQTT sensor data with auto-merge
	 * @param sensorData - Raw sensor data from MQTT
	 * @param options - Processing options
	 * @returns Processed sensor data ready for database
	 */
	public async processMQTTData(
		sensorData: MQTTSensorData,
		options: MQTTDataOptions = {}
	): Promise<MQTTSensorData> {
		try {
			console.log(`🔄 Processing MQTT data: ${sensorData.type} = ${sensorData.value}`);

			// Check for immediate duplicates before saving
			if (!options.skipMerge) {
				const hasPendingDuplicates = await this.checkPendingDuplicates(sensorData);

				if (hasPendingDuplicates) {
					console.log('⚠️ Potential duplicate MQTT data detected, triggering immediate merge...');
					await this.performImmediateMerge();
				}
			}

			// Enhance sensor data with merge metadata
			const enhancedData: MQTTSensorData = {
				...sensorData,
				quality: options.quality === 'mqtt_raw' ? 'good' : (options.quality as any) || 'good'
			};

			// Schedule periodic merge if not already pending
			if (!options.skipMerge && !this.pendingMerge) {
				this.schedulePeriodicMerge();
			}

			return enhancedData;

		} catch (error) {
			console.error('❌ Error in MQTT auto-merge processing:', error);
			// Return original data on error
			return {
				...sensorData,
				quality: 'poor'
			};
		}
	}

	/**
	 * Pre-save validation and merge for MQTT data
	 * @param sensorData - Sensor data to validate and potentially merge
	 */
	public async preSaveMerge(sensorData: MQTTSensorData): Promise<boolean> {
		try {
			// Check if similar data exists within a short time window
			const recentData = await this.findRecentSimilarData(sensorData, 60000); // 1 minute

			if (recentData.length > 0) {
				console.log(`🔄 Found ${recentData.length} recent similar MQTT data, performing pre-save merge...`);

				// Merge with recent data
				const mergedData = await this.mergeWithRecentData(sensorData, recentData);

				if (mergedData) {
					console.log('✅ Pre-save merge completed for MQTT data');
					return true; // Indicate that merge was performed
				}
			}

			return false; // No merge needed
		} catch (error) {
			console.error('❌ Error in pre-save merge:', error);
			return false;
		}
	}

	/**
	 * Check for pending duplicates that might conflict with new MQTT data
	 */
	private async checkPendingDuplicates(newData: MQTTSensorData): Promise<boolean> {
		try {
			// Look for very recent data with same timestamp or very close timestamps
			const timeThreshold = new Date(Date.now() - 5000); // Last 5 seconds

			const similarData = await SensorData.findOne({
				$or: [
					{ timestamp: newData.timestamp },
					{
						createdAt: { $gte: timeThreshold },
						[newData.type]: { $exists: true, $ne: null }
					}
				]
			}).lean();

			return !!similarData;
		} catch (error) {
			console.error('❌ Error checking pending duplicates:', error);
			return false;
		}
	}

	/**
	 * Find recent similar sensor data
	 */
	private async findRecentSimilarData(sensorData: MQTTSensorData, timeWindowMs: number): Promise<any[]> {
		try {
			const timeThreshold = new Date(Date.now() - timeWindowMs);

			const recentData = await SensorData.find({
				createdAt: { $gte: timeThreshold },
				[sensorData.type]: { $exists: true, $ne: null }
			})
				.sort({ createdAt: -1 })
				.limit(5)
				.lean();

			return recentData;
		} catch (error) {
			console.error('❌ Error finding recent similar data:', error);
			return [];
		}
	}

	/**
	 * Merge new MQTT data with recent existing data
	 */
	private async mergeWithRecentData(newData: MQTTSensorData, recentData: any[]): Promise<boolean> {
		try {
			// Find the most recent record to update
			const targetRecord = recentData[0];

			if (!targetRecord) {
				return false;
			}

			// Update the target record with new sensor value
			const updateData: any = {
				[newData.type]: newData.value,
				updatedAt: new Date(),
				dataQuality: 'merged',
				mergedAt: new Date(),
				lastMqttUpdate: newData.timestamp
			};

			await SensorData.findByIdAndUpdate(targetRecord._id, {
				$set: updateData
			});

			console.log(`✅ Merged MQTT data ${newData.type}=${newData.value} with existing record`);
			return true;
		} catch (error) {
			console.error('❌ Error merging with recent data:', error);
			return false;
		}
	}

	/**
	 * Perform immediate merge when duplicates are detected
	 */
	private async performImmediateMerge(): Promise<void> {
		try {
			const now = Date.now();
			if (now - this.lastMergeTime < 2000) { // Minimum 2 seconds between immediate merges
				console.log('⚠️ Skipping immediate merge (too frequent)');
				return;
			}

			const mergeStats = await this.mergerService.mergeSameTimestampData({
				exactDuplicatesOnly: true,
				timeWindowMs: 30000, // Reduced from 60 seconds to 30 seconds
				preserveOriginal: false
			});

			this.lastMergeTime = now;
			console.log('✅ Immediate MQTT merge completed:', mergeStats);
		} catch (error) {
			console.error('❌ Error in immediate merge:', error);
		}
	}

	/**
	 * Schedule periodic merge to handle accumulated data
	 */
	private schedulePeriodicMerge(): void {
		if (this.pendingMerge) {
			return; // Already scheduled
		}

		this.pendingMerge = new Promise(resolve => {
			setTimeout(async () => {
				try {
					await this.performPeriodicMerge();
				} catch (error) {
					console.error('❌ Error in periodic merge:', error);
				} finally {
					this.pendingMerge = null;
					resolve();
				}
			}, this.mergeInterval);
		});
	}

	/**
	 * Perform periodic merge of accumulated MQTT data
	 */
	private async performPeriodicMerge(): Promise<void> {
		try {
			const now = Date.now();
			if (now - this.lastMergeTime < this.mergeInterval) {
				return; // Too soon
			}

			console.log('🔄 Performing periodic MQTT data merge...');
			const mergeStats = await this.mergerService.mergeSameTimestampData({
				exactDuplicatesOnly: false,
				timeWindowMs: 60000, // 1 minute window for periodic merge
				preserveOriginal: false
			});

			this.lastMergeTime = now;
			console.log('✅ Periodic MQTT merge completed:', mergeStats);
		} catch (error) {
			console.error('❌ Error in periodic merge:', error);
		}
	}

	/**
	 * Force immediate merge (for manual triggering)
	 */
	public async forceMerge(): Promise<void> {
		await this.performImmediateMerge();
	}

	/**
	 * Get merge statistics
	 */
	public getStats(): { lastMergeTime: number; hasPendingMerge: boolean; mergeInterval: number } {
		return {
			lastMergeTime: this.lastMergeTime,
			hasPendingMerge: !!this.pendingMerge,
			mergeInterval: this.mergeInterval
		};
	}
}

// Export singleton instance
export const mqttAutoMergeMiddleware = MQTTAutoMergeMiddleware.getInstance();
