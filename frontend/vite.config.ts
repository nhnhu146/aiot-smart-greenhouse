import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		port: 3000,
		host: true,
		watch: {
			usePolling: true
		}
	},
	preview: {
		port: 3000,
		host: true
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, './src')
		}
	},
	define: {
		'process.env': process.env
	}
})
