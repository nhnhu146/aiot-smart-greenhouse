"use client";

import { useState, useEffect } from "react";
import { Container, Card, Row, Col, Button, Form, Table, Badge } from "react-bootstrap";
import useWebSocket from "@/hooks/useWebSocket";
import styles from "./voice-commands.module.scss";

// Force dynamic rendering
export const dynamic = "force-dynamic";

interface VoiceCommand {
	id: string;
	command: string;
	confidence: number | null;
	timestamp: string;
	processed: boolean;
	response?: string;
	errorMessage?: string;
}

const VoiceCommands = () => {
	const [commands, setCommands] = useState<VoiceCommand[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [testCommand, setTestCommand] = useState("");
	const [isSending, setIsSending] = useState(false);
	const { socket } = useWebSocket();

	// Format timestamp to display date-time consistently
	const formatDateTime = (timestamp: string): string => {
		const date = new Date(timestamp);
		if (isNaN(date.getTime())) {
			return timestamp;
		}
		return date.toLocaleString("en-GB", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false,
		});
	};

	// Fetch voice commands history
	const fetchVoiceCommands = async () => {
		try {
			setIsLoading(true);
			const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
			const response = await fetch(`${API_BASE_URL}/api/voice-commands`);

			if (response.ok) {
				const result = await response.json();
				if (result.success) {
					setCommands(result.data.commands || []);
				}
			} else {
				console.warn("Voice commands API response not ok:", response.status);
			}
		} catch (error) {
			console.error("Failed to fetch voice commands:", error);
		} finally {
			setIsLoading(false);
		}
	};

	// Send test voice command
	const sendTestCommand = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!testCommand.trim()) return;

		try {
			setIsSending(true);
			const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
			const response = await fetch(`${API_BASE_URL}/api/voice-commands/process`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					command: testCommand.trim(),
					confidence: 1.0,
				}),
			});

			if (response.ok) {
				setTestCommand("");
				// Refresh the list after a short delay to allow processing
				setTimeout(fetchVoiceCommands, 1000);
			} else {
				console.error("Failed to send test command:", response.status);
			}
		} catch (error) {
			console.error("Error sending test command:", error);
		} finally {
			setIsSending(false);
		}
	};

	// WebSocket listener for real-time voice command updates
	useEffect(() => {
		if (socket) {
			const handleVoiceCommand = (data: VoiceCommand) => {
				console.log("🎤 Received voice command update:", data);
				setCommands(prev => [data, ...prev.filter(cmd => cmd.id !== data.id)]);
			};

			socket.on("voice-command", handleVoiceCommand);
			socket.on("voice-command-history", handleVoiceCommand);

			return () => {
				socket.off("voice-command", handleVoiceCommand);
				socket.off("voice-command-history", handleVoiceCommand);
			};
		}
	}, [socket]);

	// Initial data fetch
	useEffect(() => {
		fetchVoiceCommands();
	}, []);

	const getConfidenceBadge = (confidence: number | null | undefined) => {
		if (confidence == null) return "secondary"; // N/A case
		if (confidence >= 0.9) return "success";
		if (confidence >= 0.7) return "warning";
		return "danger";
	};

	const getStatusBadge = (command: VoiceCommand) => {
		if (command.errorMessage) return "danger";
		if (command.processed) return "success";
		return "secondary";
	};

	return (
		<Container fluid className={styles.voiceCommands}>
			<Row>
				<Col>
					<h1 className={styles.pageTitle}>
						<span className={styles.voiceIcon}>🎤</span>
						<span className={styles.titleText}>Voice Received</span>
						<span className={styles.titleAccent}>AI Commands</span>
					</h1>
					<p className={styles.pageDescription}>
						Monitor and test voice commands for your smart greenhouse with enhanced AI recognition
					</p>
				</Col>
			</Row>

			<Row className="mb-4">
				<Col md={6}>
					<Card className={styles.testCard}>
						<Card.Header>
							<h5 className="mb-0">🧪 Test Voice Command</h5>
						</Card.Header>
						<Card.Body>
							<Form onSubmit={sendTestCommand}>
								<Form.Group className="mb-3">
									<Form.Label>Voice Command</Form.Label>
									<Form.Control
										type="text"
										placeholder="e.g., turn on light, open door, close window"
										value={testCommand}
										onChange={(e) => setTestCommand(e.target.value)}
										disabled={isSending}
									/>
									<Form.Text className="text-muted">
										Try commands like: &quot;turn on light&quot;, &quot;open door&quot;, &quot;close window&quot;, &quot;auto mode&quot;
									</Form.Text>
								</Form.Group>
								<Button
									type="submit"
									variant="primary"
									disabled={isSending || !testCommand.trim()}
								>
									{isSending ? "Sending..." : "Send Command"}
								</Button>
							</Form>
						</Card.Body>
					</Card>
				</Col>
				<Col md={6}>
					<Card className={styles.statusCard}>
						<Card.Header>
							<h5 className="mb-0">📊 Voice Commands Status</h5>
						</Card.Header>
						<Card.Body>
							<div className={styles.statusGrid}>
								<div className={styles.statusItem}>
									<div className={styles.statusValue}>{commands.length}</div>
									<div className={styles.statusLabel}>Total Commands</div>
								</div>
								<div className={styles.statusItem}>
									<div className={styles.statusValue}>
										{commands.filter(cmd => cmd.processed && !cmd.errorMessage).length}
									</div>
									<div className={styles.statusLabel}>Successful</div>
								</div>
								<div className={styles.statusItem}>
									<div className={styles.statusValue}>
										{commands.filter(cmd => cmd.errorMessage).length}
									</div>
									<div className={styles.statusLabel}>Failed</div>
								</div>
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>

			<Row>
				<Col>
					<Card className={styles.historyCard}>
						<Card.Header className="d-flex justify-content-between align-items-center">
							<h5 className="mb-0">📋 Voice Commands History</h5>
							<Button
								variant="outline-primary"
								size="sm"
								onClick={fetchVoiceCommands}
								disabled={isLoading}
							>
								{isLoading ? "Loading..." : "Refresh"}
							</Button>
						</Card.Header>
						<Card.Body>
							{isLoading ? (
								<div className="text-center p-4">
									<div className="spinner-border text-primary" role="status">
										<span className="visually-hidden">Loading...</span>
									</div>
								</div>
							) : commands.length === 0 ? (
								<div className="text-center p-4">
									<p className="text-muted">No voice commands recorded yet.</p>
									<p className="text-muted">Try sending a test command above!</p>
								</div>
							) : (
								<div className={styles.tableContainer}>
									<Table responsive striped hover>
										<thead>
											<tr>
												<th>Time</th>
												<th>Command</th>
												<th>Confidence</th>
												<th>Status</th>
												<th>Response</th>
											</tr>
										</thead>
										<tbody>
											{commands.map((command) => (
												<tr key={command.id}>
													<td className={styles.timeCell}>
														{formatDateTime(command.timestamp)}
													</td>
													<td className={styles.commandCell}>
														<code>{command.command}</code>
													</td>
													<td>
														<Badge bg={getConfidenceBadge(command.confidence)}>
															{command.confidence != null ? (command.confidence * 100).toFixed(0) + '%' : 'N/A'}
														</Badge>
													</td>
													<td>
														<Badge bg={getStatusBadge(command)}>
															{command.errorMessage
																? "Error"
																: command.processed
																	? "Processed"
																	: "Pending"
															}
														</Badge>
													</td>
													<td className={styles.responseCell}>
														{command.errorMessage ? (
															<span className="text-danger">{command.errorMessage}</span>
														) : command.response ? (
															<span className="text-success">{command.response}</span>
														) : (
															<span className="text-muted">-</span>
														)}
													</td>
												</tr>
											))}
										</tbody>
									</Table>
								</div>
							)}
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</Container>
	);
};

export default VoiceCommands;
