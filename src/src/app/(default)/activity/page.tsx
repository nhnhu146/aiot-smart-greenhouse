"use client";

import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import ActivityCard from '../../../components/ActivityCard';
import publishMessage from '@/hooks/publishMQTT';
import useMQTT from '@/hooks/useMQTT';
import pushNoti from '@/hooks/pushNoti';

var Humidity = 0, Temperature = 0, Rain = 0, Waterlevel = 0, Moisture = 0;
var noti_sent = false, last_water_state = false;

const Activity = () => {
  const { messages, clearMessages } = useMQTT(); // Hook returns an array of messages
  const [switchStates, setSwitchStates] = useState(
    new Map([
      ['HKT_greenhouse/lights', false],
    ])
  );
  const [userInteraction, setUserInteraction] = useState(false);

  const activities = [
    { title: 'Lights', icon: '💡', topic: 'HKT_greenhouse/lights' },
    { title: 'Fan', icon: '🌬️', topic: 'HKT_greenhouse/fan' },
    { title: 'Watering', icon: '💧', topic: 'HKT_greenhouse/watering' },
    { title: 'Window', icon: '🪟', topic: 'HKT_greenhouse/window' },
    { title: 'Door', icon: '🚪', topic: 'HKT_greenhouse/door' },
  ];

  // Handle user interaction
  const handleSwitchChange = (topic: string, state: boolean) => {
    setSwitchStates((prev) => new Map(prev).set(topic, state));
    const message = state ? 'HIGH' : 'LOW';
    console.log(`Switch changed: topic=${topic}, state=${state}`);
    console.log(`Publishing message: ${message}`);
    publishMessage(topic, message);

    // // Mark that the user has interacted and start a 3-minute timer
    // setUserInteraction(true);
    // setTimeout(() => {
    //   setUserInteraction(false); // Re-enable message processing after 3 minutes
    // }, 3 * 60 * 1000);
  };

  // Parse incoming messages to update photonResistorValue
  useEffect(() => {
    console.log(messages);
    if (messages.length > 0) {
      messages.forEach(async (msg) => {
        if (msg.startsWith("Photonresistor value")) {
          const value = parseInt(msg.split(" ")[2], 10); // Extract the numeric value

          // Adjust light switch state based on the photonresistor value
          const shouldTurnOn = value > 2000;
          const currentLightState = switchStates.get('HKT_greenhouse/lights') || false;

          if (shouldTurnOn !== currentLightState) {
            setSwitchStates((prev) => {
              const newStates = new Map(prev);
              newStates.set('HKT_greenhouse/lights', shouldTurnOn);
              return newStates;
            });
            const message = shouldTurnOn ? 'HIGH' : 'LOW';
            publishMessage('HKT_greenhouse/lights', message); // Publish the message to update light state
          }
          clearMessages();
        }

        if (msg.startsWith("PIR value")) {
          const value = parseInt(msg.split(" ")[2], 10); // Extract the numeric value
          
          // Open door when PIR is on
          var shouldOpenDoor = value == 1 ? true : false;
          var currentDoorState = switchStates.get('HKT_greenhouse/door');

          if (shouldOpenDoor !== currentDoorState) {
            setSwitchStates((prev) => {
              const newStates = new Map(prev);
              newStates.set('HKT_greenhouse/door', shouldOpenDoor);
              return newStates;
            });
            const message = shouldOpenDoor ? 'HIGH' : 'LOW';
            publishMessage('HKT_greenhouse/door', message); // Publish the message to update light state
          }
          clearMessages();
        }
        
        if (msg.startsWith("Humidity value") || msg.startsWith("Temperature value") || msg.startsWith("Rain value")) {

          if (msg.startsWith("Humidity value")) {
            const value = parseFloat(msg.split(" ")[2]);
            Humidity = value;
          }
        

          if (msg.startsWith("Temperature value")) {
            const value = parseFloat(msg.split(" ")[2]);
            Temperature = value
          }
        
          if (msg.startsWith("Rain value")) {
            const value = parseInt(msg.split(" ")[2], 10);
            Rain = value;
          }
          
          console.log(Humidity, Temperature, Rain);
          if (typeof Humidity === "number" && typeof Temperature === "number" && typeof Rain === "number") {
            var shouldOpenWindow = (Humidity > 30 && Temperature > 20 && Rain < 200) ? true : false;
            var shouldOpenFan = (Humidity > 30 && Temperature > 20 && Rain >= 200) ? true : false;

            var currentFanState = switchStates.get('HKT_greenhouse/fan');
            var currentWindowState = switchStates.get('HKT_greenhouse/window');

            var old_humidity = 0;
            var old_temperature = 0;

            if (shouldOpenWindow !== currentWindowState) {
              setSwitchStates((prev) => {
                const newStates = new Map(prev);
                newStates.set('HKT_greenhouse/window', shouldOpenWindow);
                return newStates;
              });
              const message = shouldOpenWindow ? 'HIGH' : 'LOW';
              publishMessage('HKT_greenhouse/window', message); // Publish the message to update window state
            }
            if (shouldOpenFan != currentFanState) {
              setSwitchStates((prev) => {
                const newStates = new Map(prev);
                newStates.set('HKT_greenhouse/fan', shouldOpenFan);
                return newStates;
              });
              const message = shouldOpenFan ? 'HIGH' : 'LOW';
              publishMessage('HKT_greenhouse/fan', message); // Publish the message to update fan state
            }
            if (Humidity != old_humidity && Temperature != old_temperature && Humidity > 0 && Temperature > 0) {
              old_humidity = Humidity;
              old_temperature = Temperature;
              const lcdMessage = `Humidity: ${Humidity.toFixed(2)} | Temperature: ${Temperature.toFixed(2)}`;
              publishMessage("HKT_greenhouse/lcd", lcdMessage);
            }
          }
          clearMessages();
        }

        if (msg.startsWith("Moisture value") || msg.startsWith("Float switch value")) {
          if (msg.startsWith("Moisture value")) {
            const value = parseFloat(msg.split(" ")[2]);
            Moisture = value;
          }
        
          if (msg.startsWith("Float switch value")) {
            const value = parseFloat(msg.split(" ")[3]);
            Waterlevel = value;
          }

          const shouldTurnOnPump = (Moisture > 4000 && Waterlevel === 1) ? true : false;
          const currentLightState = switchStates.get('HKT_greenhouse/watering');

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

          if (shouldTurnOnPump !== currentLightState) {
            setSwitchStates((prev) => {
              const newStates = new Map(prev);
              newStates.set('HKT_greenhouse/watering', shouldTurnOnPump);
              return newStates;
            });
            const message = shouldTurnOnPump ? 'HIGH' : 'LOW';
            publishMessage('HKT_greenhouse/watering', message); // Publish the message to update light state
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
        headers: {
          'Content-Type': 'application/json',
        },
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
    <Container className="py-4">  
      <h3 className="mb-4 px-2">Let’s check your GreenHouse activity</h3>
      <Row>
        {activities.map((activity, index) => (
          <Col key={index} xs={12} md={6} lg={4} className="d-flex justify-content-center mb-3">
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

export default Activity;
