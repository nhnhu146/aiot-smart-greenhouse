#!/usr/bin/env python3
"""
Smart Greenhouse - Advanced Sensor Data Merger
Automatically merges N/A sensor values and same-timestamp data
Triggers on: server restart, MQTT messages, scheduled intervals
"""

import os
import sys
import time
import json
import logging
import signal
import socket
import threading
from datetime import datetime, timedelta
from pymongo import MongoClient, DESCENDING
from typing import Dict, Any, Optional, List
import schedule

# Set UTF-8 encoding for Windows
if sys.platform.startswith('win'):
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Configure logging with UTF-8 encoding


class UTF8Formatter(logging.Formatter):
    def format(self, record):
        message = super().format(record)
        # Replace emojis with text for Windows compatibility
        replacements = {
            '✅': '[OK]', '❌': '[ERROR]', '⚠️': '[WARNING]', '🔄': '[PROCESSING]',
            '📊': '[DATA]', '🔐': '[CLOSED]', '📝': '[LOG]', '🚀': '[START]', '⏰': '[SCHEDULE]'
        }
        for emoji, text in replacements.items():
            message = message.replace(emoji, text)
        return message


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('advanced_sensor_merger.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

for handler in logger.handlers:
    handler.setFormatter(UTF8Formatter(
        '%(asctime)s - %(levelname)s - %(message)s'))


class AdvancedSensorMerger:
    def __init__(self, mongo_uri: str = None, db_name: str = 'aiot_greenhouse'):
        self.mongo_uri = mongo_uri or os.getenv(
            'MONGODB_URI', 'mongodb://localhost:27017')
        self.db_name = db_name
        self.client = None
        self.db = None
        self.collection = None
        self.is_running = False
        self.merge_lock = threading.Lock()
        self.last_restart_check = datetime.now()

    def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = MongoClient(
                self.mongo_uri, serverSelectionTimeoutMS=30000)
            self.db = self.client[self.db_name]
            self.collection = self.db.sensordatas
            self.client.admin.command('ping')
            logger.info(f"✅ Connected to MongoDB: {self.db_name}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            return False

    def get_recent_sensor_data(self, limit: int = 200) -> List[Dict[str, Any]]:
        """Get recent sensor data for analysis"""
        try:
            cursor = self.collection.find({}, {
                'temperature': 1, 'humidity': 1, 'soil': 1, 'rain': 1,
                'waterlevel': 1, 'light': 1, 'height': 1, 'createdAt': 1, 'timestamp': 1
            }).sort('createdAt', DESCENDING).limit(limit)

            data = list(cursor)
            logger.info(f"📊 Retrieved {len(data)} recent sensor records")
            return data
        except Exception as e:
            logger.error(f"❌ Error fetching recent sensor data: {e}")
            return []

    def normalize_timestamp(self, doc: Dict[str, Any]) -> datetime:
        """Normalize timestamp from document"""
        if 'createdAt' in doc and doc['createdAt']:
            return doc['createdAt']
        elif 'timestamp' in doc and doc['timestamp']:
            if isinstance(doc['timestamp'], str):
                return datetime.fromisoformat(doc['timestamp'].replace('Z', '+00:00'))
            return doc['timestamp']
        return datetime.now()

    def is_na_value(self, value: Any) -> bool:
        """Check if value is N/A or equivalent"""
        if value is None:
            return True
        if isinstance(value, str):
            return value.lower() in ['n/a', 'na', 'null', 'none', 'undefined', '']
        if isinstance(value, dict) and 'value' in value:
            return self.is_na_value(value['value'])
        return False

    def extract_value(self, field_data: Any) -> Any:
        """Extract actual value from field data"""
        if field_data is None:
            return None
        if isinstance(field_data, dict):
            return field_data.get('value', field_data.get('data', None))
        return field_data

    def merge_same_timestamp_data(self) -> int:
        """Merge data records with the same timestamp"""
        try:
            with self.merge_lock:
                logger.info("🔄 Starting same-timestamp data merge")

                # Group records by minute-level timestamp
                pipeline = [
                    {
                        "$group": {
                            "_id": {
                                "year": {"$year": "$createdAt"},
                                "month": {"$month": "$createdAt"},
                                "day": {"$dayOfMonth": "$createdAt"},
                                "hour": {"$hour": "$createdAt"},
                                "minute": {"$minute": "$createdAt"}
                            },
                            "docs": {"$push": "$$ROOT"},
                            "count": {"$sum": 1}
                        }
                    },
                    {"$match": {"count": {"$gt": 1}}},
                    {"$sort": {"_id": -1}},
                    {"$limit": 50}
                ]

                duplicate_groups = list(self.collection.aggregate(pipeline))
                merged_count = 0

                for group in duplicate_groups:
                    docs = group['docs']
                    if len(docs) < 2:
                        continue

                    # Find the most complete record
                    best_doc = self.find_most_complete_record(docs)
                    merged_doc = self.merge_documents(docs, best_doc)

                    if merged_doc:
                        # Update the best document
                        result = self.collection.update_one(
                            {'_id': best_doc['_id']},
                            {'$set': merged_doc}
                        )

                        # Delete other documents from the same time
                        other_ids = [doc['_id']
                                     for doc in docs if doc['_id'] != best_doc['_id']]
                        if other_ids:
                            self.collection.delete_many(
                                {'_id': {'$in': other_ids}})

                        if result.modified_count > 0:
                            merged_count += 1
                            timestamp = best_doc.get('createdAt', 'unknown')
                            logger.info(
                                f"✅ Merged {len(docs)} records at {timestamp}")

                logger.info(
                    f"✅ Same-timestamp merge completed - {merged_count} groups merged")
                return merged_count
        except Exception as e:
            logger.error(f"❌ Error in same-timestamp merge: {e}")
            return 0

    def find_most_complete_record(self, docs: List[Dict]) -> Dict:
        """Find the record with the fewest N/A values"""
        sensor_fields = ['temperature', 'humidity', 'soil',
                         'rain', 'waterlevel', 'light', 'height']

        best_doc = docs[0]
        min_na_count = float('inf')

        for doc in docs:
            na_count = sum(1 for field in sensor_fields
                           if self.is_na_value(self.extract_value(doc.get(field))))

            if na_count < min_na_count:
                min_na_count = na_count
                best_doc = doc

        return best_doc

    def merge_documents(self, docs: List[Dict], base_doc: Dict) -> Dict:
        """Merge multiple documents into one complete record"""
        sensor_fields = ['temperature', 'humidity', 'soil',
                         'rain', 'waterlevel', 'light', 'height']
        merged_data = {}

        for field in sensor_fields:
            # Start with base document value
            best_value = self.extract_value(base_doc.get(field))

            # If base value is N/A, look for better value in other docs
            if self.is_na_value(best_value):
                for doc in docs:
                    candidate_value = self.extract_value(doc.get(field))
                    if not self.is_na_value(candidate_value):
                        best_value = candidate_value
                        break

            # Update if we found a better value
            if not self.is_na_value(best_value):
                if isinstance(base_doc.get(field), dict):
                    merged_data[field] = {
                        **base_doc[field], 'value': best_value}
                else:
                    merged_data[field] = best_value

        return merged_data if merged_data else None

    def find_best_value(self, field_name: str, current_timestamp: datetime, data_list: List[Dict]) -> Any:
        """Find the best non-N/A value for a field"""
        # Priority 1: Same timestamp (within 1 minute)
        for doc in data_list:
            doc_timestamp = self.normalize_timestamp(doc)
            if abs((doc_timestamp - current_timestamp).total_seconds()) < 60:
                field_value = self.extract_value(doc.get(field_name))
                if not self.is_na_value(field_value):
                    return field_value

        # Priority 2: Most recent non-N/A value
        for doc in data_list:
            field_value = self.extract_value(doc.get(field_name))
            if not self.is_na_value(field_value):
                return field_value

        return None

    def merge_na_values(self, recent_data: List[Dict]) -> int:
        """Merge N/A values with latest available data"""
        if not recent_data:
            return 0

        merged_count = 0
        sensor_fields = ['temperature', 'humidity', 'soil',
                         'rain', 'waterlevel', 'light', 'height']

        for doc in recent_data:
            doc_timestamp = self.normalize_timestamp(doc)
            has_na_values = False
            updates = {}

            for field in sensor_fields:
                field_value = self.extract_value(doc.get(field))
                if self.is_na_value(field_value):
                    has_na_values = True
                    best_value = self.find_best_value(
                        field, doc_timestamp, recent_data)
                    if best_value is not None:
                        if isinstance(doc.get(field), dict):
                            updates[field] = {
                                **doc[field], 'value': best_value}
                        else:
                            updates[field] = best_value

            if has_na_values and updates:
                try:
                    result = self.collection.update_one(
                        {'_id': doc['_id']},
                        {'$set': updates}
                    )
                    if result.modified_count > 0:
                        merged_count += 1
                        logger.info(
                            f"✅ Updated document {doc['_id']} - {len(updates)} fields")
                except Exception as e:
                    logger.error(
                        f"❌ Failed to update document {doc['_id']}: {e}")

        return merged_count

    def run_comprehensive_merge(self) -> bool:
        """Run comprehensive merge operation"""
        try:
            logger.info("🔄 Starting comprehensive sensor data merge")

            # Step 1: Merge same-timestamp data
            same_time_merged = self.merge_same_timestamp_data()

            # Step 2: Get fresh data and merge N/A values
            recent_data = self.get_recent_sensor_data(200)
            na_merged = self.merge_na_values(recent_data) if recent_data else 0

            total_merged = same_time_merged + na_merged
            if total_merged > 0:
                logger.info(
                    f"✅ Merge completed - {same_time_merged} timestamp groups + {na_merged} N/A updates")
            else:
                logger.info("✅ No merging needed - data is optimal")

            return True
        except Exception as e:
            logger.error(f"❌ Error during merge operation: {e}")
            return False

    def check_backend_restart(self) -> bool:
        """Check if backend server is accessible"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(2)
            result = sock.connect_ex(('localhost', 5000))
            sock.close()
            return result == 0
        except Exception:
            return False

    def trigger_on_restart(self):
        """Check for restart and trigger merge if needed"""
        if self.check_backend_restart():
            current_time = datetime.now()
            time_diff = (current_time -
                         self.last_restart_check).total_seconds()
            if time_diff > 120:  # Only trigger if more than 2 minutes since last check
                logger.info("🚀 Backend restart detected - triggering merge")
                self.run_comprehensive_merge()
            self.last_restart_check = current_time

    def start_service(self):
        """Start continuous merge service"""
        self.is_running = True
        logger.info("🚀 Advanced sensor merger service started")

        # Run initial merge on startup
        self.run_comprehensive_merge()

        # Schedule periodic tasks
        schedule.every(5).minutes.do(self.run_comprehensive_merge)
        schedule.every(30).seconds.do(self.trigger_on_restart)

        logger.info(
            "⏰ Scheduled tasks: merge every 5min, restart check every 30s")

        while self.is_running:
            try:
                schedule.run_pending()
                time.sleep(10)
            except KeyboardInterrupt:
                logger.info("✅ Service stopped by user")
                break
            except Exception as e:
                logger.error(f"❌ Service error: {e}")
                time.sleep(60)

    def stop_service(self):
        """Stop the service"""
        self.is_running = False

    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("🔐 MongoDB connection closed")


def signal_handler(sig, frame):
    """Handle shutdown gracefully"""
    logger.info("✅ Received shutdown signal")
    sys.exit(0)


def main():
    import argparse
    parser = argparse.ArgumentParser(
        description='Advanced Greenhouse Sensor Merger')
    parser.add_argument('--mode', choices=['single', 'service'], default='single',
                        help='Run mode: single merge or continuous service')
    parser.add_argument('--mongo-uri', default=None, help='MongoDB URI')
    parser.add_argument('--trigger', choices=['restart', 'mqtt', 'schedule'], default='schedule',
                        help='Trigger type for merge operations')

    args = parser.parse_args()

    signal.signal(signal.SIGINT, signal_handler)

    merger = AdvancedSensorMerger(mongo_uri=args.mongo_uri)

    try:
        if not merger.connect():
            logger.error("❌ Cannot connect to MongoDB")
            sys.exit(1)

        if args.mode == 'single':
            logger.info("🔄 Running single comprehensive merge")
            success = merger.run_comprehensive_merge()
            sys.exit(0 if success else 1)
        else:
            logger.info("🚀 Starting continuous service mode")
            merger.start_service()
    except KeyboardInterrupt:
        logger.info("✅ Process interrupted by user")
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        sys.exit(1)
    finally:
        merger.close()


if __name__ == "__main__":
    main()
