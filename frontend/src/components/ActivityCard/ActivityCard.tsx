import React from 'react';
import { Card } from 'react-bootstrap';
import styles from './ActivityCard.module.scss';

type ActivityCardProps = {
  title: string;
  icon: string;
  switchId: string;
  switchState: boolean;
  onSwitchChange?: (state: boolean) => void;
};

const ActivityCard: React.FC<ActivityCardProps> = ({ title, icon, switchState, onSwitchChange }) => {
  const handleCardClick = () => {
    if (onSwitchChange) {
      onSwitchChange(!switchState); // Toggle trạng thái
    }
  };

  return (
    <Card
      className={`${styles.card} ${switchState ? styles.active : ''}`}
      onClick={handleCardClick}
    >
      <Card.Body className={styles.cardBody}>
        <div className={styles.icon}>{icon}</div>
        <div className={styles.title}>{title}</div>
      </Card.Body>
    </Card>
  );
};

export default ActivityCard;
