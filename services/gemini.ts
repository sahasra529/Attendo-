import { GoogleGenAI, Type } from "@google/genai";

// Use a getter to ensure the AI client is only initialized when a function is actually called.
// This prevents the whole app from crashing if process.env.API_KEY is missing or invalid at startup.
const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export async function getAttendanceInsights(data: any[]) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this attendance data and provide key insights, focusing on low attendance and patterns: ${JSON.stringify(data)}`,
    config: {
      systemInstruction: "You are a specialized AI for educational analytics. Provide concise, actionable insights about student attendance behavior.",
    }
  });
  return response.text;
}

export async function detectAnomalies(records: any[]) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Examine these records for suspicious activity (duplicates, outside hours, strange locations): ${JSON.stringify(records)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            attendanceId: { type: Type.STRING },
            reason: { type: Type.STRING },
            severity: { type: Type.STRING, description: "Low, Medium, High" }
          },
          required: ["attendanceId", "reason", "severity"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
}

export async function processNaturalLanguageQuery(query: string, context: any) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `User Query: "${query}". Context Data: ${JSON.stringify(context)}. Answer the query based on the data provided.`,
    config: {
      systemInstruction: "You are an assistant for school administrators. You help them query their attendance database using natural language.",
    }
  });
  return response.text;
}

export async function predictRisk(students: any[], history: any[]) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Predict which students are at risk of falling below 75% attendance based on their history: ${JSON.stringify({ students, history })}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            studentId: { type: Type.STRING },
            riskLevel: { type: Type.STRING },
            predictedPercentage: { type: Type.NUMBER },
            warningMessage: { type: Type.STRING }
          },
          required: ["studentId", "riskLevel", "predictedPercentage", "warningMessage"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
}