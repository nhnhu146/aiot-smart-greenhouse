
import mqtt from 'mqtt';

const brokerUrl = "ws://broker.hivemq.com:8000/mqtt"; // URL MQTT Broker

const publishMessage = (topic: string, message: string) => {
	const client = mqtt.connect(brokerUrl);
	client.on('connect', () => {
		client.publish(topic, message, (error) => {
			if (error) {
				console.error('Message failed to send:', error);
			} else {
				console.log(`Message sent successfully on topic ${topic}: ${message}`);
			}
			client.end(); // Close the connection
		});
	});
};

export default publishMessage;