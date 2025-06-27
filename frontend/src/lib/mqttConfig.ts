// MQTT Configuration utility
interface MQTTConfig {
	brokerUrl: string;
	username?: string;
	password?: string;
	clientIdPrefix: string;
}

// Development configuration - reads from environment variables
const getDevMQTTConfig = (): MQTTConfig => ({
	brokerUrl: process.env.NEXT_PUBLIC_MQTT_URL || "mqtt://mqtt.noboroto.id.vn:1883",
	username: process.env.NEXT_PUBLIC_MQTT_USERNAME || "vision",
	password: process.env.NEXT_PUBLIC_MQTT_PASSWORD || "vision",
	clientIdPrefix: "greenhouse_dev"
});

// Production configuration - reads from environment variables
const getProdMQTTConfig = (): MQTTConfig => ({
	brokerUrl: process.env.NEXT_PUBLIC_MQTT_URL || "mqtt://mqtt.noboroto.id.vn:1883",
	username: process.env.NEXT_PUBLIC_MQTT_USERNAME || "vision",
	password: process.env.NEXT_PUBLIC_MQTT_PASSWORD || "vision",
	clientIdPrefix: "greenhouse_prod"
});

// Public HiveMQ broker (fallback for testing)
const getPublicMQTTConfig = (): MQTTConfig => ({
	brokerUrl: "ws://broker.hivemq.com:8000/mqtt",
	clientIdPrefix: "greenhouse_public"
});

// Get current MQTT configuration based on environment
export const getMQTTConfig = (): MQTTConfig => {
	const env = process.env.NODE_ENV || 'development';

	switch (env) {
		case 'production':
			return getProdMQTTConfig();
		case 'development':
		default:
			return getDevMQTTConfig();
	}
};

// Export configuration objects for specific use cases
export { getDevMQTTConfig, getProdMQTTConfig, getPublicMQTTConfig };
export type { MQTTConfig };
