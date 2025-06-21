import React from 'react';
import { Card, Form } from 'react-bootstrap';

type ActivityCardProps = {
  title: string;
  icon: string;
  switchId: string;
  switchState: boolean;
  onSwitchChange?: (state: boolean) => void;
};

const ActivityCard: React.FC<ActivityCardProps> = ({ title, icon, switchId, onSwitchChange, switchState }) => {
  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onSwitchChange) {
      onSwitchChange(event.target.checked); // Pass the switch state to the parent
    }
  };

  return (
    <Card className="border-0" style={{ width: '24rem', borderRadius: '10px', height: '6rem' }}>
      <Card.Body className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          {/* Icon and Title */}
          <span className="me-3" style={{ fontSize: '1.5rem' }}>{icon}</span>
          <Card.Title className="mb-0">{title}</Card.Title>
        </div>

        {/* Switch */}
        <Form className="ms-auto">
          <Form.Check
            type="switch"
            id={switchId}
            label=""
            checked={switchState}
            onChange={handleSwitchChange} // Attach the event handler here
          />
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ActivityCard;
