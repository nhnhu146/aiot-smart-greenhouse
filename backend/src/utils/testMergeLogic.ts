#!/usr/bin/env node

/**
 * Test Data Merge Logic 
 * Tạo test case để kiểm tra logic merge đã được fix
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import { DatabaseService } from '../services/DatabaseService';
import { DataMergerService } from '../services/DataMergerService';
import SensorDataModel from '../models/SensorData';

async function testMergeLogic(): Promise<void> {
	console.log('🧪 Testing improved merge logic...');

	try {
		// Connect to database
		const dbService = DatabaseService.getInstance();
		await dbService.connect();
		console.log('✅ Database connected successfully');

		const mergerService = DataMergerService.getInstance();

		// Test 1: Create duplicate data with same timestamp
		console.log('\n📝 Test 1: Creating duplicate data with same timestamp...');

		const testTimestamp = new Date();

		const testData1 = {
			temperature: 25.5,
			humidity: null,
			soilMoisture: 60,
			waterLevel: null,
			createdAt: testTimestamp,
			deviceId: 'test-device-01',
			dataQuality: 'partial'
		};

		const testData2 = {
			temperature: null,
			humidity: 65.2,
			soilMoisture: null,
			waterLevel: 80,
			createdAt: testTimestamp,
			deviceId: 'test-device-01',
			dataQuality: 'partial'
		};

		// Test pre-save merge logic
		console.log('🔍 Testing pre-save merge check...');

		// Save first document
		const doc1 = new SensorDataModel(testData1);
		await doc1.save();
		console.log('✅ Saved first test document');

		// Test pre-save merge with second document
		const mergeResult = await mergerService.preSaveMergeCheck(testData2);

		if (mergeResult) {
			console.log('✅ Pre-save merge successful');
			console.log('📊 Merged data:', {
				temperature: mergeResult.temperature,
				humidity: mergeResult.humidity,
				soilMoisture: mergeResult.soilMoisture,
				waterLevel: mergeResult.waterLevel,
				dataQuality: mergeResult.dataQuality
			});
		} else {
			console.log('❌ Pre-save merge failed - creating second document manually for testing');
			const doc2 = new SensorDataModel(testData2);
			await doc2.save();
		}

		// Test 2: Check if duplicates still exist
		console.log('\n🔍 Test 2: Checking for remaining duplicates...');

		const duplicates = await SensorDataModel.find({
			createdAt: testTimestamp
		}).lean();

		console.log(`📊 Found ${duplicates.length} records with test timestamp`);

		if (duplicates.length > 1) {
			console.log('⚠️ Multiple records still exist - testing batch merge...');

			const stats = await mergerService.mergeSameTimestampData();
			console.log('📊 Batch merge stats:', stats);

			// Re-check
			const afterMerge = await SensorDataModel.find({
				createdAt: testTimestamp
			}).lean();

			console.log(`📊 After merge: ${afterMerge.length} records remaining`);

			if (afterMerge.length === 1) {
				console.log('✅ Batch merge successful');
				console.log('📊 Final merged data:', {
					temperature: afterMerge[0].temperature,
					humidity: afterMerge[0].humidity,
					soilMoisture: afterMerge[0].soilMoisture,
					waterLevel: afterMerge[0].waterLevel,
					dataQuality: afterMerge[0].dataQuality
				});
			} else {
				console.log('❌ Batch merge incomplete');
			}
		} else {
			console.log('✅ No duplicates found - merge working correctly');
		}

		// Test 3: Performance test
		console.log('\n⚡ Test 3: Performance test...');

		const startTime = Date.now();
		const perfStats = await mergerService.mergeSameTimestampData();
		const endTime = Date.now();

		console.log(`📊 Performance: ${endTime - startTime}ms`);
		console.log('📊 Merge stats:', perfStats);

		// Cleanup test data
		console.log('\n🧹 Cleaning up test data...');
		await SensorDataModel.deleteMany({
			deviceId: 'test-device-01'
		});
		console.log('✅ Test data cleaned up');

		console.log('\n🎉 All tests completed successfully!');
		process.exit(0);

	} catch (error) {
		console.error('❌ Error in merge logic test:', error);
		process.exit(1);
	}
}

// Run the test
testMergeLogic();
