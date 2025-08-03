// Utility functions for UTC+7 timezone handling

/**
 * Get current time in UTC+7 (Vietnam timezone)
 */
export const getVietnamTime = (): Date => {
	const now = new Date();
	// Add 7 hours for UTC+7
	return new Date(now.getTime() + (7 * 60 * 60 * 1000));
};

/**
 * Format timestamp to UTC+7 for CSV export (readable format)
 */
export const formatVietnamTimestamp = (date?: Date): string => {
	const inputDate = date || new Date();
	// Convert to Vietnam timezone by adding 7 hours
	const vietnamTime = new Date(inputDate.getTime() + (7 * 60 * 60 * 1000));

	// Format as YYYY-MM-DD HH:mm:ss (UTC+7)
	const year = vietnamTime.getUTCFullYear();
	const month = String(vietnamTime.getUTCMonth() + 1).padStart(2, '0');
	const day = String(vietnamTime.getUTCDate()).padStart(2, '0');
	const hours = String(vietnamTime.getUTCHours()).padStart(2, '0');
	const minutes = String(vietnamTime.getUTCMinutes()).padStart(2, '0');
	const seconds = String(vietnamTime.getUTCSeconds()).padStart(2, '0');

	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Get Vietnam timezone formatted string for display in English
 */
export const getVietnamTimeString = (date?: Date): string => {
	const inputDate = date || new Date();
	// Convert to Vietnam timezone by adding 7 hours
	const vietnamTime = new Date(inputDate.getTime() + (7 * 60 * 60 * 1000));

	// Format as readable string in English format
	return vietnamTime.toLocaleString('en-US', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
		timeZone: 'UTC'
	}) + ' (UTC+7)';
};

/**
 * Format timestamp for JSON export (ISO format with UTC+7 indicator)
 */
export const formatVietnamTimestampISO = (date?: Date): string => {
	const inputDate = date || new Date();
	// Convert to Vietnam timezone by adding 7 hours
	const vietnamTime = new Date(inputDate.getTime() + (7 * 60 * 60 * 1000));

	// Return ISO string with +07:00 timezone indicator
	return vietnamTime.toISOString().replace('Z', '+07:00');
};
