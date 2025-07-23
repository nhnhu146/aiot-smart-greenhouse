#!/usr/bin/env node

/**
 * Data Merger Tool - Server-side TypeScript implementation
 * Merge duplicate sensor data with same timestamps on Docker server
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import { DataMergerService } from '../services/DataMergerService';
import { DatabaseService } from '../services/DatabaseService';

async function runDataMerger() {
	console.log('🔄 Starting Data Merger Service...');

	try {
		// Connect to database
		const dbService = DatabaseService.getInstance();
		await dbService.connect();
		console.log('✅ Database connected successfully');

		// Initialize Data Merger Service
		const mergerService = DataMergerService.getInstance();

		// Run merge operation
		console.log('🔄 Running timestamp merge operation...');
		const stats = await mergerService.mergeSameTimestampData();

		// Display results
		console.log('\n📊 Merge Results:');
		console.log(`├─ Total duplicate groups found: ${stats.totalDuplicates}`);
		console.log(`├─ Groups processed: ${stats.processedGroups}`);
		console.log(`├─ Records merged: ${stats.mergedRecords}`);
		console.log(`└─ Records deleted: ${stats.deletedRecords}`);

		if (stats.processedGroups > 0) {
			console.log('\n✅ Data merge completed successfully!');
		} else {
			console.log('\n✅ No duplicate timestamps found - database is clean!');
		}

		process.exit(0);

	} catch (error) {
		console.error('❌ Error in data merger:', error);
		process.exit(1);
	}
}

// Run if called directly
if (require.main === module) {
	runDataMerger().catch(console.error);
}

export { runDataMerger };
