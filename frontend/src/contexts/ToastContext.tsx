import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { AppConstants } from '../config/AppConfig';

interface ToastMessage {
	id: string;
	message: string;
	variant: 'success' | 'error' | 'warning' | 'info';
	duration?: number;
}

interface ToastContextType {
  messages: ToastMessage[];
  showToast: (message: string, variant?: ToastMessage['variant'], duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
	children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
	const [toasts, setToasts] = useState<ToastMessage[]>([]);

	const generateId = () => Math.random().toString(36).substr(2, 9);

	const removeToast = (id: string) => {
		setToasts(prev => prev.filter(toast => toast.id !== id));
	};

	const showToast = useCallback((message: string, variant: ToastMessage['variant'] = 'info', duration?: number) => {
		const finalDuration = duration ?? AppConstants.UI.TOAST_DURATION_INFO;
		const id = generateId();
		const newToast: ToastMessage = { id, message, variant, duration: finalDuration };

		setToasts(prev => [...prev, newToast]);

		// Auto-remove toast after duration
		if (finalDuration > 0) {
			setTimeout(() => {
				removeToast(id);
			}, finalDuration);
		}
	}, []);

	// WebSocket error handler
	useEffect(() => {
		const handleWebSocketError = (event: Event) => {
			const customEvent = event as CustomEvent;
			const { message, type } = customEvent.detail;
			showToast(message, type || 'warning', AppConstants.UI.TOAST_DURATION_WARNING);
		};

		window.addEventListener('websocket:error', handleWebSocketError);
		
		return () => {
			window.removeEventListener('websocket:error', handleWebSocketError);
		};
	}, [showToast]);

	const showError = (message: string, duration?: number) => showToast(message, 'error', duration);
	const showSuccess = (message: string, duration?: number) => showToast(message, 'success', duration); 
	const showWarning = (message: string, duration?: number) => showToast(message, 'warning', duration);
	const showInfo = (message: string, duration?: number) => showToast(message, 'info', duration);

	const getVariantClass = (variant: ToastMessage['variant']) => {
		switch (variant) {
			case 'success': return 'bg-success text-white';
			case 'error': return 'bg-danger text-white';
			case 'warning': return 'bg-warning text-dark';
			case 'info': return 'bg-info text-white';
			default: return 'bg-light text-dark';
		}
	};

	const getVariantIcon = (variant: ToastMessage['variant']) => {
		switch (variant) {
			case 'success': return '✅';
			case 'error': return '❌';
			case 'warning': return '⚠️';
			case 'info': return 'ℹ️';
			default: return '📢';
		}
	};



	const clearToasts = () => {
		setToasts([]);
	};

	const contextValue: ToastContextType = {
		messages: toasts,
		showToast,
		showError,
		showSuccess,
		showWarning,
		showInfo,
		clearToasts
	};

	return (
		<ToastContext.Provider value={contextValue}>
			{children}

			{/* Toast Container - positioned at top-right, non-intrusive */}
			<ToastContainer
				position="top-end"
				className="p-3"
				style={{
					zIndex: 9999,
					maxWidth: '350px'
				}}
			>
				{toasts.map((toast) => (
					<Toast
						key={toast.id}
						onClose={() => removeToast(toast.id)}
						className={`${getVariantClass(toast.variant)} border-0 shadow-sm mb-2`}
						style={{
							minWidth: '280px',
							fontSize: '0.9rem'
						}}
					>
						<Toast.Header className={`${getVariantClass(toast.variant)} border-0`}>
							<span className="me-2">{getVariantIcon(toast.variant)}</span>
							<strong className="me-auto">System Notification</strong>
							<small>now</small>
						</Toast.Header>
						<Toast.Body className="py-2">
							{toast.message}
						</Toast.Body>
					</Toast>
				))}
			</ToastContainer>
		</ToastContext.Provider>
	);
};

export const useToast = (): ToastContextType => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error('useToast must be used within a ToastProvider');
	}
	return context;
};

export default ToastProvider;
