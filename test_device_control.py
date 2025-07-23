#!/usr/bin/env python3
"""
MQTT Device Control Test Script
Tests device control communication between backend and ESP32
"""

import asyncio
import json
import aiohttp
import ssl


async def test_device_control():
    """Test device control API endpoint"""

    API_BASE = "http://localhost:3001"  # Adjust if different

    test_cases = [
        {"deviceType": "light", "action": "on"},
        {"deviceType": "light", "action": "off"},
        {"deviceType": "pump", "action": "on"},
        {"deviceType": "pump", "action": "off"},
        {"deviceType": "door", "action": "open"},
        {"deviceType": "door", "action": "close"},
        {"deviceType": "window", "action": "open"},
        {"deviceType": "window", "action": "close"},
    ]

    print("🎮 Testing Device Control API...")
    print("=" * 50)

    async with aiohttp.ClientSession() as session:
        for test in test_cases:
            try:
                print(f"📡 Testing: {test['deviceType']} -> {test['action']}")

                async with session.post(
                    f"{API_BASE}/api/devices/control",
                    json=test,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    result = await response.json()

                    if response.status == 200:
                        print(f"   ✅ Success: {result.get('message', 'OK')}")
                    else:
                        print(
                            f"   ❌ Error {response.status}: {result.get('message', 'Unknown error')}")

            except Exception as e:
                print(f"   💥 Exception: {str(e)}")

            # Small delay between requests
            await asyncio.sleep(0.5)

    print("\n" + "=" * 50)
    print("🔍 Device Control Test Complete")
    print("\n💡 Expected MQTT Messages:")
    print("   greenhouse/devices/light/control -> 'HIGH' or 'LOW'")
    print("   greenhouse/devices/pump/control -> 'HIGH' or 'LOW'")
    print("   greenhouse/devices/door/control -> 'HIGH' or 'LOW'")
    print("   greenhouse/devices/window/control -> 'HIGH' or 'LOW'")
    print("\n📝 Notes:")
    print("   - ESP32 expects simple string values, not JSON")
    print("   - 'HIGH' = on/open, 'LOW' = off/close")
    print("   - Check MQTT broker logs for actual messages sent")

if __name__ == "__main__":
    asyncio.run(test_device_control())
