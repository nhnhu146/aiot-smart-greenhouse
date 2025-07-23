#!/usr/bin/env python3
"""
Smart Greenhouse - Device History Populator
Ensures device history data exists for frontend History tab
"""

import os
import sys
import json
import logging
from datetime import datetime, timedelta
from pymongo import MongoClient
from typing import Dict, Any, List
import random

# Set UTF-8 encoding for Windows
if sys.platform.startswith('win'):
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('device_history_populator.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class DeviceHistoryPopulator:
    def __init__(self, mongo_uri: str = None, db_name: str = 'aiot_greenhouse'):
        """Initialize the device history populator"""
        self.mongo_uri = mongo_uri or os.getenv(
            'MONGODB_URI', 'mongodb://localhost:27017')
        self.db_name = db_name
        self.client = None
        self.db = None
        self.device_history_collection = None

    def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = MongoClient(
                self.mongo_uri, serverSelectionTimeoutMS=30000)
            self.db = self.client[self.db_name]
            self.device_history_collection = self.db.devicehistories
            # Test connection
            self.client.admin.command('ping')
            logger.info(f"[OK] Connected to MongoDB: {self.db_name}")
            return True
        except Exception as e:
            logger.error(f"[ERROR] Failed to connect to MongoDB: {e}")
            return False

    def check_existing_data(self) -> int:
        """Check how many device history records exist"""
        try:
            count = self.device_history_collection.count_documents({})
            logger.info(
                f"[DATA] Found {count} existing device history records")
            return count
        except Exception as e:
            logger.error(f"[ERROR] Error checking existing data: {e}")
            return 0

    def generate_sample_history(self, days_back: int = 7, records_per_day: int = 10) -> List[Dict[str, Any]]:
        """Generate sample device history data"""
        devices = [
            {'name': 'light', 'type': 'light', 'actions': ['on', 'off']},
            {'name': 'pump', 'type': 'pump', 'actions': ['on', 'off']},
            {'name': 'fan', 'type': 'fan', 'actions': ['on', 'off']},
            {'name': 'door', 'type': 'door', 'actions': ['open', 'close']},
            {'name': 'window', 'type': 'window', 'actions': ['open', 'close']}
        ]

        control_types = ['manual', 'automatic']
        user_ids = ['user123', 'system', 'admin', 'greenhouse_app']

        sample_data = []
        base_time = datetime.now() - timedelta(days=days_back)

        for day in range(days_back):
            day_time = base_time + timedelta(days=day)

            for record_num in range(records_per_day):
                device = random.choice(devices)
                action = random.choice(device['actions'])
                control_type = random.choice(control_types)
                user_id = random.choice(user_ids)

                # Add some randomness to the timestamp
                random_minutes = random.randint(
                    0, 1440)  # 0-24 hours in minutes
                timestamp = day_time + timedelta(minutes=random_minutes)

                record = {
                    'deviceId': f"greenhouse_{device['name']}",
                    'deviceType': device['type'],
                    'action': action,
                    'status': action in ['on', 'open'],
                    'controlType': control_type,
                    'userId': user_id,
                    'timestamp': timestamp,
                    # 75% success rate
                    'success': random.choice([True, True, True, False]),
                    'createdAt': timestamp,
                    'updatedAt': timestamp
                }

                # Add error message for failed operations
                if not record['success']:
                    record['errorMessage'] = random.choice([
                        'Device timeout',
                        'MQTT connection lost',
                        'Hardware malfunction',
                        'Sensor read error'
                    ])

                sample_data.append(record)

        logger.info(
            f"[DATA] Generated {len(sample_data)} sample device history records")
        return sample_data

    def populate_history(self, force: bool = False) -> bool:
        """Populate device history collection with sample data"""
        try:
            existing_count = self.check_existing_data()

            if existing_count > 0 and not force:
                logger.info(
                    f"[OK] Device history already has {existing_count} records. Use --force to repopulate.")
                return True

            if force and existing_count > 0:
                logger.info("[PROCESSING] Force mode - clearing existing data")
                self.device_history_collection.delete_many({})

            # Generate and insert sample data
            sample_data = self.generate_sample_history(
                days_back=7, records_per_day=15)

            if sample_data:
                result = self.device_history_collection.insert_many(
                    sample_data)
                inserted_count = len(result.inserted_ids)
                logger.info(
                    f"[OK] Successfully inserted {inserted_count} device history records")

                # Create indexes for better query performance
                self.device_history_collection.create_index(
                    [('timestamp', -1)])
                self.device_history_collection.create_index(
                    [('deviceType', 1)])
                self.device_history_collection.create_index(
                    [('controlType', 1)])
                logger.info(
                    "[OK] Created database indexes for optimal performance")

                return True
            else:
                logger.error("[ERROR] No sample data generated")
                return False

        except Exception as e:
            logger.error(f"[ERROR] Failed to populate device history: {e}")
            return False

    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("[CLOSED] MongoDB connection closed")


def main():
    """Main execution function"""
    import argparse
    parser = argparse.ArgumentParser(
        description='Smart Greenhouse Device History Populator')
    parser.add_argument('--force', action='store_true',
                        help='Force repopulation even if data exists')
    parser.add_argument('--mongo-uri', default=None,
                        help='MongoDB connection URI')

    args = parser.parse_args()

    populator = DeviceHistoryPopulator(mongo_uri=args.mongo_uri)

    try:
        if not populator.connect():
            logger.error("[ERROR] Cannot connect to MongoDB")
            sys.exit(1)

        success = populator.populate_history(force=args.force)

        if success:
            logger.info(
                "[OK] Device history population completed successfully")
            sys.exit(0)
        else:
            logger.error("[ERROR] Device history population failed")
            sys.exit(1)

    except KeyboardInterrupt:
        logger.info("[OK] Process interrupted by user")
    except Exception as e:
        logger.error(f"[ERROR] Unexpected error: {e}")
        sys.exit(1)
    finally:
        populator.close()


if __name__ == "__main__":
    main()
