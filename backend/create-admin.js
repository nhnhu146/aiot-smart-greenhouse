// Script to create default admin user in MongoDB
// Run this script with: node create-admin.js

const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/greenhouse';

async function createAdminUser() {
	const client = new MongoClient(MONGODB_URI);

	try {
		await client.connect();
		console.log('Connected to MongoDB');

		const db = client.db();
		const usersCollection = db.collection('users');

		// Check if admin user already exists
		const existingAdmin = await usersCollection.findOne({ email: 'admin@gmail.com' });

		if (!existingAdmin) {
			// Hash the password
			const hashedPassword = await bcrypt.hash('admin', 10);

			// Create admin user
			const adminUser = {
				_id: 'admin-001',
				email: 'admin@gmail.com',
				password: hashedPassword,
				role: 'admin',
				createdAt: new Date(),
				lastLogin: null
			};

			await usersCollection.insertOne(adminUser);
			console.log('✅ Default admin user created successfully');
			console.log('👤 Email: admin@gmail.com');
			console.log('🔐 Password: admin');
		} else {
			console.log('Admin user already exists');
		}

		// Check if test user already exists
		const existingTestUser = await usersCollection.findOne({ email: 'vttu21@clc.fitus.edu.vn' });

		if (!existingTestUser) {
			// Hash the password
			const hashedTestPassword = await bcrypt.hash('vttu21', 10);

			// Create test user
			const testUser = {
				_id: 'test-001',
				email: 'vttu21@clc.fitus.edu.vn',
				password: hashedTestPassword,
				role: 'user',
				createdAt: new Date(),
				lastLogin: null
			};

			await usersCollection.insertOne(testUser);
			console.log('✅ Test user created successfully');
			console.log('👤 Email: vttu21@clc.fitus.edu.vn');
			console.log('🔐 Password: vttu21');
		} else {
			console.log('Test user already exists');
		}

	} catch (error) {
		console.error('Error creating admin user:', error);
	} finally {
		await client.close();
	}
}

createAdminUser();
