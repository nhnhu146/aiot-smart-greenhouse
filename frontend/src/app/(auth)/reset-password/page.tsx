'use client'
import React, { FormEvent, useState, useEffect } from 'react';
import { Card, Button } from 'react-bootstrap';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import authService from '@/lib/authService';
import styles from '../signin/signin.module.scss';

const ResetPassword = () => {
	const [token, setToken] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const searchParams = useSearchParams();

	useEffect(() => {
		const tokenParam = searchParams.get('token');
		if (tokenParam) {
			setToken(tokenParam);
		} else {
			setError('Invalid reset link');
		}
	}, [searchParams]);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError('');
		setSuccess('');

		// Validate passwords
		if (newPassword !== confirmPassword) {
			setError('Passwords do not match');
			return;
		}

		if (newPassword.length < 6) {
			setError('Password must be at least 6 characters long');
			return;
		}

		setLoading(true);

		try {
			const response = await fetch('/api/auth/reset-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ token, newPassword }),
			});

			const data = await response.json();

			if (data.success) {
				setSuccess('Password has been reset successfully');
				setNewPassword('');
				setConfirmPassword('');

				// Redirect to signin after success
				setTimeout(() => {
					router.push('/signin');
				}, 2000);
			} else {
				setError(data.message || 'Failed to reset password');
			}
		} catch (e) {
			console.error('Reset password error:', e);
			setError('An unexpected error occurred');
		} finally {
			setLoading(false);
		}
	};

	if (!token && !error) {
		return (
			<div className={styles.container}>
				<Card className={styles.card}>
					<Card.Body className='d-flex flex-column justify-content-center align-items-center'>
						<p>Loading...</p>
					</Card.Body>
				</Card>
			</div>
		);
	}

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
								fontSize: '12px',
								padding: '5px 15px'
							}}
						>
							← Back to Sign In
						</Button>
					</div>

					{/* Title */}
					<h2 className={styles.title}>Reset Password</h2>
					<p className="text-muted text-center mb-4">
						Enter your new password below.
					</p>

					{/* Form */}
					<form onSubmit={handleSubmit} className="w-100">
						{/* New Password Input */}
						<div className={styles.passwordContainer}>
							<label htmlFor="newPassword" className="form-label">
								New Password
							</label>
							<input
								id="newPassword"
								type={showPassword ? 'text' : 'password'}
								placeholder="Enter new password"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								className={`form-control mb-3 ${styles.input}`}
								required
								minLength={6}
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className={styles.eyeButton}
							>
								{showPassword ? (
									<Image
										className="mx-1 my-1"
										src="/open-eye.svg"
										alt="Show password"
										width={19}
										height={19}
									/>
								) : (
									<Image
										className="mx-1 my-1"
										src="/close-eye.svg"
										alt="Hide password"
										width={20}
										height={20}
									/>
								)}
							</button>
						</div>

						{/* Confirm Password Input */}
						<div className={styles.passwordContainer}>
							<label htmlFor="confirmPassword" className="form-label">
								Confirm New Password
							</label>
							<input
								id="confirmPassword"
								type={showConfirmPassword ? 'text' : 'password'}
								placeholder="Confirm new password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								className={`form-control mb-3 ${styles.input}`}
								required
								minLength={6}
							/>
							<button
								type="button"
								onClick={() => setShowConfirmPassword(!showConfirmPassword)}
								className={styles.eyeButton}
							>
								{showConfirmPassword ? (
									<Image
										className="mx-1 my-1"
										src="/open-eye.svg"
										alt="Show password"
										width={19}
										height={19}
									/>
								) : (
									<Image
										className="mx-1 my-1"
										src="/close-eye.svg"
										alt="Hide password"
										width={20}
										height={20}
									/>
								)}
							</button>
						</div>

						{/* Error Message */}
						{error && <p className={styles.errorMessage}>{error}</p>}

						{/* Success Message */}
						{success && (
							<div className="alert alert-success" role="alert">
								{success}
								<br />
								<small>Redirecting to sign in...</small>
							</div>
						)}

						{/* Loading State */}
						{loading && <p>Resetting password...</p>}

						{/* Submit Button */}
						<Button
							type="submit"
							variant="success"
							className={styles.submitButton}
							disabled={loading || !token}
						>
							{loading ? 'Resetting...' : 'Reset Password'}
						</Button>
					</form>
				</Card.Body>
			</Card>
		</div>
	);
};

export default ResetPassword;
