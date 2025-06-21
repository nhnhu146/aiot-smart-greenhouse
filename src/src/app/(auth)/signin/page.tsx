'use client'
import React, { FormEvent, useState } from 'react';
import { Card, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useSignInWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { auth } from '@/app/firebase/config';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './signin.module.scss';

const SignIn = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [signInWithEmailAndPassword, user, loading, firebaseError] = useSignInWithEmailAndPassword(auth);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        try {
            const response = await signInWithEmailAndPassword(email, password);

            if (response?.user) {
                sessionStorage.setItem('user', JSON.stringify(response.user.uid));
                setEmail('');
                setPassword('');
                return router.push('/dashboard');
            } else {
                setError('Your email or password is incorrect');
            }
        } catch (e) {
            console.error(e);
            setError(firebaseError?.message || 'An unexpected error occurred');
        }
    };

    return (
        <div className={styles.container}>
            <Card className={styles.card}>
                <Card.Body className='d-flex flex-column justify-content-center align-items-center'>
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
