"use client";

import React from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { Card, Row, Col, Badge } from 'react-bootstrap';

interface SensorCardProps {
    title: string;
    value: string;
    unit: string;
    icon: string;
    color: string;
}

const SensorCard: React.FC<SensorCardProps> = ({ title, value, unit, icon, color }) => (
    <Card className="h-100 shadow-sm" style={{ outline: 'none', border: 'none', borderRadius: '12px', boxShadow: '0 6px 15px rgba(0, 0, 0, 0.08)' }}>
        <Card.Body className="d-flex align-items-center">
            <div className={`me-3 fs-1 text-${color}`}>
                {icon}
            </div>
            <div>
                <Card.Title className="mb-1 fs-6">{title}</Card.Title>
                <Card.Text className="mb-0 fs-4 fw-bold">
                    {value} <small className="text-muted">{unit}</small>
                </Card.Text>
            </div>
        </Card.Body>
    </Card>
);

const SensorDashboard: React.FC = () => {
    const { sensorData, isConnected } = useWebSocketContext();
    const [sensors, setSensors] = React.useState({
        temperature: { value: '--', timestamp: null },
        humidity: { value: '--', timestamp: null },
        soil: { value: '--', timestamp: null },
        water: { value: '--', timestamp: null },
        light: { value: '--', timestamp: null },
        rain: { value: '--', timestamp: null }
    });

    React.useEffect(() => {
        if (sensorData) {
            const { sensor, data, timestamp } = sensorData;
            const value = typeof data === 'object' ? data.value : data;

            setSensors(prev => ({
                ...prev,
                [sensor]: { value: value.toString(), timestamp }
            }));
        }
    }, [sensorData]);

    const sensorCards = [
        {
            key: 'temperature',
            title: 'Temperature',
            unit: '°C',
            icon: '🌡️',
            color: 'danger'
        },
        {
            key: 'humidity',
            title: 'Humidity',
            unit: '%',
            icon: '💧',
            color: 'info'
        },
        {
            key: 'soil',
            title: 'Soil Moisture',
            unit: '',
            icon: '🌱',
            color: 'success'
        },
        {
            key: 'water',
            title: 'Water Level',
            unit: '',
            icon: '🚰',
            color: 'primary'
        },
        {
            key: 'light',
            title: 'Light Level',
            unit: 'lux',
            icon: '☀️',
            color: 'warning'
        },
        {
            key: 'rain',
            title: 'Rain Status',
            unit: '',
            icon: '🌧️',
            color: 'secondary'
        }
    ];

    const containerStyle = {
        outline: 'none'
    };

    return (
        <div style={containerStyle}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 style={{ color: '#2b512b', fontSize: '1.6rem', outline: 'none' }}>Sensor Dashboard</h2>
                <Badge bg={isConnected ? 'success' : 'danger'} style={{ outline: 'none' }}>
                    {isConnected ? '🟢 Live Data' : '🔴 Disconnected'}
                </Badge>
            </div>

            <Row className="g-3" style={{ outline: 'none' }}>
                {sensorCards.map(({ key, title, unit, icon, color }) => (
                    <Col key={key} xs={12} sm={6} lg={4} style={{ outline: 'none' }}>
                        <SensorCard
                            title={title}
                            value={sensors[key as keyof typeof sensors].value}
                            unit={unit}
                            icon={icon}
                            color={color}
                        />
                    </Col>
                ))}
            </Row>

            {sensorData && (
                <div className="mt-3" style={{ outline: 'none' }}>
                    <small className="text-muted">
                        Last update: {new Date(sensorData.timestamp).toLocaleString()}
                    </small>
                </div>
            )}
        </div>
    );
};

export default SensorDashboard;
