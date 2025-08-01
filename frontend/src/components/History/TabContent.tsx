import React from 'react';
import { Card } from 'react-bootstrap';
import { PaginationInfo } from '@/types/history';
import PaginationControls from './PaginationControls';

interface TabContentProps {
	title: string;
	icon: string;
	pagination: PaginationInfo;
	onPageChange: (page: number) => void;
	isEmpty: boolean;
	emptyMessage: string;
	children: React.ReactNode;
}

const TabContent: React.FC<TabContentProps> = ({
	title,
	icon,
	pagination,
	onPageChange,
	isEmpty,
	emptyMessage,
	children
}) => {
	return (
		<Card>
			<Card.Header>
				<div className="d-flex justify-content-between align-items-center">
					<h5 className="mb-0">
						{icon} {title}
					</h5>
					<small className="text-muted">
						Page {pagination.page} of {pagination.totalPages}
						{pagination.total > 0 && ` (${pagination.total} total records)`}
					</small>
				</div>
			</Card.Header>
			<Card.Body>
				{isEmpty ? (
					<div className="text-center py-4 text-muted">
						<p>{emptyMessage}</p>
					</div>
				) : (
					<>
						{children}
						<PaginationControls
							pagination={pagination}
							onPageChange={onPageChange}
						/>
					</>
				)}
			</Card.Body>
		</Card>
	);
};

export default TabContent;
