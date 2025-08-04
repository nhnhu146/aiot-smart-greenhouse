import { FilterState, SortState, PaginationInfo } from '@/types/history';

interface CacheEntry {
	data: any;
	timestamp: number;
	pagination?: PaginationInfo;
}

/**
 * Centralized request manager for History API calls
 * Provides debouncing, caching, and request cancellation
 */
export class HistoryRequestManager {
	private static instance: HistoryRequestManager;
	private cache = new Map<string, CacheEntry>();
	private pendingRequests = new Map<string, Promise<any>>();
	private requestTimers = new Map<string, ReturnType<typeof setTimeout>>();
	private abortControllers = new Map<string, AbortController>();

	// Configuration
	private readonly DEBOUNCE_DELAY = 800; // 800ms debounce
	private readonly CACHE_TTL = 60000; // 1 minute cache
	private readonly MAX_CACHE_SIZE = 50;

	private constructor() {}

	static getInstance(): HistoryRequestManager {
		if (!HistoryRequestManager.instance) {
			HistoryRequestManager.instance = new HistoryRequestManager();
		}
		return HistoryRequestManager.instance;
	}

	/**
	 * Generate cache key from request parameters
	 */
	private generateCacheKey(endpoint: string, params: Record<string, any>): string {
		const sortedParams = Object.keys(params)
			.sort()
			.reduce((acc, key) => {
				acc[key] = params[key];
				return acc;
			}, {} as Record<string, any>);
		
		return `${endpoint}:${JSON.stringify(sortedParams)}`;
	}

	/**
	 * Clean expired cache entries
	 */
	private cleanCache(): void {
		const now = Date.now();
		for (const [key, entry] of this.cache.entries()) {
			if (now - entry.timestamp > this.CACHE_TTL) {
				this.cache.delete(key);
			}
		}

		// Limit cache size
		if (this.cache.size > this.MAX_CACHE_SIZE) {
			const sortedEntries = Array.from(this.cache.entries())
				.sort((a, b) => a[1].timestamp - b[1].timestamp);
			
			const toDelete = sortedEntries.slice(0, this.cache.size - this.MAX_CACHE_SIZE);
			toDelete.forEach(([key]) => this.cache.delete(key));
		}
	}

	/**
	 * Get cached data if available and not expired
	 */
	private getCachedData(cacheKey: string): CacheEntry | null {
		const cached = this.cache.get(cacheKey);
		if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
			return cached;
		}
		if (cached) {
			this.cache.delete(cacheKey);
		}
		return null;
	}

	/**
	 * Cancel pending request for a specific cache key
	 */
	private cancelPendingRequest(cacheKey: string): void {
		// Cancel existing timer
		const existingTimer = this.requestTimers.get(cacheKey);
		if (existingTimer) {
			clearTimeout(existingTimer);
			this.requestTimers.delete(cacheKey);
		}

		// Cancel existing request
		const existingController = this.abortControllers.get(cacheKey);
		if (existingController) {
			existingController.abort();
			this.abortControllers.delete(cacheKey);
		}

		// Remove pending request promise
		this.pendingRequests.delete(cacheKey);
	}

	/**
	 * Make optimized API request with debouncing and caching
	 */
	async makeRequest<T>(
		apiCall: (params: Record<string, any>) => Promise<T>,
		endpoint: string,
		params: Record<string, any>
	): Promise<T> {
		const cacheKey = this.generateCacheKey(endpoint, params);

		// Check cache first
		const cached = this.getCachedData(cacheKey);
		if (cached) {
			console.log(`📦 Cache hit for ${endpoint}`);
			return cached.data;
		}

		// Return existing pending request if available
		const existingRequest = this.pendingRequests.get(cacheKey);
		if (existingRequest) {
			console.log(`⏳ Returning existing request for ${endpoint}`);
			return existingRequest;
		}

		// Cancel any previous request for this key
		this.cancelPendingRequest(cacheKey);

		// Create debounced request
		return new Promise<T>((resolve, reject) => {
			const timer = setTimeout(async () => {
				try {
					console.log(`🚀 Making API request to ${endpoint}`);
					const requestPromise = apiCall(params);
					this.pendingRequests.set(cacheKey, requestPromise);

					const result = await requestPromise;

					// Cache the result
					this.cache.set(cacheKey, {
						data: result,
						timestamp: Date.now()
					});

					// Clean up
					this.pendingRequests.delete(cacheKey);
					this.requestTimers.delete(cacheKey);

					// Clean cache periodically
					this.cleanCache();

					resolve(result);
				} catch (error: any) {
					// Clean up on error
					this.pendingRequests.delete(cacheKey);
					this.requestTimers.delete(cacheKey);

					console.error(`❌ Request failed for ${endpoint}:`, error);
					reject(error);
				}
			}, this.DEBOUNCE_DELAY);

			this.requestTimers.set(cacheKey, timer);
		});
	}

	/**
	 * Build standardized API parameters for history requests
	 */
	buildHistoryParams(
		filters: FilterState,
		sort: SortState,
		pagination: PaginationInfo,
		extraFilters: Record<string, any> = {}
	): Record<string, any> {
		const params: Record<string, any> = {
			page: pagination.page,
			limit: pagination.limit,
			sortBy: sort.field,
			sortOrder: sort.direction,
			...extraFilters
		};

		// Add common filter parameters only if they have meaningful values
		if (filters.dateFrom?.trim()) params.dateFrom = filters.dateFrom;
		if (filters.dateTo?.trim()) params.dateTo = filters.dateTo;

		return params;
	}

	/**
	 * Force clear cache for specific endpoint or all cache
	 */
	clearCache(endpoint?: string): void {
		if (endpoint) {
			for (const key of this.cache.keys()) {
				if (key.startsWith(endpoint)) {
					this.cache.delete(key);
				}
			}
		} else {
			this.cache.clear();
		}
		console.log(`🗑️ Cache cleared ${endpoint ? `for ${endpoint}` : 'completely'}`);
	}

	/**
	 * Cancel all pending requests
	 */
	cancelAllRequests(): void {
		for (const [key] of this.pendingRequests) {
			this.cancelPendingRequest(key);
		}
		console.log('❌ All pending requests cancelled');
	}

	/**
	 * Get cache statistics for debugging
	 */
	getCacheStats(): { size: number; keys: string[]; pendingRequests: number } {
		return {
			size: this.cache.size,
			keys: Array.from(this.cache.keys()),
			pendingRequests: this.pendingRequests.size
		};
	}
}

export default HistoryRequestManager;