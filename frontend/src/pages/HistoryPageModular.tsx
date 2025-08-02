import React, { useState } from 'react';
import { Container, Tab, Tabs } from 'react-bootstrap';
import withAuth from '@/components/withAuth/withAuth';
import HistoryFilters from '@/components/History/HistoryFiltersNew';
import HistoryHeader from '@/components/History/HistoryHeader';
import HistoryTabContent from '@/components/History/HistoryTabContent';
import { useHistoryFilters } from '@/hooks/useHistoryFiltersNew';
import { useHistorySort } from '@/hooks/useHistorySortNew';
import { useHistoryData } from '@/hooks/useHistoryDataNew';
import { useHistoryExport } from '@/hooks/useHistoryExport';
import './HistoryPage.css';

const HistoryPageModular: React.FC = () => {
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

	// Data fetching with applied filters and sorting
	const {
		sensorData,
		deviceControls,
		voiceCommands,
		sensorPagination,
		devicePagination,
		voicePagination,
		loading,
		handlePageChange,
		refreshData
	} = useHistoryData(appliedFilters, sensorSort, deviceSort, voiceSort);

	// Export functionality
	const { isExporting, exportData } = useHistoryExport();

	return (
		<Container fluid className="history-container">
			<HistoryHeader
				onToggleFilters={toggleFilters}
				onExportData={exportData}
				isExporting={isExporting}
				hasActiveFilters={hasActiveFilters}
			/>

			<HistoryFilters
				filters={filters}
				showFilters={showFilters}
				onFilterChange={updateFilter}
				onApplyFilters={applyFilters}
				onClearFilters={clearFilters}
				onToggleFilters={toggleFilters}
				hasActiveFilters={hasActiveFilters}
			/>

			<div className="tab-content-wrapper">
				<Tabs
					activeKey={activeTab}
					onSelect={(k) => setActiveTab(k as "sensors" | "controls" | "voice")}
					className="nav-tabs"
				>
					<Tab eventKey="sensors" title="📊 Sensor Data">
						<HistoryTabContent
							tab="sensors"
							data={sensorData}
							pagination={sensorPagination}
							sortState={sensorSort}
							onSort={handleSort}
							onPageChange={(page) => handlePageChange('sensors', page)}
							loading={loading.sensors}
							onRefresh={() => refreshData('sensors')}
						/>
					</Tab>

					<Tab eventKey="controls" title="🎛️ Device Controls">
						<HistoryTabContent
							tab="controls"
							data={deviceControls}
							pagination={devicePagination}
							sortState={deviceSort}
							onSort={handleSort}
							onPageChange={(page) => handlePageChange('controls', page)}
							loading={loading.controls}
							onRefresh={() => refreshData('controls')}
						/>
					</Tab>

					<Tab eventKey="voice" title="🎤 Voice Commands">
						<HistoryTabContent
							tab="voice"
							data={voiceCommands}
							pagination={voicePagination}
							sortState={voiceSort}
							onSort={handleSort}
							onPageChange={(page) => handlePageChange('voice', page)}
							loading={loading.voice}
							onRefresh={() => refreshData('voice')}
						/>
					</Tab>
				</Tabs>
			</div>
		</Container>
	);
};

export default withAuth(HistoryPageModular);
