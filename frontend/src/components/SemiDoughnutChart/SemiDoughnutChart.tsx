'use client';

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
	Chart as ChartJS,
	ArcElement,
	Tooltip,
	Legend,
} from 'chart.js';
import { CDBContainer } from 'cdbreact';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register necessary components
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface AppSemiDoughnutChartProps {
	label: string;
	value: number;
	maxValue: number;
	unit: string;
}

const AppSemiDoughnutChart: React.FC<AppSemiDoughnutChartProps> = ({ label, value, maxValue, unit }) => {
	const data = {
		labels: [label, ''],
		datasets: [
			{
				label: `${label} Level`,
				data: [value, maxValue - value],
				backgroundColor: [
					'#57AE09',
					'rgba(0, 0, 0, 0.25)',
				],
				borderWidth: 1,
			},
		],
	};

	const options = {
		responsive: true,
		cutout: '60%',
		rotation: -90,
		circumference: 180,
		plugins: {
			legend: {
				position: 'top' as const,
			},
			datalabels: {
				color: '#fff',
				font: {
					weight: 'bold' as const,
					size: 16,
				},
				formatter: (value: number, ctx: any) => {
					if (ctx.dataIndex === 0) {
						return `${Math.round(value)} ${unit}`;
					}
					return '';
				},
				anchor: 'center' as const,
				align: 'center' as const,
			},
		},
	};

	return (
		<CDBContainer>
			<Doughnut data={data} options={options} />
		</CDBContainer>
	);
};

export default AppSemiDoughnutChart;