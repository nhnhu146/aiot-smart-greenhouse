import mongoose, { Schema, Document } from 'mongoose';
import { Settings } from '../types';

export interface ISettings extends Omit<Settings, '_id'>, Document { }

const SettingsSchema: Schema = new Schema({
	temperatureThreshold: {
		min: {
			type: Number,
			required: true,
			default: 18
		},
		max: {
			type: Number,
			required: true,
			default: 30
		}
	},
	humidityThreshold: {
		min: {
			type: Number,
			required: true,
			default: 40
		},
		max: {
			type: Number,
			required: true,
			default: 80
		}
	},
	soilMoistureThreshold: {
		min: {
			type: Number,
			required: true,
			default: 30
		},
		max: {
			type: Number,
			required: true,
			default: 70
		}
	},
	waterLevelThreshold: {
		min: {
			type: Number,
			required: true,
			default: 20
		},
		max: {
			type: Number,
			required: true,
			default: 90
		}
	},
	autoControl: {
		light: {
			type: Boolean,
			default: true
		},
		pump: {
			type: Boolean,
			default: true
		},
		door: {
			type: Boolean,
			default: true
		}
	},
	notifications: {
		email: {
			type: Boolean,
			default: true
		},
		threshold: {
			type: Boolean,
			default: true
		},
		emailRecipients: {
			type: [String],
			default: []
		},
		alertFrequency: {
			type: Number,
			default: 5,  // 5 minutes default
			min: 1,      // minimum 1 minute
			max: 60      // maximum 60 minutes
		},
		batchAlerts: {
			type: Boolean,
			default: true  // Enable batching by default
		}
	},
	emailAlerts: {
		temperature: {
			type: Boolean,
			default: true
		},
		humidity: {
			type: Boolean,
			default: true
		},
		soilMoisture: {
			type: Boolean,
			default: true
		},
		waterLevel: {
			type: Boolean,
			default: true
		}
	}
}, {
	timestamps: true,
	versionKey: false
});

export default mongoose.model<ISettings>('Settings', SettingsSchema);
