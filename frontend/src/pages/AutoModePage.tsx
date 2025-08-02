import AutomationHeader from '@/components/AutoMode/AutomationHeader';
import AutomationMessageDisplay from '@/components/AutoMode/AutomationMessageDisplay';
import ControlToggleCard from '@/components/AutoMode/ControlToggleCard';
import LightThresholdCard from '@/components/AutoMode/LightThresholdCard';
import PumpThresholdCard from '@/components/AutoMode/PumpThresholdCard';
import TemperatureThresholdCard from '@/components/AutoMode/TemperatureThresholdCard';
import RainSettingsCard from '@/components/AutoMode/RainSettingsCard';
import AutomationActions from '@/components/AutoMode/AutomationActions';
import { useAutomationPage } from '@/hooks/useAutomationPage';
import './AutoModePage.css';

const AutoModePage = () => {
	const {
		settings,
		loading,
		saving,
		resetting,
		reloading,
		runningCheck,
		message,
		autoMode,
		isAnyActionInProgress,
		handleAutomationToggle,
		handleInputChange,
		saveSettings,
		loadSettings,
		resetToDefaults,
		runAutomationCheck
	} = useAutomationPage();

	if (loading) {
		return (
			<div className="automode-loading">
				<div>Loading automation settings...</div>
			</div>
		);
	}

	return (
		<div className="automode-container">
			<AutomationHeader
				autoMode={autoMode}
				isAnyActionInProgress={isAnyActionInProgress}
				onToggle={handleAutomationToggle}
			/>

			<AutomationMessageDisplay message={message} />

			<div className="settings-grid">
				<ControlToggleCard
					settings={settings}
					isAnyActionInProgress={isAnyActionInProgress}
					onInputChange={handleInputChange}
				/>

				<LightThresholdCard
					lightThresholds={settings.lightThresholds}
					isAnyActionInProgress={isAnyActionInProgress}
					onInputChange={handleInputChange}
				/>

				<PumpThresholdCard
					pumpThresholds={settings.pumpThresholds}
					isAnyActionInProgress={isAnyActionInProgress}
					onInputChange={handleInputChange}
				/>

				<TemperatureThresholdCard
					temperatureThresholds={settings.temperatureThresholds}
					isAnyActionInProgress={isAnyActionInProgress}
					onInputChange={handleInputChange}
				/>

				<RainSettingsCard
					rainSettings={settings.rainSettings}
					isAnyActionInProgress={isAnyActionInProgress}
					onInputChange={handleInputChange}
				/>
			</div>

			<AutomationActions
				isAnyActionInProgress={isAnyActionInProgress}
				saving={saving}
				reloading={reloading}
				runningCheck={runningCheck}
				resetting={resetting}
				onSave={saveSettings}
				onReload={loadSettings}
				onRunCheck={runAutomationCheck}
				onReset={resetToDefaults}
			/>
		</div>
	);
};

export default AutoModePage;
