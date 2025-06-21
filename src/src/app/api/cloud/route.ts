import axios from "axios";
import { NextResponse } from "next/server";

// Fetch ThingSpeak Channel ID and API Key from environment variables
const THINGSPEAK_CHANNEL_ID = process.env.THINGSPEAK_CHANNEL_ID;
const THINGSPEAK_API_KEY = process.env.THINGSPEAK_API_KEY;

// Mapping of friendly names to ThingSpeak fields
const FIELD_NAMES: { [key: string]: string } = {
    date: "created_at",
    entryId: "entry_id",
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
        const thingSpeakUrl = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_API_KEY}`;
        const response = await axios.get(thingSpeakUrl);

        const feeds = response.data.feeds;
        if (!feeds || feeds.length === 0) {
            return NextResponse.json({ error: "No data found in the ThingSpeak channel." }, { status: 404 });
        }

        // Convert the data to a more readable format
        const formattedData = feeds.map((feed: any) => ({
            date: feed[FIELD_NAMES.date] || null,
            entryId: feed[FIELD_NAMES.entryId] || null,
            light: feed[FIELD_NAMES.light] || null,
            distance: feed[FIELD_NAMES.distance] || null,
            moisture: feed[FIELD_NAMES.moisture] || null,
            temperature: feed[FIELD_NAMES.temperature] || null,
            humidity: feed[FIELD_NAMES.humidity] || null,
            pirIn: feed[FIELD_NAMES.pirIn] || null,
            floatSwitch: feed[FIELD_NAMES.floatSwitch] || null,
            rain: feed[FIELD_NAMES.rain] || null,
        }));

        return NextResponse.json(formattedData);
    } catch (error) {
        console.error("Error fetching data:", error);
        return NextResponse.json({ error: "An error occurred while fetching data." }, { status: 500 });
    }
}