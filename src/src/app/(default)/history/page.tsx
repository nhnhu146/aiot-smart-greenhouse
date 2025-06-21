'use client';
import { useEffect, useState } from 'react';
import { Container, Card } from 'react-bootstrap';
import axios from 'axios';

const History = () => {
    const [data, setData] = useState<any[]>([]);

    // Fetch data when component is mounted
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/api/cloud');

                if (response.status === 200) {
                    let fetchedData = response.data;

                    if (Array.isArray(fetchedData)) {
                        // Sort data by entryId in descending order
                        fetchedData.sort((a, b) => (b.entryId || 0) - (a.entryId || 0));
                        setData(fetchedData);
                    } else {
                        console.error('Data is not an array', fetchedData);
                        setData([]);
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, []);

    return (
        <Container className="my-3">
            <h3 className="mb-4 mx-2">Let's check your Cloud!</h3>
            {Array.isArray(data) && data.length === 0 ? (
                <p>Loading data...</p>
            ) : (
                Array.isArray(data) && data.map((entry: any, index: number) => (
                    <Card
                        key={index}
                        style={{ width: '100%', height: '100px', borderRadius: '15px', margin: '10px 0', boxShadow: '0 0 10px rgba(87, 174, 9, 0.3)' }}
                    >
                        <Card.Body>
                            <p><b>DateTime:</b> {entry.date || 'N/A'}</p>
                            <p>
                                <b> Light sensor:</b> {entry.light || 'N/A'}
                                <b> Distance:</b> {entry.distance || 'N/A'}
                                <b> Moisture:</b> {entry.moisture || 'N/A'}
                                <b> Temperature:</b> {entry.temperature || 'N/A'}
                                <b> Humidity:</b> {entry.humidity || 'N/A'}
                                <b> PIR:</b> {entry.pirIn || 'N/A'}
                                <b> Float switch:</b> {entry.floatSwitch || 'N/A'}
                                <b> Rain:</b> {entry.rain || 'N/A'}
                            </p>
                        </Card.Body>
                    </Card>
                ))
            )}
        </Container>
    );
};

export default History;
