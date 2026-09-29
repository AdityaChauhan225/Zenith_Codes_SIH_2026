# Complete Deployment Guide — BACHAV Emergency System

This guide walks you through deploying the entire **BACHAV** system to production with zero cost on **Vercel** (Frontend) and **Render** (Unified Python ML & SOS Backend).

---

## Architecture Overview

```
                        ┌────────────────────────────────────────────────┐
                        │              CLIENT / CITIZEN / NDRF           │
                        │           (Desktop, Tablet, Mobile Browser)    │
                        └───────────────────────┬────────────────────────┘
                                                │
                                    HTTPS       │   WebSocket / REST
                                                │
                    ┌───────────────────────────┴───────────────────────────┐
                    ▼                                                       ▼
       ┌─────────────────────────┐                             ┌─────────────────────────┐
       │     VERCEL (FRONTEND)   │                             │      RENDER (BACKEND)   │
       │                         │                             │                         │
       │ • React 19 + Vite       │                             │ • Python FastAPI Server │
       │ • Tailwind CSS          │                             │ • XGBoost Risk Model    │
       │ • Interactive Maps      │                             │ • PyTorch GRU Nowcaster │
       │ • Offline PWA Wayfinder │                             │ • Multi-Source Telemetry│
       │ • Citizen SOS Dispatch  │                             │ • Socket.IO Dispatch    │
       └─────────────────────────┘                             └─────────────────────────┘
```

---

## PART 1: Frontend Deployment (Vercel)

### Step 1: Push Code to GitHub
Ensure all latest code is committed and pushed to `main` on GitHub:
```powershell
git push origin main
```

### Step 2: Import Project on Vercel
1. Go to [https://vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **"Add New..."** in the top right -> Select **"Project"**.
3. Locate your repository **`AdityaChauhan225/Zenith_Codes_SIH_2026`** and click **"Import"**.

### Step 3: Configure Build Settings
Vercel automatically detects Vite. Confirm the following settings:
- **Framework Preset**: `Vite`
- **Root Directory**: `./` (leave default)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 4: Click Deploy
1. Click **"Deploy"**. Vercel will install dependencies, build the React app, and deploy it across their global edge CDN in under 60 seconds.
2. Once complete, you will receive a production URL (e.g. `https://zenith-codes-sih-2026.vercel.app`).
3. Single Page App (SPA) client-side routing is handled automatically by the [`vercel.json`](./vercel.json) rewrite rules.

---

## PART 2: Unified Backend Deployment (Render)

Render natively supports Python web services out of the box with `pip install -r requirements.txt` and `uvicorn api_server:app`.

### Option A: 1-Click Blueprint (Recommended)
1. Go to [https://dashboard.render.com](https://dashboard.render.com) and log in with GitHub.
2. Click **"New +"** in the top right -> Select **"Blueprint"**.
3. Connect your repository: **`AdityaChauhan225/Zenith_Codes_SIH_2026`**.
4. Render will automatically detect [`render.yaml`](./render.yaml) and configure the unified Python service:
   - **Service Name**: `bachav-backend`
   - **Runtime**: `Python 3.11+`
   - **Branch**: `main`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python -m uvicorn api_server:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`
5. Click **"Apply"**. Render will deploy your service and give you a live URL (e.g. `https://bachav-backend.onrender.com`).

---

### Option B: Manual Web Service Setup
If you prefer configuring manually without Blueprint:
1. Go to [https://dashboard.render.com](https://dashboard.render.com) -> Click **"New +"** -> **"Web Service"**.
2. Select **`AdityaChauhan225/Zenith_Codes_SIH_2026`** -> Click **"Connect"**.
3. Fill in the following fields:
   | Setting | Value |
   | :--- | :--- |
   | **Name** | `bachav-backend` |
   | **Region** | `Singapore` or `Frankfurt` (choose nearest to India) |
   | **Branch** | **`main`** *(Make sure this is set to `main`, not default feature branch)* |
   | **Runtime** | `Python` |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `python -m uvicorn api_server:app --host 0.0.0.0 --port $PORT` |
   | **Instance Type** | `Free` |
4. Click **"Create Web Service"**.
5. Your service will build and go live at `https://bachav-backend.onrender.com`.

---

## PART 3: Post-Deployment Verification

Once deployed, test your live production URLs:

1. **Verify Backend Health & ML Model Status**:
   `GET https://<YOUR-RENDER-URL>.onrender.com/api/health`
   ```json
   {
     "status": "OK",
     "service": "SOS Flood Emergency Backend",
     "models": {
       "xgboost_flash_flood": "ready",
       "gru_nowcaster": "ready",
       "ingestion_assembler": "ready"
     }
   }
   ```

2. **Verify XGBoost Flash-Flood Prediction**:
   `POST https://<YOUR-RENDER-URL>.onrender.com/api/predict`
   ```json
   {
     "rainfall_1h_mm": 25.0, "rainfall_3h_mm": 55.0, "rainfall_6h_mm": 85.0, "rainfall_24h_mm": 140.0,
     "soil_saturation_index": 0.88, "slope_degrees": 32.0, "elevation_m": 2100.0, "aspect": 180.0,
     "historical_incident_density": 0.05, "distance_to_nearest_stream_m": 120.0,
     "land_cover_class": "forest", "antecedent_moisture_condition": "wet"
   }
   ```
   Returns calibrated probability score, hazard tier (`low`, `medium`, `high`, `critical`), and SHAP feature drivers!

3. **Verify Real-Time Live GPS Prediction**:
   `POST https://<YOUR-RENDER-URL>.onrender.com/api/predict/live`
   ```json
   { "lat": 30.3165, "lon": 78.0322 }
   ```
   Runs multi-source telemetry ingestion pipeline and immediately returns real-time risk!

4. **Verify Deep Learning Rainfall Nowcast**:
   `POST https://<YOUR-RENDER-URL>.onrender.com/api/nowcast`
   ```json
   {}
   ```
   Returns sequential 6-hour precipitation predictions via PyTorch GRU.

5. **Verify Nearby Shelters**:
   `GET https://<YOUR-RENDER-URL>.onrender.com/api/shelters?lat=30.3165&lng=78.0322`
   Returns relief shelters sorted nearest-first by Haversine distance.

6. **Verify Emergency Distress SOS**:
   `POST https://<YOUR-RENDER-URL>.onrender.com/api/sos`
   Accepts GPS distress alerts, deduplicates rapid double-clicks within 3 seconds, and broadcasts live to authority dispatchers via Socket.IO!

---

## PART 4: Summary of Production URLs

| Service | Provider | Purpose |
| :--- | :--- | :--- |
| **Frontend Web App** | Vercel | React + Tailwind dashboard, offline PWA map, citizen SOS UI |
| **Unified Backend** | Render | FastAPI server, XGBoost inference, PyTorch GRU nowcasting, live telemetry ingestion, Socket.IO dispatch |
