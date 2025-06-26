'use client'
import React, { FormEvent, useState } from 'react';
import { Card, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import authService from '@/lib/authService';
import styles from './signin.module.scss';

const SignIn = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError('');
		setLoading(true);

		try {
			const response = await authService.signIn(email, password);

			if (response.success && response.user) {
				setEmail('');
				setPassword('');
				router.push('/dashboard');
			} else {
				setError(response.message || 'Sign in failed');
			}
		} catch (e) {
			console.error('Sign in error:', e);
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

					{/* Form */}
					<form onSubmit={handleSubmit} className={styles.formContainer}>
						{/* Email Input */}
						<div className='mx-4'>
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
							{/* Show/Hide password */}
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className={styles.eyeButton}
							>
								{showPassword ?
									<Image className="mx-1 my-1" src="/close-eye.svg" alt="Hide password" width={20} height={20} />
									: <Image className="mx-1 my-1" src="/open-eye.svg" alt="Show password" width={19} height={19} />
								}
							</button>
						</div>

						{/* Error Message */}
						{error && <p className={styles.errorMessage}>{error}</p>}

						{/* Loading State */}
						{loading && <p>Loading...</p>}

						{/* Submit Button */}
						<Button
							type="submit"
							variant="success"
							className={styles.submitButton}
							disabled={loading}
						>
							{loading ? 'Signing In...' : 'Sign In'}
						</Button>
					</form>
				</Card.Body>
			</Card>
		</div>
	);
};

export default SignIn;
