
import { GoogleGenAI } from "@google/genai";

// Always initialize with process.env.API_KEY as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getTournamentAssistance = async (prompt: string, history: {role: string, parts: {text: string}[]}[]) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history,
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: `You are the Official AI Assistant for the Lohar Wadha Tournament. 
        You help users register their teams. 
        Rules:
        - 11 players mandatory.
        - Team name required.
        - Supports Jamaati and Non-Jamaati teams.
        - Official forms are the only way to register.
        Answer in the user's language (Urdu or English). Keep answers professional yet encouraging.`,
      },
    });
    // Use the .text property directly.
    return response.text;
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "I'm having trouble connecting to the tournament server. Please try again later.";
  }
};
