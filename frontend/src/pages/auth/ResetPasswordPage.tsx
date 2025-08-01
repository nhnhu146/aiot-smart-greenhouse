import { useState, FormEvent, useEffect } from 'react';
import { Card, Button, Alert, Form } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import authService from '@/lib/authService';
import styles from './SignInPage.module.scss';

const ResetPasswordPage = () => {
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [token, setToken] = useState('');
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	useEffect(() => {
		const resetToken = searchParams.get('token');
		if (resetToken) {
			setToken(resetToken);
		} else {
			setError('Invalid reset link');
		}
	}, [searchParams]);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError('');
		setMessage('');

		if (password !== confirmPassword) {
			setError('Passwords do not match');
			return;
		}

		setLoading(true);

		try {
			const response = await authService.resetPassword(token, password);

			if (response.success) {
				setMessage('Password reset successfully! Redirecting to sign in...');
				setTimeout(() => navigate('/signin'), 2000);
			} else {
				setError(response.message || 'Password reset failed');
			}
		} catch (e) {
			console.error('Reset password error:', e);
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
							<Form.Label>New Password</Form.Label>
							<div className={styles.passwordContainer}>
								<Form.Control
									type={showPassword ? 'text' : 'password'}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									className={styles.input}
								/>
								<button
									type="button"
									className={styles.eyeButton}
									onClick={() => setShowPassword(!showPassword)}
								>
									{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
								</button>
							</div>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label>Confirm New Password</Form.Label>
							<Form.Control
								type={showPassword ? 'text' : 'password'}
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
								className={styles.input}
							/>
						</Form.Group>

						<Button
							type="submit"
							className={styles.submitButton}
							disabled={loading || !token}
							size="lg"
						>
							{loading ? 'Resetting...' : 'Reset Password'}
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

export default ResetPasswordPage;
