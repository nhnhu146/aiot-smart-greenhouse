import axios from "axios";
import { NextResponse } from "next/server";

// Fetch ThingSpeak Channel ID and API Key from environment variables
const THINGSPEAK_CHANNEL_ID = process.env.THINGSPEAK_CHANNEL_ID;
const THINGSPEAK_API_KEY = process.env.THINGSPEAK_API_KEY;

// Mapping of friendly names to ThingSpeak fields
const FIELD_NAMES: { [key: string]: string } = {
    light: "field1",
    distance: "field2",
    moisture: "field3",
    temperature: "field4",
    humidity: "field5",
    pirIn: "field6",
    floatSwitch: "field7",
    rain: "field8",
};

export async function GET() {
    try {
        // Fetch data from ThingSpeak
        const thingSpeakUrl = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_API_KEY}`;
        const response = await axios.get(thingSpeakUrl);

        const feeds = response.data.feeds;
        if (!feeds || feeds.length === 0) {
            return NextResponse.json({ error: "No data found in the ThingSpeak channel." }, { status: 404 });
        }

        // Find the most recent non-null value for each field
        const data: { [key: string]: number | null } = {};
        Object.entries(FIELD_NAMES).forEach(([key, fieldName]) => {
            // Iterate from the latest entry backwards to find the first non-null value
            for (let i = feeds.length - 1; i >= 0; i--) {
                const value = feeds[i][fieldName];
                if (value !== null && value !== undefined) {
                    data[key] = parseFloat(value);
                    break;
                }
            }
            // If no valid value is found, set to null
            if (!(key in data)) {
                data[key] = null;
            }
        });

        // console.log("Filtered data:", data);

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching data:", error);
        return NextResponse.json({ error: "An error occurred while fetching data." }, { status: 500 });
    }
}