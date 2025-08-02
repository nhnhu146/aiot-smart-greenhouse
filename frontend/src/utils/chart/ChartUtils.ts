/**
 * Chart utility functions for data processing and formatting
 * Optimized for Sensor Data Timeline visualization
 */

export interface ChartDataPoint {
	timestamp: string | Date;
	temperature?: number;
	humidity?: number;
	soilMoisture?: number;
	waterLevel?: number;
	lightLevel?: number;
	rainStatus?: boolean;
	plantHeight?: number;
}

export class ChartUtils {

	private static readonly CHART_COLORS = {
		temperature: '#dc2626', // Red with higher contrast
		humidity: '#2563eb', // Blue with higher contrast
		soilMoisture: '#16a34a', // Green with higher contrast
		waterLevel: '#0f172a', // Dark blue with higher contrast
		lightLevel: '#d97706', // Orange with higher contrast
		rainStatus: '#4b5563', // Gray with higher contrast
		plantHeight: '#7c2d12' // Brown with higher contrast
	} as const;

	/**
	 * Normalize timestamp to prevent duplicate Date keywords and ensure HH:mm:ss format
	 */
	static normalizeTimestamp(timestamp: string | Date): string {
		if (!timestamp) return new Date().toISOString();

		try {
			const date = new Date(timestamp);
			if (isNaN(date.getTime())) {
				console.warn('Invalid timestamp detected:', timestamp);
				return new Date().toISOString();
			}
			return date.toISOString();
		} catch (error) {
			console.warn('Error parsing timestamp:', timestamp, 'Error:', error);
			return new Date().toISOString();
		}
	}

	/**
	 * Filter out invalid data points (missing timestamps or invalid dates)
	 */
	static filterValidData(data: ChartDataPoint[]): ChartDataPoint[] {
		return data.filter(item => {
			if (!item.timestamp) return false;

			// Check for common invalid date strings
			if (typeof item.timestamp === 'string' && item.timestamp.includes('Invalid Date')) {
				console.warn('Filtered out invalid date:', item.timestamp);
				return false;
			}

			const date = new Date(item.timestamp);
			const isValid = !isNaN(date.getTime());

			if (!isValid) {
				console.warn('Filtered out invalid timestamp:', item.timestamp);
			}

			return isValid;
		});
	}

	/**
	 * Format chart data for Chart.js with time validation
	 */
	static formatForChart(data: ChartDataPoint[], selectedMetrics: string[]) {
		const validData = this.filterValidData(data);

		if (validData.length === 0) {
			return {
				labels: [],
				datasets: []
			};
		}

		const labels = validData.map(item => new Date(item.timestamp));

		const datasets: Array<{
			label: string;
			data: number[];
			borderColor: string;
			backgroundColor: string;
			tension: number;
			fill: boolean;
		}> = [];

		selectedMetrics.forEach(metric => {
			if (validData.some(item => item[metric as keyof ChartDataPoint] !== undefined)) {
				datasets.push({
					label: this.getMetricLabel(metric),
					data: validData.map(item => {
						const value = item[metric as keyof ChartDataPoint];
						if (typeof value === 'number') {
							return value;
						} else if (typeof value === 'boolean') {
							return value ? 1 : 0;
						} else {
							return 0;
						}
					}),
					borderColor: this.CHART_COLORS[metric as keyof typeof this.CHART_COLORS],
					backgroundColor: this.CHART_COLORS[metric as keyof typeof this.CHART_COLORS] + '20',
					tension: 0.1,
					fill: false
				});
			}
		});

		return { labels, datasets };
	}

	private static getMetricLabel(metric: string): string {
		const labels = {
			temperature: 'Temperature (°C)',
			humidity: 'Humidity (%)',
			soilMoisture: 'Soil Moisture',
			waterLevel: 'Water Level',
			lightLevel: 'Light Level',
			rainStatus: 'Rain Status',
			plantHeight: 'Plant Height (cm)'
		};

		return labels[metric as keyof typeof labels] || metric;
	}

	/**
	 * Get chart options with proper time scale and Vietnamese timezone
	 */
	static getChartOptions() {
		return {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					position: 'top' as const,
				},
				title: {
					display: false,
				},
			},
			scales: {
				x: {
					type: 'time' as const,
					time: {
						displayFormats: {
							minute: 'HH:mm',
							hour: 'HH:mm',
							day: 'MM-dd',
						},
					},
					title: {
						display: true,
						text: 'Time (UTC+7)'
					}
				},
				y: {
					beginAtZero: true,
					title: {
						display: true,
						text: 'Value'
					}
				},
			},
			interaction: {
				mode: 'index' as const,
				intersect: false,
			},
		};
	}
}
