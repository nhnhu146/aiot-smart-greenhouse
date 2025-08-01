import { useState, FormEvent } from 'react';
import { Card, Button, Alert, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import authService from '@/lib/authService';
import styles from './SignInPage.module.scss';

const ForgotPasswordPage = () => {
	const [email, setEmail] = useState('');
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError('');
		setMessage('');
		setLoading(true);

		try {
			const response = await authService.forgotPassword(email);

			if (response.success) {
				setMessage('Password reset email sent! Please check your inbox.');
				setEmail('');
			} else {
				setError(response.message || 'Failed to send reset email');
			}
		} catch (e) {
			console.error('Forgot password error:', e);
			setError('An unexpected error occurred');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={styles.container}>
			<Card className={styles.card}>
				<Card.Body>
					<div className="text-center mb-4">
						<img src="/logo.svg" alt="Logo" width={200} height={120} />
						<h3 className="mt-3">Reset Password</h3>
					</div>

					{message && <Alert variant="success">{message}</Alert>}
					{error && <Alert variant="danger">{error}</Alert>}

					<Form onSubmit={handleSubmit}>
						<Form.Group className="mb-3">
							<Form.Label>Email Address</Form.Label>
							<Form.Control
								type="email"
								placeholder="Enter your email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className={styles.input}
							/>
						</Form.Group>

						<Button
							type="submit"
							className={styles.submitButton}
							disabled={loading}
							size="lg"
						>
							{loading ? 'Sending...' : 'Send Reset Link'}
						</Button>
					</Form>

					<div className="text-center mt-3">
						<button
							type="button"
							className="btn btn-link"
							onClick={() => navigate('/signin')}
						>
							Back to Sign In
						</button>
					</div>
				</Card.Body>
			</Card>
		</div>
	);
};

export default ForgotPasswordPage;
