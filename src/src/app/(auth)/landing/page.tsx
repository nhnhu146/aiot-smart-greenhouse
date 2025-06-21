'use client';
import Image from 'next/image';
import { Row, Col, Button } from 'react-bootstrap';
import styles from './landing.module.scss';

const SetUp = () => {
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
                        href="signin"
                    >
                        Sign In
                    </Button>
                </Col>
                <Col>
                    <Button
                        className={`${styles.button} ${styles.signup}`}
                        href="signup"
                    >
                        Sign Up
                    </Button>
                </Col>
            </Row>
        </div>
    );
};

export default SetUp;
