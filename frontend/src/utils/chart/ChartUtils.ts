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
				return new Date().toISOString();
			}
			return date.toISOString();
		} catch (error) {
			console.error('Chart error:', error);
			return new Date().toISOString();
		}
	}

	/**
	 * Filter out invalid data points (missing timestamps or invalid dates)
	 * Also removes duplicate timestamps for better chart rendering
	 */
	static filterValidData(data: ChartDataPoint[]): ChartDataPoint[] {
		const seenTimestamps = new Set<string>();

		return data.filter(item => {
			if (!item.timestamp) return false;

			// Check for common invalid date strings
			if (typeof item.timestamp === 'string' && item.timestamp.includes('Invalid Date')) {
				return false;
			}

			const date = new Date(item.timestamp);
			const isValid = !isNaN(date.getTime());

			if (!isValid) {
				// Skip invalid timestamps - continue with filter
				return false;
			}

			// Remove duplicates based on timestamp string
			const timestampStr = date.toISOString();
			if (seenTimestamps.has(timestampStr)) {
				console.log('🔄 Filtering duplicate timestamp in chart data:', timestampStr);
				return false;
			}

			seenTimestamps.add(timestampStr);
			return true;
		});
	}

	/**
	 * Format chart data for Chart.js with data-point-based scaling (not time-based)
	 */
	static formatForChart(data: ChartDataPoint[], selectedMetrics: string[]) {
		const validData = this.filterValidData(data);

		if (validData.length === 0) {
			return {
				labels: [],
				datasets: []
			};
		}

		// Use formatted date strings as labels instead of Date objects for data-point-based scaling
		const labels = validData.map(item => {
			const date = new Date(item.timestamp);
			// Format as 24-hour format: DD/MM/YYYY HH:mm:ss
			return date.toLocaleString('en-GB', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false,
				timeZone: 'Asia/Ho_Chi_Minh'
			});
		});

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
	 * Get chart options with linear scaling (data-point-based, not time-based)
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
					type: 'category' as const, // Changed from 'time' to 'category' for data-point-based scaling
					title: {
						display: true,
						text: 'Time (UTC+7)'
					},
					ticks: {
						maxTicksLimit: 10, // Limit number of ticks for better readability
						callback: function (value: any, index: number, ticks: any[]): string {
							// Show every nth tick based on data length
							const totalTicks = ticks.length || 0;
							const step = Math.ceil(totalTicks / 8); // Show ~8 ticks max
							if (index % step === 0) {
								// @ts-ignore - this context is from Chart.js
								const labels = this.chart?.data?.labels;
								return labels?.[index] || value;
							}
							return '';
						}
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
