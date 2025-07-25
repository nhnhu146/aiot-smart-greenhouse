'use client';

import React, { useState } from 'react';
import { Container, Card, Row, Col, Button, Badge, Tab, Tabs } from 'react-bootstrap';
import styles from './examples.module.scss';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const Examples = () => {
	const [copiedItem, setCopiedItem] = useState<string | null>(null);

	const copyToClipboard = (text: string, itemId: string) => {
		navigator.clipboard.writeText(text).then(() => {
			setCopiedItem(itemId);
			setTimeout(() => setCopiedItem(null), 2000);
		});
	};

	// MQTT Sensor Topics - exactly matching embedded.ino
	const sensorTopics = [
		{
			name: "Temperature",
			topic: "greenhouse/sensors/temperature",
			dataType: "Float",
			unit: "°C",
			description: "Nhiệt độ môi trường từ cảm biến DHT11",
			examples: [
				{ description: "Nhiệt độ bình thường", value: 25.5 },
				{ description: "Nhiệt độ cao", value: 35.0 },
				{ description: "Nhiệt độ thấp", value: 15.2 }
			]
		},
		{
			name: "Humidity",
			topic: "greenhouse/sensors/humidity",
			dataType: "Float",
			unit: "%",
			description: "Độ ẩm không khí từ cảm biến DHT11",
			examples: [
				{ description: "Độ ẩm tối ưu", value: 65.0 },
				{ description: "Độ ẩm cao", value: 80.0 },
				{ description: "Độ ẩm thấp", value: 40.0 }
			]
		},
		{
			name: "Soil Moisture",
			topic: "greenhouse/sensors/soil",
			dataType: "Binary",
			unit: "0/1",
			description: "Trạng thái độ ẩm đất (0=khô, 1=ẩm)",
			examples: [
				{ description: "Đất khô", value: 0 },
				{ description: "Đất ẩm", value: 1 }
			]
		},
		{
			name: "Water Level",
			topic: "greenhouse/sensors/water",
			dataType: "Binary",
			unit: "0/1",
			description: "Mức nước trong bể (0=thấp, 1=đủ)",
			examples: [
				{ description: "Mức nước thấp", value: 0 },
				{ description: "Mức nước đủ", value: 1 }
			]
		},
		{
			name: "Light Level",
			topic: "greenhouse/sensors/light",
			dataType: "Binary",
			unit: "0/1",
			description: "Cường độ ánh sáng (0=tối, 1=sáng)",
			examples: [
				{ description: "Môi trường tối", value: 0 },
				{ description: "Có ánh sáng", value: 1 }
			]
		},
		{
			name: "Rain Status",
			topic: "greenhouse/sensors/rain",
			dataType: "Binary",
			unit: "0/1",
			description: "Trạng thái mưa (0=không mưa, 1=có mưa)",
			examples: [
				{ description: "Không mưa", value: 0 },
				{ description: "Có mưa", value: 1 }
			]
		},
		{
			name: "Plant Height",
			topic: "greenhouse/sensors/height",
			dataType: "Integer",
			unit: "cm",
			description: "Chiều cao cây trồng đo bằng cảm biến siêu âm",
			examples: [
				{ description: "Cây nhỏ", value: 15 },
				{ description: "Cây trung bình", value: 25 },
				{ description: "Cây lớn", value: 35 }
			]
		},
		{
			name: "Motion Detection",
			topic: "greenhouse/sensors/motion",
			dataType: "Binary",
			unit: "0/1",
			description: "Phát hiện chuyển động (0=không có, 1=có chuyển động)",
			examples: [
				{ description: "Không có chuyển động", value: 0 },
				{ description: "Phát hiện chuyển động", value: 1 }
			]
		}
	];

	// MQTT Control Topics - exactly matching embedded.ino
	const controlTopics = [
		{
			name: "Light Control",
			topic: "greenhouse/devices/light/control",
			dataType: "Binary",
			description: "Điều khiển đèn LED chiếu sáng (ESP32 nhận 1/0)",
			examples: [
				{ description: "Bật đèn", value: 1 },
				{ description: "Tắt đèn", value: 0 }
			]
		},
		{
			name: "Pump Control",
			topic: "greenhouse/devices/pump/control",
			dataType: "Binary",
			description: "Điều khiển máy bơm tưới nước (ESP32 nhận 1/0)",
			examples: [
				{ description: "Bật máy bơm", value: 1 },
				{ description: "Tắt máy bơm", value: 0 }
			]
		},
		{
			name: "Window Control",
			topic: "greenhouse/devices/window/control",
			dataType: "Binary",
			description: "Điều khiển cửa sổ servo (ESP32 nhận 1/0)",
			examples: [
				{ description: "Mở cửa sổ", value: 1 },
				{ description: "Đóng cửa sổ", value: 0 }
			]
		},
		{
			name: "Door Control",
			topic: "greenhouse/devices/door/control",
			dataType: "Binary",
			description: "Điều khiển cửa chính servo (ESP32 nhận 1/0)",
			examples: [
				{ description: "Mở cửa", value: 1 },
				{ description: "Đóng cửa", value: 0 }
			]
		},
		{
			name: "Microphone Control",
			topic: "greenhouse/devices/microphone/control",
			dataType: "Binary",
			description: "Điều khiển microphone ghi âm (ESP32 nhận 1/0)",
			examples: [
				{ description: "Bật microphone", value: 1 },
				{ description: "Tắt microphone", value: 0 }
			]
		}
	];

	// API Endpoints for Frontend-Backend communication
	const apiEndpoints = [
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
						lightLevel: 1,
						plantHeight: 35,
						rainStatus: 0,
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
					waterLevel: 1,
					lightLevel: 1,
					plantHeight: 35,
					rainStatus: 0,
					createdAt: "2024-01-01T12:00:00Z"
				}
			}
		},
		{
			method: 'POST',
			endpoint: '/api/devices/control',
			description: 'Điều khiển thiết bị (Frontend → Backend → MQTT)',
			parameters: 'deviceType, action',
			example: 'POST /api/devices/control',
			body: {
				deviceType: "light",
				action: "on"
			},
			response: {
				success: true,
				message: "Device control command sent successfully",
				data: {
					deviceType: "light",
					action: "on",
					status: true,
					timestamp: "2024-01-01T12:00:00Z"
				}
			}
		}
	];

	const getValueForMQTT = (value: any, dataType: string): string => {
		if (dataType === "Binary") {
			return value.toString(); // Return 0 or 1 as string
		}
		if (dataType === "Float" || dataType === "Integer") {
			return value.toString(); // Return numeric values as strings
		}
		return value.toString();
	};

	const renderTopicCard = (topic: any, index: number, prefix: string) => (
		<Col md={6} lg={4} key={index} className="mb-4">
			<Card className="h-100">
				<Card.Header className="d-flex justify-content-between align-items-center">
					<strong>{topic.name}</strong>
					<Badge bg="primary">{topic.dataType}</Badge>
				</Card.Header>
				<Card.Body>
					<div className="mb-3">
						<small className="text-muted d-block">Topic:</small>
						<code
							className="user-select-all cursor-pointer text-break"
							onClick={() => copyToClipboard(topic.topic, topic.topic)}
							title="Click to copy"
						>
							{topic.topic}
						</code>
						{copiedItem === topic.topic && (
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
									onClick={() => copyToClipboard(getValueForMQTT(example.value, topic.dataType), `${topic.topic}_${exampleIndex}`)}
								>
									{copiedItem === `${topic.topic}_${exampleIndex}` ? '✓' : 'Copy'}
								</Button>
							</div>
						</div>
					))}
				</Card.Body>
			</Card>
		</Col>
	);

	const renderControlCard = (topic: any, index: number, prefix: string) => (
		<Col md={6} lg={4} key={index} className="mb-4">
			<Card className="h-100">
				<Card.Header className="d-flex justify-content-between align-items-center">
					<strong>{topic.name}</strong>
					<Badge bg="success">{topic.dataType}</Badge>
				</Card.Header>
				<Card.Body>
					<div className="mb-3">
						<small className="text-muted d-block">Topic:</small>
						<code
							className="user-select-all cursor-pointer text-break"
							onClick={() => copyToClipboard(topic.topic, topic.topic)}
							title="Click to copy"
						>
							{topic.topic}
						</code>
						{copiedItem === topic.topic && (
							<small className="text-success d-block mt-1">✓ Copied!</small>
						)}
					</div>

					<p className="small text-muted mb-3">{topic.description}</p>

					<h6>Command Examples:</h6>
					{topic.examples.map((example: any, exampleIndex: number) => (
						<div key={exampleIndex} className="mb-2 p-2 bg-light rounded">
							<div className="d-flex justify-content-between align-items-start">
								<div>
									<small className="text-muted d-block">{example.description}</small>
									<code>{getValueForMQTT(example.value, topic.dataType)}</code>
								</div>
								<Button
									size="sm"
									variant="outline-success"
									onClick={() => copyToClipboard(getValueForMQTT(example.value, topic.dataType), `${topic.topic}_${exampleIndex}`)}
								>
									{copiedItem === `${topic.topic}_${exampleIndex}` ? '✓' : 'Copy'}
								</Button>
							</div>
						</div>
					))}
				</Card.Body>
			</Card>
		</Col>
	);

	return (
		<Container className={styles.container}>
			<h3 className={styles.heading}>IoT Smart Greenhouse - Examples</h3>
			<p className="text-muted mb-4">
				Tài liệu tham khảo về MQTT topics, API endpoints và cách tích hợp hệ thống IoT Smart Greenhouse
			</p>

			<Tabs defaultActiveKey="mqtt-sensor" className="mb-4">
				<Tab eventKey="mqtt-sensor" title="📊 MQTT Sensor Topics">
					<Card className="mb-4">
						<Card.Header>
							<h5 className="mb-0">📊 Sensor Data Topics</h5>
						</Card.Header>
						<Card.Body>
							<p className="text-muted">
								Các topic để nhận dữ liệu từ cảm biến ESP32. Backend sẽ subscribe vào các topic này để nhận dữ liệu và chuyển tiếp qua WebSocket đến frontend.
							</p>

							<Row>
								{sensorTopics.map((topic, index) => renderTopicCard(topic, index, 'sensor'))}
							</Row>
						</Card.Body>
					</Card>
				</Tab>

				<Tab eventKey="mqtt-control" title="🎮 MQTT Control Topics">
					<Card className="mb-4">
						<Card.Header>
							<h5 className="mb-0">🎮 Device Control Topics</h5>
						</Card.Header>
						<Card.Body>
							<p className="text-muted">
								Các topic để điều khiển thiết bị ESP32. Frontend gửi lệnh qua API đến backend, backend sẽ publish lệnh này vào MQTT broker.
							</p>

							<Row>
								{controlTopics.map((topic, index) => renderControlCard(topic, index, 'control'))}
							</Row>
						</Card.Body>
					</Card>
				</Tab>

				<Tab eventKey="mqtt-cli" title="💻 MQTT CLI Examples">
					<Card className="mb-4">
						<Card.Header>
							<h5 className="mb-0">💻 MQTT Command Line Examples</h5>
						</Card.Header>
						<Card.Body>
							<p className="text-muted">
								Sử dụng các lệnh sau để test MQTT với broker. <strong>IoT devices chỉ gửi giá trị đơn giản, không gửi JSON.</strong>
							</p>

							<h6>Test Sensor Data (Publish) - Simple Values Only:</h6>
							<div className="mb-3">
								<p className="small text-info">💡 ESP32 gửi chỉ giá trị số hoặc binary, không phải JSON object</p>
								<code className="d-block p-2 bg-light mb-2">
									mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/sensors/temperature -m "25.5"
								</code>
								<code className="d-block p-2 bg-light mb-2">
									mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/sensors/humidity -m "65"
								</code>
								<code className="d-block p-2 bg-light mb-2">
									mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/sensors/soil -m "0"
								</code>
								<code className="d-block p-2 bg-light mb-2">
									mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/sensors/water -m "1"
								</code>
								<code className="d-block p-2 bg-light mb-2">
									mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/sensors/light -m "1"
								</code>
								<code className="d-block p-2 bg-light mb-2">
									mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/sensors/height -m "35"
								</code>
								<Button
									size="sm"
									variant="outline-secondary"
									className="mt-2"
									onClick={() => copyToClipboard('mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/sensors/temperature -m "25.5"', 'test_pub')}
								>
									{copiedItem === 'test_pub' ? '✓ Copied' : 'Copy Temperature Command'}
								</Button>
							</div>

							<h6>Test Device Control (Publish) - ESP32 Format:</h6>
							<div className="mb-3">
								<p className="small text-info">💡 ESP32 nhận số "1"/"0", không phải "HIGH"/"LOW"</p>
								<code className="d-block p-2 bg-light mb-2">
									mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/devices/light/control -m "1"
								</code>
								<code className="d-block p-2 bg-light mb-2">
									mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/devices/pump/control -m "0"
								</code>
								<code className="d-block p-2 bg-light mb-2">
									mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/devices/door/control -m "1"
								</code>
								<code className="d-block p-2 bg-light mb-2">
									mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/devices/window/control -m "0"
								</code>
								<Button
									size="sm"
									variant="outline-secondary"
									className="mt-2"
									onClick={() => copyToClipboard('mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/devices/light/control -m "1"', 'test_control')}
								>
									{copiedItem === 'test_control' ? '✓ Copied' : 'Copy Light ON Command'}
								</Button>
							</div>

							<h6>Subscribe to All Topics:</h6>
							<div className="mb-3">
								<code className="d-block p-2 bg-light">
									mosquitto_sub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t "greenhouse/+/+"
								</code>
								<Button
									size="sm"
									variant="outline-secondary"
									className="mt-2"
									onClick={() => copyToClipboard('mosquitto_sub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t "greenhouse/+/+"', 'test_sub')}
								>
									{copiedItem === 'test_sub' ? '✓ Copied' : 'Copy Subscribe Command'}
								</Button>
							</div>
						</Card.Body>
					</Card>
				</Tab>

				<Tab eventKey="api" title="🔗 API Endpoints">
					<Card className="mb-4">
						<Card.Header>
							<h5 className="mb-0">🔗 Frontend-Backend API</h5>
						</Card.Header>
						<Card.Body>
							<p className="text-muted mb-4">
								Frontend gửi lệnh qua HTTP API đến backend. Backend sẽ xử lý và gửi MQTT command đến ESP32.
								<br />
								<strong>Frontend CHỈ DÙNG WebSocket để nhận dữ liệu real-time từ backend.</strong>
							</p>

							{apiEndpoints.map((endpoint, index) => (
								<Card key={index} className="mb-3">
									<Card.Header className="d-flex justify-content-between align-items-center">
										<div>
											<Badge bg={endpoint.method === 'GET' ? 'success' : 'primary'} className="me-2">
												{endpoint.method}
											</Badge>
											<code>{endpoint.endpoint}</code>
										</div>
									</Card.Header>
									<Card.Body>
										<p className="text-muted">{endpoint.description}</p>

										{endpoint.parameters && (
											<div className="mb-3">
												<strong>Parameters:</strong> <code>{endpoint.parameters}</code>
											</div>
										)}

										{endpoint.example && (
											<div className="mb-3">
												<strong>Example:</strong>
												<div className="p-2 bg-light rounded mt-1">
													<code>{endpoint.example}</code>
													<Button
														size="sm"
														variant="outline-secondary"
														className="ms-2"
														onClick={() => copyToClipboard(endpoint.example, `api_${index}_example`)}
													>
														{copiedItem === `api_${index}_example` ? '✓' : 'Copy'}
													</Button>
												</div>
											</div>
										)}

										{endpoint.body && (
											<div className="mb-3">
												<strong>Request Body:</strong>
												<pre className="p-2 bg-light rounded mt-1">
													<code>{JSON.stringify(endpoint.body, null, 2)}</code>
												</pre>
												<Button
													size="sm"
													variant="outline-secondary"
													onClick={() => copyToClipboard(JSON.stringify(endpoint.body, null, 2), `api_${index}_body`)}
												>
													{copiedItem === `api_${index}_body` ? '✓' : 'Copy Body'}
												</Button>
											</div>
										)}

										<div className="mb-3">
											<strong>Response:</strong>
											<pre className="p-2 bg-light rounded mt-1">
												<code>{JSON.stringify(endpoint.response, null, 2)}</code>
											</pre>
											<Button
												size="sm"
												variant="outline-secondary"
												onClick={() => copyToClipboard(JSON.stringify(endpoint.response, null, 2), `api_${index}_response`)}
											>
												{copiedItem === `api_${index}_response` ? '✓' : 'Copy Response'}
											</Button>
										</div>
									</Card.Body>
								</Card>
							))}
						</Card.Body>
					</Card>
				</Tab>

				<Tab eventKey="websocket" title="🔌 WebSocket Events">
					<Card className="mb-4">
						<Card.Header>
							<h5 className="mb-0">🔌 WebSocket Real-time Events</h5>
						</Card.Header>
						<Card.Body>
							<p className="text-muted mb-4">
								Frontend chỉ dùng WebSocket để nhận dữ liệu real-time từ backend. Không gửi lệnh điều khiển qua WebSocket.
							</p>

							<div className="mb-4">
								<h6>📡 Incoming Events (Backend → Frontend):</h6>
								<div className="p-3 bg-light rounded">
									<div className="mb-3">
										<strong>sensor:data</strong> - Dữ liệu cảm biến mới
										<pre className="mt-2">
											<code>{JSON.stringify({
												topic: "greenhouse/sensors/temperature",
												sensor: "temperature",
												data: {
													value: 25.5,
													timestamp: "2024-01-01T12:00:00Z",
													quality: "good"
												}
											}, null, 2)}</code>
										</pre>
									</div>

									<div className="mb-3">
										<strong>device-status</strong> - Trạng thái thiết bị thay đổi
										<pre className="mt-2">
											<code>{JSON.stringify({
												topic: "greenhouse/devices/light/status",
												device: "light",
												status: "on",
												timestamp: "2024-01-01T12:00:00Z"
											}, null, 2)}</code>
										</pre>
									</div>

									<div className="mb-3">
										<strong>notification</strong> - Thông báo hệ thống
										<pre className="mt-2">
											<code>{JSON.stringify({
												type: "alert",
												message: "Temperature too high",
												level: "warning",
												timestamp: "2024-01-01T12:00:00Z"
											}, null, 2)}</code>
										</pre>
									</div>
								</div>
							</div>

							<div className="alert alert-info">
								<strong>💡 Lưu ý:</strong> Frontend không gửi lệnh điều khiển qua WebSocket.
								Sử dụng HTTP API (/api/devices/control) để điều khiển thiết bị.
							</div>
						</Card.Body>
					</Card>
				</Tab>
			</Tabs>
		</Container>
	);
};

export default Examples;
