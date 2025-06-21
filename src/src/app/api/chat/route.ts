import { HfInference } from "@huggingface/inference";
import axios from "axios";
import { NextResponse } from "next/server";

// Initialize Hugging Face Inference with your token
const hf = new HfInference(process.env.HF_TOKEN);

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

export async function POST(request: Request) {
    try {
        const { question } = await request.json();

        if (!question) {
            return NextResponse.json({ error: "Question is required." }, { status: 400 });
        }

        // Fetch data from ThingSpeak
        const thingSpeakUrl = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_API_KEY}`;
        const response = await axios.get(thingSpeakUrl);

        const feeds = response.data.feeds;
        if (!feeds || feeds.length === 0) {
            return NextResponse.json({ error: "No data found in the ThingSpeak channel." }, { status: 404 });
        }

        // Identify the relevant field from the question
        const lowerQuestion = question.toLowerCase();
        const relevantField = Object.keys(FIELD_NAMES).find((field) =>
            lowerQuestion.includes(field.toLowerCase())
        );

        if (!relevantField) {
            return NextResponse.json({
                error: "No relevant field found in the question.",
                availableFields: Object.keys(FIELD_NAMES),
            });
        }

        const targetField = FIELD_NAMES[relevantField];

        // Extract data for the relevant field
        const context = feeds
            .map((feed: any, index: number) => {
                const value = feed[targetField];
                return value ? `Entry ${index + 1}: ${relevantField}: ${value}` : null;
            })
            .filter(Boolean)
            .join("\n");

        if (!context) {
            return NextResponse.json({
                error: `No data found for the field '${relevantField}'.`,
            });
        }

        // Log for debugging
        console.log("Relevant Field:", relevantField);
        console.log("Extracted Context:", context);

        // Use Hugging Face for Question-Answering
        const result = await hf.questionAnswering({
            model: "deepset/roberta-base-squad2",
            inputs: {
                question,
                context,
            },
        });

        // Return the relevant field context and model result
        return NextResponse.json({
            question,
            field: relevantField,
            context,
            answer: result.answer || "Sorry, I couldn't find the answer.",
            modelDetails: result,
        });
    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json(
            { error: "An error occurred during processing." },
            { status: 500 }
        );
    }
}
