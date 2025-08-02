import React from 'react';
import { Card } from 'react-bootstrap';

interface DashboardLoadingProps {
	isLoading: boolean;
	hasData: boolean;
}

const DashboardLoading: React.FC<DashboardLoadingProps> = ({ isLoading, hasData }) => {
	if (!isLoading || hasData) {
		return null;
	}

	return (
		<div style={{
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			height: '50vh'
		}}>
			<Card style={{ minWidth: '300px', textAlign: 'center', padding: '2rem' }}>
				<div className="spinner-border text-primary mb-3" role="status">
					<span className="sr-only">Loading...</span>
				</div>
				<h5>Loading Dashboard...</h5>
				<p className="text-muted">Fetching sensor data and system status</p>
			</Card>
		</div>
	);
};

export default DashboardLoading;
