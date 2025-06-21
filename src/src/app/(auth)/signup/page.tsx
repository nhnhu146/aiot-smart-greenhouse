'use client';
import React, { useState, useEffect } from 'react';
import { Card, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useCreateUserWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { auth } from '@/app/firebase/config';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const SignUp = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [createUserWithEmailAndPassword, user, loading, firebaseError] = useCreateUserWithEmailAndPassword(auth);

    const handleSubmit = async () => {
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!email || !password) {
            setError('Email and password cannot be empty');
            return;
        }

        try {
            await createUserWithEmailAndPassword(email, password);
        } catch (e) {
            console.error('Error creating user:', e);
            setError(firebaseError?.message || 'An unexpected error occurred');
        }
    };

    useEffect(() => {
        if (user) {
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            router.push('/signin');
        }
    }, [user, router]);

    return (
        <div
            className="min-vh-80 d-flex"
            style={{
                backgroundImage: "url('/background.svg')",
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                width: '100vw',
                height: '100vh',
            }}
        >
            <Card
                style={{
                    backgroundColor: 'white',
                    borderTopRightRadius: '30px',
                    borderBottomRightRadius: '30px',
                    borderTopLeftRadius: '0',
                    borderBottomLeftRadius: '0',
                    border: 'none',
                }}
            >
                <Card.Body className="d-flex flex-column justify-content-center align-items-center">
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
                            className="form-control mb-3"
                            style={{
                                backgroundColor: 'rgba(87, 174, 9, 0.25)',
                                width: '500px',
                            }}
                            required
                        />
                    </div>

                    {/* Password Input */}
                    <div style={{ position: 'relative', width: '500px' }}>
                        <label htmlFor="password" className="form-label">
                            Password
                        </label>
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-control mb-3"
                            style={{
                                backgroundColor: 'rgba(87, 174, 9, 0.25)',
                            }}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                top: '50%',
                                right: '10px',
                                transform: 'translateY(-20%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                            }}
                        >
                            {showPassword ? (
                                <Image
                                    className="mx-1 my-1"
                                    src="/close-eye.svg"
                                    alt="Hide password"
                                    width={20}
                                    height={20}
                                />
                            ) : (
                                <Image
                                    className="mx-1 my-1"
                                    src="/open-eye.svg"
                                    alt="Show password"
                                    width={19}
                                    height={19}
                                />
                            )}
                        </button>
                    </div>

                    {/* Confirm Password Input */}
                    <div>
                        <label htmlFor="confirmPassword" className="form-label">
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="form-control mb-3"
                            style={{
                                backgroundColor: 'rgba(87, 174, 9, 0.25)',
                                width: '500px',
                            }}
                            required
                        />
                    </div>

                    {/* Error Message */}
                    {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}
                    {firebaseError && <p style={{ color: 'red', marginBottom: '15px' }}>{firebaseError.message}</p>}

                    {/* Loading State */}
                    {loading && <p>Loading...</p>}

                    {/* Submit Button */}
                    <Button
                        type="button"
                        variant="success"
                        style={{
                            backgroundColor: '#57AE09',
                            border: 'none',
                            width: '120px',
                            borderRadius: '20px',
                            boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                        }}
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