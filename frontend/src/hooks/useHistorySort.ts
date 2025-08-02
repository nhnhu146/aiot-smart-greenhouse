import { useState } from 'react';
import { SortState } from '@/types/history';

interface UseHistorySortReturn {
	sensorSort: SortState;
	deviceSort: SortState;
	voiceSort: SortState;
	handleSort: (field: string, tab: 'sensors' | 'controls' | 'voice') => void;
}

export const useHistorySort = (): UseHistorySortReturn => {
	const [sensorSort, setSensorSort] = useState<SortState>({
		field: 'time',
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

	const handleSort = (field: string, tab: 'sensors' | 'controls' | 'voice') => {
		const currentSort = tab === 'sensors' ? sensorSort :
			tab === 'controls' ? deviceSort : voiceSort;

		const newDirection = currentSort.field === field && currentSort.direction === 'asc'
			? 'desc'
			: 'asc';

		const newSort: SortState = {
			field,
			direction: newDirection,
			tab
		};

		switch (tab) {
			case 'sensors':
				setSensorSort(newSort);
				break;
			case 'controls':
				setDeviceSort(newSort);
				break;
			case 'voice':
				setVoiceSort(newSort);
				break;
		}
	};

	return {
		sensorSort,
		deviceSort,
		voiceSort,
		handleSort,
	};
};
