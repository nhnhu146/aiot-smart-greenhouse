// -*- coding: utf-8 -*-

/**
 * Error Handling Service
 * Provides intelligent error handling with user-friendly notifications
 * Prevents error spam and provides contextual feedback
 */

interface ErrorContext {
	source: 'api' | 'websocket' | 'validation' | 'system';
	endpoint?: string;
	operation?: string;
	timestamp: string;
}

interface ErrorEntry {
	message: string;
	context: ErrorContext;
	count: number;
	lastOccurrence: string;
	suppressUntil?: string;
}

export class ErrorHandlingService {
	private errorLog: Map<string, ErrorEntry> = new Map();
	private suppressionDuration = 30000; // 30 seconds
	private maxErrorsPerEndpoint = 3; // Before suppression
	private userNotificationCallback?: (message: string, variant: 'error' | 'warning' | 'info') => void;

	/**
	 * Initialize error handling with notification callback
	 */
	initialize(notificationCallback: (message: string, variant: 'error' | 'warning' | 'info') => void) {
		this.userNotificationCallback = notificationCallback;
	}

	/**
	 * Handle and potentially display an error
	 */
	handleError(error: any, context: ErrorContext): boolean {
		const errorMessage = this.extractErrorMessage(error);
		const errorKey = this.generateErrorKey(errorMessage, context);
		const now = new Date().toISOString();

		// Check if error should be suppressed
		if (this.shouldSuppressError(errorKey, now)) {
			// Update count but don't show notification
			const entry = this.errorLog.get(errorKey);
			if (entry) {
				entry.count++;
				entry.lastOccurrence = now;
			}
			return false; // Error was suppressed
		}

		// Record or update error entry
		const existingEntry = this.errorLog.get(errorKey);
		if (existingEntry) {
			existingEntry.count++;
			existingEntry.lastOccurrence = now;

			// Check if we should start suppressing
			if (existingEntry.count >= this.maxErrorsPerEndpoint) {
				existingEntry.suppressUntil = new Date(Date.now() + this.suppressionDuration).toISOString();
				this.showUserNotification(
					`Multiple errors occurred. Notifications suppressed for 30s.`,
					'warning'
				);
				return true; // Error was shown but now suppressed
			}
		} else {
			this.errorLog.set(errorKey, {
				message: errorMessage,
				context,
				count: 1,
				lastOccurrence: now
			});
		}

		// Show user-friendly notification
		const userMessage = this.createUserFriendlyMessage(errorMessage, context);
		this.showUserNotification(userMessage, 'error');

		// Clean up old entries periodically
		this.cleanupOldEntries();

		return true; // Error was shown
	}

	/**
	 * Extract meaningful error message from various error types
	 */
	private extractErrorMessage(error: any): string {
		if (typeof error === 'string') {
			return error;
		}

		if (error instanceof Error) {
			return error.message;
		}

		if (error?.message) {
			return error.message;
		}

		if (error?.error?.message) {
			return error.error.message;
		}

		return 'An unexpected error occurred';
	}

	/**
	 * Generate unique key for error tracking
	 */
	private generateErrorKey(message: string, context: ErrorContext): string {
		const contextKey = context.endpoint || context.operation || context.source;
		return `${context.source}:${contextKey}:${message.substring(0, 50)}`;
	}

	/**
	 * Check if error should be suppressed
	 */
	private shouldSuppressError(errorKey: string, currentTime: string): boolean {
		const entry = this.errorLog.get(errorKey);
		if (!entry || !entry.suppressUntil) {
			return false;
		}

		return currentTime < entry.suppressUntil;
	}

	/**
	 * Create user-friendly error messages based on context
	 */
	private createUserFriendlyMessage(errorMessage: string, context: ErrorContext): string {
		// Filter out technical jargon and provide helpful context
		const lowerMessage = errorMessage.toLowerCase();

		if (context.source === 'api') {
			if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
				return 'Connection issue. Please check your network.';
			}
			if (lowerMessage.includes('unauthorized') || lowerMessage.includes('401')) {
				return 'Session expired. Please sign in again.';
			}
			if (lowerMessage.includes('forbidden') || lowerMessage.includes('403')) {
				return 'Access denied. Please check your permissions.';
			}
			if (lowerMessage.includes('not found') || lowerMessage.includes('404')) {
				return 'Requested resource not found.';
			}
			if (lowerMessage.includes('server') || lowerMessage.includes('500')) {
				return 'Server error. Please try again later.';
			}
		}

		if (context.source === 'websocket') {
			if (lowerMessage.includes('connection') || lowerMessage.includes('disconnect')) {
				return 'Real-time connection interrupted. Reconnecting...';
			}
		}

		if (context.source === 'validation') {
			return `Validation error: ${errorMessage}`;
		}

		// For unknown errors, provide generic but helpful message
		if (errorMessage.length > 100) {
			return 'An error occurred. Please try again or contact support.';
		}

		return errorMessage;
	}

	/**
	 * Show notification to user if callback is available
	 */
	private showUserNotification(message: string, variant: 'error' | 'warning' | 'info') {
		if (this.userNotificationCallback) {
			this.userNotificationCallback(message, variant);
		} else {
			console.error('Error notification:', message);
		}
	}

	/**
	 * Clean up old error entries to prevent memory leaks
	 */
	private cleanupOldEntries() {
		const maxAge = 5 * 60 * 1000; // 5 minutes
		const cutoff = new Date(Date.now() - maxAge).toISOString();

		for (const [key, entry] of this.errorLog.entries()) {
			if (entry.lastOccurrence < cutoff) {
				this.errorLog.delete(key);
			}
		}
	}

	/**
	 * Get error statistics for debugging
	 */
	getErrorStats() {
		const stats = {
			totalUniqueErrors: this.errorLog.size,
			suppressedErrors: 0,
			totalErrorCount: 0,
			errorsBySource: {} as Record<string, number>
		};

		for (const entry of this.errorLog.values()) {
			stats.totalErrorCount += entry.count;
			
			if (entry.suppressUntil && entry.suppressUntil > new Date().toISOString()) {
				stats.suppressedErrors++;
			}

			const source = entry.context.source;
			stats.errorsBySource[source] = (stats.errorsBySource[source] || 0) + entry.count;
		}

		return stats;
	}

	/**
	 * Clear all error history
	 */
	clearErrorHistory() {
		this.errorLog.clear();
	}

	/**
	 * Check if specific error type is currently suppressed
	 */
	isErrorSuppressed(error: any, context: ErrorContext): boolean {
		const errorMessage = this.extractErrorMessage(error);
		const errorKey = this.generateErrorKey(errorMessage, context);
		return this.shouldSuppressError(errorKey, new Date().toISOString());
	}
}

// Export singleton instance
export const errorHandlingService = new ErrorHandlingService();
export default errorHandlingService;