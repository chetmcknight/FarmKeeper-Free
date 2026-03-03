# FarmKeeper Pro Deployment Guide

This application is ready for deployment. It uses **Vite + React** for the frontend and **Supabase** for the backend (Authentication & Database).

## 1. Prerequisites

- A **Supabase** account (https://supabase.com)
- A **Google AI Studio** API Key (https://aistudio.google.com/) for the Chatbot and Diagnosis features.

## 2. Supabase Setup

1. Create a new project in Supabase.
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open the file `supabase/schema.sql` from this repository.
4. Copy the entire content and run it in the SQL Editor. This will create all necessary tables and security policies.

## 3. Environment Variables

Create a `.env` file in the root of your project (or set these variables in your hosting provider like Vercel/Netlify):

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_KEY=your_supabase_anon_key
VITE_API_KEY=your_google_gemini_api_key
```

> **Note:** The application automatically detects these variables. If they are present, it switches from "Mock Mode" (local storage) to "Production Mode" (Supabase).

## 4. Build & Deploy

### Local Build Test
Run the following to verify the build locally:

```bash
npm run build
npm run preview
```

### Hosting (Vercel / Netlify)
1. Connect your repository to Vercel or Netlify.
2. The build command is `npm run build`.
3. The output directory is `dist`.
4. **Important:** Add the Environment Variables from Step 3 in your hosting dashboard settings.

## 5. Features Notes

- **Authentication:** Works automatically with Supabase Auth when configured.
- **Database:** Uses Supabase tables defined in `schema.sql`.
- **AI Features:** Requires `VITE_API_KEY`. The chatbot uses `gemini-3.1-pro` which supports Google Search Grounding.
- **Payment:** The current payment UI is a prototype/mock. For real payments, integrate a backend implementation for PayPal/Stripe.

Your FarmKeeper Pro is now ready! 🚀
