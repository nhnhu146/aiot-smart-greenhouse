import { useState } from 'react';
import { FilterState } from '@/types/history';

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

export const useHistoryFilters = () => {
	const [filters, setFilters] = useState<FilterState>(initialFilters);
	const [showFilters, setShowFilters] = useState(false);
	// Don't initialize appliedFilters with empty values - wait for user to apply filters
	const [appliedFilters, setAppliedFilters] = useState<FilterState | null>(null);

	const updateFilter = (field: keyof FilterState, value: string) => {
		setFilters(prev => ({
			...prev,
			[field]: value
		}));
	};

	const applyFilters = () => {
		setAppliedFilters({ ...filters });
	};

	const clearFilters = () => {
		setFilters(initialFilters);
		setAppliedFilters(null);
	};

	const toggleFilters = () => {
		setShowFilters(!showFilters);
	};

	const hasActiveFilters = () => {
		if (!appliedFilters) return false;
		return Object.entries(appliedFilters).some(([key, value]) => {
			if (key === 'pageSize') return false;
			return value !== '';
		});
	};

	return {
		filters,
		showFilters,
		appliedFilters: appliedFilters || initialFilters, // Use initialFilters as fallback
		updateFilter,
		applyFilters,
		clearFilters,
		toggleFilters,
		hasActiveFilters: hasActiveFilters()
	};
};
