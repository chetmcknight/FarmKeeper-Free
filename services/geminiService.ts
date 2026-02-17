import { GoogleGenAI, Type } from "@google/genai";
import { DiagnosisResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes a plant image for diseases/pests using Gemini Vision.
 */
export const diagnosePlantHealth = async (base64Image: string): Promise<DiagnosisResult> => {
  try {
    // gemini-3-flash-preview supports multimodal inputs and structured output (JSON mode)
    const modelId = "gemini-3-flash-preview";
    
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: `You are an expert plant pathologist. Analyze this image of a crop/plant. 
            Identify the plant. Look for any signs of pests, diseases, or nutrient deficiencies.
            Return a JSON object with the following structure:
            {
              "diseaseName": "Name of issue or 'Healthy'",
              "confidence": "High/Medium/Low",
              "description": "Brief description of visual symptoms",
              "treatment": ["Step 1", "Step 2"]
            }
            Only return the JSON.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diseaseName: { type: Type.STRING },
            confidence: { type: Type.STRING },
            description: { type: Type.STRING },
            treatment: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as DiagnosisResult;

  } catch (error) {
    console.error("Diagnosis error:", error);
    throw error;
  }
};

/**
 * General Farming Advisor Chat with Google Search Grounding.
 */
export const getFarmingAdvice = async (
  prompt: string, 
  history: { role: string; parts: { text: string }[] }[]
) => {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are FarmKeeper Pro, an expert agricultural and livestock professional. Provide concise, practical, and scientific advice to farmers regarding crops, animal husbandry, veterinary health, and farm management. If looking up weather or market prices, use the Google Search tool.",
      },
      history: history,
    });

    const result = await chat.sendMessage({ message: prompt });
    
    // Extract grounding metadata if available
    const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = groundingChunks
      ?.map((chunk) => chunk.web)
      .filter((web) => web !== undefined)
      .map((web) => ({ title: web.title, uri: web.uri }));

    return {
      text: result.text || "I couldn't generate a response.",
      sources,
    };

  } catch (error) {
    console.error("Advice error:", error);
    throw error;
  }
};

/**
 * Get quick weather/market snapshot.
 * We hardcode the source URL to a reliable commodities market aggregator
 * to prevent broken links (Error 4014) from AI generated deep-links.
 */
export const getDashboardInsights = async (location: string, commodities: string[] = ["Corn", "Soybeans"]) => {
  try {
    const commoditiesList = commodities.join(", ");
    // We ask Gemini only for the price value to ensure we get data,
    // but we will provide the source link ourselves.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Get the current weather and a brief 3-day farming forecast for ${location}. 
      Also find the current market price for these agricultural items: ${commoditiesList}.
      Format the output as a concise JSON object:
      {
        "weather": { "current": "Temp/Condition", "forecast": "Summary" },
        "market": [
           { "name": "Exact Item Name from list", "price": "Price with unit" }
        ]
      }`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || "{}");
    
    // Hardcode a reliable single source for all prices to ensure links work
    // and avoid 4014/404 errors.
    const SINGLE_RELIABLE_SOURCE = "https://www.agweb.com/markets";
    
    if (result.market && Array.isArray(result.market)) {
        result.market = result.market.map((m: any) => ({
            ...m,
            sourceUrl: SINGLE_RELIABLE_SOURCE
        }));
    }

    return result;
  } catch (error) {
    console.error("Dashboard insight error:", error);
    return null;
  }
};