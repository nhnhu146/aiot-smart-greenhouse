/* eslint-disable react-hooks/exhaustive-deps */
// Mock Data Toggle Component for Settings
'use client'
import { useEffect, useState } from 'react';
import { Form, Alert, Button } from 'react-bootstrap';
import mockDataService from '@/services/mockDataService';

interface MockDataToggleProps {
	onToggle?: (isMockEnabled: boolean) => void;
}

const MockDataToggle: React.FC<MockDataToggleProps> = ({ onToggle }) => {
	const [isMockEnabled, setIsMockEnabled] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		// On mount, check the current mock data status
		const currentState = mockDataService.isUsingMockData();
		console.log('MockDataToggle: Current state from service:', currentState);
		setIsMockEnabled(currentState);
	}, []);

	// Toggle mock data function
	const handleToggle = async () => {
		setIsLoading(true);
		try {
			const newState = !isMockEnabled;
			console.log('MockDataToggle: Changing state from', isMockEnabled, 'to', newState);

			mockDataService.setUseMockData(newState);
			setIsMockEnabled(newState);

			// Notify parent component immediately
			if (onToggle) {
				onToggle(newState);
			}

			// Small delay to show loading state, but don't reload page
			setTimeout(() => {
				setIsLoading(false);
				console.log('MockDataToggle: State change complete');
			}, 300);
		} catch (error) {
			console.error('Error toggling mock data:', error);
			setIsLoading(false);
		}
	};

	return (
		<div>
			<div className="d-flex align-items-center justify-content-between mb-3">
				<div>
					<strong>Data Source Mode</strong>
					<div className="text-muted small">
						Choose between mock data for testing or real sensor data
						<br />
						<span className="text-info">
							🌐 This setting is saved locally in your browser only
						</span>
					</div>
				</div>
				<div className="d-flex align-items-center gap-3">
					<span className={`badge ${isMockEnabled ? 'bg-warning' : 'bg-success'}`}>
						{isMockEnabled ? '🎭 Mock Data' : '📊 Real Data'}
					</span>
					<Form.Check
						type="switch"
						id="mock-data-setting-toggle"
						checked={isMockEnabled}
						onChange={handleToggle}
						disabled={isLoading}
						style={{ margin: 0 }}
					/>
				</div>
			</div>

			<Alert variant={isMockEnabled ? 'warning' : 'success'} className="mb-0">
				{isMockEnabled ? (
					<>
						<strong>🎭 Mock Data Mode Active</strong><br />
						Using simulated sensor data for development and testing.
						This data updates automatically to simulate real greenhouse conditions.
					</>
				) : (
					<>
						<strong>📊 Real Data Mode Active</strong><br />
						Using actual sensor data from the greenhouse system.
						Data reflects real-time conditions from connected sensors.
					</>
				)}
			</Alert>

			{isLoading && (
				<div className="text-center mt-2">
					<div className="spinner-border spinner-border-sm me-2" role="status">
						<span className="visually-hidden">Loading...</span>
					</div>
					Applying changes...
				</div>
			)}
		</div>
	);
};

export default MockDataToggle;
