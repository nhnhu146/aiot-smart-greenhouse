import { Response } from 'express';
/**
 * Standardized API response formats
 * Ensures consistent response structure across all endpoints
 */

export interface StandardAPIResponse<T = any> {
	success: boolean
	message?: string
	data?: T
	timestamp: string
	error?: any
}

export interface PaginationInfo {
	page: number
	limit: number
	total: number
	totalPages: number
	hasNext: boolean
	hasPrev: boolean
}

export interface PaginatedResponse<T = any> extends StandardAPIResponse<T> {
	data: T
	pagination: PaginationInfo
}

/**
 * Send standardized success response
 */
export const sendSuccessResponse = <T = any>(
	res: Response,
	data?: T,
	message?: string,
	statusCode: number = 200
): void => {
	const response: StandardAPIResponse<T> = {
		success: true,
		message: message || 'Operation completed successfully',
		data,
		timestamp: new Date().toISOString()
	};
	res.status(statusCode).json(response);
};
/**
 * Send standardized error response
 */
export const sendErrorResponse = (
	res: Response,
	message: string,
	statusCode: number = 500,
	error?: any
): void => {
	const response: StandardAPIResponse = {
		success: false,
		message,
		timestamp: new Date().toISOString(),
		...(process.env.NODE_ENV === 'development' && error && { error })
	};
	res.status(statusCode).json(response);
};
/**
 * Send standardized paginated response
 */
export const sendPaginatedResponse = <T = any>(
	res: Response,
	data: T,
	pagination: PaginationInfo,
	message?: string,
	statusCode: number = 200
): void => {
	const response: PaginatedResponse<T> = {
		success: true,
		message: message || 'Data retrieved successfully',
		data,
		pagination,
		timestamp: new Date().toISOString()
	};
	res.status(statusCode).json(response);
};
/**
 * Send standardized validation error response
 */
export const sendValidationErrorResponse = (
	res: Response,
	errors: any,
	message: string = 'Validation failed'
): void => {
	const response: StandardAPIResponse = {
		success: false,
		message,
		error: errors,
		timestamp: new Date().toISOString()
	};
	res.status(400).json(response);
};