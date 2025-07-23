#!/usr/bin/env python3
"""
Data Merge Utility - Merge duplicate sensor data with same timestamps
Thực hiện merge data có cùng giờ, phút, giây trong database
"""

import os
import sys
from datetime import datetime
from pymongo import MongoClient
from typing import Dict, Any, List

# MongoDB connection
MONGO_URI = os.getenv(
    'MONGODB_URI', 'mongodb://greenhouse_user:greenhouse_password@localhost:27017/aiot_greenhouse?authSource=admin')


class DataMerger:
    def __init__(self):
        self.client = MongoClient(MONGO_URI)
        self.db = self.client.aiot_greenhouse
        self.collection = self.db.sensordatas

    def merge_same_timestamp_data(self) -> int:
        """Merge records with same timestamp (hour, minute, second)"""
        try:
            print("🔄 Starting timestamp merge...")

            # Group by hour, minute, second
            pipeline = [
                {
                    "$group": {
                        "_id": {
                            "year": {"$year": "$createdAt"},
                            "month": {"$month": "$createdAt"},
                            "day": {"$dayOfMonth": "$createdAt"},
                            "hour": {"$hour": "$createdAt"},
                            "minute": {"$minute": "$createdAt"},
                            "second": {"$second": "$createdAt"}
                        },
                        "docs": {"$push": "$$ROOT"},
                        "count": {"$sum": 1}
                    }
                },
                {"$match": {"count": {"$gt": 1}}},
                {"$sort": {"_id": -1}},
                {"$limit": 100}
            ]

            duplicate_groups = list(self.collection.aggregate(pipeline))
            merged_count = 0

            for group in duplicate_groups:
                docs = group['docs']
                if len(docs) < 2:
                    continue

                # Find most complete record
                best_doc = self.find_best_record(docs)
                merged_doc = self.merge_records(docs, best_doc)

                if merged_doc:
                    # Update best record
                    self.collection.update_one(
                        {'_id': best_doc['_id']},
                        {'$set': merged_doc}
                    )

                    # Delete others
                    other_ids = [doc['_id']
                                 for doc in docs if doc['_id'] != best_doc['_id']]
                    if other_ids:
                        self.collection.delete_many(
                            {'_id': {'$in': other_ids}})
                        merged_count += len(other_ids)

                    print(f"✅ Merged {len(docs)} records at {group['_id']}")

            print(f"🎉 Merge completed: {merged_count} records merged")
            return merged_count

        except Exception as e:
            print(f"❌ Error in merge: {e}")
            return 0

    def find_best_record(self, docs: List[Dict]) -> Dict:
        """Find record with most non-null values"""
        best_score = -1
        best_doc = docs[0]

        for doc in docs:
            score = 0
            fields = ['temperature', 'humidity', 'soilMoisture',
                      'waterLevel', 'plantHeight', 'lightLevel']

            for field in fields:
                if doc.get(field) is not None:
                    score += 1

            if score > best_score:
                best_score = score
                best_doc = doc

        return best_doc

    def merge_records(self, docs: List[Dict], best_doc: Dict) -> Dict:
        """Merge all records into one complete record"""
        merged = {}

        # Sensor fields to merge
        fields = ['temperature', 'humidity', 'soilMoisture', 'waterLevel',
                  'plantHeight', 'lightLevel', 'rainStatus', 'motionDetected']

        for field in fields:
            # Use first non-null value found
            for doc in docs:
                if doc.get(field) is not None:
                    merged[field] = doc[field]
                    break

        # Keep metadata from best record
        merged['deviceId'] = best_doc.get('deviceId', 'esp32-greenhouse-01')
        merged['dataQuality'] = 'complete'
        merged['updatedAt'] = datetime.now()

        return merged

    def close(self):
        self.client.close()


if __name__ == "__main__":
    merger = DataMerger()
    try:
        count = merger.merge_same_timestamp_data()
        print(f"✅ Successfully merged {count} duplicate records")
    finally:
        merger.close()
