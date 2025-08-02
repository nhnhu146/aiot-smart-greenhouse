/**
 * Notification Service - Re-export from modular implementation
 * Maintains backward compatibility while using focused modules
 */

// Re-export everything from the new modular structure
export { notificationService, type AlertData } from './notification';

// Default export for backward compatibility
export { notificationService as default } from './notification';
