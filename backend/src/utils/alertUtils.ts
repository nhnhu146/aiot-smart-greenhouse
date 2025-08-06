import { Alert } from '../models/Alert';
/**
 * Remove duplicate alerts with the same timestamp
 */
export async function removeDuplicateAlerts() {
	try {
		console.log('🔄 Starting alert cleanup process...');
		// Find all alerts grouped by timestamp and type
		const duplicates = await Alert.aggregate([
			{
				$group: {
					_id: {
						timestamp: '$timestamp',
						type: '$type',
						deviceId: '$deviceId'
					},
					count: { $sum: 1 },
					ids: { $push: '$_id' }
				}
			},
			{
				$match: {
					count: { $gt: 1 }
				}
			}
		]);
		let totalRemoved = 0;
		for (const duplicate of duplicates) {
			// Keep the first one, remove the rest
			const idsToRemove = duplicate.ids.slice(1);
			if (idsToRemove.length > 0) {
				await Alert.deleteMany({ _id: { $in: idsToRemove } });
				totalRemoved += idsToRemove.length;
				console.log(`✅ Removed ${idsToRemove.length} duplicate alerts for timestamp: ${duplicate._id.timestamp}`);
			}
		}

		const stats = {
			totalDuplicateGroups: duplicates.length,
			totalAlertsRemoved: totalRemoved,
			timestamp: new Date().toISOString()
		};
		console.log('✅ Alert cleanup completed:', stats);
		return stats;
	} catch (error) {
		console.error('❌ Error during alert cleanup:', error);
		throw error;
	}
}
