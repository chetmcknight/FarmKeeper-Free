# FarmKeeper Free Deployment Guide

This application uses **Vite + React** for the frontend and **Google Sheets** for cloud sync.

## 1. Prerequisites

- A **Gemini API key** from Google AI Studio (https://aistudio.google.com/)
- A **Google Cloud project** with the Sheets API enabled and an API key

## 2. Environment Variables

Create a `.env` file in the root of your project:

```env
VITE_API_KEY=your_google_gemini_api_key
```

## 3. Build & Deploy

### Local Build Test
```bash
npm run build
npm run preview
```

### Hosting (Vercel / Netlify / Cloud Run)
1. Connect your repository to your hosting provider.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set the `VITE_API_KEY` environment variable in your hosting dashboard.

## 4. Google Sheets Setup

1. Create a Google Sheet with 5 tabs: `Users`, `Crops`, `Animals`, `Farmhands`, `ScoutHistory`
2. Share it publicly: **Anyone with the link can edit**
3. Deploy the **Google Apps Script** (see `apps-script/` directory) as a web app
4. In the app's **Settings** page, enter the Sheet ID, API key, and Apps Script URL

Your FarmKeeper Free is now ready! 🚀
