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
 * Format timestamp to UTC+7 ISO string
 */
export const formatVietnamTimestamp = (date?: Date): string => {
	const vietnamTime = date ? new Date(date.getTime() + (7 * 60 * 60 * 1000)) : getVietnamTime();
	return vietnamTime.toISOString();
};

/**
 * Get Vietnam timezone formatted string for display in English
 */
export const getVietnamTimeString = (date?: Date): string => {
	const vietnamTime = date ? new Date(date.getTime() + (7 * 60 * 60 * 1000)) : getVietnamTime();
	return vietnamTime.toLocaleString('en-US', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
		timeZone: 'UTC'
	});
};
