import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// User model interface (replaces Firebase Auth)
export interface User {
	id: string;
	email: string;
	password: string;
	createdAt: Date;
	lastLogin?: Date;
	lastPasswordReset?: Date;
}

// Password reset token interface
export interface PasswordResetToken {
	email: string;
	token: string;
	expiresAt: Date;
	createdAt: Date;
}

// In-memory user store (replace with database in production)
export const users: Map<string, User> = new Map();

// Make users globally accessible for compatibility
declare global {
	var users: Map<string, User>;
}
global.users = users;

// In-memory password reset tokens store
export const passwordResetTokens: Map<string, PasswordResetToken> = new Map();

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Create default admin user with hashed password
export const createDefaultAdmin = async (): Promise<void> => {
	const hashedPassword = await bcrypt.hash('admin', 10);
	const defaultAdmin: User = {
		id: 'admin-001',
		email: 'admin@gmail.com',
		password: hashedPassword,
		createdAt: new Date(),
		lastLogin: undefined
	};

	// Add default admin to users store
	users.set('admin@gmail.com', defaultAdmin);
	console.log('✅ Default admin user created: admin@gmail.com/admin');
};

// Proper JWT implementation with signing
export const generateToken = (payload: object): string => {
	return jwt.sign(payload, JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN || '24h'
	} as jwt.SignOptions);
};

export const verifyToken = (token: string): any => {
	try {
		return jwt.verify(token, JWT_SECRET);
	} catch (error) {
		throw new Error('Invalid or expired token');
	}
};

// Authentication middleware
export const authenticateToken = (req: any, res: Response, next: NextFunction): void => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		res.status(401).json({ success: false, message: 'Access token required' });
		return;
	}

	try {
		const user = verifyToken(token);
		req.user = user;
		next();
	} catch (error) {
		res.status(403).json({ success: false, message: 'Invalid or expired token' });
		return;
	}
};
