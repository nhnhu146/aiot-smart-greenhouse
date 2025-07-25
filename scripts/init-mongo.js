// MongoDB Initialization Script for AIOT Smart Greenhouse
// This script creates the initial database structure and admin user

print('Starting MongoDB initialization...');

// Switch to admin database
db = db.getSiblingDB('admin');

// Create admin user if not exists
try {
	const adminUser = db.getUser('admin');
	if (!adminUser) {
		db.createUser({
			user: 'admin',
			pwd: 'admin123',
			roles: [
				{ role: 'userAdminAnyDatabase', db: 'admin' },
				{ role: 'readWriteAnyDatabase', db: 'admin' },
				{ role: 'dbAdminAnyDatabase', db: 'admin' }
			]
		});
		print('✅ Admin user created successfully');
	} else {
		print('ℹ️  Admin user already exists');
	}
} catch (error) {
	print('❌ Error creating admin user:', error);
}

// Switch to greenhouse database
db = db.getSiblingDB('greenhouse');

// Create application user
try {
	db.createUser({
		user: 'greenhouse_user',
		pwd: 'greenhouse123',
		roles: [
			{ role: 'readWrite', db: 'greenhouse' }
		]
	});
	print('✅ Application user created successfully');
} catch (error) {
	print('ℹ️  Application user might already exist or error occurred:', error);
}

// Create collections and sample data
print('Creating collections...');

// Settings collection with default values
db.settings.insertOne({
	_id: 'system',
	temperature: {
		min: 18,
		max: 35,
		unit: 'celsius'
	},
	humidity: {
		min: 40,
		max: 80,
		unit: 'percent'
	},
	light: {
		min: 200,
		max: 1000,
		unit: 'lux'
	},
	notifications: {
		email: true,
		push: true,
		alerts: true
	},
	createdAt: new Date(),
	updatedAt: new Date()
});

// Device status collection
db.devicestatus.insertOne({
	deviceId: 'greenhouse_main',
	sensors: {
		temperature: { value: 25, unit: 'celsius', timestamp: new Date() },
		humidity: { value: 60, unit: 'percent', timestamp: new Date() },
		light: { value: 500, unit: 'lux', timestamp: new Date() }
	},
	actuators: {
		fan: false,
		pump: false,
		heater: false,
		lights: false
	},
	status: 'online',
	lastUpdate: new Date()
});

print('✅ Database initialization completed successfully');
print('Database: greenhouse');
print('Collections created: settings, devicestatus');
print('Default admin user: admin/admin123');
print('App user: greenhouse_user/greenhouse123');
