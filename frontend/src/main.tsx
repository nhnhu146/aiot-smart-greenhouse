import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { initBrowserCompatibility } from './utils/browserCompatibility'
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/globals.scss'

// Initialize browser compatibility features
initBrowserCompatibility();

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
)
