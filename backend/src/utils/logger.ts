import winston from 'winston';
import path from 'path';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');

const logger = winston.createLogger({
	level: process.env.LOG_LEVEL || 'info',
	format: winston.format.combine(
		winston.format.timestamp({
			format: 'YYYY-MM-DD HH:mm:ss'
		}),
		winston.format.errors({ stack: true }),
		winston.format.json()
	),
	defaultMeta: { service: 'aiot-greenhouse-backend' },
	transports: [
		// Console output
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.simple()
			)
		}),
		// File outputs
		new winston.transports.File({
			filename: path.join(logsDir, 'error.log'),
			level: 'error'
		}),
		new winston.transports.File({
			filename: path.join(logsDir, 'automation.log'),
			level: 'info'
		}),
		new winston.transports.File({
			filename: path.join(logsDir, 'combined.log')
		})
	]
});

// Create logs directory if it doesn't exist
import fs from 'fs';
if (!fs.existsSync(logsDir)) {
	fs.mkdirSync(logsDir, { recursive: true });
	console.log('📁 Created logs directory:', logsDir);
}

export default logger;
