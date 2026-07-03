import { DiagnosisResult } from "../types";
// @ts-ignore
import { GoogleGenAI, Type } from "@google/genai";

// Lazily load @google/genai (now installed locally)
let _aiClient: any = null;

const getAI = async () => {
  if (_aiClient) return _aiClient;
  
  const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY)
    || (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_KEY);
  
  // Initialize client using the installed package
  _aiClient = new GoogleGenAI({ apiKey });
  return _aiClient;
};
// --- Caching Helpers ---
const CACHE_PREFIX = 'farmkeeper_cache_';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour default

const getCachedData = (key: string) => {
  const cached = localStorage.getItem(CACHE_PREFIX + key);
  if (!cached) return null;
  try {
    const { timestamp, data } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
  } catch (e) {
    return null;
  }
  return null;
};

const setCachedData = (key: string, data: any) => {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ timestamp: Date.now(), data }));
  } catch (e) {
    console.warn("Cache set failed", e);
  }
};

/**
 * Analyzes a field image (crop or livestock) using Gemini Vision.
 * Uses client-side SDK with VITE_API_KEY.
 */
export const diagnoseHealth = async (base64Image: string): Promise<DiagnosisResult> => {
  try {
    // gemini-2.0-flash supports multimodal inputs and structured output (JSON mode)
    const modelId = "gemini-2.0-flash";
    
    const ai = await getAI();
    // Use imported Type directly

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
 * Uses client-side SDK with VITE_API_KEY.
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

    const ai = await getAI();

    const chat = ai.chats.create({
      model: "gemini-2.0-flash",
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
      ?.map((chunk: any) => chunk.web)
      .filter((web: any) => web !== undefined)
      .map((web: any) => ({ title: web.title, uri: web.uri }));

    return {
      text: result.text || "I couldn't generate a response.",
      sources,
    };

  } catch (error) {
    console.error("Advice error:", error);
    throw error;
  }
};

// --- Granular Dashboard Functions with Caching ---

/**
 * Get weather insights and farming forecasts.
 * Uses Gemini with Google Search grounding for real-time weather data.
 */
export const getWeatherInsight = async (location: string) => {
  const cacheKey = `weather_${location.replace(/\s/g, '')}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const ai = await getAI();

    // Note: responseMimeType: "application/json" cannot be used together with
    // tools (googleSearch). We request JSON in the prompt and parse it manually.
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Get the current weather and a brief 3-day farming forecast for ${location}.
      You MUST respond ONLY with a JSON object in this exact format, no other text:
      { "current": "Temperature and condition, e.g. 72°F Partly Cloudy", "forecast": "Brief 3-day farming-relevant forecast summary" }`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let text = response.text || "";
    // Strip markdown code fences if present
    if (text.includes('```')) {
      text = text.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim();
    }

    const data = JSON.parse(text || "{}");
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error("Weather error:", error);
    return { current: "--", forecast: "Unavailable" };
  }
};

export const getMarketPrices = async (commodities: string[], storeName: string = "Tractor Supply Co.") => {
  // Sort commodities to ensure cache key consistency
  const sortedCommodities = [...commodities].sort();
  const cacheKey = `market_${storeName.replace(/\s/g, '')}_${sortedCommodities.join('_').substring(0, 20)}`; // shorten key
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    // Simplify query for speed: "Price of [List] at [Store]"
    const commoditiesList = commodities.join(", ");
    
    const ai = await getAI();

    // Note: responseMimeType: "application/json" cannot be used together with
    // tools (googleSearch). We request JSON in the prompt and parse it manually.
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Current price of ${commoditiesList} at ${storeName} in Sequim/Port Angeles WA area.
      You MUST respond ONLY with a JSON array in this exact format, no other text:
      [ { "name": "Item", "price": "$X.XX" } ]`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    let text = response.text || "";
    // Strip markdown code fences if present
    if (text.includes('```')) {
      text = text.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim();
    }

    const data = JSON.parse(text || "[]");
    
    let url = "https://www.tractorsupply.com/tsc/store_Portangeles-WA-98362_2636";
    let displaySource = "Tractor Supply";

    if (storeName.includes("Coastal")) {
        url = "https://www.coastalcountry.com/about/store-locations/sequim?srsltid=AfmBOopMJEBsX1qdtHvNmZb870_uSxs7qjrshzqv2CjfYaOFUWDt2qSL";
        displaySource = "Coastal";
    } else if (storeName.includes("Leitz")) {
        url = "https://www.leitzfarmsupply.com/?y_source=1_NzA3MjM5My03MTUtbG9jYXRpb24ud2Vic2l0ZQ%3D%3D";
        displaySource = "Leitz";
    }

    const processedData = (Array.isArray(data) ? data : []).map((item: any) => {
        return {
            name: item.name,
            price: item.price,
            sourceName: displaySource,
            sourceUrl: url
        };
    });

    setCachedData(cacheKey, processedData);
    return processedData;

  } catch (error) {
    console.error("Market error:", error);
    return [];
  }
};

export const getDailyTip = async () => {
  const cacheKey = `daily_tip_${new Date().toISOString().split('T')[0]}`; // One tip per day
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const ai = await getAI();

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Provide a "dailyTip" which is a useful, practical, and scientific piece of advice for farmers regarding crops or livestock for the current season.
      Format output as JSON: { "title": "Short Title", "content": "1-2 sentences", "category": "Crops|Livestock|General" }`,
      config: {
        responseMimeType: "application/json",
      },
    });
    const data = JSON.parse(response.text || "{}");
    const result = {
        ...data,
        source: "Agriculture.com",
        sourceUrl: "https://www.agriculture.com/"
    };
    setCachedData(cacheKey, result);
    return result;
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
