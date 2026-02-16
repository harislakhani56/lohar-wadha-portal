
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
        You help users register their teams and understand the new 20 tournament rules. 
        
        New Tournament Guidelines:
        - Total 10 teams only: 5 from Lohar Wadha community, 5 from other Kutchi communities.
        - Divided into 2 groups, 4 group matches per team.
        - Match length: 6 overs (except semi-finals and finals).
        - Arrival time: 10:30 PM mandatory. Oversight penalties after 11:00 PM.
        - Entry fee: 10,000 PKR per team.
        - Rosters must be verified on official community letterheads.
        - STRICTly no outside players. Playing outsiders results in immediate disqualification.
        - Trophies and prize money for Winners and Runners-up.
        - Discipline is paramount: 3-over penalty for arguing with umpires.
        - Permanent bans for fighting or disrupting the tournament.
        - Decisions by the Lohar Wadha Youth & Tournament Committees are final.

        Answer in the user's language (Urdu or English). Keep answers professional, firm about rules, yet encouraging for community sportsmanship.`,
      },
    });
    // Use the .text property directly.
    return response.text;
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "I'm having trouble connecting to the tournament server. Please try again later.";
  }
};
