'use client';
import Image from 'next/image';
import { Row, Col, Button } from 'react-bootstrap';

const SetUp = () => {
    return (
        <div
            style={{
                backgroundImage: "url('/setup.svg')",
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                width: '100vw',
                height: '100vh',
            }}
        >
            <Image
                className="mb-5"
                src="/logo.svg"
                alt="GreenHouse Logo"
                width={450} height={400}
                style={{
                    position: 'absolute',
                    top: '0%',
                    left: '34%',
                }} />

            <Row className='justify-content-center align-items-center d-flex'>
                <Col>
                    <Button
                        style={{
                            backgroundColor: '#57AE09',
                            borderRadius: '20px',
                            borderColor: '#57AE09',
                            width: '100px',
                            boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                            position: 'absolute',
                            top: '55%',
                            left: '45%',
                            transform: 'translate(-50%, -50%)',
                            padding: '10px 20px',
                            fontSize: '16px'
                        }}
                        href='signin'
                    >
                        Sign In
                    </Button>
                </Col>
                <Col>
                    <Button
                        style={{
                            backgroundColor: '#57AE09',
                            borderRadius: '20px',
                            borderColor: '#57AE09',
                            width: '100px',
                            boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                            position: 'absolute',
                            top: '55%',
                            left: '54%',
                            transform: 'translate(-50%, -50%)',
                            padding: '10px 20px',
                            fontSize: '16px'
                        }}
                        href='signup'
                    >
                        Sign Up
                    </Button>
                </Col>
            </Row>
        </div>
    );
};

export default SetUp;