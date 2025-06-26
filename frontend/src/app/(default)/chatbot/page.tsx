'use client';
import { ChangeEvent, useState } from "react";
import { Container, Card, Image } from "react-bootstrap";

const Chatbot = () => {
	const [question, setQuestion] = useState("");
	const [response, setResponse] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
			const res = await fetch(`${API_BASE_URL}/api/chat`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ question }),
			});

			const data = await res.json();
			if (data.error) {
				setResponse(`Error: ${data.error}`);
			} else {
				setResponse(data.answer || "Sorry, I don't know the answer.");
			}
		} catch (error) {
			console.error("Error:", error);
			setResponse("An error occurred.");
		}
	};

	return (
		<Container className="my-3">
			<h3 className="mb-4 mx-2">Green bot</h3>
			<Card style={{ borderRadius: "20px" }}>
				<Card.Body className="mx-3 my-3">
					<h3>Hi, User! 👋</h3>
					<p>How can I help you?</p>
					<div className="mt-auto d-flex align-items-center p-2">
						<Image
							src="/avatar.svg"
							alt="Avatar"
							width={40}
							height={40}
							className="mx-2"
						/>
						<p className="my-2">{question}</p>
					</div>
					<div className="mt-auto d-flex align-items-center p-2">
						<Image
							src="/bot.svg"
							alt="Greenbot"
							width={40}
							height={40}
							className="mx-2"
						/>
						<p className="my-2">{response}</p>
					</div>
				</Card.Body>
				<Card.Footer>
					<form onSubmit={handleSubmit} className="mx-3 my-3">
						<input
							type="text"
							placeholder="Ask me something..."
							value={question}
							onChange={(e) => setQuestion(e.target.value)}
							style={{
								width: "95%",
								border: "none",
							}}
						/>
						<button
							type="submit"
							style={{
								color: "#333333",
								border: "none",
								background: "none",
								cursor: "pointer",
							}}
						>
							➤
						</button>
					</form>
				</Card.Footer>
			</Card>
		</Container>
	);
};

export default Chatbot;
