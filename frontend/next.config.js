/** @type {import('next').NextConfig} */
const nextConfig = {
	output: 'standalone',
	experimental: {
		outputFileTracingRoot: undefined,
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