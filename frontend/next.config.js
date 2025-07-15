/** @type {import('next').NextConfig} */
const nextConfig = {
	// Enable standalone output for Docker
	output: 'standalone',
	trailingSlash: true,
	images: {
		unoptimized: true
	},
	eslint: {
		ignoreDuringBuilds: false,
	},
	typescript: {
		ignoreBuildErrors: false,
	},
	// Disable static generation to fix useContext issues
	experimental: {
		esmExternals: true,
	},
	compiler: {
		removeConsole: process.env.NODE_ENV === 'production',
	},
	// Ignore HTML import errors for custom error pages
	webpack: (config, { dev, isServer }) => {
		if (!dev && !isServer) {
			// Ignore specific warnings about Html imports
			config.ignoreWarnings = [
				{
					module: /Html/,
				},
			];
		}
		return config;
	},
};

module.exports = nextConfig;
