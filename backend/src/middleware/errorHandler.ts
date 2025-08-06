import { Request, Response, NextFunction } from 'express';
import { APIResponse } from '../types';
import { Config } from '../config/AppConfig';
export interface CustomError extends Error {
	statusCode?: number
	isOperational?: boolean
}

export const errorHandler = (
	error: CustomError,
	req: Request,
	res: Response
): void => {
	console.error('Error:', error);
	const statusCode = error.statusCode || 500;
	const message = error.isOperational ? error.message : 'Internal server error';
	const response: APIResponse = {
		success: false,
		message,
		error: Config.app.env === 'development' ? error.stack : undefined,
		timestamp: new Date().toISOString()
	};
	res.status(statusCode).json(response);
};
export const notFoundHandler = (req: Request, res: Response): void => {
	const response: APIResponse = {
		success: false,
		message: 'Route not found',
		error: `Cannot ${req.method} ${req.path}`,
		timestamp: new Date().toISOString()
	};
	res.status(404).json(response);
};
export const asyncHandler = (fn: Function) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
};
export class AppError extends Error implements CustomError {
	public readonly statusCode: number;
	public readonly isOperational: boolean;
	constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = isOperational;
		Error.captureStackTrace(this, this.constructor);
	}
}
