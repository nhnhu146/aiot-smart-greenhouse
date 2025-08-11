import React from 'react';
import { SortState } from '@/types/history';

interface SortableHeaderProps {
	field: string;
	tab: 'sensors' | 'controls' | 'voice' | 'alerts';
	children: React.ReactNode;
	sortState: SortState;
	onSort: (field: string, tab: 'sensors' | 'controls' | 'voice' | 'alerts') => void;
	className?: string;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
	field,
	tab,
	children,
	sortState,
	onSort,
	className = ''
}) => {
	const isActive = sortState.field === field && sortState.tab === tab;
	const direction = isActive ? sortState.direction : null;

	const getSortClass = () => {
		let classes = `sortable-header ${className}`;
		if (isActive) {
			classes += direction === 'asc' ? ' sort-asc' : ' sort-desc';
		}
		return classes;
	};

	const handleClick = () => {
		onSort(field, tab);
	};

	return (
		<th
			className={getSortClass()}
			onClick={handleClick}
			style={{ cursor: 'pointer' }}
		>
			{children}
		</th>
	);
};

export default SortableHeader;
