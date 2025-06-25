'use client';

import React, { useEffect, useState } from 'react';
import { Card, Button, Form } from 'react-bootstrap';
import styles from './settings.module.scss';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/app/firebase/config';

const SystemSettingsPage = () => {
  const [threshold, setThreshold] = useState(75);
  const [email, setEmail] = useState('');
  const [schedule, setSchedule] = useState('08:00');
  const [controlMode, setControlMode] = useState('auto');
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
    console.log('Saving config:', { threshold, email, schedule, controlMode });
    // TODO: Gửi dữ liệu tới backend
  };

  const handleReset = () => {
    setThreshold(75);
    setEmail(user?.email || '');
    setSchedule('08:00');
    setControlMode('auto');
    setEmailError('');
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>System Configuration</h2>

      <Card className={styles.card}>
        <Card.Header className={styles.cardHeader}>Threshold Settings</Card.Header>
        <Card.Body className={styles.cardBody}>
          <Form.Group className={styles.formGroup}>
            <Form.Label>Alert Threshold (%)</Form.Label>
            <Form.Control
              type="number"
              min={0}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
            />
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

      <Card className={styles.card}>
        <Card.Header className={styles.cardHeader}>Control Parameters</Card.Header>
        <Card.Body className={styles.cardBody}>
          <Form.Group className={styles.formGroup}>
            <Form.Label>Mode</Form.Label>
            <Form.Select
              value={controlMode}
              onChange={(e) => setControlMode(e.target.value)}
            >
              <option value="auto">Automatic</option>
              <option value="manual">Manual</option>
            </Form.Select>
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
