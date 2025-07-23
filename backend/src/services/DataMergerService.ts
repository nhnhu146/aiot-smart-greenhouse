import SensorDataModel, { ISensorData } from '../models/SensorData';
import { DatabaseService } from './DatabaseService';

export interface MergeStatistics {
	totalDuplicates: number;
	mergedRecords: number;
	deletedRecords: number;
	processedGroups: number;
}

export class DataMergerService {
	private static instance: DataMergerService;
	private dbService: DatabaseService;

	private constructor() {
		this.dbService = DatabaseService.getInstance();
	}

	public static getInstance(): DataMergerService {
		if (!DataMergerService.instance) {
			DataMergerService.instance = new DataMergerService();
		}
		return DataMergerService.instance;
	}

	/**
	 * Merge sensor data records with same timestamp (hour, minute, second)
	 * This handles duplicate data from multiple sources (MQTT, WebSocket, manual)
	 */
	public async mergeSameTimestampData(): Promise<MergeStatistics> {
		try {
			console.log('🔄 Starting data merge for same timestamps...');

			const stats: MergeStatistics = {
				totalDuplicates: 0,
				mergedRecords: 0,
				deletedRecords: 0,
				processedGroups: 0
			};

			// Aggregation pipeline to find duplicates by timestamp (hour, minute, second)
			const pipeline: any[] = [
				{
					$group: {
						_id: {
							year: { $year: '$createdAt' },
							month: { $month: '$createdAt' },
							day: { $dayOfMonth: '$createdAt' },
							hour: { $hour: '$createdAt' },
							minute: { $minute: '$createdAt' },
							second: { $second: '$createdAt' }
						},
						docs: { $push: '$$ROOT' },
						count: { $sum: 1 }
					}
				},
				{
					$match: { count: { $gt: 1 } }
				},
				{
					$sort: { '_id': -1 }
				},
				{
					$limit: 200 // Process in batches to avoid memory issues
				}
			];

			const duplicateGroups = await SensorDataModel.aggregate(pipeline);
			stats.totalDuplicates = duplicateGroups.length;

			console.log(`📊 Found ${stats.totalDuplicates} duplicate timestamp groups`);

			for (const group of duplicateGroups) {
				const docs = group.docs;
				if (docs.length < 2) continue;

				const mergeResult = await this.mergeDocumentGroup(docs);
				stats.mergedRecords += mergeResult.merged;
				stats.deletedRecords += mergeResult.deleted;
				stats.processedGroups++;

				// Log progress
				if (stats.processedGroups % 10 === 0) {
					console.log(`🔄 Processed ${stats.processedGroups}/${stats.totalDuplicates} groups...`);
				}
			}

			console.log('✅ Data merge completed:', stats);
			return stats;

		} catch (error) {
			console.error('❌ Error in data merge:', error);
			throw error;
		}
	}

	/**
	 * Merge a group of documents with same timestamp
	 */
	private async mergeDocumentGroup(docs: any[]): Promise<{ merged: number; deleted: number }> {
		try {
			// Find the most complete document (has most non-null sensor values)
			const bestDoc = this.findMostCompleteDocument(docs);

			// Create merged document with best data from all documents
			const mergedData = this.mergeDocumentData(docs, bestDoc);

			// Update the best document with merged data
			await SensorDataModel.findByIdAndUpdate(bestDoc._id, {
				$set: mergedData
			});

			// Delete other documents
			const otherIds = docs
				.filter(doc => doc._id.toString() !== bestDoc._id.toString())
				.map(doc => doc._id);

			if (otherIds.length > 0) {
				await SensorDataModel.deleteMany({ _id: { $in: otherIds } });
			}

			return {
				merged: 1,
				deleted: otherIds.length
			};

		} catch (error) {
			console.error('❌ Error merging document group:', error);
			return { merged: 0, deleted: 0 };
		}
	}

	/**
	 * Find document with most complete sensor data
	 */
	private findMostCompleteDocument(docs: any[]): any {
		let bestScore = -1;
		let bestDoc = docs[0];

		const sensorFields = ['temperature', 'humidity', 'soilMoisture', 'waterLevel', 'plantHeight', 'lightLevel'];

		for (const doc of docs) {
			let score = 0;

			// Count non-null sensor values
			for (const field of sensorFields) {
				if (doc[field] !== null && doc[field] !== undefined) {
					score++;
				}
			}

			// Prefer newer documents if score is same
			if (score > bestScore || (score === bestScore && doc.createdAt > bestDoc.createdAt)) {
				bestScore = score;
				bestDoc = doc;
			}
		}

		return bestDoc;
	}

	/**
	 * Merge data from multiple documents into one complete record
	 */
	private mergeDocumentData(docs: any[], baseDoc: any): any {
		const merged: any = {};

		// Sensor fields to merge (use first non-null value found)
		const sensorFields = [
			'temperature', 'humidity', 'soilMoisture', 'waterLevel',
			'plantHeight', 'lightLevel', 'rainStatus', 'motionDetected'
		];

		for (const field of sensorFields) {
			// Use value from base document first, then find first non-null from others
			if (baseDoc[field] !== null && baseDoc[field] !== undefined) {
				merged[field] = baseDoc[field];
			} else {
				for (const doc of docs) {
					if (doc[field] !== null && doc[field] !== undefined) {
						merged[field] = doc[field];
						break;
					}
				}
			}
		}

		// Keep metadata from base document
		merged.deviceId = baseDoc.deviceId || 'esp32-greenhouse-01';
		merged.dataQuality = 'merged';
		merged.updatedAt = new Date();

		// Add merge metadata
		merged.mergedFrom = docs.length;
		merged.mergedAt = new Date();

		return merged;
	}

	/**
	 * Auto-merge on data reception (real-time merging)
	 * Called when new sensor data is received via MQTT or WebSocket
	 */
	public async autoMergeOnDataReceive(newData: any): Promise<boolean> {
		try {
			const timestamp = new Date(newData.createdAt);

			// Find existing records within same second
			const startOfSecond = new Date(timestamp);
			startOfSecond.setMilliseconds(0);

			const endOfSecond = new Date(startOfSecond);
			endOfSecond.setMilliseconds(999);

			const existingDocs = await SensorDataModel.find({
				createdAt: {
					$gte: startOfSecond,
					$lte: endOfSecond
				}
			}).lean();

			if (existingDocs.length === 0) {
				// No duplicates, proceed normally
				return false;
			}

			// Merge with existing data
			const allDocs = [...existingDocs, newData];
			await this.mergeDocumentGroup(allDocs);

			console.log(`🔄 Auto-merged data for timestamp: ${timestamp.toISOString()}`);
			return true;

		} catch (error) {
			console.error('❌ Error in auto-merge:', error);
			return false;
		}
	}

	/**
	 * Schedule periodic merge (for cron job)
	 */
	public async schedulePeriodicMerge(intervalMinutes: number = 30): Promise<void> {
		console.log(`⏰ Scheduling periodic merge every ${intervalMinutes} minutes`);

		setInterval(async () => {
			try {
				const stats = await this.mergeSameTimestampData();
				if (stats.processedGroups > 0) {
					console.log(`🔄 Periodic merge completed: ${stats.mergedRecords} merged, ${stats.deletedRecords} deleted`);
				}
			} catch (error) {
				console.error('❌ Error in periodic merge:', error);
			}
		}, intervalMinutes * 60 * 1000);
	}
}

export default DataMergerService;
