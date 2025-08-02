import SensorDataModel, { ISensorData } from '../models/SensorData';
import { DatabaseService } from './DatabaseService';
import automationService from './AutomationService';
import { MergeStatistics, MergeOptions } from './merger/MergerTypes';
import { DocumentAnalyzer } from './merger/DocumentAnalyzer';
import { DataMerger } from './merger/DataMerger';

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
	public async mergeSameTimestampData(options: MergeOptions = {}): Promise<MergeStatistics> {
		try {
			console.log('🔄 Starting enhanced data merge for duplicate timestamps...');

			const stats: MergeStatistics = {
				totalDuplicates: 0,
				mergedRecords: 0,
				deletedRecords: 0,
				processedGroups: 0
			};

			// First: Handle exact timestamp duplicates
			const exactDuplicates = await DocumentAnalyzer.getExactDuplicateGroups();
			stats.totalDuplicates += exactDuplicates.length;

			for (const duplicate of exactDuplicates) {
				const result = await DataMerger.mergeDocumentGroup(duplicate.docs);
				stats.mergedRecords += result.merged;
				stats.deletedRecords += result.deleted;
				stats.processedGroups++;

				console.log(`✅ Merged ${duplicate.docs.length} exact duplicates for timestamp: ${duplicate._id}`);
			}

			// Second: Handle near duplicates if not exact only
			if (!options.exactDuplicatesOnly) {
				const nearDuplicates = await DocumentAnalyzer.getNearDuplicateGroups(options.timeWindowMs);
				stats.totalDuplicates += nearDuplicates.length;

				for (const duplicate of nearDuplicates) {
					const result = await DataMerger.mergeDocumentGroup(duplicate.docs);
					stats.mergedRecords += result.merged;
					stats.deletedRecords += result.deleted;
					stats.processedGroups++;

					console.log(`✅ Merged ${duplicate.docs.length} near duplicates for timeframe: ${duplicate._id}`);
				}
			}

			console.log('✅ Enhanced data merge completed:', stats);
			return stats;

		} catch (error) {
			console.error('❌ Error during enhanced data merge:', error);
			throw error;
		}
	}

	/**
	 * Clean up old sensor data (older than specified days)
	 */
	public async cleanupOldData(daysToKeep: number = 30): Promise<number> {
		try {
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

			const result = await SensorDataModel.deleteMany({
				createdAt: { $lt: cutoffDate }
			});

			console.log(`🗑️ Cleaned up ${result.deletedCount} old sensor records (older than ${daysToKeep} days)`);
			return result.deletedCount || 0;

		} catch (error) {
			console.error('❌ Error during data cleanup:', error);
			throw error;
		}
	}

	/**
	 * Get merge statistics without performing merge
	 */
	public async getMergeStatistics(): Promise<{ exactDuplicates: number; nearDuplicates: number }> {
		try {
			const exactDuplicates = await DocumentAnalyzer.getExactDuplicateGroups();
			const nearDuplicates = await DocumentAnalyzer.getNearDuplicateGroups();

			return {
				exactDuplicates: exactDuplicates.length,
				nearDuplicates: nearDuplicates.length
			};
		} catch (error) {
			console.error('❌ Error getting merge statistics:', error);
			return { exactDuplicates: 0, nearDuplicates: 0 };
		}
	}
}

export default DataMergerService.getInstance();
