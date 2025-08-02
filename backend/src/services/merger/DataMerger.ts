import SensorDataModel from '../../models/SensorData';

export class DataMerger {
	/**
	 * Merge data from multiple documents into one complete record
	 */
	static mergeDocumentData(docs: any[], baseDoc: any): any {
		const merged: any = {};

		// Sensor fields to merge (use first non-null value found)
		const sensorFields = [
			'temperature', 'humidity', 'soilMoisture', 'waterLevel',
			'plantHeight', 'lightLevel', 'rainStatus'
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
	 * Complete merge of document data with priority handling
	 */
	static mergeDocumentDataComplete(docs: any[], baseDoc: any): any {
		const merged: any = {};

		// Sensor fields to merge (use first non-null value found)
		const sensorFields = [
			'temperature', 'humidity', 'soilMoisture', 'waterLevel',
			'plantHeight', 'lightLevel', 'rainStatus'
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

	private static calculateCompletenessScore(doc: any): number {
		const sensorFields = ['temperature', 'humidity', 'soilMoisture', 'waterLevel', 'plantHeight', 'lightLevel', 'rainStatus'];
		let score = 0;

		for (const field of sensorFields) {
			if (doc[field] !== null && doc[field] !== undefined && doc[field] !== '') {
				score++;
			}
		}

		return score;
	}
}
