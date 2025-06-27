
import mqtt from 'mqtt';
import { getMQTTConfig } from '@/lib/mqttConfig';

const publishMessage = (topic: string, message: string) => {
	// Get MQTT configuration from environment
	const mqttConfig = getMQTTConfig();
	const { brokerUrl, username, password, clientIdPrefix } = mqttConfig;

	const client = mqtt.connect(brokerUrl, {
		username: username,
		password: password,
		clientId: `${clientIdPrefix}_pub_${Math.random().toString(16).substr(2, 8)}`,
		keepalive: 60,
		connectTimeout: 30 * 1000,
	});

	client.on('connect', () => {
		console.log(`✅ Connected to MQTT Broker for publishing: ${brokerUrl}`);
		client.publish(topic, message, { qos: 1 }, (error) => {
			if (error) {
				console.error('❌ Message failed to send:', error);
			} else {
				console.log(`📤 Message sent successfully on topic ${topic}: ${message}`);
			}
			client.end(); // Close the connection
		});
	});

	client.on('error', (error) => {
		console.error('❌ MQTT Publisher error:', error);
		client.end();
	});
};

export default publishMessage;