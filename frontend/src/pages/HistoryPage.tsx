import React, { useState } from "react";
import { Container, Alert, Tab, Tabs } from "react-bootstrap";
import { useHistoryData } from "@/hooks/useHistoryData";
import { useHistoryFilters } from "@/hooks/useHistoryFilters";
import { useHistorySort } from "@/hooks/useHistorySort";
import { useHistoryExport } from "@/hooks/useHistoryExport";
import SensorDataTable from "@/components/History/SensorDataTable";
import DeviceControlTable from "@/components/History/DeviceControlTable";
import VoiceCommandTable from "@/components/History/VoiceCommandTable";
import TabContent from "@/components/History/TabContent";
import HistoryHeader from "@/components/History/HistoryHeader";
import HistoryFilters from "@/components/History/HistoryFilters";
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

	const { isExporting, exportData } = useHistoryExport();

	const {
		sensorData,
		deviceControls,
		voiceCommands,
		sensorPagination,
		devicePagination,
		voicePagination,
		handlePageChange: hookHandlePageChange,
	} = useHistoryData(appliedFilters, sensorSort, deviceSort, voiceSort);

	const handlePageChange = (page: number) => {
		hookHandlePageChange(activeTab, page);
	};

	const handleExportData = (format: 'json' | 'csv') => {
		exportData(format, activeTab, appliedFilters);
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
						emptyMessage="No sensor data found. Try adjusting filters or check your connection."
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
						emptyMessage="No device control data found. Try adjusting filters or check your connection."
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
						emptyMessage="No voice commands found. Try adjusting filters or check your connection."
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
					onExportData={handleExportData}
					isExporting={isExporting}
					hasActiveFilters={hasActiveFilters}
				/>

				<HistoryFilters
					filters={filters}
					showFilters={showFilters}
					onFilterChange={updateFilter}
					onClearFilters={clearFilters}
					onApplyFilters={applyFilters}
					hasActiveFilters={hasActiveFilters}
				/>

				{hasActiveFilters && (
					<Alert variant="info" className="mb-3">
						<strong>Filters Active:</strong> Some filters are currently applied.
						Results may be limited.
					</Alert>
				)}



				<Tabs
					activeKey={activeTab}
					onSelect={(tab) => setActiveTab(tab as "sensors" | "controls" | "voice")}
					className="mb-4 history-tabs"
				>
					<Tab
						eventKey="sensors"
						title={
							<span>
								📊 Sensors
								<span className="tab-count">{sensorPagination.total}</span>
							</span>
						}
					/>
					<Tab
						eventKey="controls"
						title={
							<span>
								🎛️ Controls
								<span className="tab-count">{devicePagination.total}</span>
							</span>
						}
					/>
					<Tab
						eventKey="voice"
						title={
							<span>
								🎤 Voice
								<span className="tab-count">{voicePagination.total}</span>
							</span>
						}
					/>
				</Tabs>

				{renderTabContent()}
			</Container>
		</div>
	);
};

export default withAuth(HistoryPage);
