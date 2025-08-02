import React, { useState } from "react";
import { Container, Alert, Tab, Tabs } from "react-bootstrap";
import { useHistoryData } from "@/hooks/useHistoryData";
import { useHistoryFilters } from "@/hooks/useHistoryFilters";
import { useHistorySort } from "@/hooks/useHistorySort";
import HistoryFilters from "@/components/History/HistoryFilters";
import SensorDataTable from "@/components/History/SensorDataTable";
import DeviceControlTable from "@/components/History/DeviceControlTable";
import VoiceCommandTable from "@/components/History/VoiceCommandTable";
import TabContent from "@/components/History/TabContent";
import HistoryHeader from "@/components/History/HistoryHeader";
import withAuth from "@/components/withAuth/withAuth";
import './HistoryPage.css';

const HistoryPage: React.FC = () => {
	const [activeTab, setActiveTab] = useState<"sensors" | "controls" | "voice">("sensors");

	// Custom hooks for state management
	const {
		filters,
		showFilters,
		updateFilter,
		applyFilters,
		clearFilters,
		toggleFilters,
		hasActiveFilters
	} = useHistoryFilters();

	const {
		sensorSort,
		deviceSort,
		voiceSort,
		handleSort
	} = useHistorySort();

	const {
		sensorData,
		deviceControls,
		voiceCommands,
		dataCounts,
		isLoading,
		isExporting,
		sensorPagination,
		devicePagination,
		voicePagination,
		fetchSensorData,
		fetchDeviceData,
		fetchVoiceData,
		exportData,
	} = useHistoryData(filters, sensorSort, deviceSort, voiceSort);

	const handlePageChange = (page: number) => {
		switch (activeTab) {
			case 'sensors':
				fetchSensorData(page);
				break;
			case 'controls':
				fetchDeviceData(page);
				break;
			case 'voice':
				fetchVoiceData(page);
				break;
		}
	};

	const renderTabContent = () => {
		switch (activeTab) {
			case 'sensors':
				return (
					<TabContent
						title="Sensor Data"
						icon="📊"
						pagination={sensorPagination}
						onPageChange={handlePageChange}
						isEmpty={sensorData.length === 0}
						emptyMessage="No sensor data found"
					>
						<SensorDataTable
							data={sensorData}
							sortState={sensorSort}
							onSort={handleSort}
						/>
					</TabContent>
				);

			case 'controls':
				return (
					<TabContent
						title="Device Controls"
						icon="🎛️"
						pagination={devicePagination}
						onPageChange={handlePageChange}
						isEmpty={deviceControls.length === 0}
						emptyMessage="No device control data found"
					>
						<DeviceControlTable
							data={deviceControls}
							sortState={deviceSort}
							onSort={handleSort}
						/>
					</TabContent>
				);

			case 'voice':
				return (
					<TabContent
						title="Voice Commands"
						icon="🎤"
						pagination={voicePagination}
						onPageChange={handlePageChange}
						isEmpty={voiceCommands.length === 0}
						emptyMessage="No voice commands found"
					>
						<VoiceCommandTable
							data={voiceCommands}
							sortState={voiceSort}
							onSort={handleSort}
						/>
					</TabContent>
				);

			default:
				return null;
		}
	};

	return (
		<div className="history-container">
			<Container fluid>
				<HistoryHeader
					onToggleFilters={toggleFilters}
					onExportData={exportData}
					isExporting={isExporting}
					hasActiveFilters={hasActiveFilters}
				/>

				{hasActiveFilters && (
					<Alert variant="info" className="mb-3">
						<strong>Filters Active:</strong> Some filters are currently applied.
						Results may be limited.
					</Alert>
				)}

				<HistoryFilters
					filters={filters}
					showFilters={showFilters}
					onFilterChange={updateFilter}
					onApplyFilters={applyFilters}
					onClearFilters={clearFilters}
					onToggleFilters={toggleFilters}
				/>

				<Tabs
					activeKey={activeTab}
					onSelect={(tab) => setActiveTab(tab as "sensors" | "controls" | "voice")}
					className="mb-4"
				>
					<Tab
						eventKey="sensors"
						title={
							<span>
								📊 Sensors
								<span className="tab-count">{dataCounts.sensors}</span>
							</span>
						}
					/>
					<Tab
						eventKey="controls"
						title={
							<span>
								🎛️ Controls
								<span className="tab-count">{dataCounts.devices}</span>
							</span>
						}
					/>
					<Tab
						eventKey="voice"
						title={
							<span>
								🎤 Voice
								<span className="tab-count">{dataCounts.voice}</span>
							</span>
						}
					/>
				</Tabs>

				{isLoading ? (
					<div className="loading-spinner">
						<div className="spinner-border text-primary" role="status">
							<span className="sr-only">Loading...</span>
						</div>
						<span className="ms-2">Loading data...</span>
					</div>
				) : (
					renderTabContent()
				)}
			</Container>
		</div>
	);
};

export default withAuth(HistoryPage);
