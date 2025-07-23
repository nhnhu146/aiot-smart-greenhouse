#!/usr/bin/env node

/**
 * Alert Cleanup Utility
 * Remove duplicate alerts and analyze alert patterns
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import { DatabaseService } from '../services/DatabaseService';
import { Alert } from '../models/Alert';

interface AlertCleanupStats {
	totalAlerts: number;
	duplicateAlerts: number;
	alertsByType: { [key: string]: number };
	alertsByLevel: { [key: string]: number };
	alertsByHour: { [key: string]: number };
	deletedDuplicates: number;
}

async function cleanupDuplicateAlerts(): Promise<AlertCleanupStats> {
	console.log('🔄 Starting alert cleanup and analysis...');

	try {
		// Connect to database
		const dbService = DatabaseService.getInstance();
		await dbService.connect();
		console.log('✅ Database connected successfully');

		// Get all alerts from last 24 hours
		const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
		const alerts = await Alert.find({
			timestamp: { $gte: last24Hours }
		}).sort({ timestamp: -1 }).lean();

		console.log(`📊 Found ${alerts.length} alerts in last 24 hours`);

		const stats: AlertCleanupStats = {
			totalAlerts: alerts.length,
			duplicateAlerts: 0,
			alertsByType: {},
			alertsByLevel: {},
			alertsByHour: {},
			deletedDuplicates: 0
		};

		// Analyze alerts
		const alertMap = new Map<string, any[]>();

		for (const alert of alerts) {
			// Count by type
			stats.alertsByType[alert.type] = (stats.alertsByType[alert.type] || 0) + 1;

			// Count by level
			stats.alertsByLevel[alert.level] = (stats.alertsByLevel[alert.level] || 0) + 1;

			// Count by hour
			const hour = new Date(alert.timestamp).getHours();
			const hourKey = `${hour}:00`;
			stats.alertsByHour[hourKey] = (stats.alertsByHour[hourKey] || 0) + 1;

			// Group potential duplicates
			const alertKey = `${alert.type}-${alert.level}-${alert.message}`;
			const timeWindow = Math.floor(new Date(alert.timestamp).getTime() / (5 * 60 * 1000)); // 5-minute windows
			const duplicateKey = `${alertKey}-${timeWindow}`;

			if (!alertMap.has(duplicateKey)) {
				alertMap.set(duplicateKey, []);
			}
			alertMap.get(duplicateKey)!.push(alert);
		}

		// Find and remove duplicates
		const duplicateGroups = Array.from(alertMap.values()).filter(group => group.length > 1);
		stats.duplicateAlerts = duplicateGroups.length;

		console.log(`🔍 Found ${duplicateGroups.length} potential duplicate groups`);

		// Remove duplicates (keep the first one in each group)
		for (const group of duplicateGroups) {
			if (group.length > 1) {
				// Sort by timestamp and keep the earliest
				group.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
				const toDelete = group.slice(1); // Remove all but the first

				const deleteIds = toDelete.map(alert => alert._id);
				if (deleteIds.length > 0) {
					const deleteResult = await Alert.deleteMany({ _id: { $in: deleteIds } });
					stats.deletedDuplicates += deleteResult.deletedCount || 0;
					console.log(`🗑️ Deleted ${deleteResult.deletedCount} duplicate alerts for ${group[0].type}`);
				}
			}
		}

		return stats;

	} catch (error) {
		console.error('❌ Error in alert cleanup:', error);
		throw error;
	}
}

async function displayStats(stats: AlertCleanupStats) {
	console.log('\n📊 Alert Analysis Report:');
	console.log('========================');
	console.log(`Total alerts in last 24h: ${stats.totalAlerts}`);
	console.log(`Duplicate groups found: ${stats.duplicateAlerts}`);
	console.log(`Duplicate alerts deleted: ${stats.deletedDuplicates}`);

	console.log('\n📈 Alerts by Type:');
	Object.entries(stats.alertsByType)
		.sort(([, a], [, b]) => b - a)
		.forEach(([type, count]) => {
			console.log(`├─ ${type}: ${count} alerts`);
		});

	console.log('\n⚠️ Alerts by Level:');
	Object.entries(stats.alertsByLevel)
		.sort(([, a], [, b]) => b - a)
		.forEach(([level, count]) => {
			console.log(`├─ ${level}: ${count} alerts`);
		});

	console.log('\n⏰ Alerts by Hour:');
	Object.entries(stats.alertsByHour)
		.sort(([a], [b]) => parseInt(a) - parseInt(b))
		.forEach(([hour, count]) => {
			const bar = '█'.repeat(Math.min(count / 10, 20));
			console.log(`├─ ${hour}: ${count.toString().padStart(3)} ${bar}`);
		});
}

async function runAlertCleanup() {
	try {
		const stats = await cleanupDuplicateAlerts();
		await displayStats(stats);

		if (stats.deletedDuplicates > 0) {
			console.log(`\n✅ Cleanup completed successfully! Removed ${stats.deletedDuplicates} duplicate alerts.`);
		} else {
			console.log('\n✅ No duplicate alerts found - database is clean!');
		}

		// Recommendations
		console.log('\n💡 Recommendations:');
		if (stats.alertsByType.soilMoisture > 50) {
			console.log('├─ Soil moisture alerts are very frequent - check sensor or increase cooldown');
		}
		if (stats.deletedDuplicates > stats.totalAlerts * 0.3) {
			console.log('├─ High duplicate rate detected - review alert logic and cooldown settings');
		}
		if (Object.values(stats.alertsByHour).some(count => count > 50)) {
			console.log('├─ Some hours have excessive alerts - consider batch alerting');
		}
		console.log('└─ Monitor alert patterns regularly to optimize system performance');

		process.exit(0);

	} catch (error) {
		console.error('❌ Alert cleanup failed:', error);
		process.exit(1);
	}
}

// Run if called directly
if (require.main === module) {
	runAlertCleanup().catch(console.error);
}

export { runAlertCleanup, cleanupDuplicateAlerts };
