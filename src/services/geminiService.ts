import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function getChatResponse(message: string, context: string) {
  const model = ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      { role: 'user', parts: [{ text: `Context: ${context}\n\nUser Question: ${message}` }] }
    ],
    config: {
      systemInstruction: "You are SolarGuard Assistant. You help rural users manage their solar battery systems. Use simple, clear language. If there is rain in the context, warn about potential power cuts.",
    }
  });

  const response = await model;
  return response.text;
}

export async function getFastChatResponse(message: string, context: string) {
  const model = ai.models.generateContent({
    model: "gemini-2.5-flash-lite-latest",
    contents: [
      { role: 'user', parts: [{ text: `Context: ${context}\n\nUser Question: ${message}` }] }
    ],
    config: {
      systemInstruction: "You are SolarGuard Assistant. Be extremely concise and fast. You are in voice mode.",
    }
  });

  const response = await model;
  return response.text;
}

export async function getNearbyRepairShops(lat: number, lon: number) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Find solar panel and battery repair shops near my location.",
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lon
          }
        }
      }
    },
  });
  
  return {
    text: response.text,
    links: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
}

export function connectLiveAssistant(callbacks: any) {
  return ai.live.connect({
    model: "gemini-2.5-flash-native-audio-preview-09-2025",
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
      },
      systemInstruction: "You are SolarGuard Voice Assistant. You are talking to a rural user about their solar battery health. Be helpful, concise, and speak clearly.",
    },
  });
}
