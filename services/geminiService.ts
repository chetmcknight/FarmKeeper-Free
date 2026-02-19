import { GoogleGenAI, Type } from "@google/genai";
import { DiagnosisResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes a field image (crop or livestock) using Gemini Vision.
 */
export const diagnoseHealth = async (base64Image: string): Promise<DiagnosisResult> => {
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
            text: `You are an expert agriculturalist and veterinarian. Analyze this image. 
            It contains either a crop/plant or a farm animal.
            1. Identify the subject (e.g., 'Corn', 'Cow', 'Tomato', 'Sheep').
            2. Diagnose any health issues, diseases, pests, injuries, or nutrient deficiencies. If healthy, state 'Healthy [Subject]'.
            3. Provide a confidence level.
            4. Describe the symptoms or visual evidence.
            5. List recommended treatments or actions.

            Return a JSON object with the following structure:
            {
              "diseaseName": "Name of issue or 'Healthy [Subject]'",
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

    let text = response.text;
    if (!text) throw new Error("No response from AI");
    
    // Clean potential markdown wrapping
    if (text.startsWith('```json')) {
        text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (text.startsWith('```')) {
        text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
        return JSON.parse(text) as DiagnosisResult;
    } catch (parseError) {
        console.error("JSON Parse Error", parseError, text);
        throw new Error("Failed to parse diagnosis result.");
    }

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
  history: { role: string; parts: { text: string }[] }[],
  farmContext?: string
) => {
  try {
    let systemInstruction = "You are FarmKeeper, an expert agricultural and livestock professional. Provide concise, practical, and scientific advice to farmers regarding crops, animal husbandry, veterinary health, and farm management. If looking up weather or market prices, use the Google Search tool.";
    
    if (farmContext) {
        systemInstruction += `\n\nCURRENT FARM DATA:\nThe user has the following crops and livestock on their farm. Use this information to provide personalized advice:\n${farmContext}`;
    }

    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: systemInstruction,
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

// --- Granular Dashboard Functions ---

export const getWeatherInsight = async (location: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Get the current weather and a brief 3-day farming forecast for ${location}.
      Format output as JSON: { "current": "Temp/Condition", "forecast": "Short summary" }`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Weather error:", error);
    return { current: "--", forecast: "Unavailable" };
  }
};

export const getMarketPrices = async (commodities: string[], storeName: string = "Tractor Supply Co.") => {
  try {
    const commoditiesList = commodities.join(", ");
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find current retail price for: ${commoditiesList} at ${storeName}.
      Format output as JSON array: [ { "name": "Item Name", "price": "Price" } ]`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });
    const data = JSON.parse(response.text || "[]");
    
    let url = "https://www.tractorsupply.com/";
    let displaySource = "Tractor Supply";

    if (storeName.includes("Leitz")) {
        url = "https://leitzfarm.com/";
        displaySource = "Leitz";
    } else if (storeName.includes("Farm Supply")) {
        url = "https://www.portangelesfarmsupply.com/"; // Mock url or closest real one
        displaySource = "Farm Supply";
    }

    return (Array.isArray(data) ? data : []).map((item: any) => {
        return {
            name: item.name,
            price: item.price,
            sourceName: displaySource,
            sourceUrl: url
        };
    });
  } catch (error) {
    console.error("Market error:", error);
    return [];
  }
};

export const getDailyTip = async () => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a "dailyTip" which is a useful, practical, and scientific piece of advice for farmers regarding crops or livestock for the current season.
      Format output as JSON: { "title": "Short Title", "content": "1-2 sentences", "category": "Crops|Livestock|General" }`,
      config: {
        responseMimeType: "application/json",
      },
    });
    const data = JSON.parse(response.text || "{}");
    return {
        ...data,
        source: "Agriculture.com",
        sourceUrl: "https://www.agriculture.com/"
    };
  } catch (error) {
    console.error("Tip error:", error);
    return null;
  }
};

/**
 * @deprecated Use granular functions above
 */
export const getDashboardInsights = async (location: string, commodities: string[]) => {
    const [weather, market, dailyTip] = await Promise.all([
        getWeatherInsight(location),
        getMarketPrices(commodities, "Tractor Supply Co."),
        getDailyTip()
    ]);
    return { weather, market, dailyTip };
};