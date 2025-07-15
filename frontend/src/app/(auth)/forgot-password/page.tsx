'use client'
import React, { FormEvent, useState } from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import authService from '@/lib/authService';
import styles from '../signin/signin.module.scss';

const ForgotPassword = () => {
	const [email, setEmail] = useState('');
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const router = useRouter();

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
				<Card.Body className='d-flex flex-column justify-content-center align-items-center'>
					{/* Back Button */}
					<div style={{ alignSelf: 'flex-start', marginBottom: '10px' }}>
						<Button
							variant="outline-secondary"
							onClick={() => router.push('/signin')}
							style={{
								borderRadius: '8px',
								padding: '8px 16px',
								fontSize: '14px'
							}}
						>
							← Back to Sign In
						</Button>
					</div>

					<Image className="mb-3" src="/logo.svg" alt="GreenHouse Logo" width={250} height={150} />

					<h4 className="mb-3 text-center">Reset Password</h4>
					<p className="text-center text-muted mb-4">
						Enter your email address and we'll send you a link to reset your password.
					</p>

					{/* Success Message */}
					{message && <Alert variant="success" className="w-100">{message}</Alert>}

					{/* Error Message */}
					{error && <Alert variant="danger" className="w-100">{error}</Alert>}

					{/* Form */}
					<form onSubmit={handleSubmit} className={styles.formContainer}>
						{/* Email Input */}
						<div className='mx-4'>
							<label htmlFor="email" className="form-label">
								Email Address
							</label>
							<input
								id="email"
								type="email"
								placeholder="Enter your email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className={`form-control mb-3 ${styles.input}`}
								required
							/>
						</div>

						{/* Submit Button */}
						<Button
							type="submit"
							variant="success"
							className={styles.submitButton}
							disabled={loading}
						>
							{loading ? 'Sending...' : 'Send Reset Link'}
						</Button>
					</form>
				</Card.Body>
			</Card>
		</div>
	);
};

export default ForgotPassword;
