'use client';

import React, { useState } from 'react';
import { Container, Card, Row, Col, Button, Badge } from 'react-bootstrap';
import styles from './mqtt-examples.module.scss';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const MqttExamples = () => {
	const [copiedTopic, setCopiedTopic] = useState<string | null>(null);

	const copyToClipboard = (text: string, topicId: string) => {
		navigator.clipboard.writeText(text).then(() => {
			setCopiedTopic(topicId);
			setTimeout(() => setCopiedTopic(null), 2000);
		});
	};

	const sensorTopics = [
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
		},
		{
			name: "Water Level (Binary)",
			topic: "greenhouse/sensors/water",
			dataType: "Binary",
			unit: "0/1",
			description: "Mức nước trong bình chứa (nhị phân: 0=bình thường, 1=ngập nước)",
			examples: [
				{ description: "Mức nước bình thường", value: 0 },
				{ description: "Ngập nước (báo động)", value: 1 }
			]
		},
		{
			name: "Light Level (Binary)",
			topic: "greenhouse/sensors/light",
			dataType: "Binary",
			unit: "0/1",
			description: "Cường độ ánh sáng môi trường (nhị phân: 0=tối, 1=sáng)",
			examples: [
				{ description: "Tối (cần bật đèn)", value: 0 },
				{ description: "Sáng (đủ ánh sáng)", value: 1 }
			]
		},
		{
			name: "Plant Height",
			topic: "greenhouse/sensors/height",
			dataType: "Number",
			unit: "cm",
			description: "Chiều cao cây trồng (đo bằng siêu âm)",
			examples: [
				{ description: "Cây con", value: 15 },
				{ description: "Cây phát triển", value: 45 },
				{ description: "Cây trưởng thành", value: 80 }
			]
		},
		{
			name: "Rain Detection (Binary)",
			topic: "greenhouse/sensors/rain",
			dataType: "Binary",
			unit: "0/1",
			description: "Phát hiện mưa (nhị phân: 0=không mưa, 1=có mưa)",
			examples: [
				{ description: "Trời khô ráo", value: 0 },
				{ description: "Đang có mưa", value: 1 }
			]
		}
	];

	const controlTopics = [
		{
			name: "Light Control",
			topic: "greenhouse/devices/light/control",
			dataType: "String",
			description: "Điều khiển đèn LED chiếu sáng (ESP32 nhận HIGH/LOW)",
			examples: [
				{ description: "Bật đèn", value: "HIGH" },
				{ description: "Tắt đèn", value: "LOW" }
			]
		},
		{
			name: "Pump Control",
			topic: "greenhouse/devices/pump/control",
			dataType: "String",
			description: "Điều khiển máy bơm tưới nước (ESP32 nhận HIGH/LOW)",
			examples: [
				{ description: "Bật máy bơm", value: "HIGH" },
				{ description: "Tắt máy bơm", value: "LOW" }
			]
		},
		{
			name: "Door Control",
			topic: "greenhouse/devices/door/control",
			dataType: "String",
			description: "Điều khiển servo motor cửa chính (ESP32 nhận HIGH/LOW)",
			examples: [
				{ description: "Mở cửa", value: "HIGH" },
				{ description: "Đóng cửa", value: "LOW" }
			]
		},
		{
			name: "Window Control",
			topic: "greenhouse/devices/window/control",
			dataType: "String",
			description: "Điều khiển servo motor cửa sổ thông gió (ESP32 nhận HIGH/LOW)",
			examples: [
				{ description: "Mở cửa sổ", value: "HIGH" },
				{ description: "Đóng cửa sổ", value: "LOW" }
			]
		}
	];

	const getValueForMQTT = (value: any, dataType: string): string => {
		if (dataType === "Boolean" || dataType === "Binary") {
			return value ? "1" : "0";
		}
		if (dataType === "String") {
			return value; // Return as-is for HIGH/LOW strings
		}
		return value.toString();
	};

	return (
		<Container className={styles.container}>
			<h3 className={styles.heading}>MQTT Topics Examples</h3>

			<Card className="mb-4">
				<Card.Header>
					<h5 className="mb-0">📊 Sensor Data Topics</h5>
				</Card.Header>
				<Card.Body>
					<p className="text-muted">
						Các topic để nhận dữ liệu từ cảm biến. Backend sẽ subscribe vào các topic này để nhận dữ liệu và chuyển tiếp qua WebSocket đến frontend.
					</p>

					<Row>
						{sensorTopics.map((topic, index) => (
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
											{copiedTopic === topic.topic && (
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
										{topic.examples.map((example, exampleIndex) => (
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
														{copiedTopic === `${topic.topic}_${exampleIndex}` ? '✓' : 'Copy'}
													</Button>
												</div>
											</div>
										))}
									</Card.Body>
								</Card>
							</Col>
						))}
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
						{controlTopics.map((topic, index) => (
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
											{copiedTopic === topic.topic && (
												<small className="text-success d-block mt-1">✓ Copied!</small>
											)}
										</div>

										<p className="small text-muted mb-3">{topic.description}</p>

										<h6>Command Examples:</h6>
										{topic.examples.map((example, exampleIndex) => (
											<div key={exampleIndex} className="mb-3 p-2 bg-light rounded">
												<div className="d-flex justify-content-between align-items-start mb-2">
													<small className="text-muted">{example.description}</small>
													<Button
														size="sm"
														variant="outline-primary"
														onClick={() => copyToClipboard(getValueForMQTT(example.value, topic.dataType), `${topic.topic}_${exampleIndex}`)}
													>
														{copiedTopic === `${topic.topic}_${exampleIndex}` ? '✓' : 'Copy'}
													</Button>
												</div>
												<code className="d-block">
													{getValueForMQTT(example.value, topic.dataType)}
												</code>
											</div>
										))}
									</Card.Body>
								</Card>
							</Col>
						))}
					</Row>
				</Card.Body>
			</Card>

			<Card className="mb-4">
				<Card.Header>
					<h5 className="mb-0">🔧 Test Commands</h5>
				</Card.Header>
				<Card.Body>
					<p className="text-muted">
						Sử dụng các lệnh sau để test MQTT với broker. <strong>IoT devices chỉ gửi giá trị đơn giản, không gửi JSON.</strong>
					</p>

					<h6>Test Sensor Data (Publish) - Simple Values Only:</h6>
					<div className="mb-3">
						<p className="small text-info">💡 ESP32 gửi chỉ giá trị số hoặc binary, không phải JSON object</p>
						<code className="d-block p-2 bg-light mb-2">
							mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/sensors/temperature -m &quot;25.5&quot;
						</code>
						<code className="d-block p-2 bg-light mb-2">
							mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/sensors/humidity -m &quot;65&quot;
						</code>
						<code className="d-block p-2 bg-light mb-2">
							mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/sensors/soil -m &quot;0&quot;
						</code>
						<code className="d-block p-2 bg-light mb-2">
							mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/sensors/water -m &quot;75&quot;
						</code>
						<code className="d-block p-2 bg-light mb-2">
							mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/sensors/light -m &quot;15000&quot;
						</code>
						<code className="d-block p-2 bg-light mb-2">
							mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/sensors/height -m &quot;35&quot;
						</code>
						<Button
							size="sm"
							variant="outline-secondary"
							className="mt-2"
							onClick={() => copyToClipboard('mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/sensors/temperature -m "25.5"', 'test_pub')}
						>
							{copiedTopic === 'test_pub' ? '✓ Copied' : 'Copy Temperature Command'}
						</Button>
					</div>

					<h6>Test Device Control (Publish) - ESP32 Format:</h6>
					<div className="mb-3">
						<p className="small text-info">💡 ESP32 chỉ nhận &quot;HIGH&quot;/&quot;LOW&quot; strings, không phải &quot;1&quot;/&quot;0&quot;</p>
						<code className="d-block p-2 bg-light mb-2">
							mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/devices/light/control -m &quot;HIGH&quot;
						</code>
						<code className="d-block p-2 bg-light mb-2">
							mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/devices/pump/control -m &quot;LOW&quot;
						</code>
						<code className="d-block p-2 bg-light mb-2">
							mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/devices/door/control -m &quot;HIGH&quot;
						</code>
						<Button
							size="sm"
							variant="outline-secondary"
							className="mt-2"
							onClick={() => copyToClipboard('mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/devices/light/control -m "HIGH"', 'test_control')}
						>
							{copiedTopic === 'test_control' ? '✓ Copied' : 'Copy Light ON Command'}
						</Button>
					</div>

					<h6>Subscribe to All Topics:</h6>
					<div className="mb-3">
						<code className="d-block p-2 bg-light">
							mosquitto_sub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/+/+
						</code>
						<Button
							size="sm"
							variant="outline-secondary"
							className="mt-2"
							onClick={() => copyToClipboard('mosquitto_sub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/+/+', 'test_sub')}
						>
							{copiedTopic === 'test_sub' ? '✓ Copied' : 'Copy Subscribe Command'}
						</Button>
					</div>
				</Card.Body>
			</Card>
		</Container>
	);
};

export default MqttExamples;
