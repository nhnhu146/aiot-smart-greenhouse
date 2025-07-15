const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

async function createAdmin() {
	try {
		await mongoose.connect('mongodb://greenhouse_user:greenhouse_password@aiot_greenhouse_db:27017/aiot_greenhouse?authSource=admin');

		const UserSchema = new mongoose.Schema({
			username: { type: String, required: true, unique: true },
			email: { type: String, required: true, unique: true },
			password: { type: String, required: true },
			role: { type: String, enum: ['user', 'admin'], default: 'user' },
			isActive: { type: Boolean, default: true },
			createdAt: { type: Date, default: Date.now }
		});

		const User = mongoose.model('User', UserSchema);

		// Create admin user
		const hashedAdminPassword = await bcrypt.hash('admin', 10);

		const admin = new User({
			username: 'admin',
			email: 'admin@gmail.com',
			password: hashedAdminPassword,
			role: 'admin',
			isActive: true
		});

		// Create test user
		const hashedTestPassword = await bcrypt.hash('vttu21', 10);

		const testUser = new User({
			username: 'vttu21',
			email: 'vttu21@clc.fitus.edu.vn',
			password: hashedTestPassword,
			role: 'user',
			isActive: true
		});

		try {
			await admin.save();
			console.log('✅ Admin user created successfully');
			console.log('📧 Email: admin@gmail.com');
			console.log('🔑 Password: admin');
		} catch (error) {
			if (error.code === 11000) {
				console.log('ℹ️ Admin user already exists');
			} else {
				throw error;
			}
		}

		try {
			await testUser.save();
			console.log('✅ Test user created successfully');
			console.log('📧 Email: vttu21@clc.fitus.edu.vn');
			console.log('🔑 Password: vttu21');
		} catch (error) {
			if (error.code === 11000) {
				console.log('ℹ️ Test user already exists');
			} else {
				throw error;
			}
		}

	} catch (error) {
		if (error.code === 11000) {
			console.log('ℹ️ Admin user already exists');
		} else {
			console.error('❌ Error:', error.message);
		}
	} finally {
		await mongoose.disconnect();
	}
}

createAdmin();
