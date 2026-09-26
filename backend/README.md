# Flood Emergency SOS Alert System

A real-time disaster alert and location transmission system built for flood emergencies.

---

## 🚀 How to Run the Project

### 1. Prerequisites
- **Node.js** (v16 or higher installed)

### 2. Install Dependencies (First time only)
Open terminal in the `backend/backend` folder:
```powershell
cd backend
npm install
```

### 3. Start the Server
From the `backend/backend` folder:
```powershell
npm start
```
Or for development with automatic restart on file change:
```powershell
npm run dev
```

---

## 🌐 Access Points

Once the server is running, open your web browser:

| Interface | URL | Description |
|---|---|---|
| **User SOS Interface** | [http://localhost:5000/](http://localhost:5000/) | One-click emergency distress button with GPS tracking and offline sync |
| **Authority Dashboard** | [http://localhost:5000/authority.html](http://localhost:5000/authority.html) | Real-time live feed, interactive OpenStreetMap, and nearest shelter finder |
| **Health Check API** | [http://localhost:5000/api/health](http://localhost:5000/api/health) | JSON status endpoint confirming server & alerts status |
| **Nearby Shelters API** | [http://localhost:5000/api/shelters?lat=28.6139&lng=77.2090](http://localhost:5000/api/shelters?lat=28.6139&lng=77.2090) | Computes distances using Haversine formula |

---

## 📂 Project Structure

```
backend/
├── backend/
│   ├── data/
│   │   └── shelters.json      # Emergency shelter coordinates and capacities
│   ├── server.js              # Express API & Socket.IO real-time server
│   ├── package.json           # Node.js dependencies and run scripts
│   └── package-lock.json
└── frontend/
    ├── css/
    │   └── style.css          # Emergency UI & authority dashboard styles
    ├── js/
    │   ├── app.js             # User SOS logic, Geolocation API, offline queue
    │   └── authority.js       # Live dashboard, Socket.IO listener, Leaflet map
    ├── index.html             # User emergency SOS page
    └── authority.html         # Rescue authority monitoring dashboard
```
