"use client";

import { useEffect, useState } from "react";
import mqttClient from "@/lib/mqttClient";

export default function useMQTT() {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const handleMessage = (topic: string, message: Buffer) => {
      setMessages((prevMessages) => [...prevMessages, message.toString()]);
    };

    mqttClient.on("message", handleMessage);

    return () => {
      mqttClient.off("message", handleMessage);
    };
  }, []);

  // Clear messages after they have been processed
  const clearMessages = () => {
    setMessages([]);
  };

  return { messages, clearMessages };
}
