# BACHAV — Cloud Deployment Guide
## Step-by-Step Instructions for Vercel (Frontend) & Render (Backend)

This guide provides exact, zero-friction instructions to deploy the entire **BACHAV** system live to the internet for free.

---

## PART 1: Deploy Frontend on Vercel (Time: ~2 Minutes)

Vercel provides free, high-speed global CDN hosting with automatic SSL certificates and continuous deployment from GitHub.

### Step 1: Open Vercel
1. Go to [https://vercel.com](https://vercel.com) and Sign In (choose **"Continue with GitHub"**).

### Step 2: Import Your Repository
1. On your Vercel Dashboard, click the **"Add New..."** button in the top right and select **"Project"**.
2. Find and select your repository: **`AdityaChauhan225/Zenith_Codes_SIH_2026`**.
   *(If not listed, click "Adjust GitHub App Permissions" and grant access to the repo).*
3. Click **"Import"**.

### Step 3: Configure Project Settings
Vercel will automatically read [`vercel.json`](./vercel.json) from the repository root:
- **Framework Preset**: `Vite` (Auto-detected)
- **Root Directory**: `./` (Default)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

*(No environment variables are required for the frontend — it connects to live public satellite/radar telemetry automatically).*

### Step 4: Click Deploy
1. Click the blue **"Deploy"** button.
2. Vercel will compile the 2,445 modules in ~45 seconds.
3. Once finished, you will receive your live production URL (e.g., `https://zenith-codes-sih-2026.vercel.app`).
4. **All routes work out of the box** thanks to `vercel.json` rewrites (`/`, `/dashboard/user/home`, `/dashboard/authorities/home`).

---

## PART 2: Deploy Backend on Render (Time: ~3 Minutes)

Render provides free cloud hosting with native WebSocket / Socket.IO support, automatic HTTPS, and zero maintenance.

### Option A: 1-Click Blueprint (Recommended)
1. Go to [https://dashboard.render.com](https://dashboard.render.com) and log in with GitHub.
2. Click **"New +"** in the top right $\rightarrow$ Select **"Blueprint"**.
3. Connect your repository: **`AdityaChauhan225/Zenith_Codes_SIH_2026`**.
4. Render will automatically detect [`render.yaml`](./render.yaml) and configure the service:
   - **Service Name**: `bachav-backend`
   - **Root Directory**: `backend/backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: `Free`
5. Click **"Apply"**. Render will deploy your service and give you a live URL (e.g. `https://bachav-backend.onrender.com`).

---

### Option B: Manual Web Service Setup
If you prefer configuring manually without Blueprint:
1. Go to [https://dashboard.render.com](https://dashboard.render.com) $\rightarrow$ Click **"New +"** $\rightarrow$ **"Web Service"**.
2. Select **`AdityaChauhan225/Zenith_Codes_SIH_2026`** $\rightarrow$ Click **"Connect"**.
3. Fill in the following fields:
   | Setting | Value |
   | :--- | :--- |
   | **Name** | `bachav-backend` |
   | **Region** | `Singapore` or `Frankfurt` (choose nearest to India) |
   | **Branch** | `main` |
   | **Root Directory** | `backend/backend` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `node server.js` |
   | **Instance Type** | `Free` |
4. Click **"Create Web Service"**.
5. Your service will build and go live at `https://bachav-backend.onrender.com`.

---

## PART 3: Post-Deployment Verification

Once both services are deployed, test your live production URLs:

1. **Verify Backend Health**:
   Open in browser: `https://<YOUR-RENDER-URL>.onrender.com/api/health`  
   Expected Response:
   ```json
   {
     "status": "OK",
     "service": "SOS Flood Emergency Backend",
     "activeAlertsCount": 0
   }
   ```

2. **Verify Nearby Shelters**:
   Open in browser: `https://<YOUR-RENDER-URL>.onrender.com/api/shelters?lat=30.3165&lng=78.0322`  
   Expected Response:
   ```json
   {
     "success": true,
     "shelters": [ ...6 relief shelters sorted by nearest distance... ]
   }
   ```

3. **Verify Frontend Landing Page & Routing**:
   - Open: `https://<YOUR-VERCEL-URL>.vercel.app/`
   - Sign In as Citizen: Use any email like `resident@gmail.com` $\rightarrow$ verifies `/dashboard/user/home`
   - Sign In as Authority: Use `collector@gov.in` $\rightarrow$ verifies `/dashboard/authorities/home`
   - Refresh the page while on a dashboard route $\rightarrow$ confirms `vercel.json` SPA rewrite works with zero 404s.

---

## PART 4: Optional Public Tunnel (For Live Mobile Demo Testing Right Now)

If you need a public HTTPS link on your phone **immediately** without waiting for cloud builds:

```powershell
# In a new terminal:
npx localtunnel --port 5173
```
This gives you an instant temporary public URL (e.g. `https://calm-rivers-find.loca.lt`) that you can open on any mobile phone to demo the platform live.
