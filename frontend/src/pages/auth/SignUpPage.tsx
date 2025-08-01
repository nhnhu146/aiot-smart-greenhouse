import { useState, FormEvent } from 'react';
import { Card, Button, Alert, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import authService from '@/lib/authService';
import styles from './SignInPage.module.scss';

const SignUpPage = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError('');

		if (password !== confirmPassword) {
			setError('Passwords do not match');
			return;
		}

		setLoading(true);

		try {
			const response = await authService.signUp(email, password);

			if (response.success) {
				navigate('/dashboard');
			} else {
				setError(response.message || 'Sign up failed');
			}
		} catch (e) {
			console.error('Sign up error:', e);
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
						<h3 className="mt-3">Sign Up</h3>
					</div>

					{error && <Alert variant="danger">{error}</Alert>}

					<Form onSubmit={handleSubmit}>
						<Form.Group className="mb-3">
							<Form.Label>Email</Form.Label>
							<Form.Control
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className={styles.input}
							/>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label>Password</Form.Label>
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
							<Form.Label>Confirm Password</Form.Label>
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
							disabled={loading}
							size="lg"
						>
							{loading ? 'Creating account...' : 'Sign Up'}
						</Button>
					</Form>

					<div className="text-center mt-3">
						<span>Already have an account? </span>
						<button
							type="button"
							className="btn btn-link p-0"
							onClick={() => navigate('/signin')}
						>
							Sign in
						</button>
					</div>
				</Card.Body>
			</Card>
		</div>
	);
};

export default SignUpPage;
