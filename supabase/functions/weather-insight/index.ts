// supabase/functions/weather-insight/index.ts
// Server-side weather forecast endpoint using Gemini with Google Search grounding.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai@1.40.0";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const client = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("OK", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
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

    const { location } = await req.json();
    if (!location) {
      return new Response(JSON.stringify({ error: "location required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await (client as any).models.generateContent({
      model: "gemini-3.1-pro",
      contents: `Get the current weather and a brief 3-day farming forecast for ${location}.
      Format output as JSON: { "current": "Temp/Condition", "forecast": "Short summary" }`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const data = JSON.parse(response.text || "{}");
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Weather error:", error);
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
