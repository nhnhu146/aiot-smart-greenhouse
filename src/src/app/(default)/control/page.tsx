"use client";

import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import ActivityCard from '../../../components/ActivityCard/ActivityCard';
import publishMessage from '@/hooks/publishMQTT';
import useMQTT from '@/hooks/useMQTT';
import pushNoti from '@/hooks/pushNoti';
import styles from './control.module.scss';

var Humidity = 0, Temperature = 0, Rain = 0, Waterlevel = 0, Moisture = 0;
var noti_sent = false, last_water_state = false;

const Control = () => {
  const { messages, clearMessages } = useMQTT();
  const [switchStates, setSwitchStates] = useState(new Map([['HKT_greenhouse/lights', false]]));
  const [userInteraction, setUserInteraction] = useState(false);

  const activities = [
    { title: 'Lights', icon: '💡', topic: 'HKT_greenhouse/lights' },
    { title: 'Fan', icon: '🌬️', topic: 'HKT_greenhouse/fan' },
    { title: 'Watering', icon: '💧', topic: 'HKT_greenhouse/watering' },
    { title: 'Window', icon: '🪟', topic: 'HKT_greenhouse/window' },
    { title: 'Door', icon: '🚪', topic: 'HKT_greenhouse/door' },
  ];

  const handleSwitchChange = (topic: string, state: boolean) => {
    setSwitchStates((prev) => new Map(prev).set(topic, state));
    const message = state ? 'HIGH' : 'LOW';
    publishMessage(topic, message);
  };

  useEffect(() => {
    if (messages.length > 0) {
      messages.forEach(async (msg) => {
        if (msg.startsWith("Photonresistor value")) {
          const value = parseInt(msg.split(" ")[2], 10);
          const shouldTurnOn = value > 2000;
          const currentLightState = switchStates.get('HKT_greenhouse/lights') || false;
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
            const shouldOpenWindow = Humidity > 30 && Temperature > 20 && Rain < 200;
            const shouldOpenFan = Humidity > 30 && Temperature > 20 && Rain >= 200;
            const currentFanState = switchStates.get('HKT_greenhouse/fan');
            const currentWindowState = switchStates.get('HKT_greenhouse/window');

            if (shouldOpenWindow !== currentWindowState) {
              setSwitchStates((prev) => new Map(prev).set('HKT_greenhouse/window', shouldOpenWindow));
              publishMessage('HKT_greenhouse/window', shouldOpenWindow ? 'HIGH' : 'LOW');
            }

            if (shouldOpenFan !== currentFanState) {
              setSwitchStates((prev) => new Map(prev).set('HKT_greenhouse/fan', shouldOpenFan));
              publishMessage('HKT_greenhouse/fan', shouldOpenFan ? 'HIGH' : 'LOW');
            }

            const lcdMessage = `Humidity: ${Humidity.toFixed(2)} | Temperature: ${Temperature.toFixed(2)}`;
            publishMessage("HKT_greenhouse/lcd", lcdMessage);
          }
          clearMessages();
        }

        if (msg.startsWith("Moisture value") || msg.startsWith("Float switch value")) {
          if (msg.startsWith("Moisture value")) Moisture = parseFloat(msg.split(" ")[2]);
          if (msg.startsWith("Float switch value")) Waterlevel = parseFloat(msg.split(" ")[3]);

          const shouldTurnOnPump = Moisture > 4000 && Waterlevel === 1;
          const currentPumpState = switchStates.get('HKT_greenhouse/watering');

          if (Waterlevel === 1 && last_water_state === false) {
            noti_sent = false;
            last_water_state = true;
          }

          if (Waterlevel === 0 && noti_sent === false) {
            pushNoti("HKT GreenHouse Notification", "Water level is low. Please refill the water tank");
            sendEmail({
              to: 'nguyengiakiet2345@gmail.com',
              subject: 'HKT GreenHouse Notification',
              text: 'Water level is low. Please refill the water tank',
            });
            noti_sent = true;
          }

          if (shouldTurnOnPump !== currentPumpState) {
            setSwitchStates((prev) => new Map(prev).set('HKT_greenhouse/watering', shouldTurnOnPump));
            publishMessage('HKT_greenhouse/watering', shouldTurnOnPump ? 'HIGH' : 'LOW');
          }
          clearMessages();
        }
      });
    }
  }, [messages, userInteraction, switchStates]);

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

  return (
    <Container className={styles["activity-container"]}>
      <h3 className={styles["activity-title"]}>Let’s check your GreenHouse activity</h3>
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
    </Container>
  );
};

export default Control;
