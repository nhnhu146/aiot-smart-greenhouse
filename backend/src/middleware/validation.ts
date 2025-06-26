import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { APIResponse } from '../types';

export const validateBody = (schema: ZodSchema) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		try {
			req.body = schema.parse(req.body);
			next();
		} catch (error) {
			if (error instanceof ZodError) {
				const response: APIResponse = {
					success: false,
					message: 'Validation failed',
					error: error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', '),
					timestamp: new Date().toISOString()
				};
				res.status(400).json(response);
				return;
			}

			const response: APIResponse = {
				success: false,
				message: 'Internal server error',
				error: 'Validation error occurred',
				timestamp: new Date().toISOString()
			};
			res.status(500).json(response);
		}
	};
};

export const validateQuery = (schema: ZodSchema) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		try {
			req.query = schema.parse(req.query);
			next();
		} catch (error) {
			if (error instanceof ZodError) {
				const response: APIResponse = {
					success: false,
					message: 'Query validation failed',
					error: error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', '),
					timestamp: new Date().toISOString()
				};
				res.status(400).json(response);
				return;
			}

			const response: APIResponse = {
				success: false,
				message: 'Internal server error',
				error: 'Query validation error occurred',
				timestamp: new Date().toISOString()
			};
			res.status(500).json(response);
		}
	};
};
