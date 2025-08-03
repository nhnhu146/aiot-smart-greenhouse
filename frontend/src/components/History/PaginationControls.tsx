import React, { useState } from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';
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
	const [jumpPage, setJumpPage] = useState('');

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

	const handleFirst = () => {
		if (page > 1 && !disabled) {
			onPageChange(1);
		}
	};

	const handleLast = () => {
		if (page < totalPages && !disabled) {
			onPageChange(totalPages);
		}
	};

	const handleJumpSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const targetPage = parseInt(jumpPage);
		if (targetPage >= 1 && targetPage <= totalPages && !disabled) {
			onPageChange(targetPage);
			setJumpPage('');
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
		<div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
			{/* Navigation buttons */}
			<div className="d-flex align-items-center gap-1">
				<Button
					variant="outline-primary"
					onClick={handleFirst}
					disabled={!hasPrev || disabled}
					size="sm"
					title="First page"
				>
					⏮️
				</Button>
				<Button
					variant="outline-primary"
					onClick={handlePrevious}
					disabled={!hasPrev || disabled}
					size="sm"
				>
					← Previous
				</Button>
			</div>

			{/* Page numbers */}
			<div className="d-flex align-items-center gap-1">
				{getPageNumbers().map((pageNum) => (
					<Button
						key={pageNum}
						variant={pageNum === page ? 'primary' : 'outline-secondary'}
						onClick={() => onPageChange(pageNum)}
						disabled={disabled}
						size="sm"
						className="px-2"
					>
						{pageNum}
					</Button>
				))}
			</div>

			{/* Next and Last buttons */}
			<div className="d-flex align-items-center gap-1">
				<Button
					variant="outline-primary"
					onClick={handleNext}
					disabled={!hasNext || disabled}
					size="sm"
				>
					Next →
				</Button>
				<Button
					variant="outline-primary"
					onClick={handleLast}
					disabled={!hasNext || disabled}
					size="sm"
					title="Last page"
				>
					⏭️
				</Button>
			</div>

			{/* Jump to page */}
			{totalPages > 10 && (
				<Form onSubmit={handleJumpSubmit} className="d-flex align-items-center gap-1">
					<InputGroup size="sm" style={{ maxWidth: '120px' }}>
						<Form.Control
							type="number"
							min={1}
							max={totalPages}
							value={jumpPage}
							onChange={(e) => setJumpPage(e.target.value)}
							placeholder={`1-${totalPages}`}
							disabled={disabled}
							size="sm"
						/>
						<Button
							variant="outline-secondary"
							type="submit"
							disabled={disabled}
							size="sm"
						>
							Go
						</Button>
					</InputGroup>
				</Form>
			)}
		</div>
	);
};

export default PaginationControls;
