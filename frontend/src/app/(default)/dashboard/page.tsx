'use client'
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import AppLineChart from '@/components/LineChart/LineChart';
import AppSemiDoughnutChart from '@/components/SemiDoughnutChart/SemiDoughnutChart';
import { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './dashboard.module.scss';

const Dashboard = () => {
    const [data, setData] = useState<{ humidity: number; moisture: number; temperature: number } | null>(null);

    useEffect(() => {
        // Fetch data from your API
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

    if (!data) {
        return <div>Loading...</div>;
    }
    return (
        <Container className={styles.dashboardContainer}>
            <h3>Welcome to GreenHouse</h3>
            <Row className={`my-3 align-items-center justify-content-center ${styles.chartRow}`}>
                <Col sm={8}>
                    <Card className={styles.chartCard}>
                        <Card.Body className={styles.chartTitle}>Development Prediction Chart</Card.Body>
                        <div className='my-3'>
                            <AppLineChart />
                        </div>
                    </Card>
                </Col>
            </Row>

            <Row className={`my-3 ${styles.chartRow}`}>
                <Col>
                    <Card className={styles.doughnutCard}>
                        <Card.Body className={styles.chartTitle}>Humidity</Card.Body>
                        <AppSemiDoughnutChart
                            label="Humidity"
                            value={data.humidity}
                            maxValue={90}
                            unit='%'
                        />
                    </Card>
                </Col>
                <Col>
                    <Card className={styles.doughnutCard}>
                        <Card.Body className={styles.chartTitle}>Soil moisture</Card.Body>
                        <AppSemiDoughnutChart
                            label="Moisture"
                            value={(4095 - data.moisture) / 4095 * 100}
                            maxValue={100}
                            unit='%'
                        />
                    </Card>
                </Col>
                <Col>
                    <Card className={styles.doughnutCard}>
                        <Card.Body className={styles.chartTitle}>Temperature</Card.Body>
                        <AppSemiDoughnutChart
                            label="Temperature"
                            value={data.temperature}
                            maxValue={50}
                            unit='°C'
                        />
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default Dashboard;