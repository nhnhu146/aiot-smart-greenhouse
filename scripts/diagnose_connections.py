#!/usr/bin/env python3
"""
Smart Greenhouse - Connection Diagnostics
Diagnose MQTT, WebSocket, and MongoDB connections
"""

import asyncio
import json
import logging
import sys
import time
from datetime import datetime
from typing import Dict, Any, List

try:
    import websockets
    import pymongo
    import paho.mqtt.client as mqtt
except ImportError as e:
    print(f"❌ Missing dependency: {e}")
    print("Install with: pip install websockets pymongo paho-mqtt")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class GreenhouseDiagnostics:
    def __init__(self):
        self.results = {}

    def log_test(self, component: str, status: str, message: str, details: Dict = None):
        """Log test results"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        status_icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"

        print(f"[{timestamp}] {status_icon} {component}: {message}")

        self.results[component] = {
            "status": status,
            "message": message,
            "details": details or {},
            "timestamp": timestamp
        }

        if details:
            for key, value in details.items():
                print(f"  - {key}: {value}")

    def test_mongodb(self, uri: str = "mongodb://localhost:27017", db_name: str = "aiot_greenhouse"):
        """Test MongoDB connection"""
        try:
            client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=5000)

            # Test connection
            client.admin.command('ping')

            # Check database
            db = client[db_name]
            collections = db.list_collection_names()

            # Check sensor data
            sensor_count = db.sensordatas.count_documents({})
            device_count = db.devicehistories.count_documents({})

            # Get latest sensor data
            latest_sensor = db.sensordatas.find_one(sort=[('createdAt', -1)])
            latest_device = db.devicehistories.find_one(
                sort=[('timestamp', -1)])

            details = {
                "Database": db_name,
                "Collections": len(collections),
                "Sensor Records": sensor_count,
                "Device History": device_count,
                "Latest Sensor": latest_sensor['createdAt'].strftime("%Y-%m-%d %H:%M:%S") if latest_sensor else "None",
                "Latest Device Action": latest_device['timestamp'].strftime("%Y-%m-%d %H:%M:%S") if latest_device else "None"
            }

            self.log_test("MongoDB", "PASS", "Connected successfully", details)
            client.close()
            return True

        except Exception as e:
            self.log_test("MongoDB", "FAIL", f"Connection failed: {str(e)}")
            return False

    def test_mqtt(self, host: str = "mqtt.noboroto.id.vn", port: int = 1883,
                  username: str = "vision", password: str = "vision"):
        """Test MQTT connection"""
        try:
            client = mqtt.Client()
            client.username_pw_set(username, password)

            # Connection callback
            connected = {"status": False, "error": None}

            def on_connect(client, userdata, flags, rc):
                if rc == 0:
                    connected["status"] = True
                else:
                    connected["error"] = f"Connection failed with code {rc}"

            def on_message(client, userdata, msg):
                print(f"  📨 Received: {msg.topic} -> {msg.payload.decode()}")

            client.on_connect = on_connect
            client.on_message = on_message

            # Connect
            client.connect(host, port, 10)
            client.loop_start()

            # Wait for connection
            time.sleep(2)

            if connected["status"]:
                # Test subscribe to greenhouse topics
                topics = [
                    "greenhouse/sensors/+",
                    "greenhouse/devices/+/control",
                    "greenhouse/devices/+/status"
                ]

                for topic in topics:
                    client.subscribe(topic)

                # Test publish
                client.publish("greenhouse/test/diagnostic",
                               "Connection test from diagnostics")

                details = {
                    "Broker": f"{host}:{port}",
                    "Username": username,
                    "Topics Subscribed": len(topics),
                    "Test Message": "Sent to greenhouse/test/diagnostic"
                }

                self.log_test("MQTT", "PASS",
                              "Connected and tested successfully", details)

                # Listen for messages for a few seconds
                print("  👂 Listening for messages (5 seconds)...")
                time.sleep(5)

                client.loop_stop()
                client.disconnect()
                return True

            else:
                error = connected["error"] or "Unknown connection error"
                self.log_test("MQTT", "FAIL", error)
                return False

        except Exception as e:
            self.log_test("MQTT", "FAIL", f"Exception: {str(e)}")
            return False

    async def test_websocket(self, uri: str = "ws://localhost:5000"):
        """Test WebSocket connection"""
        try:
            async with websockets.connect(uri, timeout=10) as websocket:
                # Test device control message
                test_message = {
                    "type": "device:control",
                    "device": "light",
                    "action": "HIGH",
                    "timestamp": datetime.now().isoformat()
                }

                await websocket.send(json.dumps(test_message))

                # Wait for response
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=5)
                    response_data = json.loads(response)

                    details = {
                        "URI": uri,
                        "Test Message": "device:control for light",
                        "Response Type": response_data.get("type", "unknown"),
                        "Response Success": response_data.get("success", False)
                    }

                    self.log_test(
                        "WebSocket", "PASS", "Connected and communication successful", details)
                    return True

                except asyncio.TimeoutError:
                    self.log_test("WebSocket", "WARN",
                                  "Connected but no response received")
                    return True

        except Exception as e:
            self.log_test("WebSocket", "FAIL", f"Connection failed: {str(e)}")
            return False

    async def test_backend_api(self, base_url: str = "http://localhost:5000"):
        """Test Backend API endpoints"""
        try:
            import aiohttp

            async with aiohttp.ClientSession() as session:
                endpoints = [
                    "/api/health",
                    "/api/sensors/latest",
                    "/api/history/device-controls",
                    "/api/devices/status"
                ]

                results = {}

                for endpoint in endpoints:
                    url = f"{base_url}{endpoint}"
                    try:
                        async with session.get(url, timeout=10) as response:
                            if response.status == 200:
                                data = await response.json()
                                results[endpoint] = f"✅ OK (status: {response.status})"
                            else:
                                results[endpoint] = f"❌ HTTP {response.status}"
                    except Exception as e:
                        results[endpoint] = f"❌ Error: {str(e)}"

                details = results

                success_count = sum(1 for v in results.values() if "✅" in v)
                total_count = len(endpoints)

                if success_count == total_count:
                    self.log_test("Backend API", "PASS",
                                  f"All {total_count} endpoints working", details)
                    return True
                elif success_count > 0:
                    self.log_test(
                        "Backend API", "WARN", f"{success_count}/{total_count} endpoints working", details)
                    return True
                else:
                    self.log_test("Backend API", "FAIL",
                                  "No endpoints responding", details)
                    return False

        except ImportError:
            self.log_test("Backend API", "SKIP",
                          "aiohttp not available (pip install aiohttp)")
            return True
        except Exception as e:
            self.log_test("Backend API", "FAIL", f"Test failed: {str(e)}")
            return False

    def test_embedded_simulation(self):
        """Simulate embedded device MQTT messages"""
        try:
            client = mqtt.Client()
            client.username_pw_set("vision", "vision")

            connected = {"status": False}

            def on_connect(client, userdata, flags, rc):
                connected["status"] = (rc == 0)

            client.on_connect = on_connect
            client.connect("mqtt.noboroto.id.vn", 1883, 10)
            client.loop_start()

            time.sleep(2)

            if connected["status"]:
                # Simulate sensor data
                sensor_data = [
                    ("greenhouse/sensors/temperature", "25.5"),
                    ("greenhouse/sensors/humidity", "65.0"),
                    ("greenhouse/sensors/soil", "0"),  # Dry soil
                    ("greenhouse/sensors/light", "300"),  # Low light
                    ("greenhouse/sensors/water", "75.0"),
                    ("greenhouse/sensors/height", "15.2")
                ]

                for topic, value in sensor_data:
                    client.publish(topic, value)
                    print(f"  📤 Published: {topic} = {value}")
                    time.sleep(0.5)

                details = {
                    "Sensor Messages": len(sensor_data),
                    "Topics": [topic for topic, _ in sensor_data],
                    "Note": "Check backend logs for processing"
                }

                self.log_test("Embedded Simulation", "PASS",
                              "Sensor data published", details)

                client.loop_stop()
                client.disconnect()
                return True
            else:
                self.log_test("Embedded Simulation", "FAIL",
                              "Could not connect to MQTT broker")
                return False

        except Exception as e:
            self.log_test("Embedded Simulation", "FAIL",
                          f"Simulation failed: {str(e)}")
            return False

    def generate_report(self):
        """Generate final diagnostic report"""
        print("\n" + "="*60)
        print("🏥 SMART GREENHOUSE DIAGNOSTIC REPORT")
        print("="*60)

        passed = sum(1 for r in self.results.values() if r["status"] == "PASS")
        warned = sum(1 for r in self.results.values() if r["status"] == "WARN")
        failed = sum(1 for r in self.results.values() if r["status"] == "FAIL")
        total = len(self.results)

        print(
            f"📊 Summary: {passed} passed, {warned} warnings, {failed} failed (total: {total})")
        print()

        # Show recommendations
        if failed > 0:
            print("🔧 RECOMMENDED ACTIONS:")
            for component, result in self.results.items():
                if result["status"] == "FAIL":
                    print(f"  ❌ {component}: {result['message']}")

                    # Specific recommendations
                    if component == "MongoDB":
                        print("     • Check if MongoDB is running")
                        print("     • Verify connection string")
                        print("     • Check network connectivity")
                    elif component == "MQTT":
                        print("     • Verify MQTT broker is accessible")
                        print("     • Check credentials (vision/vision)")
                        print(
                            "     • Test network connectivity to mqtt.noboroto.id.vn")
                    elif component == "WebSocket":
                        print(
                            "     • Check if backend server is running on port 5000")
                        print("     • Verify WebSocket endpoint configuration")
                    elif component == "Backend API":
                        print("     • Start the backend server")
                        print("     • Check API routes are properly configured")
            print()

        if passed == total:
            print("✅ All systems operational! Your Smart Greenhouse is ready.")
        elif passed > failed:
            print("⚠️ Most systems working. Check warnings above.")
        else:
            print("❌ Multiple system failures detected. Please fix the issues above.")

    async def run_full_diagnostic(self):
        """Run complete diagnostic suite"""
        print("🚀 Starting Smart Greenhouse Diagnostics...\n")

        # Test individual components
        self.test_mongodb()
        self.test_mqtt()
        await self.test_websocket()
        await self.test_backend_api()
        self.test_embedded_simulation()

        # Generate final report
        self.generate_report()


async def main():
    """Main execution"""
    diagnostics = GreenhouseDiagnostics()
    await diagnostics.run_full_diagnostic()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Diagnostic interrupted by user")
    except Exception as e:
        print(f"\n❌ Diagnostic failed: {e}")
        sys.exit(1)
