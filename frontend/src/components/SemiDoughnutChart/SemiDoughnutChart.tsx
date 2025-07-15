'use client';

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
	Chart as ChartJS,
	ArcElement,
	Tooltip,
	Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import styles from './SemiDoughnutChart.module.scss';

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
		<div className={styles.chartCard}>
			<p className={styles.label}>{label}</p>
			<Doughnut data={data} options={options} />
		</div>
	);
};

export default AppSemiDoughnutChart;