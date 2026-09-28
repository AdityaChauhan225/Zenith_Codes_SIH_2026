# BACHAV — Flash Flood Early Warning System
## Comprehensive Project Specification & Architectural Documentation

> **Team**: Zenith Codes  
> **Event**: Smart India Hackathon 2026 (SIH 2026)  
> **Problem Statement ID**: 26192 (*Flash Flood Risk Prediction and Disaster Management for Hilly Terrains*)  
> **Domain**: Disaster Management, Physical Hydrology, Machine Learning, Offline-First Systems  
> **Target Region**: Mountain catchments of the Western Himalayas & Western Ghats (Himachal Pradesh, Uttarakhand, Nilgiris)

---

## 1. Executive Summary & Problem Context

In mountainous and hilly regions, standard meteorological alerts are distributed at the broad district level. Because mountainous micro-watersheds have steep elevation drops, variable slope angles, and localized convective storm cells (cloudbursts), regional alerts are inadequate:
1. **Spatial Inaccuracy**: An alert issued for an entire district does not inform specific mountain villages whether their localized torrent (*nallah*) or hillside is at risk.
2. **Delayed Lead Time**: Conventional warnings often reach hill communities after flash floods or debris flows have already begun.
3. **Infrastructure Fragility**: Severe downpours frequently knock out cellular towers and power lines, cutting off conventional internet communications exactly when evacuation instructions are needed most.

### The BACHAV Solution
**BACHAV** is a hyper-local, village-level early warning and offline-resilient emergency coordination platform:
- **Village-Level Spatial Resolution**: Models each micro-watershed independently using 30m digital elevation data, vector drainage networks, and high-resolution precipitation.
- **Actionable Lead Time**: Delivers 1–6 hour advance flash-flood risk classifications (`low`, `medium`, `high`, `critical`) allowing organized evacuation.
- **Explainable Predictions**: Uses TreeSHAP to attribute exact risk percentages to root physical causes (e.g. 3-hour rainfall accumulation, antecedent soil saturation).
- **Two-Tiered Dashboard**: Segregates workflows into a Citizen Resident Dashboard and an Authorities Tactical Command Hub.
- **Offline Emergency Architecture**: Integrates **Beacon Point** and **Flood-Wayfinder** PWA, enabling offline vector routing and emergency navigation even under cellular blackout.

---

## 2. End-to-End System Architecture

```mermaid
flowchart TD
    subgraph Data Layer ["1. Multi-Source Ingestion & Caching"]
        A1[Open-Meteo API<br/>Precipitation, Soil Moisture, Pressure]
        A2[Copernicus DEM GLO-30<br/>30m Elevation, Slope, Aspect]
        A3[OSM Overpass API<br/>Vector Rivers, Streams, Canals]
        A4[ESA WorldCover 10m<br/>Forest, Agri, Urban, Barren]
        A5[NASA GLC & EONET<br/>10-Year Incident Density]
        A1 & A2 & A3 & A4 & A5 --> B[ThreadPoolExecutor<br/>Concurrent Ingestion ~4.2s]
        B --> C1[WeatherCache<br/>30-Min TTL | 1.1km Grid]
        B --> C2[StaticCache<br/>Persistent | 11m Grid]
    end

    subgraph MLLayer ["2. Hydrological Physics & ML Models"]
        C1 & C2 --> D[Feature Assembler & Contract Validator<br/>Strict 12-Feature Schema]
        D --> E1[XGBoost Multiclass Classifier<br/>Class Weighted, Stratified 5-Fold]
        D --> E2[TreeSHAP Explainer<br/>Feature Gain & Local Attribution]
        D --> E3[Nowcasting GRU Model<br/>Temporal Sequence Forecasting]
        E1 & E2 --> F[Calibrated Risk Payload<br/>Tier, Continuous Score, SHAP Weights]
    end

    subgraph BackendLayer ["3. Emergency Backend & Real-Time Sockets"]
        G[Express.js REST Engine<br/>Port 5000]
        G --> H1[Shelters Service<br/>Haversine Distance Sorting]
        G --> H2[SOS Ingestion Pipeline<br/>Duplicate De-duplication 3s Window]
        G --> H3[Socket.IO Gateway<br/>Live Incident Broadcasting]
    end

    subgraph FrontendLayer ["4. Web Application & Dashboards"]
        I[Vite + React 19 Frontend<br/>Port 5173]
        I --> J1[Landing Page<br/>Bento Grid, Process, Trust Protocols]
        I --> J2[Animated SignInDrawer<br/>Role-Based Dynamic Routing]
        J2 --> K1[Citizen Dashboard<br/>Live Telemetry, SOS Trigger, Evacuation Guide]
        J2 --> K2[Authorities Command Hub<br/>SOS Triage, Unit Dispatch, Tactical Leaflet Map]
    end

    subgraph OfflineLayer ["5. Offline Resilience"]
        L[Flood-Wayfinder PWA<br/>IndexedDB + Service Worker]
        L --> M1[Offline Vector Routing<br/>A* OSM Graph Traversal]
        L --> M2[Beacon Point<br/>Emergency Mesh Network]
    end

    F --> G
    G <--> I
    I <--> L
```

---

## 3. Hydrological Physics & Machine Learning Pipeline

### A. The 12-Feature Hydrological Schema
The model consumes exactly 12 normalized environmental, meteorological, and topographical features:

| # | Feature Name | Data Type | Physical Range | Hydrological Rationale |
| :-: | :--- | :---: | :---: | :--- |
| **1** | `rainfall_1h_mm` | `float` | $\ge 0.0$ mm | 1-hour rainfall accumulation. High values (>40 mm/hr) indicate intense convective cloudbursts. |
| **2** | `rainfall_3h_mm` | `float` | $\ge \text{rainfall\_1h}$ | 3-hour cumulative precipitation. Captures rapid storm progression across micro-basins. |
| **3** | `rainfall_6h_mm` | `float` | $\ge \text{rainfall\_3h}$ | 6-hour cumulative precipitation. Essential for medium mountain watersheds. |
| **4** | `rainfall_24h_mm` | `float` | $\ge \text{rainfall\_6h}$ | 24-hour cumulative rainfall. Drives total catchment volumetric water balance. |
| **5** | `soil_saturation_index` | `float` | $0.0 - 1.0$ | Volumetric soil moisture ratio $\theta$ normalized between dry ($\theta_{dry}=0.08$) and saturated ($\theta_{sat}=0.48$). |
| **6** | `slope_degrees` | `float` | $5.0^\circ - 70.0^\circ$ | Topographic incline. Steeper slopes accelerate runoff velocity into high-energy debris flows. |
| **7** | `elevation_m` | `float` | $300 - 4500$ m | Elevation above sea level. Controls orographic condensation and freezing levels. |
| **8** | `aspect` | `float` | $0.0^\circ - 360.0^\circ$ | Hill-slope azimuth orientation. South/southwest slopes receive stronger monsoon moisture interception. |
| **9** | `historical_incident_density` | `float` | $\ge 0.0$ / $\text{km}^2$ | Number of recorded flash-flood/landslide events within a 10 km circular buffer over 10 years. |
| **10** | `land_cover_class` | `string` | `forest`, `agriculture`, `urban`, `barren` | Infiltration roughness. Urban and barren surfaces produce immediate runoff; forests retard surge waves. |
| **11** | `distance_to_nearest_stream_m`| `float` | $\ge 0.0$ m | Proximity to nearest drainage riverbed or torrent (*nallah*). Zones within <150 m face acute risk. |
| **12** | `antecedent_moisture_condition`| `string`| `dry`, `normal`, `wet` | SCS-CN AMC class based on 5-day prior cumulative precipitation ($P_5$). Modulates retention $S$. |

### B. Soil Conservation Service Curve Number (SCS-CN) Runoff Physics
Direct runoff depth $Q$ (mm) is computed as:
$$Q = \frac{(P - I_a)^2}{P - I_a + S} \quad \text{for } P > I_a, \quad \text{else } Q = 0$$
where $I_a = 0.2 \times S$ (initial abstraction), and potential maximum retention $S = \frac{25400}{CN} - 254$.
The Curve Number ($CN$) dynamically adjusts according to Antecedent Moisture Conditions:
- **AMC I (Dry)**: $CN_I = \frac{CN_{II}}{2.281 - 0.01281 \times CN_{II}}$
- **AMC II (Normal)**: Baseline calibrated values (`forest: 60`, `agriculture: 76`, `barren: 86`, `urban: 93`)
- **AMC III (Wet)**: $CN_{III} = \frac{CN_{II}}{0.427 + 0.00573 \times CN_{II}}$

### C. Machine Learning Model Architecture & Performance
- **Algorithm**: Multi-Class Gradient Boosted Decision Trees (XGBoost).
- **Hyperparameters**: `max_depth: 6`, `learning_rate: 0.05`, `n_estimators: 150`, `subsample: 0.85`, `colsample_bytree: 0.85`.
- **Training Strategy**: Strict **Out-of-Time Temporal Split** (Train: 4,500 samples across 2021–2023 monsoon seasons; Test: 1,500 samples across the full 2024 monsoon season). Eliminates temporal lookahead leakage.
- **Class Imbalance Handling**: Weighted sample loss (`compute_sample_weight("balanced")`). Rare critical cases account for only 3.5% of samples.

#### Verified Evaluation Metrics (Test Partition: 1,500 Samples)
| Metric | Value | Meaning |
| :--- | :---: | :--- |
| **Test Accuracy** | **`89.4%`** | Overall multi-class prediction accuracy |
| **Macro F1 Score** | **`0.8127`** | Unweighted mean F1 across all four tiers |
| **Weighted F1 Score**| **`0.8980`** | Sample-weighted F1 across all four tiers |
| **Critical Tier F1** | **`0.8333`** | 88.9% Precision, 78.4% Recall on life-threatening flood surges |
| **Cohen's Kappa** | **`0.7503`** | Substantial inter-tier agreement |

#### TreeSHAP Feature Gain Contributions
1. **3h & 24h Cumulative Precipitation**: **32.26%** total gain (primary driver of convective bursts)
2. **Antecedent Moisture Condition (AMC III Wet / I Dry)**: **22.60%** total gain (pre-saturation control)
3. **Land Cover Roughness (`urban`, `forest`, `barren`)**: **12.33%** total gain (surface permeability)
4. **1h Peak Burst Intensity**: **9.58%** total gain (cloudburst threshold detection)
5. **Soil Saturation Index**: **6.85%** total gain (volumetric moisture capacity)
6. **Stream Proximity**: **2.91%** total gain (distance to torrent drainage line)

---

## 4. Multi-Source Ingestion & Caching Layer

### Ingestion Providers
1. **Open-Meteo API**: Live weather, 1h/3h/6h/24h precipitation, 0–7cm soil moisture $\theta$, surface pressure.
2. **Copernicus DEM GLO-30 / OpenTopoData**: 30m resolution elevation $z$, slope angle, and solar aspect calculated across a $3 \times 3$ kernel ($\Delta \approx 30\text{ m}$).
3. **OpenStreetMap Overpass API**: Live vector query (`way["waterway"~"river|stream|canal"](around:3000, lat, lon);`) returning line geometries for geodesic distance computation.
4. **ESA WorldCover 10m / Bhuvan LULC**: Satellite land cover raster mapped to four hydrological roughness classes.
5. **NASA GLC & EONET**: Historical disaster catalog search within a 10 km radial buffer ($314.16\text{ km}^2$).

### Multi-Resolution Caching Layer (`cache.py`)
- **Parallelization**: `ThreadPoolExecutor` queries all 5 uncached external REST streams concurrently, reducing cold payload latency from ~9.0s to **~4.2s** (>50% speedup).
- **`WeatherCache`**: 30-minute (1,800s) TTL cache for weather telemetry, keyed to normalized $0.01^\circ \approx 1.1\text{ km}$ grid cells (`round(lat, 2), round(lon, 2)`).
- **`StaticCache`**: Long-lived in-memory cache for static topography, slope, and stream distances, keyed to normalized $0.0001^\circ \approx 11\text{ m}$ grid cells (`round(lat, 4), round(lon, 4)`).
- **Warm Cache Latency**: **0.4 – 0.5 ms** (<0.5 ms) instant memory lookup.

---

## 5. Emergency Backend & Real-Time Communications

The backend service is built with Node.js, Express, and Socket.IO (`backend/backend/server.js`), running on port 5000.

### REST Endpoints
| Method | Endpoint | Query / Body Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | None | Returns service health, timestamp, and active alert count |
| `GET` | `/api/shelters` | `?lat=30.3165&lng=78.0322` | Returns shelters sorted by Haversine distance from user coordinates |
| `POST`| `/api/sos` | `latitude`, `longitude`, `accuracy`, `info` | Records new emergency SOS and broadcasts via Socket.IO |
| `PATCH`| `/api/sos/:id/resolve` | None | Transitions alert state to `RESOLVED` and notifies connected dashboards |

### Haversine Distance Calculation
$$\Delta\sigma = 2 \arcsin \sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1 \cos\phi_2 \sin^2\left(\frac{\Delta\lambda}{2}\right)}$$
$$d = R \times \Delta\sigma \quad (\text{where } R = 6,371\text{ km})$$

### Spatial-Temporal SOS De-duplication
To prevent responder alert fatigue and denial-of-service from panicked repetitive clicking, the backend enforces a **3-second client de-duplication window**:
If an incoming SOS matches an existing ID or identical coordinate within 3,000 ms, the system responds with HTTP 200 `"SOS Alert already processed"` rather than duplicating the record.

---

## 6. Frontend User Interfaces & Roles

The frontend is built on **React 19, Vite, Tailwind CSS, and Leaflet**, running on port 5173.

### A. Landing Portal (`/`)
- **Hero Section**: Dynamic headline (*"Village-Level. Flash Flood. Early Warning."*), Chromium layout auto-detection (`zoom: 0.9`), and call-to-action buttons.
- **Bento Grid Features**: Breakdown of rainfall ingestion, soil moisture analysis, slope modeling, historical catalogs, and IoT sensor meshes.
- **Process Steps**: Four-stage visual lifecycle: *Collect $\rightarrow$ Analyse $\rightarrow$ Predict $\rightarrow$ Alert*.
- **Government Compliance**: Aligned with NDMA/IMD standard 4-stage color-coded alerts (Green, Yellow, Orange, Red).

### B. Universal Sign-In Drawer & Role-Based Access Control (`SignInDrawer.jsx`)
- **Citizen Login**: Emails without government domains (e.g. `resident@gmail.com`) automatically navigate to the **User Dashboard** (`/dashboard/user/home`).
- **Authority / NDRF Login**: Emails containing `@gov.in`, `ndrf`, `official`, or `admin` automatically route to the **Authorities Command Hub** (`/dashboard/authorities/home`).

### C. Citizen Dashboard (`/dashboard/user/*`)
1. **Home Tab (`/home`)**:
   - Live meteorological card fetching real-time temperature, wind speed, precipitation, and humidity from Open-Meteo.
   - Real-time soil saturation gauge, river level surge tracker, and localized advisory notices.
   - Large interactive **"TRIGGER EMERGENCY SOS"** button with simulated 5-second beacon broadcast state.
2. **Interactive Map Tab (`/map`)**:
   - Leaflet map centered on user coordinates displaying nearby emergency shelters and risk overlays.
3. **Help & Evacuation Guide Tab (`/help`)**:
   - Packing essentials checklist (water, emergency radio, waterproof document containers).
   - "Before Evacuating" and "On the Move" safety protocols.
   - Emergency contact directory (District Collector, NDRF Control Room, State Disaster Helpline).

### D. Authorities Tactical Command Hub (`/dashboard/authorities/*`)
1. **Emergency Triage Queue**:
   - Live stream of incoming SOS alerts categorized by priority (`SOS ACTIVE`, `MEDICAL`, `RESOLVED`).
   - Detailed inspection drawer showing trapped individuals, battery level, estimated water depth, and emergency contact.
2. **Tactical Actions**:
   - **"Dispatch NDRF Boat"**: Instantly transitions alert to `DISPATCHED` and updates tactical map markers.
   - **"Mark Resolved"**: Marks emergency resolved and archives the alert.
3. **Tactical Leaflet Map**:
   - Visualizes live SOS locations, moving rescue boats, and HQ command center pins with coordinate popups.

---

## 7. Offline Resilience: Flood-Wayfinder & Beacon Point

Located in `Flood-Wayfinder/`, this subsystem is purpose-built for total network blackout scenarios:
- **Progressive Web App (PWA)**: Service workers (`sw.js`) cache UI assets, map tiles, and offline routing engines.
- **IndexedDB (`offlineDb.ts`)**: Stores vector road networks, pre-downloaded relief shelter coordinates, and local telemetry on the citizen's device.
- **Offline Routing Engine (`routing.ts`, `osm.ts`)**: Computes safe walking routes away from active river torrents using local A* pathfinding without requiring server queries.
- **Beacon Point**: Emergency mesh framework enabling device-to-device relay of SOS alerts to rescue teams equipped with portable receivers.

---

## 8. Complete Project File & Directory Structure

```text
Zenith_Codes_SIH_2026/
├── backend/
│   ├── backend/
│   │   ├── data/
│   │   │   └── shelters.json             # 6 Geo-referenced relief shelters dataset
│   │   ├── package.json                  # Express, Socket.IO, CORS dependencies
│   │   └── server.js                     # REST API & Socket.IO server (Port 5000)
│   └── frontend/                         # Standalone HTML/JS fallback interface
│       ├── authority.html
│       ├── index.html
│       └── js/ (app.js, authority.js)
├── data/
│   └── flash_flood_data.csv              # 6,000 hourly hydrological records (2021-2024)
├── docs/
│   ├── DATA_INGESTION_SPEC.md            # Technical guide for GIS & API ingestion
│   └── SIH TEMPLATE.pptx                 # Official hackathon presentation slides
├── Flood-Wayfinder/                      # Offline-First PWA and routing service
│   ├── artifacts/wayfinder/
│   │   ├── src/pages/WayfinderPage.tsx   # Offline navigation interface
│   │   └── src/services/ (offlineDb.ts, osm.ts, routing.ts, wayfinder.ts)
│   └── package.json
├── ml_database/                          # Ingestion & training subsystem
│   ├── data_ingestion/
│   │   ├── assembler.py                  # ThreadPoolExecutor concurrent feature builder
│   │   ├── cache.py                      # WeatherCache (30m) & StaticCache
│   │   ├── hydrology.py                  # Overpass OSM river network extractor
│   │   ├── topography.py                 # OpenTopoData DEM & slope/aspect math
│   │   ├── weather.py                    # Open-Meteo precipitation & AMC calculations
│   │   └── validators.py                 # 12-feature schema validator
│   ├── docs/audit_reports/               # Performance & ground-truth audit logs
│   └── tests/                            # 39 Unit tests (test_cache, test_pipeline, etc.)
├── models/
│   ├── feature_metadata.json             # Model training metadata & hyperparameters
│   ├── nowcaster_gru.pt                  # Serialized PyTorch GRU nowcasting model
│   └── xgb_flash_flood.joblib            # Trained XGBoost multiclass model bundle
├── public/
│   ├── hero-bg-video.mp4                 # Background video asset for hero section
│   └── icons.svg
├── reports/
│   ├── confusion_matrix.png              # Visual confusion matrix (out-of-time test)
│   ├── evaluation_report.json            # Precision/recall/F1 metrics per tier
│   ├── shap_bar.png                      # Mean absolute SHAP importance plot
│   └── shap_summary.png                  # SHAP beeswarm distribution plot
├── src/                                  # React 19 Frontend Application (Port 5173)
│   ├── App.jsx                           # Top-level React Router configuration
│   ├── components/
│   │   ├── dashboard/                    # DashboardLayout & InteractiveMap (Leaflet)
│   │   └── widgets/                      # Forecast, RecentAlerts, RiskLevel widgets
│   ├── pages/
│   │   ├── LandingPage.jsx               # Main BACHAV portal
│   │   └── dashboard/
│   │       ├── AuthoritiesDashboard.jsx  # Emergency Hub & Tactical Map
│   │       └── UserDashboard.jsx         # Telemetry, Emergency SOS, Shelter Map
│   └── ui-kit/                           # Reusable animated UI components & drawers
├── evaluate.py                           # Model evaluation and SHAP analysis script
├── generate_dataset.py                   # SCS-CN physically grounded dataset generator
├── nowcast.py                            # GRU sequence nowcasting inference script
├── package.json                          # Vite, React 19, Tailwind v4, Leaflet dependencies
├── predict.py                            # Core predict_risk() inference script
├── sample_input.json                     # Sample real-world hydrological payload
├── sample_output.json                    # Expected risk tier and attribution payload
├── test_pipeline.py                      # Hydrological contract test suite
├── train.py                              # Model training & cross-validation pipeline
└── vite.config.js                        # Vite bundler configuration
```

---

## 9. Automated Testing & Verification Summary

The platform has undergone rigorous automated testing across all functional modules (8 test suites, 100% pass rate):

```text
======================================================
TEST VERIFICATION SUMMARY: 8 SUITES / 46 UNIT TESTS
STATUS: ALL 8 SUITES PASSED (0 FAILURES)
======================================================
[PASS] ML Ingestion & Caching Unit Tests (39 tests)     [13.31s]
[PASS] Hydrological Pipeline Contract Tests (7 tests)   [ 0.37s]
[PASS] XGBoost Multiclass Inference & Attribution       [ 0.92s]
[PASS] Deep Learning Nowcasting GRU Model               [ 1.20s]
[PASS] Out-of-Time Model Evaluation (2024 Monsoon)      [ 8.12s]
[PASS] Emergency Backend REST & Socket.IO Lifecycle     [ 0.66s]
[PASS] Frontend HTTP Route Healthcheck (3 Routes)       [ 0.05s]
[PASS] Production Client Bundle Compilation (Vite)      [ 1.84s]
```

---

## 10. How to Run the Complete System

### Prerequisites
- **Node.js**: v18+ (tested on Node v22)
- **Python**: 3.10+ (tested on Python 3.14 with `xgboost`, `shap`, `torch`, `scikit-learn`, `joblib`, `pandas`, `numpy`)

### Step 1: Start the React Frontend Application
```powershell
cmd /c "npm run dev"
```
*Access the interface at [http://localhost:5173/](http://localhost:5173/)*

### Step 2: Start the Emergency Backend Server
```powershell
node backend/backend/server.js
```
*Healthcheck available at [http://localhost:5000/api/health](http://localhost:5000/api/health)*

### Step 3: Run Model Risk Inference
```powershell
python predict.py --input sample_input.json
```

### Step 4: Run the Complete Automated Test Suite
```powershell
python .gemini/antigravity-ide/brain/0894955a-9a88-491c-8b16-6b6dda8e5575/scratch/run_full_test_suite.py
```
