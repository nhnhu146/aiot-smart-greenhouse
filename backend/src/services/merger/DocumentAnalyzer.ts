import SensorDataModel from '../../models/SensorData';
import { DocumentGroup } from './MergerTypes';
import { AppConstants } from '../../config/AppConfig';
export class DocumentAnalyzer {
	/**
	 * Calculate completeness score for a document
	 * Prioritizes non-null and non-zero values for better data quality
	 */
	static calculateCompletenessScore(doc: any): number {
		const sensorFields = ['temperature', 'humidity', 'soilMoisture', 'waterLevel', 'plantHeight', 'lightLevel', 'rainStatus'];
		let score = 0;

		for (const field of sensorFields) {
			const value = doc[field];

			// Higher score for non-null and non-zero values
			if (this.isValidNonZeroValue(value)) {
				score += 2; // Double points for non-zero values
			} else if (this.isValidNonNullValue(value)) {
				score += 1; // Single point for non-null values (including valid zeros)
			}
		}

		return score;
	}

	/**
	 * Find document with most complete sensor data
	 * Enhanced to prioritize non-null and non-zero values
	 */
	static findMostCompleteDocument(docs: any[]): any {
		let bestScore = -1;
		let bestDoc = docs[0];

		for (const doc of docs) {
			const score = this.calculateCompletenessScore(doc);

			// Prefer higher score, then newer documents if score is same
			if (score > bestScore || (score === bestScore && doc.createdAt > bestDoc.createdAt)) {
				bestScore = score;
				bestDoc = doc;
			}
		}

		return bestDoc;
	}

	/**
	 * Check if value is valid and non-zero (for sensors that shouldn't be zero)
	 */
	private static isValidNonZeroValue(value: any): boolean {
		if (value === null || value === undefined || value === '') {
			return false;
		}

		// For boolean fields (like rainStatus), 0 and 1 are both valid
		if (typeof value === 'boolean') {
			return true;
		}

		// For numeric fields, non-zero values are preferred
		if (typeof value === 'number') {
			return !isNaN(value) && value !== 0;
		}

		// For string values, non-empty strings are valid
		if (typeof value === 'string') {
			return value.trim().length > 0;
		}

		return false;
	}

	/**
	 * Check if value is valid and non-null (including zero for valid sensor readings)
	 */
	private static isValidNonNullValue(value: any): boolean {
		if (value === null || value === undefined || value === '') {
			return false;
		}

		// For boolean fields
		if (typeof value === 'boolean') {
			return true;
		}

		// For numeric fields, accept all numbers including zero
		if (typeof value === 'number') {
			return !isNaN(value);
		}

		// For string values
		if (typeof value === 'string') {
			return value.trim().length > 0;
		}

		return false;
	}

	/**
	 * Get exact duplicate groups by timestamp
	 */
	static async getExactDuplicateGroups(): Promise<DocumentGroup[]> {
		return await SensorDataModel.aggregate([
			{
				$group: {
					_id: '$createdAt',
					docs: { $push: '$$ROOT' },
					count: { $sum: 1 }
				}
			},
			{
				$match: { count: { $gt: 1 } }
			}
		]);
	}

	/**
	 * Get near duplicate groups (within time window)
	 */
	static async getNearDuplicateGroups(timeWindowMs: number = AppConstants.CONNECTION_TIMEOUT / 2): Promise<DocumentGroup[]> {
		const docs = await SensorDataModel.find({ /* TODO: Implement */ }).sort({ createdAt: 1 }).lean();
		const groups: DocumentGroup[] = [];
		const processed = new Set();
		for (let i = 0; i < docs.length; i++) {
			if (processed.has(docs[i]._id.toString())) continue;
			const currentDoc = docs[i];
			const group: any[] = [currentDoc];
			processed.add(currentDoc._id.toString());
			// Find docs within time window
			for (let j = i + 1; j < docs.length; j++) {
				if (processed.has(docs[j]._id.toString())) continue;
				const timeDiff = Math.abs(
					new Date(docs[j].createdAt || new Date()).getTime() - new Date(currentDoc.createdAt || new Date()).getTime()
				);
				if (timeDiff <= timeWindowMs) {
					group.push(docs[j]);
					processed.add(docs[j]._id.toString());
				} else {
					break; // Since sorted, no more matches
				}
			}

			if (group.length > 1) {
				groups.push({
					_id: currentDoc.createdAt,
					docs: group,
					count: group.length
				});
			}
		}

		return groups;
	}
}
