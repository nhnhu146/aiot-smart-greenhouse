'use client';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import AppLineChart from '@/components/LineChart/LineChart';
import AppSemiDoughnutChart from '@/components/SemiDoughnutChart/SemiDoughnutChart';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/app/firebase/config';
import styles from './dashboard.module.scss';
import publishMessage from '@/hooks/publishMQTT';

const Dashboard = () => {
  const [data, setData] = useState<{ humidity: number; moisture: number; temperature: number } | null>(null);
  const [user] = useAuthState(auth);

  const [deviceStatus, setDeviceStatus] = useState({
    lights: false,
    fan: false,
    watering: false,
    door: false,
    window: false,
  });

  const toggleDevice = (device: keyof typeof deviceStatus) => {
    // Chỉ thực hiện nếu thiết bị chưa được bật
    if (deviceStatus[device]) return;
    
    setDeviceStatus(prev => ({ ...prev, [device]: true }));
    
    const topic = `HKT_greenhouse/${device}`;
    publishMessage(topic, 'HIGH');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/sensor-data');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  if (!data || !user) {
    return <div>Loading...</div>;
  }

  return (
    <Container className={styles.dashboardContainer}>
      <h3>Welcome, {user.email}</h3>

      <Row className={`my-3 ${styles.chartRow}`}>
        <Col md={6}>
          <Card className={styles.deviceStatusCard}>
            <Card.Body>
                <h5 className={styles.statusTitle}>Device Status</h5>
                    <div className={styles.deviceStatusRow}>
                    <div className={styles.deviceItem}>💡 Lights: {deviceStatus.lights ? 'ON' : 'OFF'}</div>
                    <div className={styles.deviceItem}>🌬️ Fan: {deviceStatus.fan ? 'ON' : 'OFF'}</div>
                    <div className={styles.deviceItem}>💧 Watering: {deviceStatus.watering ? 'ON' : 'OFF'}</div>
                    <div className={styles.deviceItem}>🚪 Door: {deviceStatus.door ? 'OPEN' : 'CLOSE'}</div>
                    <div className={styles.deviceItem}>🪟 Window: {deviceStatus.window ? 'OPEN' : 'CLOSE'}</div>
                </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className={styles.quickControlCard}>
            <Card.Body>
              <h5 className={styles.controlTitle}>Quick Control</h5>
              <div className={styles.quickControlRow}>
                <Button
                  className={styles.controlButton}
                  onClick={() => toggleDevice('lights')}
                >
                  💡 Turn On Lights
                </Button>
                <Button
                  className={styles.controlButton}
                  onClick={() => toggleDevice('door')}
                >
                  🚪 Open Door
                </Button>
                <Button
                  className={styles.controlButton}
                  onClick={() => toggleDevice('fan')}
                >
                  🌬️ Turn On Fan
                </Button>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    className={styles.controlButton}
                    onClick={() => toggleDevice('watering')}
                  >
                    💧 Start Watering
                  </Button>
                  <Button
                    className={styles.controlButton}
                    onClick={() => toggleDevice('window')}
                  >
                    🪟 Open Window
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className={`my-3 ${styles.chartRow}`}>
        <Col>
          <Card className={styles.doughnutCard}>
            <Card.Body className={styles.chartTitle}>Humidity</Card.Body>
            <AppSemiDoughnutChart label="Humidity" value={data.humidity} maxValue={90} unit="%" />
          </Card>
        </Col>
        <Col>
          <Card className={styles.doughnutCard}>
            <Card.Body className={styles.chartTitle}>Soil Moisture</Card.Body>
            <AppSemiDoughnutChart
              label="Moisture"
              value={(4095 - data.moisture) / 4095 * 100}
              maxValue={100}
              unit="%"
            />
          </Card>
        </Col>
        <Col>
          <Card className={styles.doughnutCard}>
            <Card.Body className={styles.chartTitle}>Temperature</Card.Body>
            <AppSemiDoughnutChart label="Temperature" value={data.temperature} maxValue={50} unit="°C" />
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
