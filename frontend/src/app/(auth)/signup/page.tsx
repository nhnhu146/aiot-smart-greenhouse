'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import React, { useState, useEffect } from 'react';
import { Card, Button } from 'react-bootstrap';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import authService from '@/lib/authService';
import styles from './signup.module.scss';

const SignUp = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	useEffect(() => {
		// Check if user is already authenticated
		if (authService.isAuthenticated()) {
			router.replace('/dashboard');
		}
	}, [router]);

	const handleSubmit = async () => {
		setError('');

		if (password !== confirmPassword) {
			setError('Passwords do not match');
			return;
		}

		if (!email || !password) {
			setError('Email and password are required');
			return;
		}

		setLoading(true);

		try {
			const response = await authService.signUp(email, password);

			if (response.success && response.user) {
				setEmail('');
				setPassword('');
				setConfirmPassword('');
				router.push('/dashboard');
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
				<Card.Body className="d-flex flex-column justify-content-center align-items-center">
					{/* Back Button */}
					<div style={{ alignSelf: 'flex-start', marginBottom: '10px' }}>
						<Button
							variant="outline-secondary"
							onClick={() => router.push('/landing')}
							style={{
								borderRadius: '8px',
								padding: '8px 16px',
								fontSize: '14px'
							}}
						>
							← Back
						</Button>
					</div>

					<Image className="mb-3" src="/logo.svg" alt="GreenHouse Logo" width={250} height={150} />

					{/* Email Input */}
					<div className="mx-4">
						<label htmlFor="email" className="form-label">
							Your Email
						</label>
						<input
							id="email"
							type="email"
							placeholder="Enter email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className={`form-control mb-3 ${styles.input}`}
							required
						/>
					</div>

					{/* Password Input */}
					<div className={styles.passwordContainer}>
						<label htmlFor="password" className="form-label">
							Password
						</label>
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							placeholder="Enter password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className={`form-control mb-3 ${styles.input}`}
							required
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
							Confirm Password
						</label>
						<input
							id="confirmPassword"
							type={showConfirmPassword ? 'text' : 'password'}
							placeholder="Confirm Password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							className={`form-control mb-3 ${styles.input}`}
							required
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

					{/* Submit Button */}
					<Button
						type="button"
						variant="success"
						className={styles.submitButton}
						onClick={handleSubmit}
						disabled={loading}
					>
						{loading ? 'Signing Up...' : 'Sign Up'}
					</Button>
				</Card.Body>
			</Card>
		</div>
	);
};

export default SignUp;