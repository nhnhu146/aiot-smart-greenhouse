/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_URL: string
	readonly VITE_MQTT_URL: string
	readonly VITE_MQTT_USERNAME: string
	readonly VITE_MQTT_PASSWORD: string
	readonly VITE_SERVER_URL: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
