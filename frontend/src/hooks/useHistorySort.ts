import { useState } from 'react';
import { SortState } from '@/types/history';

export const useHistorySort = () => {
	const [sensorSort, setSensorSort] = useState<SortState>({
		field: 'createdAt',
		direction: 'desc',
		tab: 'sensors'
	});

	const [deviceSort, setDeviceSort] = useState<SortState>({
		field: 'timestamp',
		direction: 'desc',
		tab: 'controls'
	});

	const [voiceSort, setVoiceSort] = useState<SortState>({
		field: 'timestamp',
		direction: 'desc',
		tab: 'voice'
	});

	const [alertSort, setAlertSort] = useState<SortState>({
		field: 'timestamp',
		direction: 'desc',
		tab: 'alerts'
	});

	const handleSort = (field: string, tab: 'sensors' | 'controls' | 'voice' | 'alerts') => {
		const updateSort = (currentSort: SortState, setSort: (sort: SortState) => void) => {
			if (currentSort.field === field) {
				// Toggle direction for same field
				const newDirection = currentSort.direction === 'asc' ? 'desc' : 'asc';
				setSort({
					field,
					direction: newDirection,
					tab
				});
			} else {
				// New field, default to desc (newest first for timestamps)
				setSort({
					field,
					direction: 'desc',
					tab
				});
			}
		};

		switch (tab) {
			case 'sensors':
				updateSort(sensorSort, setSensorSort);
				break;
			case 'controls':
				updateSort(deviceSort, setDeviceSort);
				break;
			case 'voice':
				updateSort(voiceSort, setVoiceSort);
				break;
			case 'alerts':
				updateSort(alertSort, setAlertSort);
				break;
		}
	};

	return {
		sensorSort,
		deviceSort,
		voiceSort,
		alertSort,
		handleSort
	};
};
