// Enhanced API Client with centralized error handling and toast integration
import axios, { AxiosResponse, AxiosError } from 'axios';
import { Config, AppConstants } from '../config/AppConfig';

// API Response interfaces
export interface APISuccess<T = any> {
	success: true;
	message: string;
	data: T;
	timestamp: string;
}

export interface APIError {
	success: false;
	message: string;
	error?: string;
	timestamp: string;
}

export type APIResponse<T = any> = APISuccess<T> | APIError;

// Error handler type
type ErrorHandler = (message: string, duration?: number) => void;

// Global error handler reference (will be set by components that use toast)
let globalErrorHandler: ErrorHandler | null = null;

export const setGlobalErrorHandler = (handler: ErrorHandler) => {
	globalErrorHandler = handler;
};

// Create axios instance with default config
const apiClient = axios.create({
	baseURL: `${Config.api.baseUrl}/api`,
	timeout: Config.api.timeout,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem(AppConstants.STORAGE_KEYS.AUTH_TOKEN);
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
	(response: AxiosResponse) => {
		// Check if response indicates an API error even with 2xx status
		if (response.data && response.data.success === false) {
			const errorMessage = response.data.message || 'An error occurred';
			
			// Show toast error if handler is available and it's not an auth error
			if (globalErrorHandler && !isAuthError(response.data)) {
				globalErrorHandler(errorMessage);
			}
		}
		return response;
	},
	async (error: AxiosError) => {
		let errorMessage = 'Network error occurred';
		
		if (error.response) {
			// Server responded with error status
			const status = error.response.status;
			const data = error.response.data as any;
			
			switch (status) {
				case AppConstants.HTTP_STATUS.UNAUTHORIZED:
					errorMessage = 'Authentication required. Please sign in.';
					// Clear stored auth data
					localStorage.removeItem(AppConstants.STORAGE_KEYS.AUTH_TOKEN);
					localStorage.removeItem(AppConstants.STORAGE_KEYS.USER_DATA);
					// Redirect to login if not already there
					if (!window.location.pathname.includes('/signin')) {
						window.location.href = '/signin';
					}
					break;
					
				case AppConstants.HTTP_STATUS.FORBIDDEN:
					errorMessage = 'Access denied. Insufficient permissions.';
					break;
					
				case AppConstants.HTTP_STATUS.NOT_FOUND:
					errorMessage = 'Requested resource not found.';
					break;
					
				case AppConstants.HTTP_STATUS.CONFLICT:
					errorMessage = data?.message || 'Data conflict occurred.';
					break;
					
				case AppConstants.HTTP_STATUS.UNPROCESSABLE_ENTITY:
					errorMessage = data?.message || 'Validation error occurred.';
					break;
					
				case AppConstants.HTTP_STATUS.INTERNAL_SERVER_ERROR:
					errorMessage = 'Server error occurred. Please try again.';
					break;
					
				case AppConstants.HTTP_STATUS.SERVICE_UNAVAILABLE:
					errorMessage = 'Service temporarily unavailable.';
					break;
					
				default:
					errorMessage = data?.message || `HTTP Error ${status}`;
			}
		} else if (error.request) {
			// Network error
			errorMessage = 'Unable to connect to server. Check your internet connection.';
		} else {
			// Request setup error
			errorMessage = error.message || 'Request failed';
		}
		
		// Show toast error if handler is available and it's not an auth error
		if (globalErrorHandler && !isAuthError(error.response?.data)) {
			globalErrorHandler(errorMessage, AppConstants.UI.TOAST_DURATION_ERROR);
		}
		
		return Promise.reject(error);
	}
);

// Helper function to check if error is auth-related
const isAuthError = (data: any): boolean => {
	if (!data) return false;
	const authErrorMessages = [
		'Authentication required',
		'Invalid token',
		'Token expired',
		'Please sign in',
		'Unauthorized'
	];
	return authErrorMessages.some(msg => 
		data.message?.toLowerCase().includes(msg.toLowerCase())
	);
};

// Enhanced API methods with better error handling
export const api = {
	// GET request
	async get<T = any>(url: string, params?: any): Promise<APIResponse<T>> {
		try {
			const response = await apiClient.get(url, { params });
			return response.data;
		} catch (error) {
			console.error('API GET Error:', error);
			throw error;
		}
	},

	// POST request
	async post<T = any>(url: string, data?: any): Promise<APIResponse<T>> {
		try {
			const response = await apiClient.post(url, data);
			return response.data;
		} catch (error) {
			console.error('API POST Error:', error);
			throw error;
		}
	},

	// PUT request
	async put<T = any>(url: string, data?: any): Promise<APIResponse<T>> {
		try {
			const response = await apiClient.put(url, data);
			return response.data;
		} catch (error) {
			console.error('API PUT Error:', error);
			throw error;
		}
	},

	// DELETE request
	async delete<T = any>(url: string): Promise<APIResponse<T>> {
		try {
			const response = await apiClient.delete(url);
			return response.data;
		} catch (error) {
			console.error('API DELETE Error:', error);
			throw error;
		}
	},

	// PATCH request
	async patch<T = any>(url: string, data?: any): Promise<APIResponse<T>> {
		try {
			const response = await apiClient.patch(url, data);
			return response.data;
		} catch (error) {
			console.error('API PATCH Error:', error);
			throw error;
		}
	},
};

// Export default instance for backward compatibility
export default apiClient;

// Utility functions for common API operations
export const apiUtils = {
	// Check if response is successful
	isSuccess: <T>(response: APIResponse<T>): response is APISuccess<T> => {
		return response.success === true;
	},

	// Extract data from successful response
	getData: <T>(response: APIResponse<T>): T | null => {
		return apiUtils.isSuccess(response) ? response.data : null;
	},

	// Get error message from response
	getErrorMessage: (response: APIResponse): string => {
		return response.success ? '' : response.message;
	},

	// Handle API response with toast feedback
	handleResponse: <T>(
		response: APIResponse<T>, 
		onSuccess?: (data: T) => void,
		successMessage?: string
	): T | null => {
		if (apiUtils.isSuccess(response)) {
			if (successMessage && globalErrorHandler) {
				// We need a success handler too - will be added when components set it
			}
			onSuccess?.(response.data);
			return response.data;
		} else {
			// Error already handled by interceptor
			return null;
		}
	}
};

// Types for external use
export interface SensorData {
	_id?: string;
	temperature?: number;
	humidity?: number;
	soilMoisture?: number;
	lightLevel?: number;
	waterLevel?: number;
	timestamp?: string;
	createdAt?: string;
}

export interface DeviceStatus {
	_id?: string;
	deviceType: string;
	status: boolean;
	updatedAt?: string;
}

export interface Alert {
	_id?: string;
	message: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	acknowledged: boolean;
	timestamp?: string;
	createdAt?: string;
}