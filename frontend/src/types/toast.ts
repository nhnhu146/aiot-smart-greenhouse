// Toast notification types and configurations
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastNotification {
	id: string;
	type: ToastType;
	title: string;
	message?: string;
	duration?: number;
	persistent?: boolean;
	timestamp: Date;
}

export interface ToastConfig {
	success: {
		duration: number;
		icon: string;
		className: string;
	};
	error: {
		duration: number;
		icon: string;
		className: string;
	};
	warning: {
		duration: number;
		icon: string;
		className: string;
	};
	info: {
		duration: number;
		icon: string;
		className: string;
	};
}

export const DEFAULT_TOAST_CONFIG: ToastConfig = {
	success: {
		duration: 4000,
		icon: '✅',
		className: 'bg-success text-white'
	},
	error: {
		duration: 8000,
		icon: '❌',
		className: 'bg-danger text-white'
	},
	warning: {
		duration: 6000,
		icon: '⚠️',
		className: 'bg-warning text-dark'
	},
	info: {
		duration: 5000,
		icon: 'ℹ️',
		className: 'bg-info text-white'
	}
};

export const MAX_TOASTS = 5;
export const TOAST_ANIMATION_DURATION = 300;
