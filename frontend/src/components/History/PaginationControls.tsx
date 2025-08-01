import React from 'react';
import { Button } from 'react-bootstrap';
import { PaginationInfo } from '@/types/history';

interface PaginationControlsProps {
	pagination: PaginationInfo;
	onPageChange: (page: number) => void;
	disabled?: boolean;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
	pagination,
	onPageChange,
	disabled = false
}) => {
	const { page, totalPages, hasPrev, hasNext } = pagination;

	const handlePrevious = () => {
		if (hasPrev && !disabled) {
			onPageChange(page - 1);
		}
	};

	const handleNext = () => {
		if (hasNext && !disabled) {
			onPageChange(page + 1);
		}
	};

	const getPageNumbers = () => {
		const pages = [];
		const maxVisiblePages = 5;
		let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
		let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

		// Adjust start page if we're near the end
		if (endPage - startPage + 1 < maxVisiblePages) {
			startPage = Math.max(1, endPage - maxVisiblePages + 1);
		}

		for (let i = startPage; i <= endPage; i++) {
			pages.push(i);
		}
		return pages;
	};

	if (totalPages <= 1) {
		return null; // Don't show pagination if there's only one page
	}

	return (
		<div className="d-flex justify-content-between align-items-center mt-3">
			<Button
				variant="outline-primary"
				onClick={handlePrevious}
				disabled={!hasPrev || disabled}
				size="sm"
			>
				← Previous
			</Button>

			<div className="d-flex align-items-center">
				{getPageNumbers().map((pageNum) => (
					<Button
						key={pageNum}
						variant={pageNum === page ? 'primary' : 'outline-secondary'}
						onClick={() => onPageChange(pageNum)}
						disabled={disabled}
						size="sm"
						className="mx-1"
					>
						{pageNum}
					</Button>
				))}
			</div>

			<Button
				variant="outline-primary"
				onClick={handleNext}
				disabled={!hasNext || disabled}
				size="sm"
			>
				Next →
			</Button>
		</div>
	);
};

export default PaginationControls;
