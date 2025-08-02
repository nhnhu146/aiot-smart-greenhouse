import { z } from 'zod';

// Alert query parameters schema
export const AlertQuerySchema = z.object({
	page: z.string().transform(val => parseInt(val)).pipe(z.number().min(1)).optional(),
	limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(100)).optional(),
	from: z.string().transform(val => new Date(val)).optional(),
	to: z.string().transform(val => new Date(val)).optional(),
	resolved: z.string().transform(val => val === 'true').pipe(z.boolean()).optional()
});

// Test email schema
export const TestEmailSchema = z.object({
	recipients: z.array(z.string().email()).min(1, 'At least one recipient is required')
});

// System error schema
export const SystemErrorSchema = z.object({
	error: z.string().optional(),
	component: z.string().optional()
});
