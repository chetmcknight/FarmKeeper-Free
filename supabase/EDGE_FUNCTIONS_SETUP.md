# Supabase Edge Functions Setup Guide

This directory contains server-side endpoints that keep your API secrets secure and enable rate-limiting, billing control, and better performance.

## Functions Included

1. **`diagnose-health/`** — Image analysis for crop/livestock health diagnosis (uses Gemini Vision with structured JSON)
2. **`gemini-proxy/`** — Generic proxy for Gemini API requests (chat, content generation, etc.)
3. **`weather-insight/`** — Weather forecasting with Google Search grounding

## Prerequisites

- Supabase account and project ([supabase.com](https://supabase.com))
- Supabase CLI installed: `npm install -g supabase`
- Google Gemini API key

## Setup Steps

### 1. Initialize Supabase (if not already done)

```bash
cd /path/to/FarmKeeper-Pro
supabase init
```

This creates the `supabase/` directory structure. You'll already have `supabase/functions/` from this repo.

### 2. Set Up Environment Variables

Create or update `supabase/.env.local` with:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

For production (Supabase dashboard):
- Go to **Project Settings** → **Edge Functions** → **Secrets**
- Add `GEMINI_API_KEY` with your Gemini API key

### 3. Deploy Edge Functions Locally (for testing)

```bash
supabase start    # Start local Supabase stack
supabase functions deploy diagnose-health
supabase functions deploy gemini-proxy
supabase functions deploy weather-insight
```

Local endpoints will be available at:
- `http://localhost:54321/functions/v1/diagnose-health`
- `http://localhost:54321/functions/v1/gemini-proxy`
- `http://localhost:54321/functions/v1/weather-insight`

### 4. Deploy to Production

```bash
supabase link --project-ref <your-project-id>
supabase functions deploy diagnose-health --no-verify-jwt
supabase functions deploy gemini-proxy --no-verify-jwt
supabase functions deploy weather-insight --no-verify-jwt
```

(Use `--no-verify-jwt` if your functions don't require authentication; for production, you should enable JWT verification and validate `Authorization: Bearer <token>` in the function code.)

### 5. Update Frontend Environment Variables

In your `.env` file, add the Supabase project URL (no API key needed; requests are proxied):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
# (API key is NOT needed on the client side for Edge Function calls)
```

## Usage in Frontend

Update `services/geminiService.ts` to call these endpoints instead of the client-side SDK.

**Example: Health Diagnosis**

```typescript
export const diagnoseHealth = async (base64Image: string) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const response = await fetch(`${supabaseUrl}/functions/v1/diagnose-health`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Image }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};
```

## Security Notes

✅ **API Key is Server-Side Only** — Never exposed to the browser
✅ **CORS Enabled** — Functions allow cross-origin requests from your frontend
✅ **Rate Limiting** — You can add rate-limit middleware in the functions
✅ **Authentication** — (Optional) Enable JWT verification for private endpoints

For production, add:
```typescript
// In Edge Function
const authHeader = req.headers.get('Authorization');
const token = authHeader?.split(' ')[1];
// Verify token using supabase.auth.getUser() or custom logic
```

## Testing Locally

With `supabase start` running:

```bash
curl -X POST http://localhost:54321/functions/v1/diagnose-health \
  -H "Content-Type: application/json" \
  -d '{"base64Image":"..."}'
```

## Troubleshooting

- **Import errors in editor:** Deno modules (std, npm:) are valid at runtime. Ignore IDE warnings.
- **API key not found:** Check that `GEMINI_API_KEY` is set in `.env.local` or Supabase secrets.
- **CORS errors:** Verify `Access-Control-Allow-*` headers are returned by the function.
- **Timeout:** Gemini API calls can be slow; consider increasing Supabase function timeout in settings.

## Next Steps

1. Test Edge Functions locally with your frontend.
2. Deploy to production Supabase.
3. Monitor function execution and costs in the Supabase dashboard.
4. Consider adding stricter authentication and rate-limiting for production.
