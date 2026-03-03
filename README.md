# FarmKeeper Pro 🧑‍🌾

FarmKeeper Pro is a comprehensive agricultural management platform empowered by Google's Gemini AI. It helps farmers track their fields, manage livestock health, diagnose crop diseases via computer vision, and access real-time farming advice.

## Features

### 📊 Command Center
- **Smart Dashboard:** Real-time weather updates, location-based forecasts, and live commodity market prices (Corn, Soybeans, Wheat, etc.).
- **Daily Insights:** AI-generated daily farming tips and expert insights based on your region.
- **Status Overview:** At-a-glance metrics for crop health and livestock alerts.

### 🌽 Crop Manager
- **Field Tracking:** Log planting dates, varieties, and acreage for infinite fields.
- **Growth Monitoring:** Track growth days and estimated harvest dates.
- **Field Operations:** Maintain a detailed history of spraying, fertilizing, scouting, and harvesting events.

### 🐄 Livestock Manager
- **Digital Herd Book:** Manage detailed profiles for Cattle, Pigs, Sheep, Poultry, and more.
- **Medical History:** Specific logs for vaccinations, illnesses, injuries, and vet checkups.
- **Health Status:** Visual tagging for sick, pregnant, lactating, or quarantined animals.
- **Care Timeline:** Chronological view of all care activities per animal.

### 📸 Field Scout AI
- **Visual Diagnosis:** Take or upload photos of crops and animals.
- **AI Analysis:** Uses Gemini Vision (Multimodal) to identify pests, diseases, and nutrient deficiencies.
- **Actionable Advice:** Receives immediate confidence scores, symptom descriptions, and treatment recommendations.

### 🤖 AI Farm Advisor
- **Chat Interface:** Natural language conversation with an expert agricultural AI.
- **Search Grounding:** Integrated with Google Search to provide up-to-date answers on weather, regulations, and market trends with citations.

## Technology Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS
- **AI Integration:** Google Gemini API (`@google/genai`)
- **State/Backend:** 
  - Default: Local Storage (Offline capable prototype)
  - Optional: Supabase (PostgreSQL + Auth) for cloud sync

## Setup & Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/farmkeeper-pro.git
   cd farmkeeper-pro
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory (or copy `.env.example`). Vite only exposes vars prefixed with `VITE_` to the client — use the `VITE_API_KEY` variable for Gemini.
   
   Example `.env` (use `.env.local` or keep `.env` out of git):

   ```env
   # Required (available to browser code as import.meta.env.VITE_API_KEY)
   VITE_API_KEY=your_gemini_api_key_here

   # Optional (for Cloud Sync - client-side values use VITE_ prefix)
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_KEY=your_supabase_anon_key

   # Optional (payments)
   VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
   ```

   Notes:
   - The app reads `import.meta.env.VITE_API_KEY` in development. If you run server-side code that requires `process.env.API_KEY`, set that in your CI or server environment separately.
   - Copy `.env.example` to `.env` and fill the values.

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## Building for Production

To build the app for production (generating static files in `dist/`):

```bash
npm run build
```

## Docker Support

A `Dockerfile` and `nginx.conf` are included for containerized deployment.

```bash
docker build -t farmkeeper-pro .
docker run -p 8080:80 farmkeeper-pro
```

## Deployment Status

This project is configured for continuous deployment via Google Cloud Build to Cloud Run.
