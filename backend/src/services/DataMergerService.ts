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
	 * Merge sensor data records with same timestamp (enhanced to handle exact and near duplicates)
	 * This handles duplicate data from multiple sources (MQTT, WebSocket, manual)
	 */
	public async mergeSameTimestampData(): Promise<MergeStatistics> {
		try {
			console.log('🔄 Starting enhanced data merge for duplicate timestamps...');

			const stats: MergeStatistics = {
				totalDuplicates: 0,
				mergedRecords: 0,
				deletedRecords: 0,
				processedGroups: 0
			};

			// First: Handle exact timestamp duplicates
			const exactDuplicates = await SensorDataModel.aggregate([
				{
					$group: {
						_id: '$createdAt',
						docs: { $push: '$$ROOT' },
						count: { $sum: 1 }
					}
				},
				{
					$match: { count: { $gt: 1 } }
				},
				{
					$sort: { 'count': -1 }
				}
			]);

			console.log(`📊 Found ${exactDuplicates.length} groups with exact timestamp duplicates`);

			// Process exact duplicates first
			for (const group of exactDuplicates) {
				const docs = group.docs;
				if (docs.length < 2) continue;

				const mergeResult = await this.mergeDocumentGroupEnhanced(docs);
				stats.mergedRecords += mergeResult.merged;
				stats.deletedRecords += mergeResult.deleted;
				stats.processedGroups++;
			}

			// Second: Handle second-level near duplicates (after exact duplicates are cleaned)
			const pipeline: any[] = [
				{
					$group: {
						_id: {
							year: { $year: '$createdAt' },
							month: { $month: '$createdAt' },
							day: { $dayOfMonth: '$createdAt' },
							hour: { $hour: '$createdAt' },
							minute: { $minute: '$createdAt' },
							second: { $second: '$createdAt' } // Group by second for precise duplicates
						},
						docs: { $push: '$$ROOT' },
						count: { $sum: 1 }
					}
				},
				{
					$match: { count: { $gt: 1 } }
				},
				{
					$sort: { 'count': -1 }
				},
				{
					$limit: 200 // Process reasonable batch size
				}
			];

			const minuteDuplicates = await SensorDataModel.aggregate(pipeline);
			console.log(`📊 Found ${minuteDuplicates.length} groups with minute-level duplicates`);

			// Process minute-level duplicates
			for (const group of minuteDuplicates) {
				const docs = group.docs;
				if (docs.length < 2) continue;

				const mergeResult = await this.mergeDocumentGroupEnhanced(docs);
				stats.mergedRecords += mergeResult.merged;
				stats.deletedRecords += mergeResult.deleted;
				stats.processedGroups++;
			}

			stats.totalDuplicates = exactDuplicates.length + minuteDuplicates.length;

			console.log(`📊 Found ${stats.totalDuplicates} groups with duplicate data in same minute`);

			console.log('✅ Enhanced data merge completed:', stats);
			return stats;

		} catch (error) {
			console.error('❌ Error in enhanced data merge:', error);
			throw error;
		}
	}

	/**
	 * Enhanced merge for groups with exact duplicate timestamps
	 */
	private async mergeDocumentGroupEnhanced(docs: any[]): Promise<{ merged: number; deleted: number }> {
		try {
			// Sort by most complete data and most recent
			const sortedDocs = docs.sort((a, b) => {
				const scoreA = this.calculateCompletenessScore(a);
				const scoreB = this.calculateCompletenessScore(b);

				if (scoreA !== scoreB) {
					return scoreB - scoreA; // Higher score first
				}

				// If scores are equal, prefer more recent
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			});

			const bestDoc = sortedDocs[0];
			const mergedData = this.mergeDocumentDataComplete(docs, bestDoc);

			// Update the best document with merged data
			await SensorDataModel.findByIdAndUpdate(bestDoc._id, {
				$set: mergedData
			});

			// Delete all other documents
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
			console.error('❌ Error in enhanced document group merge:', error);
			return { merged: 0, deleted: 0 };
		}
	}

	/**
	 * Calculate completeness score for a document
	 */
	private calculateCompletenessScore(doc: any): number {
		const sensorFields = ['temperature', 'humidity', 'soilMoisture', 'waterLevel', 'plantHeight', 'lightLevel', 'rainStatus', 'motionDetected'];
		let score = 0;

		for (const field of sensorFields) {
			if (doc[field] !== null && doc[field] !== undefined && doc[field] !== '') {
				score++;
			}
		}

		return score;
	}

	/**
	 * Complete merge of document data with priority handling
	 */
	private mergeDocumentDataComplete(docs: any[], baseDoc: any): any {
		const merged: any = {};

		// Sensor fields to merge (use first non-null value found)
		const sensorFields = [
			'temperature', 'humidity', 'soilMoisture', 'waterLevel',
			'plantHeight', 'lightLevel', 'rainStatus', 'motionDetected'
		];

		for (const field of sensorFields) {
			// Use value from base document first, then find first non-null from others
			if (baseDoc[field] !== null && baseDoc[field] !== undefined && baseDoc[field] !== '') {
				merged[field] = baseDoc[field];
			} else {
				for (const doc of docs) {
					if (doc[field] !== null && doc[field] !== undefined && doc[field] !== '') {
						merged[field] = doc[field];
						break;
					}
				}
			}
		}

		// Keep metadata from base document but enhance with merge info
		merged.deviceId = baseDoc.deviceId || 'esp32-greenhouse-01';
		merged.dataQuality = 'merged_enhanced';
		merged.updatedAt = new Date();

		// Enhanced merge metadata
		merged.mergedFrom = docs.length;
		merged.mergedAt = new Date();
		merged.originalTimestamp = baseDoc.createdAt;
		merged.duplicatesRemoved = docs.length - 1;

		return merged;
	}

	/**
	 * Merge a group of documents with same timestamp (original method)
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
	 * Auto-merge on data reception (enhanced real-time merging)
	 * Called when new sensor data is received via MQTT or WebSocket
	 */
	public async autoMergeOnDataReceive(newData: any): Promise<boolean> {
		try {
			// Validate and parse timestamp
			let timestamp: Date;

			if (!newData.createdAt) {
				console.warn('⚠️ No createdAt field in newData, using current time');
				timestamp = new Date();
			} else {
				timestamp = new Date(newData.createdAt);

				// Check if date is valid
				if (isNaN(timestamp.getTime())) {
					console.warn(`⚠️ Invalid createdAt value: ${newData.createdAt}, using current time`);
					timestamp = new Date();
				}
			}

			// Enhanced duplicate detection: check within same minute window
			const startOfMinute = new Date(timestamp);
			startOfMinute.setSeconds(0, 0); // Start of minute

			const endOfMinute = new Date(startOfMinute);
			endOfMinute.setSeconds(59, 999); // End of minute

			const existingDocs = await SensorDataModel.find({
				createdAt: {
					$gte: startOfMinute,
					$lte: endOfMinute
				}
			}).lean();

			if (existingDocs.length === 0) {
				// No duplicates in this minute, proceed normally
				return false;
			}

			console.log(`🔍 Found ${existingDocs.length} existing records in same minute`);

			// Ensure newData has valid createdAt for merging
			const newDataForMerge = {
				...newData,
				createdAt: timestamp // Use the validated timestamp
			};

			// Merge with existing data using enhanced logic
			const allDocs = [...existingDocs, newDataForMerge];
			await this.mergeDocumentGroupEnhanced(allDocs);

			console.log(`🔄 Auto-merged data for minute: ${timestamp.toLocaleString()}`);
			return true;

		} catch (error) {
			console.error('❌ Error in enhanced auto-merge:', error);

			// Log additional context for debugging
			if (error instanceof Error && error.message.includes('Cast to date failed')) {
				console.error('❌ Date validation error. newData.createdAt:', newData?.createdAt);
			}

			return false;
		}
	}

	/**
	 * Schedule periodic merge (enhanced frequency for better performance)
	 */
	public async schedulePeriodicMerge(intervalMinutes: number = 5): Promise<void> {
		console.log(`⏰ Scheduling enhanced periodic merge every ${intervalMinutes} minutes`);

		setInterval(async () => {
			try {
				const stats = await this.mergeSameTimestampData();
				if (stats.processedGroups > 0) {
					console.log(`🔄 Periodic merge completed: ${stats.mergedRecords} merged, ${stats.deletedRecords} deleted`);
				} else {
					console.log('✅ No duplicates found in periodic merge');
				}
			} catch (error) {
				console.error('❌ Error in periodic merge:', error);
			}
		}, intervalMinutes * 60 * 1000);
	}

	/**
	 * Pre-save merge check - called before saving new sensor data
	 * Returns merged document if duplicates found, null if no duplicates
	 */
	public async preSaveMergeCheck(newData: any): Promise<any | null> {
		try {
			// Check for exact timestamp duplicates
			const existingDoc = await SensorDataModel.findOne({
				createdAt: newData.createdAt
			}).lean();

			if (!existingDoc) {
				return null; // No duplicates, proceed with normal save
			}

			console.log(`🔄 Pre-save merge: Found existing data for timestamp ${newData.createdAt}`);

			// Merge the new data with existing
			const mergedData = this.mergeDocumentDataComplete([existingDoc, newData], existingDoc);
			
			// Update existing document with merged data
			const updated = await SensorDataModel.findByIdAndUpdate(
				existingDoc._id,
				{ $set: mergedData },
				{ new: true, lean: true }
			);

			return updated;

		} catch (error) {
			console.error('❌ Error in pre-save merge check:', error);
			return null;
		}
	}
}

export default DataMergerService;
