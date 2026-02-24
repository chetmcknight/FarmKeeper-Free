import { DiagnosisResult } from "../types";

// Lazily load @google/genai from the ESM CDN at runtime. This avoids requiring
// an npm package so the dev server can start; the browser will fetch the
// module when these functions run.
let _genaiModule: any = null;
let _aiClient: any = null;

const loadGenAI = async () => {
  if (_genaiModule) return _genaiModule;
  _genaiModule = await import("https://esm.sh/@google/genai@1.40.0");
  return _genaiModule;
};

const getAI = async () => {
  if (_aiClient) return _aiClient;
  const mod = await loadGenAI();
  const GoogleGenAI = mod.GoogleGenAI || (mod.default && mod.default.GoogleGenAI) || mod;
  const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY)
    || (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_KEY);
  _aiClient = new GoogleGenAI({ apiKey });
  return _aiClient;
};

// Get Supabase URL for Edge Function calls (if available)
const getSupabaseUrl = () => {
  return (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_SUPABASE_URL) || null;
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
 * 
 * Uses server-side Edge Function if VITE_SUPABASE_URL is set (recommended for production).
 * Falls back to client-side SDK for development (requires VITE_API_KEY).
 */
export const diagnoseHealth = async (base64Image: string): Promise<DiagnosisResult> => {
  const supabaseUrl = getSupabaseUrl();
  
  // Use Edge Function if Supabase is configured (recommended for production)
  if (supabaseUrl) {
    try {
      console.log(`[diagnoseHealth] Calling Edge Function: ${supabaseUrl}/functions/v1/diagnose-health`);
      console.log(`[diagnoseHealth] Image data length: ${base64Image.length} characters`);
      
      const response = await fetch(`${supabaseUrl}/functions/v1/diagnose-health`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image }),
      });
      
      console.log(`[diagnoseHealth] Response status: ${response.status}`);
      const responseText = await response.text();
      console.log(`[diagnoseHealth] Response body: ${responseText.substring(0, 200)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }
      
      const result = JSON.parse(responseText);
      console.log("[diagnoseHealth] Success:", result);
      return result;
    } catch (error) {
      console.error("Edge Function diagnoseHealth error:", error);
      console.log("[diagnoseHealth] Falling back to client-side SDK");
      // Fall through to client-side implementation below
    }
  }
  
  // Fallback to client-side SDK for development
  try {
    // gemini-3-flash-preview supports multimodal inputs and structured output (JSON mode)
    const modelId = "gemini-3-flash-preview";
    
    const ai = await getAI();
    const genai = await loadGenAI();
    const Type = genai.Type;

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
 * 
 * Uses server-side Edge Function if VITE_SUPABASE_URL is set.
 * Falls back to client-side SDK for development.
 */
export const getFarmingAdvice = async (
  prompt: string, 
  history: { role: string; parts: { text: string }[] }[],
  farmContext?: string
) => {
  const supabaseUrl = getSupabaseUrl();
  
  // Use Edge Function if available
  if (supabaseUrl) {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/gemini-proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createChat',
          payload: {
            model: 'gemini-3-flash-preview',
            firstMessage: prompt,
            config: {
              tools: [{ googleSearch: {} }],
              systemInstruction: farmContext 
                ? `You are FarmKeeper, an expert agricultural professional. Use the following farm data:\n${farmContext}`
                : 'You are FarmKeeper, an expert agricultural professional.'
            },
            history
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      return await response.json();
    } catch (error) {
      console.error("Edge Function getFarmingAdvice error:", error);
      throw error;
    }
  }

  // Fallback to client-side
  try {
    let systemInstruction = "You are FarmKeeper, an expert agricultural and livestock professional. Provide concise, practical, and scientific advice to farmers regarding crops, animal husbandry, veterinary health, and farm management. If looking up weather or market prices, use the Google Search tool.";
    
    if (farmContext) {
        systemInstruction += `\n\nCURRENT FARM DATA:\nThe user has the following crops and livestock on their farm. Use this information to provide personalized advice:\n${farmContext}`;
    }

    const ai = await getAI();

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

// --- Granular Dashboard Functions with Caching ---

/**
 * Get weather insights and farming forecasts.
 * 
 * Uses server-side Edge Function if VITE_SUPABASE_URL is set.
 */
export const getWeatherInsight = async (location: string) => {
  const cacheKey = `weather_${location.replace(/\s/g, '')}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const supabaseUrl = getSupabaseUrl();
  
  if (supabaseUrl) {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/weather-insight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location }),
      });
      
      if (!response.ok) throw new Error(await response.text());
      
      const data = await response.json();
      setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error("Weather error:", error);
      return { current: "--", forecast: "Unavailable" };
    }
  }

  // Fallback to client-side
  try {
    const ai = await getAI();

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Get the current weather and a brief 3-day farming forecast for ${location}.
      Format output as JSON: { "current": "Temp/Condition", "forecast": "Short summary" }`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });
    const data = JSON.parse(response.text || "{}");
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

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Current price of ${commoditiesList} at ${storeName} in Sequim/Port Angeles WA area.
      Return JSON array only: [ { "name": "Item", "price": "$X.XX" } ]`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });
    
    const data = JSON.parse(response.text || "[]");
    
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
      model: "gemini-3-flash-preview",
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
