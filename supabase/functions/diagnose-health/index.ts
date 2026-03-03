// supabase/functions/diagnose-health/index.ts
// Optimized endpoint for analyzing farm images (crops/livestock health diagnosis).
// Uses Gemini Vision with structured JSON output.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI, Type } from "npm:@google/genai@1.40.0";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY not set in Supabase secrets");
}

const client = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

interface DiagnosisRequest {
  base64Image: string;
}

interface DiagnosisResult {
  diseaseName: string;
  confidence: string;
  description: string;
  treatment: string[];
}

serve(async (req: Request) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response("OK", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    if (!client) {
      throw new Error("Gemini API key not configured");
    }

    const { base64Image } = (await req.json()) as DiagnosisRequest;

    if (!base64Image) {
      return new Response(JSON.stringify({ error: "base64Image required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Call Gemini Vision with structured JSON output
    const response = await (client as any).models.generateContent({
      model: "gemini-3.1-pro",
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
    if (!text) throw new Error("No response from Gemini");

    // Clean markdown wrapping if present
    if (text.startsWith("```json")) {
      text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (text.startsWith("```")) {
      text = text.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const result = JSON.parse(text) as DiagnosisResult;

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Diagnosis error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
