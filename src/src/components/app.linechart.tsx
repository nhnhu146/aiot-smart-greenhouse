"use client";
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { CDBContainer } from 'cdbreact';

// Register the components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface WeekData {
    distance: number | null;
    humidity: number | null;
    moisture: number | null;
    temperature: number | null;
}

const AppLineChart = () => {
    const [weekData, setWeekData] = useState<WeekData[]>([]);
    const [error, setError] = useState("");
    const [data, setData] = useState({
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
        datasets: [
            {
                label: 'Actual development',
                fill: false,
                lineTension: 0.1,
                backgroundColor: 'rgba(15, 107, 67, 0.5)',
                borderColor: 'rgb(15, 107, 67)',
                borderCapStyle: 'butt',
                borderDash: [],
                borderDashOffset: 0.0,
                borderJoinStyle: 'miter',
                pointBorderColor: 'rgba(75,192,192,1)',
                pointBackgroundColor: '#fff',
                pointBorderWidth: 1,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: 'rgba(71, 225, 167, 0.5)',
                pointHoverBorderColor: 'rgb(71, 225, 167)',
                pointHoverBorderWidth: 2,
                pointRadius: 1,
                pointHitRadius: 10,
                data: [] as number[], // Initialize with an empty array of numbers
            },
            {
                label: 'Predicted development',
                fill: false,
                lineTension: 0.1,
                backgroundColor: 'rgba(35, 156, 234, 0.5)',
                borderColor: 'rgb(35, 156, 234)',
                borderCapStyle: 'butt',
                borderDash: [10, 5],
                borderDashOffset: 0.0,
                borderJoinStyle: 'miter',
                pointBorderColor: 'rgba(75,192,192,1)',
                pointBackgroundColor: '#fff',
                pointBorderWidth: 1,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: 'rgba(71, 225, 167, 0.5)',
                pointHoverBorderColor: 'rgb(71, 225, 167)',
                pointHoverBorderWidth: 2,
                pointRadius: 1,
                pointHitRadius: 10,
                data: [] as number[], // Initialize with an empty array of numbers
            },
        ],
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch("/api/predict", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ startDate: "2024-12-16" }),
                });

                const result = await response.json();

                if (response.ok) {
                    setWeekData(result.weeksData);

                    const actualData: number[] = [];
                    const predictedData: number[] = [];

                    // Extract distance data and calculate predicted productivity
                    result.weeksData.forEach((week: WeekData) => {
                        // Calculate actual value, ensuring it's a number or null
                        const actual = (week.distance !== null) ? Math.max(0, 4.5 - week.distance) : null;

                        // Calculate predicted productivity if all conditions are met
                        const predict = (week.distance !== null && week.humidity !== null && week.moisture !== null && week.temperature !== null)
                            ? (
                                (2.77485584e-01 * (predictedData.length + 1) +
                                    8.57036005e-05 * week.moisture -
                                    6.74238917e-03 * week.temperature +
                                    1.21854438e-02 * week.humidity -
                                    1.109296820227019) < 0
                                    ? 0
                                    : Math.round(
                                        (2.77485584e-01 * (predictedData.length + 1) +
                                            8.57036005e-05 * week.moisture -
                                            6.74238917e-03 * week.temperature +
                                            1.21854438e-02 * week.humidity -
                                            1.109296820227019) * 100
                                    ) / 100
                            ) : (
                                (2.77485584e-01 * (predictedData.length + 1) +
                                    8.57036005e-05 * 4095 -
                                    6.74238917e-03 * 29 +
                                    1.21854438e-02 * 57 -
                                    1.109296820227019) < 0
                                    ? 0
                                    : Math.round(
                                        (2.77485584e-01 * (predictedData.length + 1) +
                                            8.57036005e-05 * 4095 -
                                            6.74238917e-03 * 28 +
                                            1.21854438e-02 * 57 -
                                            1.109296820227019) * 100
                                    ) / 100
                            );

                        // Push the actual and predicted values to their respective arrays
                        if (actual !== null)
                            actualData.push(actual);
                        if (predict !== null)
                            predictedData.push(predict);
                    });


                    // Update data with correct typing
                    setData(prevData => ({
                        ...prevData,
                        datasets: [
                            { ...prevData.datasets[0], data: actualData },
                            { ...prevData.datasets[1], data: predictedData },
                        ],
                    }));
                } else {
                    setError(result.error || "An error occurred while fetching data.");
                }
            } catch (err) {
                setError("Could not connect to the API.");
            }
        }

        fetchData();
    }, []);

    return (
        <CDBContainer>
            <Line data={data} options={{ responsive: true }} />
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </CDBContainer>
    );
};

export default AppLineChart;
