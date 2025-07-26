#!/usr/bin/env node

/**
 * Check Data Duplicate Status
 * Analyze current duplicate data situation
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import { DatabaseService } from '../services/DatabaseService';
import SensorDataModel from '../models/SensorData';

async function checkDataStatus(): Promise<void> {
	console.log('🔍 Checking current data duplicate status...');

	try {
		// Connect to database
		const dbService = DatabaseService.getInstance();
		await dbService.connect();
		console.log('✅ Database connected successfully');

		// Check last 24 hours data
		const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

		// Total records
		const totalRecords = await SensorDataModel.countDocuments({
			createdAt: { $gte: last24Hours }
		});

		console.log(`📊 Total records in last 24h: ${totalRecords}`);

		// Find exact timestamp duplicates
		const exactDuplicates = await SensorDataModel.aggregate([
			{
				$match: { createdAt: { $gte: last24Hours } }
			},
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
				$sort: { count: -1 }
			}
		]);

		console.log(`🔴 Exact timestamp duplicates: ${exactDuplicates.length} groups`);

		if (exactDuplicates.length > 0) {
			console.log('Top 5 exact duplicates:');
			exactDuplicates.slice(0, 5).forEach((group, index) => {
				console.log(`  ${index + 1}. Timestamp: ${group._id}, Count: ${group.count}`);
			});
		}

		// Find minute-level duplicates
		const minuteDuplicates = await SensorDataModel.aggregate([
			{
				$match: { createdAt: { $gte: last24Hours } }
			},
			{
				$group: {
					_id: {
						year: { $year: '$createdAt' },
						month: { $month: '$createdAt' },
						day: { $dayOfMonth: '$createdAt' },
						hour: { $hour: '$createdAt' },
						minute: { $minute: '$createdAt' }
					},
					docs: { $push: '$$ROOT' },
					count: { $sum: 1 }
				}
			},
			{
				$match: { count: { $gt: 1 } }
			},
			{
				$sort: { count: -1 }
			}
		]);

		console.log(`🟡 Minute-level duplicates: ${minuteDuplicates.length} groups`);

		if (minuteDuplicates.length > 0) {
			console.log('Top 5 minute duplicates:');
			minuteDuplicates.slice(0, 5).forEach((group, index) => {
				const date = new Date();
				date.setFullYear(group._id.year, group._id.month - 1, group._id.day);
				date.setHours(group._id.hour, group._id.minute, 0, 0);
				console.log(`  ${index + 1}. Minute: ${date.toLocaleString()}, Count: ${group.count}`);
			});
		}

		// Sample latest records
		const latestRecords = await SensorDataModel.find({
			createdAt: { $gte: last24Hours }
		})
			.sort({ createdAt: -1 })
			.limit(10)
			.lean();

		console.log('\n📝 Latest 10 records:');
		latestRecords.forEach((record, index) => {
			console.log(`  ${index + 1}. ${record.createdAt?.toISOString()} - T:${record.temperature}, H:${record.humidity}, S:${record.soilMoisture}`);
		});

		// Check data quality distribution
		const qualityStats = await SensorDataModel.aggregate([
			{
				$match: { createdAt: { $gte: last24Hours } }
			},
			{
				$group: {
					_id: '$dataQuality',
					count: { $sum: 1 }
				}
			}
		]);

		console.log('\n📊 Data quality distribution:');
		qualityStats.forEach(stat => {
			console.log(`  ${stat._id}: ${stat.count} records`);
		});

		process.exit(0);

	} catch (error) {
		console.error('❌ Error checking data status:', error);
		process.exit(1);
	}
}

// Run the check
checkDataStatus();
