import mongoose, { Schema, Document } from 'mongoose';

export interface IAutomationSettings extends Document {
	// Automation enablement
	automationEnabled: boolean;

	// Device control enablement
	lightControlEnabled: boolean;
	pumpControlEnabled: boolean;
	doorControlEnabled: boolean;
	windowControlEnabled: boolean;

	// Light automation thresholds (based on lightLevel sensor)
	lightThresholds: {
		turnOnWhenDark: number; // 0 = dark (turn on light), 1 = bright (turn off light)
		turnOffWhenBright: number;
	};

	// Pump automation thresholds (based on soilMoisture sensor)
	pumpThresholds: {
		turnOnWhenDry: number; // 0 = dry (turn on pump), 1 = wet (turn off pump)
		turnOffWhenWet: number;
	};

	// Temperature thresholds for window/door control
	temperatureThresholds: {
		windowOpenTemp: number; // Temperature to open window for ventilation
		windowCloseTemp: number; // Temperature to close window
		doorOpenTemp: number; // Emergency temperature to open door
		doorCloseTemp: number; // Temperature to close door
	};

	// Motion detection settings
	motionSettings: {
		autoOpenDoorOnMotion: boolean; // Whether to open door when motion detected
		autoCloseAfterMotion: boolean; // Auto close door after no motion
		motionTimeoutMinutes: number; // Minutes to wait before auto-closing
	};

	// Rain detection settings
	rainSettings: {
		autoCloseWindowOnRain: boolean; // Close window when rain detected
		autoOpenAfterRain: boolean; // Open window when rain stops
	};

	// Water level emergency settings
	waterLevelSettings: {
		autoTurnOffPumpOnFlood: boolean; // Turn off pump when water level = 1 (flooded)
		autoOpenDoorOnFlood: boolean; // Open door for drainage when flooded
	};

	createdAt?: Date;
	updatedAt?: Date;
}

const AutomationSettingsSchema: Schema = new Schema({
	automationEnabled: {
		type: Boolean,
		required: true,
		default: false
	},
	lightControlEnabled: {
		type: Boolean,
		required: true,
		default: true
	},
	pumpControlEnabled: {
		type: Boolean,
		required: true,
		default: true
	},
	doorControlEnabled: {
		type: Boolean,
		required: true,
		default: false
	},
	windowControlEnabled: {
		type: Boolean,
		required: true,
		default: true
	},
	lightThresholds: {
		turnOnWhenDark: {
			type: Number,
			required: true,
			default: 0 // Turn on light when lightLevel = 0 (dark)
		},
		turnOffWhenBright: {
			type: Number,
			required: true,
			default: 1 // Turn off light when lightLevel = 1 (bright)
		}
	},
	pumpThresholds: {
		turnOnWhenDry: {
			type: Number,
			required: true,
			default: 0 // Turn on pump when soilMoisture = 0 (dry)
		},
		turnOffWhenWet: {
			type: Number,
			required: true,
			default: 1 // Turn off pump when soilMoisture = 1 (wet)
		}
	},
	temperatureThresholds: {
		windowOpenTemp: {
			type: Number,
			required: true,
			default: 30 // Open window when temp >= 30°C
		},
		windowCloseTemp: {
			type: Number,
			required: true,
			default: 25 // Close window when temp <= 25°C
		},
		doorOpenTemp: {
			type: Number,
			required: true,
			default: 35 // Emergency: open door when temp >= 35°C
		},
		doorCloseTemp: {
			type: Number,
			required: true,
			default: 30 // Close door when temp <= 30°C
		}
	},
	motionSettings: {
		autoOpenDoorOnMotion: {
			type: Boolean,
			required: true,
			default: true
		},
		autoCloseAfterMotion: {
			type: Boolean,
			required: true,
			default: false
		},
		motionTimeoutMinutes: {
			type: Number,
			required: true,
			default: 5
		}
	},
	rainSettings: {
		autoCloseWindowOnRain: {
			type: Boolean,
			required: true,
			default: true
		},
		autoOpenAfterRain: {
			type: Boolean,
			required: true,
			default: false
		}
	},
	waterLevelSettings: {
		autoTurnOffPumpOnFlood: {
			type: Boolean,
			required: true,
			default: true
		},
		autoOpenDoorOnFlood: {
			type: Boolean,
			required: true,
			default: true
		}
	}
}, {
	timestamps: true
});

export default mongoose.model<IAutomationSettings>('AutomationSettings', AutomationSettingsSchema);
