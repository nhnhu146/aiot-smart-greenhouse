import { Container, Row, Col, Card } from 'react-bootstrap';
import AppLineChart from '@/components/LineChart/LineChart';
import SensorDashboard from '@/components/SensorDashboard/SensorDashboard';
import DeviceControlCenter from '@/components/DeviceControl/DeviceControlCenter';
import withAuth from '@/components/withAuth/withAuth';
import AutoModeControl from '@/components/Dashboard/AutoModeControl';
import VoiceCommandDisplay from '@/components/Dashboard/VoiceCommandDisplay';
import DashboardLoading from '@/components/Dashboard/DashboardLoading';
import ErrorBoundary from '@/components/Common/ErrorBoundary';
import { useDashboardState } from '@/hooks/useDashboardState';
import { useSensorData } from '@/hooks/useSensorData';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import './DashboardPage.css';

const DashboardPage = () => {
	const {
		persistentSensorData,
		switchStates,
		userInteraction,
		autoMode,
		activities,
		handleDeviceToggle,
		toggleAutoMode
	} = useDashboardState();

	const { data, isUsingMockData, isLoading } = useSensorData(persistentSensorData);
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

			{/* Row 1: Sensor Dashboard */}
			<Row className="mb-4">
				<Col xs={12}>
					<ErrorBoundary>
						<SensorDashboard />
					</ErrorBoundary>
				</Col>
			</Row>

			{/* Row 2: 🤖 Automation Control | Latest Voice Command */}
			<Row className="mb-4">
				<Col lg={6} className="mb-3">
					<AutoModeControl
						autoMode={autoMode}
						userInteraction={userInteraction}
						onToggle={toggleAutoMode}
					/>
				</Col>
				<Col lg={6} className="mb-3">
					<VoiceCommandDisplay
						latestVoiceCommand={latestVoiceCommand}
						formatDateTime={formatDateTime}
					/>
				</Col>
			</Row>

			{/* Row 3: Device Control Center */}
			<Row className="mb-4">
				<Col xs={12}>
					<DeviceControlCenter
						activities={activities}
						switchStates={switchStates}
						onDeviceToggle={handleDeviceToggle}
						voiceCommandTrigger={latestVoiceCommand}
					/>
				</Col>
			</Row>

			{/* Row 4: Full Width Line Chart */}
			<Row className="mb-4">
				<Col xs={12}>
					<Card className="chart-card">
						{/* <Card.Header className="bg-light">
							<h5 className="mb-0">📈 Sensor Data Trends (20 Latest Points)</h5>
						</Card.Header> */}
						<Card.Body>
							<AppLineChart />
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</Container>
	);
};

export default withAuth(DashboardPage);
