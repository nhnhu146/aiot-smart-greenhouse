export interface FilterState {
	// Date filters
	dateFrom: string;
	dateTo: string;

	// Value range filters
	minTemperature: string;
	maxTemperature: string;
	minHumidity: string;
	maxHumidity: string;
	minSoilMoisture: string;
	maxSoilMoisture: string;
	minWaterLevel: string;
	maxWaterLevel: string;

	// Specific value filters
	soilMoisture: string;
	waterLevel: string;
	rainStatus: string;

	// Device filters
	deviceType: string;
	controlType: string;

	// Pagination options
	pageSize: string;
}

export interface SortState {
	field: string;
	direction: 'asc' | 'desc';
	tab: 'sensors' | 'controls' | 'voice' | 'alerts';
}

export interface PaginationInfo {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}
