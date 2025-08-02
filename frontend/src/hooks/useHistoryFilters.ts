import { useState } from 'react';
import { FilterState } from '@/types/history';

interface UseHistoryFiltersReturn {
	filters: FilterState;
	showFilters: boolean;
	updateFilter: (field: keyof FilterState, value: string) => void;
	applyFilters: () => void;
	clearFilters: () => void;
	toggleFilters: () => void;
	hasActiveFilters: boolean;
}

const initialFilters: FilterState = {
	dateFrom: '',
	dateTo: '',
	minTemperature: '',
	maxTemperature: '',
	minHumidity: '',
	maxHumidity: '',
	minSoilMoisture: '',
	maxSoilMoisture: '',
	minWaterLevel: '',
	maxWaterLevel: '',
	soilMoisture: '',
	waterLevel: '',
	rainStatus: '',
	deviceType: '',
	controlType: '',
	pageSize: '20',
};

export const useHistoryFilters = (): UseHistoryFiltersReturn => {
	const [filters, setFilters] = useState<FilterState>(initialFilters);
	const [showFilters, setShowFilters] = useState(false);

	const updateFilter = (field: keyof FilterState, value: string) => {
		setFilters(prev => ({ ...prev, [field]: value }));
	};

	const applyFilters = () => {
		// Filters are applied automatically through state changes
		console.log('Applying filters:', filters);
	};

	const clearFilters = () => {
		setFilters(initialFilters);
	};

	const toggleFilters = () => {
		setShowFilters(prev => !prev);
	};

	const hasActiveFilters = Object.values(filters).some(value => value !== '');

	return {
		filters,
		showFilters,
		updateFilter,
		applyFilters,
		clearFilters,
		toggleFilters,
		hasActiveFilters,
	};
};
