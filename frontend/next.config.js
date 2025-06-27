/** @type {import('next').NextConfig} */
const nextConfig = {
	output: 'standalone',
	experimental: {
		outputFileTracingRoot: undefined,
	},
	env: {
		// Make environment variables available to the client
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
		NEXT_PUBLIC_MQTT_URL: process.env.NEXT_PUBLIC_MQTT_URL,
		NEXT_PUBLIC_MQTT_USERNAME: process.env.NEXT_PUBLIC_MQTT_USERNAME,
		NEXT_PUBLIC_MQTT_PASSWORD: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
	},
	async redirects() {
		return [
			{
				source: '/',
				destination: '/landing',
				permanent: true,
			},
		]
	},
}

module.exports = nextConfig