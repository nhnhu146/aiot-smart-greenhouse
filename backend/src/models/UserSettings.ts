import { Schema, model, Document } from 'mongoose';

export interface IUserSettings extends Document {
	userId: string;
	email: string;
	alertRecipients: string[];
	mqttConfig: {
		host: string;
		port: number;
		username?: string;
		password?: string;
		clientId?: string;
	};
	alertThresholds: {
		temperature: { min: number; max: number };
		humidity: { min: number; max: number };
		soilMoisture: { min: number; max: number };
		lightLevel: { min: number; max: number };
	};
	createdAt: Date;
	updatedAt: Date;
}

const userSettingsSchema = new Schema<IUserSettings>({
	userId: {
		type: String,
		required: true,
		unique: true,
		index: true
	},
	email: {
		type: String,
		required: true,
		validate: {
			validator: (email: string) => {
				return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
			},
			message: 'Invalid email format'
		}
	},
	alertRecipients: {
		type: [String],
		default: function(this: IUserSettings) {
			return [this.email];
		},
		validate: {
			validator: (emails: string[]) => {
				return emails.every(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
			},
			message: 'All alert recipients must be valid email addresses'
		}
	},
	mqttConfig: {
		host: {
			type: String,
			default: process.env.MQTT_HOST || 'localhost'
		},
		port: {
			type: Number,
			default: parseInt(process.env.MQTT_PORT || '1883')
		},
		username: {
			type: String,
			default: process.env.MQTT_USERNAME
		},
		password: {
			type: String,
			default: process.env.MQTT_PASSWORD
		},
		clientId: String
	},
	alertThresholds: {
		temperature: {
			min: { type: Number, default: 15 },
			max: { type: Number, default: 35 }
		},
		humidity: {
			min: { type: Number, default: 30 },
			max: { type: Number, default: 80 }
		},
		soilMoisture: {
			min: { type: Number, default: 20 },
			max: { type: Number, default: 80 }
		},
		lightLevel: {
			min: { type: Number, default: 200 },
			max: { type: Number, default: 1000 }
		}
	}
}, {
	timestamps: true
});

// Pre-save middleware to ensure user's email is always included in alertRecipients
userSettingsSchema.pre('save', function(next) {
	if (this.email && !this.alertRecipients.includes(this.email)) {
		this.alertRecipients.unshift(this.email);
	}
	next();
});

export const UserSettings = model<IUserSettings>('UserSettings', userSettingsSchema);
