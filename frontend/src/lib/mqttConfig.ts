// MQTT Configuration utility
interface MQTTConfig {
	brokerUrl: string;
	username?: string;
	password?: string;
	clientIdPrefix: string;
}

// Default environment-based configuration
const getDefaultMQTTConfig = (): MQTTConfig => ({
	brokerUrl: process.env.NEXT_PUBLIC_MQTT_URL || "mqtt://mqtt.noboroto.id.vn:1883",
	username: process.env.NEXT_PUBLIC_MQTT_USERNAME || "vision",
	password: process.env.NEXT_PUBLIC_MQTT_PASSWORD || "vision",
	clientIdPrefix: "greenhouse_client"
});

// Get MQTT configuration from user settings or fallback to environment
export const getMQTTConfig = (userSettings?: any): MQTTConfig => {
	const defaultConfig = getDefaultMQTTConfig();

	// If user has custom MQTT settings, use them
	if (userSettings?.mqttConfig) {
		return {
			brokerUrl: userSettings.mqttConfig.brokerUrl || defaultConfig.brokerUrl,
			username: userSettings.mqttConfig.username || defaultConfig.username,
			password: userSettings.mqttConfig.password || defaultConfig.password,
			clientIdPrefix: userSettings.mqttConfig.clientId || defaultConfig.clientIdPrefix
		};
	}

	return defaultConfig;
};

// Export for backward compatibility
export { getDefaultMQTTConfig as getDevMQTTConfig };
export { getDefaultMQTTConfig as getProdMQTTConfig };

// Public HiveMQ broker (fallback for testing)
export const getPublicMQTTConfig = (): MQTTConfig => ({
	brokerUrl: "ws://broker.hivemq.com:8000/mqtt",
	clientIdPrefix: "greenhouse_public"
});

export type { MQTTConfig };
