// Browser compatibility and error suppression utilities

/**
 * Suppress common browser extension errors that don't affect our application
 */
export const suppressBrowserExtensionErrors = () => {
	// Suppress the common Chrome extension error
	const originalErrorHandler = window.onerror;

	window.onerror = (message, source, lineno, colno, error) => {
		// Ignore Chrome extension runtime errors
		if (typeof message === 'string' && (
			message.includes('Unchecked runtime.lastError') ||
			message.includes('Could not establish connection') ||
			message.includes('Receiving end does not exist') ||
			source?.includes('extension')
		)) {
			return true; // Suppress the error
		}

		// Call original error handler for real errors
		if (originalErrorHandler) {
			return originalErrorHandler(message, source, lineno, colno, error);
		}

		return false;
	};
};

/**
 * Initialize browser compatibility features
 */
export const initBrowserCompatibility = () => {
	suppressBrowserExtensionErrors();

	// Add console warning suppression for development
	if (import.meta.env.MODE === 'development') {
		const originalConsoleWarn = console.warn;
		console.warn = (...args) => {
			const message = args.join(' ');
			// Suppress Chrome extension warnings
			if (message.includes('runtime.lastError') ||
				message.includes('extension') ||
				message.includes('Could not establish connection')) {
				return;
			}
			originalConsoleWarn.apply(console, args);
		};
	}
};
