// MongoDB initialization script
print('Starting MongoDB initialization...');

// Switch to the greenhouse database
db = db.getSiblingDB('aiot_greenhouse');

// Create collections with indexes
print('Creating collections and indexes...');

// SensorData collection
db.createCollection('sensordatas');
db.sensordatas.createIndex({ timestamp: -1 });
db.sensordatas.createIndex({ createdAt: -1 });

// DeviceStatus collection
db.createCollection('devicestatuses');
db.devicestatuses.createIndex({ deviceId: 1 });
db.devicestatuses.createIndex({ deviceType: 1 });

// Settings collection
db.createCollection('settings');

// Alert collection
db.createCollection('alerts');
db.alerts.createIndex({ timestamp: -1 });
db.alerts.createIndex({ resolved: 1 });
db.alerts.createIndex({ type: 1 });

// Insert default settings
print('Inserting default settings...');
db.settings.insertOne({
	temperatureThreshold: {
		min: 18,
		max: 30
	},
	humidityThreshold: {
		min: 40,
		max: 80
	},
	soilMoistureThreshold: {
		min: 0,
		max: 0  // No threshold - always alert when dry (0)
	},
	waterLevelThreshold: {
		min: 20,
		max: 90
	},
	autoControl: {
		light: true,
		pump: true,
		door: true
	},
	notifications: {
		email: true,
		threshold: true
	},
	createdAt: new Date(),
	updatedAt: new Date()
});

// Insert initial device statuses
print('Inserting initial device statuses...');
db.devicestatuses.insertMany([
	{
		deviceId: 'greenhouse_light',
		deviceType: 'light',
		status: false,
		lastUpdated: new Date(),
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		deviceId: 'greenhouse_pump',
		deviceType: 'pump',
		status: false,
		lastUpdated: new Date(),
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		deviceId: 'greenhouse_door',
		deviceType: 'door',
		status: false,
		lastUpdated: new Date(),
		createdAt: new Date(),
		updatedAt: new Date()
	}
]);

// Insert sample sensor data
print('Inserting sample sensor data...');
const now = new Date();
const sampleData = [];

for (let i = 0; i < 10; i++) {
	const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000)); // Last 10 hours
	sampleData.push({
		timestamp: timestamp,
		temperature: 20 + Math.random() * 15, // 20-35°C
		humidity: 40 + Math.random() * 40, // 40-80%
		soilMoisture: 30 + Math.random() * 40, // 30-70%
		waterLevel: 60 + Math.random() * 30, // 60-90%
		plantHeight: 10 + Math.random() * 20, // 10-30cm
		rainStatus: Math.random() > 0.8, // 20% chance of rain
		createdAt: timestamp,
		updatedAt: timestamp
	});
}

db.sensordatas.insertMany(sampleData);

print('MongoDB initialization completed successfully!');

// Create user for application (if authentication is enabled)
// db.createUser({
//   user: 'greenhouse_user',
//   pwd: 'greenhouse_password',
//   roles: [
//     {
//       role: 'readWrite',
//       db: 'aiot_greenhouse'
//     }
//   ]
// });
