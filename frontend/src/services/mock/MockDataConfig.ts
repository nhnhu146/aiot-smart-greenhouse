/**
 * Configuration service for mock data settings
 * Handles user preferences and localStorage management
 */

export class MockDataConfig {
	private static readonly STORAGE_KEY = 'useMockData';

	/**
	 * Check if mock data is enabled by user setting
	 */
	static isEnabled(): boolean {
		if (typeof localStorage === 'undefined') return false;

		const savedPreference = localStorage.getItem(this.STORAGE_KEY);
		return savedPreference === 'true';
	}

	/**
	 * Enable or disable mock data usage
	 */
	static setEnabled(enabled: boolean): void {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(this.STORAGE_KEY, enabled.toString());
		}
	}

	/**
	 * Clear mock data preference
	 */
	static clear(): void {
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem(this.STORAGE_KEY);
		}
	}
}
