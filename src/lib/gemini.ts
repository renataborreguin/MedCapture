import { VertexAI } from "@google-cloud/vertexai";
import { SYSTEM_PROMPT, buildGeneratePrompt } from "./prompts";
import type { GenerateResponse } from "@/types/expediente";

function getVertexAI() {
  return new VertexAI({
    project: process.env.GCP_PROJECT_ID || "",
    location: process.env.GCP_LOCATION || "us-central1",
  });
}

export async function generateNotaMedica(
  keywords: string,
  contextoPrevio?: string
): Promise<GenerateResponse> {
  const vertexAI = getVertexAI();
  const model = vertexAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      temperature: 0.3,
      topP: 0.8,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
    systemInstruction: { role: "system", parts: [{ text: SYSTEM_PROMPT }] },
  });

  const prompt = buildGeneratePrompt(keywords, contextoPrevio);

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const response = result.response;
  const text =
    response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

  const parsed: GenerateResponse = JSON.parse(text);
  return parsed;
}

export async function expandSection(
  keywords: string,
  sectionPrompt: string
): Promise<string> {
  const vertexAI = getVertexAI();
  const model = vertexAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 512,
    },
  });

  const prompt = `${sectionPrompt}\n\nKeywords: "${keywords}"\n\nResponde SOLO con el texto expandido en español, sin comillas, sin encabezados, sin explicaciones.`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  return (
    result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""
  );
}
