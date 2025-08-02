import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/globals.scss'
import { WebSocketProvider } from './contexts/WebSocketContext'
import { AutomationProvider } from './contexts/AutomationContext'
import authService from './lib/authService'

// Layout components
import AuthLayout from './layouts/AuthLayout'
import DefaultLayout from './layouts/DefaultLayout'

// Auth pages
import LandingPage from './pages/auth/LandingPage'
import SignInPage from './pages/auth/SignInPage'
import SignUpPage from './pages/auth/SignUpPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'

// Dashboard pages
import DashboardPage from './pages/DashboardPage'
import HistoryPage from './pages/HistoryPage'
import AutoModePage from './pages/AutoModePage'
import SettingsPage from './pages/default/SettingsPage'
import ExamplesPage from './pages/default/ExamplesPage'

// Root redirect component
const RootRedirect: React.FC = () => {
	const isAuthenticated = authService.isAuthenticated()

	if (isAuthenticated) {
		return <Navigate to="/dashboard" replace />
	} else {
		return <Navigate to="/landing" replace />
	}
}

function App() {
	return (
		<Router>
			<WebSocketProvider>
				<AutomationProvider>
					<Routes>
						{/* Root redirect */}
						<Route path="/" element={<RootRedirect />} />

						{/* Auth routes */}
						<Route path="/landing" element={<AuthLayout><LandingPage /></AuthLayout>} />
						<Route path="/signin" element={<AuthLayout><SignInPage /></AuthLayout>} />
						<Route path="/signup" element={<AuthLayout><SignUpPage /></AuthLayout>} />
						<Route path="/forgot-password" element={<AuthLayout><ForgotPasswordPage /></AuthLayout>} />
						<Route path="/reset-password" element={<AuthLayout><ResetPasswordPage /></AuthLayout>} />

						{/* Protected routes */}
						<Route path="/dashboard" element={<DefaultLayout><DashboardPage /></DefaultLayout>} />
						<Route path="/history" element={<DefaultLayout><HistoryPage /></DefaultLayout>} />
						<Route path="/automode" element={<DefaultLayout><AutoModePage /></DefaultLayout>} />
						<Route path="/settings" element={<DefaultLayout><SettingsPage /></DefaultLayout>} />
						<Route path="/examples" element={<DefaultLayout><ExamplesPage /></DefaultLayout>} />

						{/* Catch all - redirect to home */}
						<Route path="*" element={<Navigate to="/" replace />} />
					</Routes>
				</AutomationProvider>
			</WebSocketProvider>
		</Router>
	)
}

export default App
