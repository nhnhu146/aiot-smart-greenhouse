'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Row, Col, Button } from 'react-bootstrap';
import styles from './landing.module.scss';

const SetUp = () => {
	const router = useRouter();

	useEffect(() => {
		// Check if user is already authenticated
		const token = localStorage.getItem('token');
		if (token) {
			// Verify token is still valid
			try {
				const payload = JSON.parse(atob(token.split('.')[1]));
				const currentTime = Date.now() / 1000;

				if (payload.exp > currentTime) {
					// Token is valid, redirect to dashboard
					router.replace('/dashboard');
					return;
				}
			} catch (error) {
				// Invalid token, remove it
				localStorage.removeItem('token');
			}
		}
	}, [router]);

	return (
		<div className={styles.container}>
			<Image
				className={`mb-5 ${styles.logo}`}
				src="/logo.svg"
				alt="GreenHouse Logo"
				width={450} height={400}
			/>

			<Row className="justify-content-center align-items-center d-flex">
				<Col>
					<Button
						className={`${styles.button} ${styles.signin}`}
						onClick={() => router.push('/signin')}
					>
						Sign In
					</Button>
				</Col>
				<Col>
					<Button
						className={`${styles.button} ${styles.signup}`}
						onClick={() => router.push('/signup')}
					>
						Sign Up
					</Button>
				</Col>
			</Row>
		</div>
	);
};

export default SetUp;
