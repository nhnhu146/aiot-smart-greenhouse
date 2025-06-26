import mqtt from 'mqtt';

const brokerUrl = "ws://broker.hivemq.com:8000/mqtt"; // URL Mosquitto
const topic = ["HKT_greenhouse/Photonresistor", "HKT_greenhouse/UltraSonic", "HKT_greenhouse/Temperature", "HKT_greenhouse/Humidity", "HKT_greenhouse/RainSensor", "HKT_greenhouse/PIRIn", "HKT_greenhouse/FloatSwitch", "HKT_greenhouse/Moisture"];

const client = mqtt.connect(brokerUrl);

client.on("connect", () => {
  console.log("Connected to Mosquitto Broker");
  for (var i = 0; i < topic.length; ++i) {
    client.subscribe(topic[i], (err) => {
      if (err) {
        console.error("Failed to subscribe:", err);
      } else {
        console.log(`Subscribed to topic: ${topic}`);
      }
    });
  }
});

export default client;

