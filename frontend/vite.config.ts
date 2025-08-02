import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
			'@': '/src'
		}
	},
	css: {
		preprocessorOptions: {
			scss: {
				api: 'modern-compiler' // Use modern SASS API
			}
		}
	},
	build: {
		rollupOptions: {
			external: [],
			output: {
				manualChunks: undefined
			}
		},
		// Ensure date-fns is properly bundled
		commonjsOptions: {
			include: [/date-fns/, /node_modules/]
		}
	}
})
