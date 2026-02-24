// supabase/functions/gemini-proxy/index.ts
// Generic Gemini API proxy. Handles all Gemini requests server-side.
// This keeps the API key secret and enables rate-limiting/billing control.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI, Type } from "npm:@google/genai@1.40.0";

// Deno/Supabase environment: API key from secrets or env
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY not set in Supabase secrets");
}

const client = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

serve(async (req: Request) => {
  // Enable CORS for browser requests
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

    const body = await req.json();
    const { action, payload } = body;

    if (action === "generateContent") {
      // Generic generateContent request
      const response = await (client as any).models.generateContent(payload);
      return new Response(JSON.stringify({ text: response.text }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } else if (action === "createChat") {
      // Multi-turn chat session
      const chat = (client as any).chats.create(payload);
      const result = await chat.sendMessage({ message: payload.firstMessage });
      return new Response(
        JSON.stringify({
          text: result.text,
          sources: extractSources(result),
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    } else {
      return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Gemini proxy error:", error);
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

// Helper to extract web search sources from grounding metadata
function extractSources(result: any) {
  const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (!groundingChunks) return [];
  return groundingChunks
    .map((chunk: any) => chunk.web)
    .filter((web: any) => web)
    .map((web: any) => ({ title: web.title, uri: web.uri }));
}
