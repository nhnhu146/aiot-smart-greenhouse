import React from 'react';
import './SensorCard.css';

interface SensorCardProps {
    title: string;
    value: string;
    unit: string;
    icon: string;
    color: string;
}

const SensorCard: React.FC<SensorCardProps> = ({ title, value, unit, icon, color }) => {
    // Special handling for binary sensors
    let displayValue = value;
    let displayUnit = unit;

    if (title === 'Soil Moisture') {
        if (value === '1') {
            displayValue = 'Wet';
            displayUnit = '';
        } else if (value === '0') {
            displayValue = 'Dry';
            displayUnit = '';
        } else if (!value || value === '--' || value === 'null' || value === 'undefined') {
            displayValue = 'N/A';
            displayUnit = '';
        }
    } else if (title === 'Water Level') {
        if (value === '1') {
            displayValue = 'Full';
            displayUnit = '';
        } else if (value === '0') {
            displayValue = 'None';
            displayUnit = '';
        } else if (!value || value === '--' || value === 'null' || value === 'undefined') {
            displayValue = 'N/A';
            displayUnit = '';
        }
    } else if (title === 'Light Level') {
        if (value === '1') {
            displayValue = 'Bright';
            displayUnit = '';
        } else if (value === '0') {
            displayValue = 'Dark';
            displayUnit = '';
        } else if (!value || value === '--' || value === 'null' || value === 'undefined') {
            displayValue = 'N/A';
            displayUnit = '';
        }
    } else if (title === 'Rain Status') {
        if (value === '1' || value === 'true') {
            displayValue = 'Raining';
            displayUnit = '';
        } else if (value === '0' || value === 'false') {
            displayValue = 'No Rain';
            displayUnit = '';
        } else if (!value || value === '--' || value === 'null' || value === 'undefined') {
            displayValue = 'N/A';
            displayUnit = '';
        }
    } else {
        // For other sensors, display "N/A" if value is invalid or empty
        displayValue = (!value || value === '--' || value === 'null' || value === 'undefined') ? 'N/A' : value;
    }

    const isValidValue = displayValue !== 'N/A';

    return (
        <div className={`sensor-card ${color}`}>
            <div className="sensor-icon">{icon}</div>
            <div className="sensor-info">
                <h3 className="sensor-title">{title}</h3>
                <div className={`sensor-value ${isValidValue ? 'valid' : 'invalid'}`}>
                    {displayValue}
                    {displayUnit && <span className="sensor-unit">{displayUnit}</span>}
                </div>
            </div>
        </div>
    );
};

export default SensorCard;
