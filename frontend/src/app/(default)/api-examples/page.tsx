'use client';

import React, { useState } from 'react';
import { Container, Card, Row, Col, Button, Badge, Tab, Tabs } from 'react-bootstrap';
import styles from './api-examples.module.scss';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const ApiExamples = () => {
	const [copiedItem, setCopiedItem] = useState<string | null>(null);

	const copyToClipboard = (text: string, itemId: string) => {
		navigator.clipboard.writeText(text).then(() => {
			setCopiedItem(itemId);
			setTimeout(() => setCopiedItem(null), 2000);
		});
	};

	const sensorEndpoints = [
		{
			method: 'GET',
			endpoint: '/api/sensors',
			description: 'Lấy dữ liệu cảm biến với phân trang',
			parameters: 'page, limit, from, to',
			example: '/api/sensors?page=1&limit=20',
			response: {
				success: true,
				data: [
					{
						_id: "sensor_id",
						temperature: 25.5,
						humidity: 65,
						soilMoisture: 0,
						waterLevel: 1,
						lightLevel: 15000,
						plantHeight: 35,
						rainStatus: false,
						createdAt: "2024-01-01T12:00:00Z"
					}
				],
				pagination: {
					page: 1,
					limit: 20,
					total: 100,
					totalPages: 5
				}
			}
		},
		{
			method: 'GET',
			endpoint: '/api/sensors/latest',
			description: 'Lấy dữ liệu cảm biến mới nhất',
			parameters: 'Không có',
			example: '/api/sensors/latest',
			response: {
				success: true,
				data: {
					temperature: 25.5,
					humidity: 65,
					soilMoisture: 0,
					createdAt: "2024-01-01T12:00:00Z"
				}
			}
		}
	];

	const deviceEndpoints = [
		{
			method: 'GET',
			endpoint: '/api/devices',
			description: 'Lấy trạng thái tất cả thiết bị',
			parameters: 'deviceType (optional)',
			example: '/api/devices?deviceType=light',
			response: {
				success: true,
				data: [
					{
						deviceId: "light-01",
						deviceType: "light",
						status: true,
						updatedAt: "2024-01-01T12:00:00Z"
					}
				]
			}
		},
		{
			method: 'POST',
			endpoint: '/api/devices/control',
			description: 'Điều khiển thiết bị',
			parameters: 'deviceType, action',
			example: '/api/devices/control',
			body: {
				deviceType: "light",
				action: "on"
			},
			response: {
				success: true,
				message: "Device control command sent successfully"
			}
		}
	];

	const historyEndpoints = [
		{
			method: 'GET',
			endpoint: '/api/history',
			description: 'Lấy dữ liệu lịch sử tổng hợp',
			parameters: 'page, limit, from, to',
			example: '/api/history?page=1&limit=50',
			response: {
				success: true,
				data: {
					sensorHistory: [],
					deviceHistory: [],
					alertHistory: []
				}
			}
		},
		{
			method: 'GET',
			endpoint: '/api/history/sensors',
			description: 'Lấy lịch sử dữ liệu cảm biến (24h mặc định)',
			parameters: 'page, limit, from, to',
			example: '/api/history/sensors?limit=100',
			response: {
				success: true,
				data: []
			}
		},
		{
			method: 'GET',
			endpoint: '/api/history/summary',
			description: 'Lấy tóm tắt lịch sử theo ngày',
			parameters: 'from, to',
			example: '/api/history/summary',
			response: {
				success: true,
				data: [
					{
						_id: { year: 2024, month: 1, day: 1 },
						avgTemperature: 25.5,
						avgHumidity: 65,
						totalReadings: 1440
					}
				]
			}
		},
		{
			method: 'GET',
			endpoint: '/api/history/device-controls',
			description: 'Lấy lịch sử điều khiển thiết bị (auto/manual)',
			parameters: 'page, limit, deviceType, controlType',
			example: '/api/history/device-controls?controlType=auto',
			response: {
				success: true,
				data: {
					controls: [],
					pagination: {}
				}
			}
		}
	];

	const alertEndpoints = [
		{
			method: 'GET',
			endpoint: '/api/alerts',
			description: 'Lấy danh sách cảnh báo',
			parameters: 'page, limit, from, to, resolved',
			example: '/api/alerts?resolved=false',
			response: {
				success: true,
				data: {
					alerts: [
						{
							_id: "alert_id",
							type: "temperature",
							message: "Temperature too high: 35°C",
							value: 35,
							threshold: { min: 18, max: 30 },
							resolved: false,
							timestamp: "2024-01-01T12:00:00Z"
						}
					]
				}
			}
		},
		{
			method: 'GET',
			endpoint: '/api/alerts/active',
			description: 'Lấy cảnh báo đang hoạt động (chưa giải quyết)',
			parameters: 'page, limit',
			example: '/api/alerts/active',
			response: {
				success: true,
				data: { alerts: [] }
			}
		},
		{
			method: 'POST',
			endpoint: '/api/alerts/resolve/:id',
			description: 'Đánh dấu cảnh báo đã xử lý',
			parameters: 'id (trong URL)',
			example: '/api/alerts/resolve/alert_id',
			response: {
				success: true,
				message: "Alert resolved successfully"
			}
		}
	];

	const settingsEndpoints = [
		{
			method: 'GET',
			endpoint: '/api/settings',
			description: 'Lấy cài đặt hệ thống',
			parameters: 'Không có',
			example: '/api/settings',
			response: {
				success: true,
				data: {
					temperatureThreshold: { min: 18, max: 30 },
					humidityThreshold: { min: 40, max: 80 },
					notifications: {
						email: true,
						emailRecipients: ["admin@example.com"]
					}
				}
			}
		},
		{
			method: 'POST',
			endpoint: '/api/settings/thresholds',
			description: 'Cập nhật ngưỡng cảnh báo',
			parameters: 'temperatureThreshold, humidityThreshold, etc.',
			example: '/api/settings/thresholds',
			body: {
				temperatureThreshold: { min: 18, max: 30 },
				humidityThreshold: { min: 40, max: 80 }
			},
			response: {
				success: true,
				message: "Thresholds updated successfully"
			}
		},
		{
			method: 'POST',
			endpoint: '/api/settings/email-recipients',
			description: 'Cập nhật danh sách email nhận cảnh báo',
			parameters: 'recipients[]',
			example: '/api/settings/email-recipients',
			body: {
				recipients: ["admin@example.com", "user@example.com"]
			},
			response: {
				success: true,
				message: "Email recipients updated successfully"
			}
		}
	];

	// MQTT Topics Data
	const mqttSensorTopics = [
		{
			name: "Temperature",
			topic: "greenhouse/sensors/temperature",
			dataType: "Number",
			unit: "°C",
			description: "Nhiệt độ môi trường trong nhà kính",
			examples: [
				{ description: "Nhiệt độ bình thường", value: 25.5 },
				{ description: "Nhiệt độ cao", value: 35.0 },
				{ description: "Nhiệt độ thấp", value: 15.0 }
			]
		},
		{
			name: "Humidity",
			topic: "greenhouse/sensors/humidity",
			dataType: "Number",
			unit: "%",
			description: "Độ ẩm không khí trong nhà kính",
			examples: [
				{ description: "Độ ẩm tối ưu", value: 65 },
				{ description: "Độ ẩm cao", value: 85 },
				{ description: "Độ ẩm thấp", value: 40 }
			]
		},
		{
			name: "Soil Moisture (Binary)",
			topic: "greenhouse/sensors/soil",
			dataType: "Binary",
			unit: "0/1",
			description: "Độ ẩm đất (nhị phân: 0=khô, 1=ẩm)",
			examples: [
				{ description: "Đất khô (cần tưới)", value: 0 },
				{ description: "Đất ẩm (đủ nước)", value: 1 }
			]
		}
	];

	const mqttControlTopics = [
		{
			name: "Light Control",
			topic: "greenhouse/devices/light/control",
			dataType: "Boolean",
			description: "Điều khiển đèn LED chiếu sáng (ESP32 nhận 1/0)",
			examples: [
				{ description: "Bật đèn", value: true },
				{ description: "Tắt đèn", value: false }
			]
		},
		{
			name: "Pump Control",
			topic: "greenhouse/devices/pump/control",
			dataType: "Boolean",
			description: "Điều khiển máy bơm tưới nước (ESP32 nhận 1/0)",
			examples: [
				{ description: "Bật máy bơm", value: true },
				{ description: "Tắt máy bơm", value: false }
			]
		}
	];

	const getValueForMQTT = (value: any, dataType: string): string => {
		if (dataType === "Boolean" || dataType === "Binary") {
			return value ? "1" : "0";
		}
		if (dataType === "String") {
			return value;
		}
		return value.toString();
	};

	const renderMQTTTopicCard = (topic: any, index: number, section: string) => (
		<Col md={6} lg={4} key={index} className="mb-4">
			<Card className="h-100">
				<Card.Header className="d-flex justify-content-between align-items-center">
					<strong>{topic.name}</strong>
					<Badge bg="info">{topic.dataType}</Badge>
				</Card.Header>
				<Card.Body>
					<div className="mb-3">
						<small className="text-muted d-block">Topic:</small>
						<code
							className="user-select-all cursor-pointer text-break"
							onClick={() => copyToClipboard(topic.topic, `${section}_${index}_topic`)}
							title="Click to copy"
						>
							{topic.topic}
						</code>
						{copiedItem === `${section}_${index}_topic` && (
							<small className="text-success d-block mt-1">✓ Copied!</small>
						)}
					</div>

					<p className="small text-muted mb-3">{topic.description}</p>

					{topic.unit && (
						<div className="mb-3">
							<small className="text-muted">Unit: </small>
							<Badge bg="secondary">{topic.unit}</Badge>
						</div>
					)}

					<h6>Example Values:</h6>
					{topic.examples.map((example: any, exampleIndex: number) => (
						<div key={exampleIndex} className="mb-2 p-2 bg-light rounded">
							<div className="d-flex justify-content-between align-items-start">
								<div>
									<small className="text-muted d-block">{example.description}</small>
									<code>{getValueForMQTT(example.value, topic.dataType)}</code>
								</div>
								<Button
									size="sm"
									variant="outline-primary"
									onClick={() => copyToClipboard(getValueForMQTT(example.value, topic.dataType), `${section}_${index}_${exampleIndex}`)}
								>
									{copiedItem === `${section}_${index}_${exampleIndex}` ? '✓' : 'Copy'}
								</Button>
							</div>
						</div>
					))}
				</Card.Body>
			</Card>
		</Col>
	);

	const renderMQTTSection = () => (
		<>
			<Card className="mb-4">
				<Card.Header>
					<h5 className="mb-0">📊 Sensor Data Topics</h5>
				</Card.Header>
				<Card.Body>
					<p className="text-muted">
						Các topic để nhận dữ liệu từ cảm biến. Backend sẽ subscribe vào các topic này để nhận dữ liệu và chuyển tiếp qua WebSocket đến frontend.
					</p>
					<Row>
						{mqttSensorTopics.map((topic, index) =>
							renderMQTTTopicCard(topic, index, 'mqtt_sensors')
						)}
					</Row>
				</Card.Body>
			</Card>

			<Card className="mb-4">
				<Card.Header>
					<h5 className="mb-0">🎮 Device Control Topics</h5>
				</Card.Header>
				<Card.Body>
					<p className="text-muted">
						Các topic để điều khiển thiết bị. Frontend gửi lệnh qua WebSocket đến backend, backend sẽ publish lệnh này vào MQTT broker.
					</p>
					<Row>
						{mqttControlTopics.map((topic, index) =>
							renderMQTTTopicCard(topic, index, 'mqtt_controls')
						)}
					</Row>
				</Card.Body>
			</Card>

			<Card className="mb-4">
				<Card.Header>
					<h5 className="mb-0">🔧 MQTT Test Commands</h5>
				</Card.Header>
				<Card.Body>
					<p className="text-muted">
						Sử dụng các lệnh sau để test MQTT với broker. <strong>IoT devices chỉ gửi giá trị đơn giản, không gửi JSON.</strong>
					</p>

					<h6>Test Sensor Data (Publish):</h6>
					<div className="mb-3">
						<code className="d-block p-2 bg-light mb-2">
							{`mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/sensors/temperature -m "25.5"`}
						</code>
						<code className="d-block p-2 bg-light mb-2">
							{`mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/sensors/humidity -m "65"`}
						</code>
						<Button
							size="sm"
							variant="outline-secondary"
							className="mt-2"
							onClick={() => copyToClipboard('mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/sensors/temperature -m "25.5"', 'mqtt_test')}
						>
							{copiedItem === 'mqtt_test' ? '✓ Copied' : 'Copy MQTT Command'}
						</Button>
					</div>

					<h6>Test Device Control (Publish):</h6>
					<div className="mb-3">
						<code className="d-block p-2 bg-light mb-2">
							{`mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/devices/light/control -m "1"`}
						</code>
						<code className="d-block p-2 bg-light mb-2">
							{`mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/devices/pump/control -m "0"`}
						</code>
					</div>

					<h6>Subscribe to All Topics:</h6>
					<div className="mb-3">
						<code className="d-block p-2 bg-light">
							{`mosquitto_sub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/+/+`}
						</code>
						<Button
							size="sm"
							variant="outline-secondary"
							className="mt-2"
							onClick={() => copyToClipboard('mosquitto_sub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/+/+', 'mqtt_sub')}
						>
							{copiedItem === 'mqtt_sub' ? '✓ Copied' : 'Copy Subscribe Command'}
						</Button>
					</div>
				</Card.Body>
			</Card>
		</>
	);

	const authEndpoints = [
		{
			method: 'POST',
			endpoint: '/api/auth/signin',
			description: 'Đăng nhập hệ thống',
			parameters: 'email, password',
			example: '/api/auth/signin',
			body: {
				email: "admin@gmail.com",
				password: "admin"
			},
			response: {
				success: true,
				token: "jwt_token_here",
				user: {
					id: "admin-001",
					email: "admin@gmail.com"
				}
			}
		},
		{
			method: 'POST',
			endpoint: '/api/auth/forgot-password',
			description: 'Yêu cầu đặt lại mật khẩu',
			parameters: 'email',
			example: '/api/auth/forgot-password',
			body: {
				email: "admin@gmail.com"
			},
			response: {
				success: true,
				message: "Password reset email sent"
			}
		}
	];

	const dashboardEndpoints = [
		{
			method: 'GET',
			endpoint: '/api/dashboard',
			description: 'Lấy dữ liệu tổng quan cho dashboard',
			parameters: 'Không có',
			example: '/api/dashboard',
			response: {
				success: true,
				data: {
					current: {
						temperature: 25.5,
						humidity: 65,
						createdAt: "2024-01-01T12:00:00Z"
					},
					devices: {
						light: { status: true, updatedAt: "2024-01-01T12:00:00Z" },
						pump: { status: false, updatedAt: "2024-01-01T12:00:00Z" }
					},
					alerts: {
						active: [],
						count: 0
					},
					systemHealth: {
						database: "healthy",
						mqtt: "healthy",
						sensors: "healthy"
					}
				}
			}
		}
	];

	const renderEndpointCard = (endpoint: any, index: number, section: string) => (
		<Col md={6} lg={4} key={index} className="mb-4">
			<Card className="h-100">
				<Card.Header className="d-flex justify-content-between align-items-center">
					<strong>{endpoint.endpoint.split('/').pop()}</strong>
					<Badge bg={endpoint.method === 'GET' ? 'success' : 'primary'}>
						{endpoint.method}
					</Badge>
				</Card.Header>
				<Card.Body>
					<div className="mb-3">
						<small className="text-muted d-block">Endpoint:</small>
						<code
							className="user-select-all cursor-pointer text-break"
							onClick={() => copyToClipboard(endpoint.endpoint, `${section}_${index}_endpoint`)}
							title="Click to copy"
						>
							{endpoint.endpoint}
						</code>
						{copiedItem === `${section}_${index}_endpoint` && (
							<small className="text-success d-block mt-1">✓ Copied!</small>
						)}
					</div>

					<p className="small text-muted mb-3">{endpoint.description}</p>

					{endpoint.parameters && (
						<div className="mb-3">
							<small className="text-muted">Parameters: </small>
							<Badge bg="secondary">{endpoint.parameters}</Badge>
						</div>
					)}

					<h6>Example:</h6>
					<div className="mb-3 p-2 bg-light rounded">
						<code className="d-block mb-2">
							{endpoint.method} {endpoint.example}
						</code>
						<Button
							size="sm"
							variant="outline-primary"
							onClick={() => copyToClipboard(`${endpoint.method} ${endpoint.example}`, `${section}_${index}_example`)}
						>
							{copiedItem === `${section}_${index}_example` ? '✓' : 'Copy'}
						</Button>
					</div>

					{endpoint.body && (
						<div className="mb-3">
							<h6>Request Body:</h6>
							<pre className="bg-light p-2 rounded small">
								{JSON.stringify(endpoint.body, null, 2)}
							</pre>
							<Button
								size="sm"
								variant="outline-primary"
								onClick={() => copyToClipboard(JSON.stringify(endpoint.body, null, 2), `${section}_${index}_body`)}
							>
								{copiedItem === `${section}_${index}_body` ? '✓' : 'Copy Body'}
							</Button>
						</div>
					)}

					<div className="mb-3">
						<h6>Response:</h6>
						<pre className="bg-light p-2 rounded small">
							{JSON.stringify(endpoint.response, null, 2)}
						</pre>
						<Button
							size="sm"
							variant="outline-primary"
							onClick={() => copyToClipboard(JSON.stringify(endpoint.response, null, 2), `${section}_${index}_response`)}
						>
							{copiedItem === `${section}_${index}_response` ? '✓' : 'Copy Response'}
						</Button>
					</div>
				</Card.Body>
			</Card>
		</Col>
	);

	return (
		<Container className={styles.container}>
			<h3 className={styles.heading}>Backend API & MQTT Examples</h3>
			<p className="text-muted mb-4">
				Tài liệu đầy đủ về HTTP API endpoints và MQTT topics của hệ thống AIoT Smart Greenhouse.
				<br />
				HTTP API Base URL: <code>http://localhost:5000</code> |
				MQTT Broker: <code>mqtt.noboroto.id.vn:1883</code>
			</p>

			<Tabs defaultActiveKey="http" className="mb-4">
				<Tab eventKey="http" title="🌐 HTTP APIs">
					<Tabs defaultActiveKey="sensors" className="mb-4">
						<Tab eventKey="sensors" title="📊 Sensors">
							<Card className="mb-4">
								<Card.Header>
									<h5 className="mb-0">📊 Sensor Data APIs</h5>
								</Card.Header>
								<Card.Body>
									<p className="text-muted">
										API endpoints để lấy và quản lý dữ liệu cảm biến từ hệ thống nhà kính thông minh.
									</p>
									<Row>
										{sensorEndpoints.map((endpoint, index) =>
											renderEndpointCard(endpoint, index, 'sensors')
										)}
									</Row>
								</Card.Body>
							</Card>
						</Tab>

						<Tab eventKey="devices" title="🎮 Devices">
							<Card className="mb-4">
								<Card.Header>
									<h5 className="mb-0">🎮 Device Control APIs</h5>
								</Card.Header>
								<Card.Body>
									<p className="text-muted">
										API endpoints để điều khiển và quản lý trạng thái thiết bị trong nhà kính.
									</p>
									<Row>
										{deviceEndpoints.map((endpoint, index) =>
											renderEndpointCard(endpoint, index, 'devices')
										)}
									</Row>
								</Card.Body>
							</Card>
						</Tab>

						<Tab eventKey="history" title="📈 History">
							<Card className="mb-4">
								<Card.Header>
									<h5 className="mb-0">📈 History & Analytics APIs</h5>
								</Card.Header>
								<Card.Body>
									<p className="text-muted">
										API endpoints để truy xuất lịch sử dữ liệu và phân tích xu hướng.
									</p>
									<Row>
										{historyEndpoints.map((endpoint, index) =>
											renderEndpointCard(endpoint, index, 'history')
										)}
									</Row>
								</Card.Body>
							</Card>
						</Tab>

						<Tab eventKey="alerts" title="🚨 Alerts">
							<Card className="mb-4">
								<Card.Header>
									<h5 className="mb-0">🚨 Alert Management APIs</h5>
								</Card.Header>
								<Card.Body>
									<p className="text-muted">
										API endpoints để quản lý cảnh báo và thông báo hệ thống.
									</p>
									<Row>
										{alertEndpoints.map((endpoint, index) =>
											renderEndpointCard(endpoint, index, 'alerts')
										)}
									</Row>
								</Card.Body>
							</Card>
						</Tab>

						<Tab eventKey="settings" title="⚙️ Settings">
							<Card className="mb-4">
								<Card.Header>
									<h5 className="mb-0">⚙️ Settings & Configuration APIs</h5>
								</Card.Header>
								<Card.Body>
									<p className="text-muted">
										API endpoints để cấu hình hệ thống và quản lý cài đặt.
									</p>
									<Row>
										{settingsEndpoints.map((endpoint, index) =>
											renderEndpointCard(endpoint, index, 'settings')
										)}
									</Row>
								</Card.Body>
							</Card>
						</Tab>

						<Tab eventKey="auth" title="🔐 Auth">
							<Card className="mb-4">
								<Card.Header>
									<h5 className="mb-0">🔐 Authentication APIs</h5>
								</Card.Header>
								<Card.Body>
									<p className="text-muted">
										API endpoints để xác thực người dùng và quản lý phiên đăng nhập.
									</p>
									<Row>
										{authEndpoints.map((endpoint, index) =>
											renderEndpointCard(endpoint, index, 'auth')
										)}
									</Row>
								</Card.Body>
							</Card>
						</Tab>

						<Tab eventKey="dashboard" title="📋 Dashboard">
							<Card className="mb-4">
								<Card.Header>
									<h5 className="mb-0">📋 Dashboard APIs</h5>
								</Card.Header>
								<Card.Body>
									<p className="text-muted">
										API endpoints để lấy dữ liệu tổng quan cho dashboard.
									</p>
									<Row>
										{dashboardEndpoints.map((endpoint, index) =>
											renderEndpointCard(endpoint, index, 'dashboard')
										)}
									</Row>
								</Card.Body>
							</Card>
						</Tab>
					</Tabs>
				</Tab>

				<Tab eventKey="mqtt" title="📡 MQTT Topics">
					{renderMQTTSection()}
				</Tab>
			</Tabs>

			<Card className="mb-4">
				<Card.Header>
					<h5 className="mb-0">🧪 Quick Test Commands</h5>
				</Card.Header>
				<Card.Body>
					<h6>Using curl:</h6>
					<div className="mb-3">
						<code className="d-block p-2 bg-light mb-2">
							curl -X GET http://localhost:5000/api/sensors/latest
						</code>
						<code className="d-block p-2 bg-light mb-2">
							{`curl -X POST http://localhost:5000/api/auth/signin -H "Content-Type: application/json" -d '{"email":"admin@gmail.com","password":"admin"}'`}
						</code>
						<code className="d-block p-2 bg-light mb-2">
							curl -X GET http://localhost:5000/api/dashboard
						</code>
						<Button
							size="sm"
							variant="outline-secondary"
							className="mt-2"
							onClick={() => copyToClipboard('curl -X GET http://localhost:5000/api/sensors/latest', 'curl_test')}
						>
							{copiedItem === 'curl_test' ? '✓ Copied' : 'Copy Test Command'}
						</Button>
					</div>

					<h6>Default Admin Credentials:</h6>
					<div className="mb-3">
						<Badge bg="info" className="me-2">Email: admin@gmail.com</Badge>
						<Badge bg="info">Password: admin</Badge>
					</div>
				</Card.Body>
			</Card>
		</Container>
	);
};

export default ApiExamples;
