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
		appliedFilters,
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
		sensorPagination,
		devicePagination,
		voicePagination,
		loading,
		handlePageChange: hookHandlePageChange,
	} = useHistoryData(appliedFilters, sensorSort, deviceSort, voiceSort);

	const handlePageChange = (page: number) => {
		hookHandlePageChange(activeTab, page);
	};

	const exportData = () => {
		// Placeholder for export functionality
		console.log('Export data for', activeTab);
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
						isEmpty={sensorData.length === 0 && !loading.sensors}
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
						isEmpty={deviceControls.length === 0 && !loading.controls}
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
						isEmpty={voiceCommands.length === 0 && !loading.voice}
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

	const isLoading = loading.sensors || loading.controls || loading.voice;

	return (
		<div className="history-container">
			<Container fluid>
				<HistoryHeader
					onToggleFilters={toggleFilters}
					onExportData={exportData}
					isExporting={false}
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
					hasActiveFilters={hasActiveFilters}
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
								<span className="tab-count">{sensorData.length}</span>
							</span>
						}
					/>
					<Tab
						eventKey="controls"
						title={
							<span>
								🎛️ Controls
								<span className="tab-count">{deviceControls.length}</span>
							</span>
						}
					/>
					<Tab
						eventKey="voice"
						title={
							<span>
								🎤 Voice
								<span className="tab-count">{voiceCommands.length}</span>
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
