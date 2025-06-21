'use client'
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import AppLineChart from '@/components/app.linechart';
import AppSemiDoughnutChart from '@/components/app.semidoughnutchart';
import { useEffect, useState } from 'react';
import axios from 'axios';

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
        <Container className='my-3'>
            <h3>Welcome to GreenHouse.</h3>
            <Row className='my-3 align-items-center justify-content-center'>
                <Col sm={8}>
                    <Card>
                        <Card.Body>Development Prediction Chart</Card.Body>
                        <div className='my-3'>
                            <AppLineChart />
                        </div>
                    </Card>
                </Col>
            </Row>
            <Row className='my-3'>
                <Col>
                    <Card>
                        <Card.Body>Humidity</Card.Body>
                        <AppSemiDoughnutChart
                            label="Humidity"
                            value={data.humidity}
                            maxValue={90}
                            unit='%'
                        />
                    </Card>
                </Col>
                <Col>
                    <Card>
                        <Card.Body>Soil moisture</Card.Body>
                        <AppSemiDoughnutChart
                            label="Moisture"
                            value={(4095 - data.moisture) / 4095 * 100}
                            maxValue={100}
                            unit='%'
                        />
                    </Card>
                </Col>
                <Col>
                    <Card>
                        <Card.Body>Temperature</Card.Body>
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