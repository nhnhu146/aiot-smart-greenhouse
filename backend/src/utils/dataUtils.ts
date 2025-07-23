import { SensorData } from '../models';

/**
 * Merge sensor data with same timestamp (same hour and minute)
 * Keeps the most complete record and removes duplicates
 */
export async function mergeSameTimestampData(): Promise<number> {
	try {
		// Find records with same timestamp (grouped by hour and minute)
		const pipeline = [
			{
				$addFields: {
					roundedTimestamp: {
						$dateFromParts: {
							year: { $year: "$timestamp" },
							month: { $month: "$timestamp" },
							day: { $dayOfMonth: "$timestamp" },
							hour: { $hour: "$timestamp" },
							minute: { $minute: "$timestamp" }
						}
					}
				}
			},
			{
				$group: {
					_id: "$roundedTimestamp",
					records: { $push: "$$ROOT" },
					count: { $sum: 1 }
				}
			},
			{
				$match: { count: { $gt: 1 } }
			},
			{
				$sort: { "_id": -1 as const }
			},
			{
				$limit: 50 // Process recent duplicates first
			}
		];

		const duplicateGroups = await SensorData.aggregate(pipeline);
		let mergedCount = 0;

		for (const group of duplicateGroups) {
			const records = group.records;
			if (records.length <= 1) continue;

			// Find the most complete record
			const bestRecord = findMostCompleteRecord(records);
			const recordsToDelete = records.filter((r: any) => r._id.toString() !== bestRecord._id.toString());

			if (recordsToDelete.length > 0) {
				const idsToDelete = recordsToDelete.map((r: any) => r._id);
				await SensorData.deleteMany({ _id: { $in: idsToDelete } });
				mergedCount += recordsToDelete.length;

				console.log(`🔄 Merged ${recordsToDelete.length} records for timestamp ${group._id}`);
			}
		}

		if (mergedCount > 0) {
			console.log(`✅ Data merge completed: ${mergedCount} duplicate records removed`);
		}

		return mergedCount;
	} catch (error) {
		console.error('❌ Error merging same timestamp data:', error);
		return 0;
	}
}

/**
 * Find the most complete record from a group of duplicates
 */
function findMostCompleteRecord(records: any[]): any {
	return records.reduce((best, current) => {
		const bestScore = calculateCompletenessScore(best);
		const currentScore = calculateCompletenessScore(current);

		return currentScore > bestScore ? current : best;
	});
}

/**
 * Calculate completeness score for a sensor record
 */
function calculateCompletenessScore(record: any): number {
	let score = 0;
	const fields = ['temperature', 'humidity', 'soilMoisture', 'waterLevel', 'lightLevel'];

	for (const field of fields) {
		if (record[field] !== null && record[field] !== undefined && record[field] !== 'N/A') {
			score += 1;
		}
	}

	// Prefer newer records (createdAt)
	if (record.createdAt) {
		score += 0.1;
	}

	return score;
}

/**
 * Trigger merge on specific events
 */
export class DataMergeManager {
	private static mergeLock = false;

	static async triggerMerge(event: 'restart' | 'mqtt' | 'dashboard' | 'chart'): Promise<number> {
		if (this.mergeLock) {
			console.log('⏸️ Merge already in progress, skipping...');
			return 0;
		}

		this.mergeLock = true;

		try {
			console.log(`🔄 Triggering data merge on ${event} event...`);
			const mergedCount = await mergeSameTimestampData();
			return mergedCount;
		} finally {
			this.mergeLock = false;
		}
	}
}
