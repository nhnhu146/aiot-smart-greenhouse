import SensorDataModel from '../../models/SensorData';
import { DocumentGroup } from './MergerTypes';

export class DocumentAnalyzer {
	/**
	 * Calculate completeness score for a document
	 */
	static calculateCompletenessScore(doc: any): number {
		const sensorFields = ['temperature', 'humidity', 'soilMoisture', 'waterLevel', 'plantHeight', 'lightLevel', 'rainStatus'];
		let score = 0;

		for (const field of sensorFields) {
			if (doc[field] !== null && doc[field] !== undefined && doc[field] !== '') {
				score++;
			}
		}

		return score;
	}

	/**
	 * Find document with most complete sensor data
	 */
	static findMostCompleteDocument(docs: any[]): any {
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
	static async getNearDuplicateGroups(timeWindowMs: number = 5000): Promise<DocumentGroup[]> {
		const docs = await SensorDataModel.find({}).sort({ createdAt: 1 }).lean();
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
