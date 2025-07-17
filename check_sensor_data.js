const { MongoClient } = require('mongodb');

async function checkSensorData() {
	const client = new MongoClient('mongodb://localhost:27017');

	try {
		await client.connect();
		console.log('Connected to MongoDB');

		const db = client.db('greenhouse');
		const collection = db.collection('sensordatas');

		// Count total documents
		const count = await collection.countDocuments();
		console.log(`Total sensor data records: ${count}`);

		if (count > 0) {
			// Get latest 5 records
			const latest = await collection.find()
				.sort({ createdAt: -1 })
				.limit(5)
				.toArray();

			console.log('\nLatest 5 records:');
			latest.forEach((record, index) => {
				console.log(`${index + 1}. Time: ${record.createdAt}, Temp: ${record.temperature}°C, Humidity: ${record.humidity}%, Soil: ${record.soilMoisture}%`);
			});
		} else {
			console.log('No sensor data found. Creating sample data...');

			// Create sample data
			const sampleData = [];
			for (let i = 0; i < 10; i++) {
				const now = new Date();
				const time = new Date(now.getTime() - i * 60 * 60 * 1000); // Hour intervals

				sampleData.push({
					temperature: 20 + Math.random() * 15,
					humidity: 40 + Math.random() * 40,
					soilMoisture: 30 + Math.random() * 40,
					waterLevel: 50 + Math.random() * 30,
					deviceId: 'esp32-greenhouse-01',
					dataQuality: 'complete',
					createdAt: time,
					updatedAt: time
				});
			}

			await collection.insertMany(sampleData);
			console.log('Sample data created successfully!');
		}

	} catch (error) {
		console.error('Error:', error);
	} finally {
		await client.close();
	}
}

checkSensorData();
