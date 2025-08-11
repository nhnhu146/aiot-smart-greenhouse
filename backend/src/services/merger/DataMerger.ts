import SensorDataModel from '../../models/SensorData';
export class DataMerger {
	/**
	 * Merge data from multiple documents into one complete record
	 * Prioritizes non-null and non-zero values for better data quality
	 */
	static mergeDocumentData(docs: any[], baseDoc: any): any {
		const merged: any = {};
		// Sensor fields to merge (prioritize non-null, non-zero values)
		const sensorFields = [
			'temperature', 'humidity', 'soilMoisture', 'waterLevel',
			'plantHeight', 'lightLevel', 'rainStatus'
		];

		for (const field of sensorFields) {
			merged[field] = this.selectBestValue(docs, field, baseDoc);
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
	 * Complete merge of document data with priority handling
	 * Enhanced to prioritize non-null and non-zero values
	 */
	static mergeDocumentDataComplete(docs: any[], baseDoc: any): any {
		const merged: any = {};
		// Sensor fields to merge (prioritize non-null, non-zero values)
		const sensorFields = [
			'temperature', 'humidity', 'soilMoisture', 'waterLevel',
			'plantHeight', 'lightLevel', 'rainStatus'
		];

		for (const field of sensorFields) {
			merged[field] = this.selectBestValue(docs, field, baseDoc);
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
	 * Select best value from documents prioritizing non-null, non-zero values
	 * Priority order: 1) Non-null and non-zero, 2) Non-null, 3) Fallback to first found
	 */
	private static selectBestValue(docs: any[], field: string, baseDoc: any): any {
		const allDocs = [baseDoc, ...docs.filter(doc => doc._id?.toString() !== baseDoc._id?.toString())];

		// Priority 1: Find first non-null AND non-zero value (for numeric fields)
		for (const doc of allDocs) {
			const value = doc[field];
			if (this.isValidNonZeroValue(value)) {
				return value;
			}
		}

		// Priority 2: Find first non-null value (including zero for valid cases)
		for (const doc of allDocs) {
			const value = doc[field];
			if (this.isValidNonNullValue(value)) {
				return value;
			}
		}

		// Priority 3: Fallback to null if no valid value found
		return null;
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

		// For numeric fields, non-zero values are preferred (but 0 might be valid in some cases)
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

		// For numeric fields, accept all numbers including zero (some sensors can legitimately read 0)
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
	 * Enhanced merge for groups with exact duplicate timestamps
	 */
	static async mergeDocumentGroup(docs: any[]): Promise<{ merged: number; deleted: number }> {
		try {
			// Sort by most complete data and most recent
			const sortedDocs = docs.sort((a, b) => {
				const scoreA = this.calculateCompletenessScore(a);
				const scoreB = this.calculateCompletenessScore(b);
				if (scoreA !== scoreB) {
					return scoreB - scoreA; // Higher score first
				}

				// If scores are equal, prefer more recent
				return new Date(b.createdAt || new Date()).getTime() - new Date(a.createdAt || new Date()).getTime();
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
			console.error('❌ Error in document group merge:', error);
			return { merged: 0, deleted: 0 };
		}
	}

	/**
	 * Calculate completeness score prioritizing non-null and non-zero values
	 */
	private static calculateCompletenessScore(doc: any): number {
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
}
