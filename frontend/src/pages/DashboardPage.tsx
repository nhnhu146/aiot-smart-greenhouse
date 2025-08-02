import { Container, Row, Col, Card } from 'react-bootstrap';
import AppLineChart from '@/components/LineChart/LineChart';
import SensorDashboard from '@/components/SensorDashboard/SensorDashboard';
import DeviceControlCenter from '@/components/DeviceControl/DeviceControlCenter';
import withAuth from '@/components/withAuth/withAuth';
import DashboardAlerts from '@/components/Dashboard/DashboardAlerts';
import AutoModeControl from '@/components/Dashboard/AutoModeControl';
import VoiceCommandDisplay from '@/components/Dashboard/VoiceCommandDisplay';
import DashboardLoading from '@/components/Dashboard/DashboardLoading';
import { useDashboardState } from '@/hooks/useDashboardState';
import { useSensorData } from '@/hooks/useSensorData';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import './DashboardPage.css';

const DashboardPage = () => {
	const {
		persistentSensorData,
		isConnected,
		switchStates,
		userInteraction,
		autoMode,
		activities,
		handleDeviceToggle,
		toggleAutoMode
	} = useDashboardState();

	const { data, isUsingMockData, isLoading } = useSensorData(persistentSensorData, isConnected);
	const { latestVoiceCommand, formatDateTime } = useVoiceCommands();

	// Show loading state only if we have no data and are still loading
	if (isLoading && !data) {
		return <DashboardLoading isLoading={isLoading} hasData={!!data} />;
	}

	return (
		<Container fluid className="dashboard-container">
			{/* Connection Status Alert */}
			{isUsingMockData && (
				<div className="alert alert-info mb-3" role="alert">
					📊 <strong>Demo Mode:</strong> Currently displaying simulated sensor data.
				</div>
			)}

			{/* Main Dashboard Content */}
			<Row className="mb-4">
				{/* Sensor Dashboard */}
				<Col lg={8} className="mb-3">
					<SensorDashboard />
				</Col>

				{/* Device Controls */}
				<Col lg={4} className="mb-3">
					<DeviceControlCenter
						activities={activities}
						switchStates={switchStates}
						onDeviceToggle={handleDeviceToggle}
					/>
				</Col>
			</Row>

			{/* Control Panel Row */}
			<Row className="mb-4">
				{/* Auto Mode Control */}
				<Col md={6} className="mb-3">
					<AutoModeControl
						autoMode={autoMode}
						userInteraction={userInteraction}
						onToggle={toggleAutoMode}
					/>
					<div className="mt-3">
						<DashboardAlerts
							isConnected={isConnected}
							autoMode={autoMode}
							userInteraction={userInteraction}
						/>
					</div>
				</Col>

				{/* Voice Command Display */}
				<Col md={6} className="mb-3">
					<VoiceCommandDisplay
						latestVoiceCommand={latestVoiceCommand}
						formatDateTime={formatDateTime}
					/>
				</Col>
			</Row>

			{/* Charts Section - API data only, NO doughnut cards */}
			<Row className="my-3 align-items-center justify-content-center chart-row">
				<Col sm={12}>
					<Card className="chart-card">
						<Card.Body className="chart-title">Sensor Data Trends</Card.Body>
						<div className="my-3">
							<AppLineChart />
						</div>
					</Card>
				</Col>
			</Row>
		</Container>
	);
};

export default withAuth(DashboardPage);
