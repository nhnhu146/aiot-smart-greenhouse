import React, { useEffect, useState } from 'react';
import mockDataService from '@/services/mockDataService';
import './MockDataToggle.css';

interface MockDataToggleProps {
	onToggle?: (isMockEnabled: boolean) => void;
}

const MockDataToggle: React.FC<MockDataToggleProps> = ({ onToggle }) => {
	const [isMockEnabled, setIsMockEnabled] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		// On mount, check the current mock data status from user settings only
		// Mock data should only be enabled by explicit user configuration
		const currentState = mockDataService.isUsingMockData();

		// Ensure mock data is never enabled by default or fallback
		if (currentState && !localStorage.getItem('user_mock_data_preference')) {
			// If mock data is somehow enabled without user preference, disable it
			mockDataService.setUseMockData(false);
			setIsMockEnabled(false);
		} else {
			setIsMockEnabled(currentState);
		}
	}, []);

	// Toggle mock data function
	const handleToggle = async () => {
		setIsLoading(true);
		try {
			const newState = !isMockEnabled;

			// Store user preference explicitly in localStorage (ban.instructions.md compliance)
			localStorage.setItem('user_mock_data_preference', newState.toString());

			mockDataService.setUseMockData(newState);
			setIsMockEnabled(newState);

			// Notify parent component immediately
			if (onToggle) {
				onToggle(newState);
			}

			// Small delay to show loading state, but don't reload page
			setTimeout(() => {
				setIsLoading(false);
			}, 300);
		} catch (error) {
			console.error('❌ Failed to toggle mock data:', error);
			setIsMockEnabled(!isMockEnabled); // Revert on error
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div>
			<div className="mock-toggle-header">
				<div>
					<strong>Data Source Mode</strong>
					<div className="mock-toggle-description">
						Choose between mock data for testing or real sensor data
						<br />
						<span className="mock-toggle-info">
							🌐 This setting is saved locally in your browser only
						</span>
					</div>
				</div>
				<div className="mock-toggle-controls">
					<span className={`mock-toggle-badge ${isMockEnabled ? 'mock' : 'real'}`}>
						{isMockEnabled ? '🎭 Mock Data' : '📊 Real Data'}
					</span>
					<label className="switch">
						<input
							type="checkbox"
							checked={isMockEnabled}
							onChange={handleToggle}
							disabled={isLoading}
						/>
						<span className="slider round"></span>
					</label>
				</div>
			</div>

			<div className={`mock-toggle-alert ${isMockEnabled ? 'warning' : 'success'}`}>
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
			</div>

			{isLoading && (
				<div className="mock-toggle-loading">
					<div className="spinner"></div>
					Applying changes...
				</div>
			)}
		</div>
	);
};

export default MockDataToggle;
