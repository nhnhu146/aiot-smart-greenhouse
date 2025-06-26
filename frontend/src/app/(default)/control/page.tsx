"use client";

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form } from 'react-bootstrap';
import ActivityCard from '../../../components/ActivityCard/ActivityCard';
import publishMessage from '@/hooks/publishMQTT';
import useMQTT from '@/hooks/useMQTT';
import pushNoti from '@/hooks/pushNoti';
import styles from './control.module.scss';

var Humidity = 0, Temperature = 0, Rain = 0, Waterlevel = 0, Moisture = 0;
var noti_sent = false, last_water_state = false;

interface LogEntry {
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

const Control = () => {
  const { messages, clearMessages } = useMQTT();
  const [switchStates, setSwitchStates] = useState(new Map([['HKT_greenhouse/lights', false]]));
  const [userInteraction, setUserInteraction] = useState(false);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  
  // Threshold states
  const [thresholds, setThresholds] = useState({
    temperature: 25,
    humidity: 60,
    moisture: 40,
    light: 2000
  });

  const activities = [
    { title: 'Lights', icon: '💡', topic: 'HKT_greenhouse/lights' },
    { title: 'Fan', icon: '🌬️', topic: 'HKT_greenhouse/fan' },
    { title: 'Watering', icon: '💧', topic: 'HKT_greenhouse/watering' },
    { title: 'Window', icon: '🪟', topic: 'HKT_greenhouse/window' },
    { title: 'Door', icon: '🚪', topic: 'HKT_greenhouse/door' },
  ];

  // Add a log entry
  const addLogEntry = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setLogEntries(prev => [{
      timestamp: new Date(),
      message,
      type
    }, ...prev].slice(0, 100)); // Keep only the last 100 entries
  };

  useEffect(() => {
    // Add initial log entry
    addLogEntry('System initialized', 'info');
  }, []);

  const handleSwitchChange = (topic: string, state: boolean) => {
    setSwitchStates((prev) => new Map(prev).set(topic, state));
    const message = state ? 'HIGH' : 'LOW';
    publishMessage(topic, message);
    
    // Log the action
    const deviceName = activities.find(a => a.topic === topic)?.title || topic.split('/').pop() || '';
    addLogEntry(`${deviceName} turned ${state ? 'ON' : 'OFF'}`, state ? 'success' : 'info');
  };

  const handleThresholdChange = (type: string, value: number) => {
    setThresholds(prev => ({
      ...prev,
      [type]: value
    }));
    
    // Log the threshold change
    addLogEntry(`${type.charAt(0).toUpperCase() + type.slice(1)} threshold set to ${value}`, 'info');
  };

  useEffect(() => {
    if (messages.length > 0) {
      messages.forEach(async (msg) => {
        if (msg.startsWith("Photonresistor value")) {
          const value = parseInt(msg.split(" ")[2], 10);
          const shouldTurnOn = value > thresholds.light; // Use threshold
          const currentLightState = switchStates.get('HKT_greenhouse/lights') || false;
          
          if (value > thresholds.light && !currentLightState) {
            addLogEntry(`Light level high (${value}), turning lights on`, 'warning');
          }
          
          if (shouldTurnOn !== currentLightState) {
            setSwitchStates((prev) => new Map(prev).set('HKT_greenhouse/lights', shouldTurnOn));
            publishMessage('HKT_greenhouse/lights', shouldTurnOn ? 'HIGH' : 'LOW');
          }
          clearMessages();
        }

        if (msg.startsWith("PIR value")) {
          const value = parseInt(msg.split(" ")[2], 10);
          const shouldOpenDoor = value === 1;
          const currentDoorState = switchStates.get('HKT_greenhouse/door');
          
          if (value === 1 && !currentDoorState) {
            addLogEntry(`Motion detected, opening door`, 'info');
          }
          
          if (shouldOpenDoor !== currentDoorState) {
            setSwitchStates((prev) => new Map(prev).set('HKT_greenhouse/door', shouldOpenDoor));
            publishMessage('HKT_greenhouse/door', shouldOpenDoor ? 'HIGH' : 'LOW');
          }
          clearMessages();
        }

        if (msg.startsWith("Humidity value") || msg.startsWith("Temperature value") || msg.startsWith("Rain value")) {
          if (msg.startsWith("Humidity value")) Humidity = parseFloat(msg.split(" ")[2]);
          if (msg.startsWith("Temperature value")) Temperature = parseFloat(msg.split(" ")[2]);
          if (msg.startsWith("Rain value")) Rain = parseInt(msg.split(" ")[2], 10);

          if (typeof Humidity === "number" && typeof Temperature === "number" && typeof Rain === "number") {
            // Use thresholds
            const shouldOpenWindow = Humidity > thresholds.humidity && Temperature > thresholds.temperature && Rain < 200;
            const shouldOpenFan = Humidity > thresholds.humidity && Temperature > thresholds.temperature && Rain >= 200;
            const currentFanState = switchStates.get('HKT_greenhouse/fan');
            const currentWindowState = switchStates.get('HKT_greenhouse/window');

            if (Temperature > thresholds.temperature && !currentFanState && !currentWindowState) {
              addLogEntry(`Temperature above threshold (${Temperature}°C)`, 'warning');
            }
            
            if (Humidity > thresholds.humidity && !currentFanState && !currentWindowState) {
              addLogEntry(`Humidity above threshold (${Humidity}%)`, 'warning');
            }

            if (shouldOpenWindow !== currentWindowState) {
              setSwitchStates((prev) => new Map(prev).set('HKT_greenhouse/window', shouldOpenWindow));
              publishMessage('HKT_greenhouse/window', shouldOpenWindow ? 'HIGH' : 'LOW');
              if (shouldOpenWindow) {
                addLogEntry(`Opening window due to high temperature/humidity`, 'info');
              }
            }

            if (shouldOpenFan !== currentFanState) {
              setSwitchStates((prev) => new Map(prev).set('HKT_greenhouse/fan', shouldOpenFan));
              publishMessage('HKT_greenhouse/fan', shouldOpenFan ? 'HIGH' : 'LOW');
              if (shouldOpenFan) {
                addLogEntry(`Turning on fan due to high temperature/humidity while raining`, 'info');
              }
            }

            const lcdMessage = `Humidity: ${Humidity.toFixed(2)} | Temperature: ${Temperature.toFixed(2)}`;
            publishMessage("HKT_greenhouse/lcd", lcdMessage);
          }
          clearMessages();
        }

        if (msg.startsWith("Moisture value") || msg.startsWith("Float switch value")) {
          if (msg.startsWith("Moisture value")) Moisture = parseFloat(msg.split(" ")[2]);
          if (msg.startsWith("Float switch value")) Waterlevel = parseFloat(msg.split(" ")[3]);

          // Use threshold
          const shouldTurnOnPump = Moisture > thresholds.moisture && Waterlevel === 1;
          const currentPumpState = switchStates.get('HKT_greenhouse/watering');

          if (Moisture > thresholds.moisture && !currentPumpState) {
            addLogEntry(`Soil is dry (moisture: ${Moisture})`, 'warning');
          }

          if (Waterlevel === 1 && last_water_state === false) {
            noti_sent = false;
            last_water_state = true;
            addLogEntry(`Water tank refilled`, 'success');
          }

          if (Waterlevel === 0 && noti_sent === false) {
            pushNoti("HKT GreenHouse Notification", "Water level is low. Please refill the water tank");
            sendEmail({
              to: 'nguyengiakiet2345@gmail.com',
              subject: 'HKT GreenHouse Notification',
              text: 'Water level is low. Please refill the water tank',
            });
            noti_sent = true;
            addLogEntry(`Water level low, notification sent`, 'error');
          }

          if (shouldTurnOnPump !== currentPumpState) {
            setSwitchStates((prev) => new Map(prev).set('HKT_greenhouse/watering', shouldTurnOnPump));
            publishMessage('HKT_greenhouse/watering', shouldTurnOnPump ? 'HIGH' : 'LOW');
            if (shouldTurnOnPump) {
              addLogEntry(`Starting watering system due to dry soil`, 'info');
            }
          }
          clearMessages();
        }
      });
    }
  }, [messages, userInteraction, switchStates, thresholds]);

  async function sendEmail(emailData) {
    try {
      const res = await fetch('/api/send-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      });
      const data = await res.json();
      if (data.success) {
        console.log('Email sent successfully:', data.response);
      } else {
        console.error('Failed to send email:', data.error);
      }
    } catch (error) {
      console.error('Error while sending email:', error);
    }
  }

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <Container className={styles["activity-container"]}>
      <h3 className={styles["activity-title"]}>GreenHouse Control</h3>
      
      {/* Device controls section */}
      <Row className={styles["activity-row"]}>
        {activities.map((activity, index) => (
          <Col key={index} xs={12} md={6} lg={4} className={styles["activity-card-wrapper"]}>
            <ActivityCard
              title={activity.title}
              icon={activity.icon}
              switchId={`switch-${activity.title}`}
              switchState={switchStates.get(activity.topic) || false}
              onSwitchChange={(state) => handleSwitchChange(activity.topic, state)}
            />
          </Col>
        ))}
      </Row>
      
      {/* Threshold controls section */}
      <Card className={styles["threshold-card"]}>
        <h4 className={styles["threshold-title"]}>Alert Thresholds</h4>
        
        <div className={styles["threshold-item"]}>
          <div className={styles["threshold-label"]}>
            <span>Temperature (°C)</span>
            <span className={styles["threshold-value"]}>{thresholds.temperature}°C</span>
          </div>
          <Form.Range 
            min={15} 
            max={40} 
            step={1}
            value={thresholds.temperature}
            onChange={(e) => handleThresholdChange('temperature', parseInt(e.target.value))}
          />
        </div>
        
        <div className={styles["threshold-item"]}>
          <div className={styles["threshold-label"]}>
            <span>Humidity (%)</span>
            <span className={styles["threshold-value"]}>{thresholds.humidity}%</span>
          </div>
          <Form.Range 
            min={30} 
            max={90} 
            step={1}
            value={thresholds.humidity}
            onChange={(e) => handleThresholdChange('humidity', parseInt(e.target.value))}
          />
        </div>
        
        <div className={styles["threshold-item"]}>
          <div className={styles["threshold-label"]}>
            <span>Soil Moisture</span>
            <span className={styles["threshold-value"]}>{thresholds.moisture}</span>
          </div>
          <Form.Range 
            min={0} 
            max={4000} 
            step={100}
            value={thresholds.moisture}
            onChange={(e) => handleThresholdChange('moisture', parseInt(e.target.value))}
          />
        </div>
        
        <div className={styles["threshold-item"]}>
          <div className={styles["threshold-label"]}>
            <span>Light Level</span>
            <span className={styles["threshold-value"]}>{thresholds.light}</span>
          </div>
          <Form.Range 
            min={500} 
            max={4000} 
            step={100}
            value={thresholds.light}
            onChange={(e) => handleThresholdChange('light', parseInt(e.target.value))}
          />
        </div>
      </Card>
      
      {/* System log section */}
      <Card className={styles["log-card"]}>
        <h4 className={styles["log-title"]}>System Activity Log</h4>
        
        <ul className={styles["log-list"]}>
          {logEntries.length === 0 ? (
            <li className={styles["log-item"]}>No activity recorded yet</li>
          ) : (
            logEntries.map((entry, index) => (
              <li key={index} className={styles["log-item"]}>
                <span className={styles["log-timestamp"]}>{formatTimestamp(entry.timestamp)}</span>
                <span className={`${styles["log-message"]} ${styles[`log-${entry.type}`]}`}>
                  {entry.message}
                </span>
              </li>
            ))
          )}
        </ul>
      </Card>
    </Container>
  );
};

export default Control;
