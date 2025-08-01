export interface LightThresholds {
	turnOnWhenDark: number;
	turnOffWhenBright: number;
}

export interface PumpThresholds {
	turnOnWhenDry: number;
	turnOffWhenWet: number;
}

export interface TemperatureThresholds {
	windowOpenTemp: number;
	windowCloseTemp: number;
}

export interface RainSettings {
	autoCloseWindowOnRain: boolean;
	autoOpenAfterRain: boolean;
}

export interface AutomationSettings {
	_id?: string;
	automationEnabled: boolean;
	lightControlEnabled: boolean;
	pumpControlEnabled: boolean;
	windowControlEnabled: boolean;
	lightThresholds: LightThresholds;
	pumpThresholds: PumpThresholds;
	temperatureThresholds: TemperatureThresholds;
	rainSettings: RainSettings;
	createdAt?: string;
	updatedAt?: string;
}

export interface AutomationMessage {
	type: 'success' | 'danger';
	text: string;
}
