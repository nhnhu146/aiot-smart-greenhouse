import SensorDataModel from '../models/SensorData';

/**
 * Clean up duplicate sensor data with enhanced merging logic
 */
export async function cleanupDuplicateData() {
	try {
		console.log('🔄 Starting enhanced sensor data cleanup process...');

		// Find all sensor data grouped by timestamp and deviceId
		const duplicates = await SensorDataModel.aggregate([
			{
				$group: {
					_id: {
						timestamp: '$timestamp',
						deviceId: '$deviceId'
					},
					count: { $sum: 1 },
					docs: {
						$push: {
							id: '$_id',
							data: '$data',
							createdAt: '$createdAt'
						}
					}
				}
			},
			{
				$match: {
					count: { $gt: 1 }
				}
			}
		]);

		let totalProcessed = 0;
		let totalMerged = 0;

		for (const duplicate of duplicates) {
			const docs = duplicate.docs;

			if (docs.length > 1) {
				// Merge all data objects from duplicates
				const mergedData: any = {};
				const idsToRemove: any[] = [];
				let keepId = docs[0].id;

				// Combine all sensor readings
				for (const doc of docs) {
					if (doc.data && typeof doc.data === 'object') {
						Object.assign(mergedData, doc.data);
					}

					// Keep the earliest created document, remove others
					if (doc.id !== keepId) {
						idsToRemove.push(doc.id);
					}
				}

				// Update the kept document with merged data
				if (Object.keys(mergedData).length > 0) {
					await SensorDataModel.updateOne(
						{ _id: keepId },
						{
							$set: {
								data: mergedData,
								updatedAt: new Date()
							}
						}
					);
				}

				// Remove duplicate documents
				if (idsToRemove.length > 0) {
					await SensorDataModel.deleteMany({ _id: { $in: idsToRemove } });
					totalMerged += idsToRemove.length;
				}

				totalProcessed++;
				console.log(`✅ Merged ${docs.length} duplicate sensor data for timestamp: ${duplicate._id.timestamp}`);
			}
		}

		const stats = {
			totalDuplicateGroups: duplicates.length,
			totalGroupsProcessed: totalProcessed,
			totalDocumentsMerged: totalMerged,
			timestamp: new Date().toISOString()
		};

		console.log('✅ Enhanced sensor data cleanup completed:', stats);
		return stats;

	} catch (error) {
		console.error('❌ Error during enhanced sensor data cleanup:', error);
		throw error;
	}
}