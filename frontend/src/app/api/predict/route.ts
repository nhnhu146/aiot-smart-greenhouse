import axios from "axios";
import { NextResponse } from "next/server";

// Environment variables
const THINGSPEAK_CHANNEL_ID = process.env.THINGSPEAK_CHANNEL_ID;
const THINGSPEAK_API_KEY = process.env.THINGSPEAK_API_KEY;

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

export async function POST(request: Request) {
    try {
        const { startDate } = await request.json();
        if (!startDate) {
            return NextResponse.json({ error: "Start date is required." }, { status: 400 });
        }

        const start = new Date(startDate);
        const weeksData: any[] = [];

        for (let week = 0; week < 6; week++) {
            const endDate = new Date(start);
            endDate.setDate(start.getDate() + 6);

            const thingSpeakUrl = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_API_KEY}&start=${formatDate(start)}&end=${formatDate(endDate)}`;
            const response = await axios.get(thingSpeakUrl);

            const feeds = response.data.feeds;
            const weekData: { [key: string]: any } = {};

            // Set the last value of each field for the week
            for (const field in FIELD_NAMES) {
                const values = feeds.map((feed: any) => feed[FIELD_NAMES[field]]).filter((value: any) => value !== null);
                weekData[field] = values.length > 0 ? values[values.length - 1] : null;  // Lấy giá trị cuối cùng
            }

            weeksData.push(weekData);
            start.setDate(start.getDate() + 7); // Move to next week
        }

        return NextResponse.json({ weeksData });
    } catch (error) {
        console.error("Error fetching weekly data:", error);
        return NextResponse.json(
            { error: "An error occurred while fetching weekly data." },
            { status: 500 }
        );
    }
}

// Utility function to format date as YYYY-MM-DD
function formatDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}