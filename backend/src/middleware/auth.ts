import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Config } from '../config/AppConfig';
const JWT_SECRET = Config.auth.jwtSecret;
interface AuthenticatedRequest extends Request {
	user?: {
		id: string
		email: string
	}
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];
	if (!token) {
		res.status(401).json({
			success: false,
			message: 'Access token required'
		});
		return;
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET) as any;
		req.user = {
			id: decoded.id,
			email: decoded.email
		};
		next();
	} catch (error) {
		res.status(403).json({
			success: false,
			message: 'Invalid or expired token'
		});
		return;
	}
};