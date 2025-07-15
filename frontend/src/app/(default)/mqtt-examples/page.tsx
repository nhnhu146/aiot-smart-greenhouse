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
			name: "Soil Moisture",
			topic: "greenhouse/sensors/soil",
			dataType: "Number",
			unit: "%",
			description: "Độ ẩm đất",
			examples: [
				{ description: "Đất ẩm tốt", value: 70 },
				{ description: "Đất khô", value: 30 },
				{ description: "Đất quá ẩm", value: 90 }
			]
		},
		{
			name: "Water Level",
			topic: "greenhouse/sensors/water",
			dataType: "Number",
			unit: "%",
			description: "Mức nước trong bình chứa",
			examples: [
				{ description: "Mức nước đầy", value: 100 },
				{ description: "Mức nước trung bình", value: 50 },
				{ description: "Mức nước thấp", value: 20 }
			]
		},
		{
			name: "Light Intensity",
			topic: "greenhouse/sensors/light",
			dataType: "Number",
			unit: "lux",
			description: "Cường độ ánh sáng",
			examples: [
				{ description: "Ánh sáng ban ngày", value: 50000 },
				{ description: "Ánh sáng buổi sáng", value: 20000 },
				{ description: "Ánh sáng yếu", value: 5000 }
			]
		},
		{
			name: "Rain Detector",
			topic: "greenhouse/sensors/rain",
			dataType: "Boolean",
			description: "Cảm biến mưa",
			examples: [
				{ description: "Có mưa", value: true },
				{ description: "Không mưa", value: false }
			]
		}
	];

	const controlTopics = [
		{
			name: "Light Control",
			topic: "greenhouse/devices/light/control",
			dataType: "Boolean",
			description: "Điều khiển đèn chiếu sáng",
			examples: [
				{ description: "Bật đèn", value: true },
				{ description: "Tắt đèn", value: false }
			]
		},
		{
			name: "Pump Control",
			topic: "greenhouse/devices/pump/control",
			dataType: "Boolean",
			description: "Điều khiển máy bơm tưới",
			examples: [
				{ description: "Bật máy bơm", value: true },
				{ description: "Tắt máy bơm", value: false }
			]
		},
		{
			name: "Door Control",
			topic: "greenhouse/devices/door/control",
			dataType: "Boolean",
			description: "Điều khiển cửa nhà kính",
			examples: [
				{ description: "Mở cửa", value: true },
				{ description: "Đóng cửa", value: false }
			]
		},
		{
			name: "Window Control",
			topic: "greenhouse/devices/window/control",
			dataType: "Boolean",
			description: "Điều khiển cửa sổ thông gió",
			examples: [
				{ description: "Mở cửa sổ", value: true },
				{ description: "Đóng cửa sổ", value: false }
			]
		},
		{
			name: "Fan Control",
			topic: "greenhouse/devices/fan/control",
			dataType: "Boolean",
			description: "Điều khiển quạt thông gió",
			examples: [
				{ description: "Bật quạt", value: true },
				{ description: "Tắt quạt", value: false }
			]
		}
	];

	const getValueForMQTT = (value: any, dataType: string): string => {
		if (dataType === "Boolean") {
			return value ? "1" : "0";
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
						<p className="small text-info">💡 ESP32 gửi chỉ giá trị số, không phải JSON object</p>
						<code className="d-block p-2 bg-light mb-2">
							mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/sensors/temperature -m &quot;25.5&quot;
						</code>
						<code className="d-block p-2 bg-light mb-2">
							mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/sensors/humidity -m &quot;65&quot;
						</code>
						<code className="d-block p-2 bg-light mb-2">
							mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/sensors/soil -m &quot;45&quot;
						</code>
						<Button
							size="sm"
							variant="outline-secondary"
							className="mt-2"
							onClick={() => copyToClipboard('mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/sensors/temperature -m &quot;25.5&quot;', 'test_pub')}
						>
							{copiedTopic === 'test_pub' ? '✓ Copied' : 'Copy Temperature Command'}
						</Button>
					</div>

					<h6>Test Device Control (Publish):</h6>
					<div className="mb-3">
						<code className="d-block p-2 bg-light mb-2">
							mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/devices/light/control -m &quot;1&quot;
						</code>
						<code className="d-block p-2 bg-light mb-2">
							mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/devices/pump/control -m &quot;0&quot;
						</code>
						<Button
							size="sm"
							variant="outline-secondary"
							className="mt-2"
							onClick={() => copyToClipboard('mosquitto_pub -h mqtt.noboroto.id.vn -p 1883 -u vision -P vision -t greenhouse/devices/light/control -m "1"', 'test_control')}
						>
							{copiedTopic === 'test_control' ? '✓ Copied' : 'Copy Light Control'}
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
