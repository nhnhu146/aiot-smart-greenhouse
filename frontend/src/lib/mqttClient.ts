import mqtt from 'mqtt';

const brokerUrl = "ws://broker.hivemq.com:8000/mqtt"; // URL Mosquitto
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

const client = mqtt.connect(brokerUrl);

client.on("connect", () => {
	console.log("Connected to MQTT Broker");
	topics.forEach(topic => {
		client.subscribe(topic, (err: any) => {
			if (err) {
				console.error(`Failed to subscribe to ${topic}:`, err);
			} else {
				console.log(`Subscribed to topic: ${topic}`);
			}
		});
	});
});

export default client;

