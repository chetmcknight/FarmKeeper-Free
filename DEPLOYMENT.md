# FarmKeeper Free Deployment Guide

This application uses **Vite + React** for the frontend and **Google Sheets** for cloud sync.

## 1. Prerequisites

- A **Gemini API key** from Google AI Studio (https://aistudio.google.com/)
- A **Google Sheets API key** from Google Cloud Console
- A **deployed Apps Script** web app (see `apps-script/Code.gs`)

## 2. Required Environment Variables

All `VITE_*` vars are embedded at build time. Set them in your CI/CD or hosting dashboard:

| Variable | Purpose |
|----------|---------|
| `VITE_API_KEY` | Google Gemini AI key |
| `VITE_GS_SHEET_ID` | Google Spreadsheet ID |
| `VITE_GS_API_KEY` | Google Sheets API key |
| `VITE_GS_SCRIPT_URL` | Deployed Apps Script URL |

For local development, create a `.env` file:

```env
VITE_API_KEY=your_gemini_api_key
VITE_GS_SHEET_ID=your_spreadsheet_id
VITE_GS_API_KEY=your_google_sheets_api_key
VITE_GS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
```

## 3. Build & Deploy

### Local Build Test
```bash
npm run build
npm run preview
```

### Google Cloud Run (via Cloud Build)
The included `cloudbuild.yaml` handles the full build/deploy pipeline.

Required **Cloud Build substitutions** (set in trigger or build config):
- `_API_KEY` — Gemini API key
- `_GS_SHEET_ID` — Spreadsheet ID
- `_GS_API_KEY` — Google Sheets API key
- `_GS_SCRIPT_URL` — Apps Script URL

### Other Hosting (Vercel / Netlify)
1. Build command: `npm run build`
2. Output directory: `dist`
3. Set all 4 `VITE_*` env vars in your hosting dashboard.

## 4. Google Sheets Setup

1. Create a Google Sheet with 5 tabs: `Users`, `Crops`, `Animals`, `Farmhands`, `ScoutHistory`
2. Each tab must have the correct column headers as the first row (see README)
3. Deploy the **Google Apps Script** (see `apps-script/Code.gs`) as a web app:
   - Type: **Web app**
   - Execute as: **Me**
   - Access: **Anyone**
4. The app reads via the Sheets REST API (API key) and writes via the Apps Script

Your FarmKeeper Free is now ready! 🚀
