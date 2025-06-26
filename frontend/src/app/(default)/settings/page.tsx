'use client';

import React, { useEffect, useState } from 'react';
import { Card, Button, Form } from 'react-bootstrap';
import styles from './settings.module.scss';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/app/firebase/config';

const SystemSettingsPage = () => {
  const [temperature, setTemperature] = useState(25);
  const [humidity, setHumidity] = useState(60);
  const [moisture, setMoisture] = useState(40);
  const [email, setEmail] = useState('');
  const [schedule, setSchedule] = useState('08:00');
  const [user] = useAuthState(auth);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const isValidEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSave = () => {
    if (!isValidEmail(email)) {
      setEmailError('Invalid email format');
      return;
    }

    setEmailError('');
    console.log('Saving config:', { 
      temperature, 
      humidity, 
      moisture, 
      email, 
      schedule
    });
    // TODO: Send data to backend
  };

  const handleReset = () => {
    setTemperature(25);
    setHumidity(60);
    setMoisture(40);
    setEmail(user?.email || '');
    setSchedule('08:00');
    setEmailError('');
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>System Configuration</h2>

      <Card className={styles.card}>
        <Card.Header className={styles.cardHeader}>Threshold Settings</Card.Header>
        <Card.Body className={styles.cardBody}>
          <Form.Group className={styles.formGroup}>
            <Form.Label>Temperature Threshold (°C)</Form.Label>
            <Form.Control
              type="number"
              min={15}
              max={40}
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
            />
            <Form.Text className="text-muted">
              System will activate cooling when temperature exceeds this value.
            </Form.Text>
          </Form.Group>
          
          <Form.Group className={styles.formGroup}>
            <Form.Label>Humidity Threshold (%)</Form.Label>
            <Form.Control
              type="number"
              min={30}
              max={90}
              value={humidity}
              onChange={(e) => setHumidity(Number(e.target.value))}
            />
            <Form.Text className="text-muted">
              System will activate ventilation when humidity exceeds this value.
            </Form.Text>
          </Form.Group>
          
          <Form.Group className={styles.formGroup}>
            <Form.Label>Soil Moisture Threshold</Form.Label>
            <Form.Control
              type="number"
              min={0}
              max={4000}
              value={moisture}
              onChange={(e) => setMoisture(Number(e.target.value))}
            />
            <Form.Text className="text-muted">
              System will activate watering when soil moisture exceeds this value.
            </Form.Text>
          </Form.Group>
        </Card.Body>
      </Card>

      <Card className={styles.card}>
        <Card.Header className={styles.cardHeader}>Email Settings</Card.Header>
        <Card.Body className={styles.cardBody}>
          <Form.Group className={styles.formGroup}>
            <Form.Label>Notification Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              isInvalid={!!emailError}
            />
            <Form.Control.Feedback type="invalid">
              {emailError}
            </Form.Control.Feedback>
          </Form.Group>
        </Card.Body>
      </Card>

      <Card className={styles.card}>
        <Card.Header className={styles.cardHeader}>Schedule Settings</Card.Header>
        <Card.Body className={styles.cardBody}>
          <Form.Group className={styles.formGroup}>
            <Form.Label>Auto Watering Time</Form.Label>
            <Form.Control
              type="time"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
            />
          </Form.Group>
        </Card.Body>
      </Card>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={handleReset}>Reset to Default</Button>
        <Button variant="success" onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  );
};

export default SystemSettingsPage;
