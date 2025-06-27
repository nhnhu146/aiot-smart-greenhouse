import mqtt from 'mqtt';
import { getMQTTConfig } from './mqttConfig';

// Get MQTT configuration from environment
const mqttConfig = getMQTTConfig();
const { brokerUrl, username, password, clientIdPrefix } = mqttConfig;

const topics = [
	"greenhouse/sensors/temperature",
	"greenhouse/sensors/humidity",
	"greenhouse/sensors/soil",
	"greenhouse/sensors/water",
	"greenhouse/sensors/light",
	"greenhouse/sensors/rain",
	"greenhouse/devices/light/control",
	"greenhouse/devices/pump/control",
	"greenhouse/devices/door/control",
	"greenhouse/devices/window/control",
	"greenhouse/devices/fan/control"
];

// Connect to MQTT broker with authentication
const client = mqtt.connect(brokerUrl, {
	username: username,
	password: password,
	clientId: `${clientIdPrefix}_${Math.random().toString(16).substr(2, 8)}`,
	keepalive: 60,
	reconnectPeriod: 1000,
	connectTimeout: 30 * 1000,
});

client.on("connect", () => {
	console.log(`✅ Connected to MQTT Broker: ${brokerUrl}`);
	console.log(`🔐 Authenticated as: ${username || 'anonymous'}`);

	topics.forEach(topic => {
		client.subscribe(topic, { qos: 1 }, (err: any) => {
			if (err) {
				console.error(`❌ Failed to subscribe to ${topic}:`, err);
			} else {
				console.log(`📡 Subscribed to topic: ${topic}`);
			}
		});
	});
});

client.on("error", (error) => {
	console.error("❌ MQTT Client error:", error);
});

client.on("offline", () => {
	console.log("⚠️ MQTT Client offline");
});

client.on("reconnect", () => {
	console.log("🔄 MQTT Client reconnecting...");
});

export default client;

