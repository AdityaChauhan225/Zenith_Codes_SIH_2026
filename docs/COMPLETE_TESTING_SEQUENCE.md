# BACHAV — Complete Testing Sequence

> **Generated**: 2026-10-04
> **Scope**: ML Model → Backend → Frontend → Offline/Beacon → End-to-End
> **Target**: FAIL 0 across all categories

---

## 0. Pre-Test Environment Setup

| Step | Action |
|------|--------|
| 0.1 | `pip install -r requirements.txt` (xgboost, shap, torch, scikit-learn, fastapi, pandas, numpy, python-socketio) |
| 0.2 | `cd backend && npm install` (express, socket.io, cors) |
| 0.3 | `npm install` in root (vite, react, leaflet, lucide-react, framer-motion) |
| 0.4 | Verify `models/xgb_flash_flood.joblib` exists (2.4 MB expected) |
| 0.5 | Verify `models/nowcaster_gru.pt` exists (200+ KB expected) |
| 0.6 | Verify `data/flash_flood_data.csv` exists (6,000 rows) |
| 0.7 | Verify `backend/backend/data/shelters.json` exists (6 shelters) |
| 0.8 | Start Node backend: `node backend/backend/server.js` (port 5000) |
| 0.9 | Start FastAPI backend: `uvicorn api_server:app --port 5000` (if testing unified backend) |
| 0.10 | Start Vite dev: `npm run dev` (port 5173) |
| 0.11 | Confirm `http://localhost:5173` returns 200 |
| 0.12 | Confirm `http://localhost:5000/api/health` returns `{"status":"OK"}` |

---

## 1. Data Layer Tests

### 1.1 Dataset Integrity
| ID | Test | Expected |
|----|------|----------|
| DAT-01 | Row count == 6,000 | PASS |
| DAT-02 | All 12 features present | PASS |
| DAT-03 | Rainfall non-decreasing (1h <= 3h <= 6h <= 24h) | PASS |
| DAT-04 | Land cover ∈ {forest, agriculture, urban, barren} | PASS |
| DAT-05 | AMC ∈ {dry, normal, wet} | PASS |
| DAT-06 | No null values in any column | PASS |
| DAT-07 | soil_saturation_index ∈ [0.0, 1.0] | PASS |
| DAT-08 | slope_degrees ∈ [5.0, 70.0] | PASS |
| DAT-09 | elevation_m ∈ [300, 4500] | PASS |
| DAT-10 | aspect ∈ [0.0, 360.0] | PASS |
| DAT-11 | historical_incident_density >= 0 | PASS |
| DAT-12 | distance_to_nearest_stream_m >= 0 | PASS |
| DAT-13 | Train (2021–23) = 4,500, Test (2024) = 1,500 | PASS |
| DAT-14 | Critical tier ≈ 3.5% of total | PASS |
| DAT-15 | Timestamps within monsoon season (Jun 15 – Sep 30) | PASS |

### 1.2 Dataset Generation Physics (generate_dataset.py)
| ID | Test | Expected |
|----|------|----------|
| PHY-01 | SCS-CN dry < normal < wet for same rainfall | PASS |
| PHY-02 | SCS-CN Q = 0 below initial abstraction Ia | PASS |
| PHY-03 | Rainfall_24h monotonically non-decreasing | PASS |
| PHY-04 | Soil saturation clipped to [0,1] | PASS |

---

## 2. ML Model Tests

### 2.1 Model Loading & Hyperparameters
| ID | Function | Test | Expected |
|----|----------|------|----------|
| MOD-01 | `joblib.load()` | Model file loads without error | PASS |
| MOD-02 | `load_pipeline()` | Returns bundle + explainer | PASS |
| MOD-03 | `clf.get_params()` | max_depth == 6 | PASS |
| MOD-04 | `clf.get_params()` | learning_rate == 0.05 | PASS |
| MOD-05 | `clf.get_params()` | n_estimators == 150 | PASS |
| MOD-06 | `tier_map` | 4 classes (low, medium, high, critical) | PASS |
| MOD-07 | `tier_weights` | [0.08, 0.38, 0.68, 0.94] | PASS |
| MOD-08 | `predict_risk()` | Returns dict with risk_level, risk_score, explanation | PASS |
| MOD-09 | `predict_risk()` | risk_score ∈ [0.01, 0.99] | PASS |
| MOD-10 | `predict_risk()` | explanation has exactly 12 keys | PASS |
| MOD-11 | `predict_risk()` | All explanation values are floats | PASS |
| MOD-12 | `predict_risk()` | Same input → same output (determinism) | PASS |

### 2.2 Physical Sensitivity
| ID | Test | Expected |
|----|------|----------|
| MOD-13 | Calm weather input | risk_level ∈ {low, medium} | PASS |
| MOD-14 | Cloudburst on saturated urban slope | risk_level ∈ {high, critical} | PASS |
| MOD-15 | Increase rainfall only | risk_score non-decreasing | PASS |
| MOD-16 | Increase soil saturation only | risk_score non-decreasing | PASS |
| MOD-17 | Decrease land cover permeability (forest→urban) | risk_score non-decreasing | PASS |

### 2.3 Input Validation
| ID | Test | Expected |
|----|------|----------|
| MOD-18 | Negative rainfall | ValueError raised | PASS |
| MOD-19 | 3h < 1h rainfall | ValueError raised | PASS |
| MOD-20 | slope_degrees = 90 | ValueError raised | PASS |
| MOD-21 | Unknown land_cover_class | ValueError raised | PASS |
| MOD-22 | Unknown AMC | ValueError raised | PASS |
| MOD-23 | Missing feature key | ValueError raised | PASS |
| MOD-24 | Invalid input type (list instead of dict) | TypeError raised | PASS |
| MOD-25 | soil_saturation clipped to [0, 1] | No crash, value clipped | PASS |

### 2.4 GRU Nowcaster (nowcast.py)
| ID | Function | Test | Expected |
|----|----------|------|----------|
| NOW-01 | `torch.load()` | Weights load without NaN | PASS |
| NOW-02 | `RainfallNowcasterGRU()` | Forward pass shape (N, 6) | PASS |
| NOW-03 | `predict_nowcast()` | All 6 outputs >= 0 (Softplus) | PASS |
| NOW-04 | `predict_nowcast()` | Returns dict with keys forecast_1h...6h | PASS |
| NOW-05 | `predict_nowcast()` | Invalid shape (24, 4) → ValueError | PASS |
| NOW-06 | `enrich_features_with_nowcast()` | Adds nowcasted_future_rainfall_6h_mm | PASS |

### 2.5 Model Metrics
| ID | Test | Expected |
|----|------|----------|
| MOD-26 | accuracy >= 85% | 89.4% → PASS |
| MOD-27 | macro_f1 >= 0.78 | 0.8127 → PASS |
| MOD-28 | critical F1 >= 0.78 | 0.8333 → PASS |
| MOD-29 | kappa >= 0.70 | 0.7503 → PASS |

### 2.6 API Endpoints (api_server.py)
| ID | Endpoint | Test | Expected |
|----|----------|------|----------|
| API-01 | GET /api/health | 200 OK, status == "OK" | PASS |
| API-02 | GET /api/health | Has xgboost_flash_flood field | PASS |
| API-03 | GET /api/health | Has gru_nowcaster field | PASS |
| API-04 | GET /api/health | Has ingestion_assembler field | PASS |
| API-05 | POST /api/predict | Valid 12-feature payload → risk_level + score + explanation | PASS |
| API-06 | POST /api/predict | Bad JSON → 400 | PASS |
| API-07 | POST /api/predict | Missing features → 400 | PASS |
| API-08 | POST /api/predict/live | lat+lon provided → live prediction | PASS |
| API-09 | POST /api/predict/live | Missing lat → 400 | PASS |
| API-10 | POST /api/nowcast | Custom 24×3 sequence → forecast | PASS |
| API-11 | POST /api/nowcast | No sequence → auto-generated forecast | PASS |
| API-12 | GET /api/shelters | No params → all shelters, no distance | PASS |
| API-13 | GET /api/shelters | lat+lng → sorted by distance | PASS |
| API-14 | GET /api/sos | Returns all alerts | PASS |
| API-15 | POST /api/sos | Valid coords → 201 + id | PASS |
| API-16 | POST /api/sos | Bad latitude → 400 | PASS |
| API-17 | POST /api/sos | Bad longitude → 400 | PASS |
| API-18 | POST /api/sos | Same coords within 3s → "already processed" | PASS |
| API-19 | POST /api/sos | After 3.1s → new record | PASS |
| API-20 | PATCH /api/sos/:id/resolve | Valid id → 200, status=RESOLVED | PASS |
| API-21 | PATCH /api/sos/:id/resolve | Invalid id → 404 | PASS |
| API-22 | Socket.IO | new_sos_alert event broadcast | PASS |
| API-23 | Socket.IO | sos_status_updated event broadcast | PASS |

---

## 3. Backend Tests (backend/backend/server.js)

### 3.1 REST Endpoints
| ID | Endpoint | Test | Expected |
|----|----------|------|----------|
| BAK-01 | GET /api/health | 200, status "OK", timestamp present | PASS |
| BAK-02 | GET /api/shelters?lat=30.3165&lng=78.0322 | 200, count == 6, sorted nearest-first | PASS |
| BAK-03 | GET /api/shelters | No params → all shelters, distanceKm = null | PASS |
| BAK-04 | POST /api/sos | Valid → 201, returns alert object with id | PASS |
| BAK-05 | POST /api/sos | latitude=999 → 400 | PASS |
| BAK-06 | POST /api/sos | Invalid JSON → 400 | PASS |
| BAK-07 | POST /api/sos | Duplicate within 3s → 200 "already processed" | PASS |
| BAK-08 | POST /api/sos | 10 rapid clicks → 1 record, 9 dedup | PASS |
| BAK-09 | POST /api/sos | After 3.1s → new 201 record | PASS |
| BAK-10 | PATCH /api/sos/:id/resolve | Valid → 200, status=RESOLVED | PASS |
| BAK-11 | PATCH /api/sos/:id/resolve | Unknown id → 404 | PASS |
| BAK-12 | GET /api/sos | Returns array of all alerts | PASS |

### 3.2 Haversine Distance
| ID | Test | Expected |
|----|------|----------|
| BAK-13 | Same coordinates | 0.00 km | PASS |
| BAK-14 | Known distance (Dehradun to Mussoorie) | ≈ 29 km | PASS |
| BAK-15 | Sorted output | Distances ascending | PASS |

### 3.3 Socket.IO
| ID | Test | Expected |
|----|------|----------|
| BAK-16 | Connection | initial_alerts event received | PASS |
| BAK-17 | New SOS broadcast | new_sos_alert event | PASS |
| BAK-18 | Resolve broadcast | sos_status_updated event | PASS |
| BAK-19 | Disconnect | No crash | PASS |

---

## 4. Frontend Tests (Port 5173)

### 4.1 Routing & Build
| ID | Test | Expected |
|----|------|----------|
| FRO-01 | GET / | 200 OK | PASS |
| FRO-02 | GET /dashboard/user/home | 200 OK | PASS |
| FRO-03 | GET /dashboard/user/map | 200 OK | PASS |
| FRO-04 | GET /dashboard/user/help | 200 OK | PASS |
| FRO-05 | GET /dashboard/authorities/home | 200 OK | PASS |
| FRO-06 | `npm run build` | dist/ created, no errors | PASS |
| FRO-07 | GET /unknown | 200 (SPA fallback to index.html) | PASS |

### 4.2 Landing Page
| ID | Component | Test | Expected |
|----|-----------|------|----------|
| LND-01 | HeroSection | BACHAV brand present | PASS |
| LND-02 | HeroSection | Tagline "Village-Level. Flash Flood. Early Warning." | PASS |
| LND-03 | HeroSection | CTA button "Learn How It Works" | PASS |
| LND-04 | HeroSection | Detail cards (Village-Level, Lead Time, IoT) | PASS |
| LND-05 | FeaturesSection | Title "Five data streams. One prediction model." | PASS |
| LND-06 | FeaturesSection | 5 feature cards (Rainfall, Soil, Slope, Historical, IoT) | PASS |
| LND-07 | ProcessSection | Steps: Collect → Analyse → Predict → Alert | PASS |
| LND-08 | ProcessSection | Problem/solution text present | PASS |
| LND-09 | RolesSection | 4 trust cards | PASS |
| LND-10 | CTASection | "Start monitoring your region." | PASS |
| LND-11 | CTASection | Footer links (Features, How It Works, Alert System, Get Started) | PASS |
| LND-12 | Nav links | Scroll to #features, #how-it-works, #roles | PASS |
| LND-13 | Mobile | No horizontal scroll (max-width handled) | PASS |

### 4.3 Sign-In Drawer (SignInDrawer.jsx)
| ID | Component | Test | Expected |
|----|-----------|------|----------|
| ATH-01 | DrawerTrigger | Click opens drawer | PASS |
| ATH-02 | Login tab | Default active tab is "login" | PASS |
| ATH-03 | Login tab | Email input present | PASS |
| ATH-04 | Login tab | Password input present | PASS |
| ATH-05 | Signup tab | Name, Phone, Email, Password, Confirm inputs | PASS |
| ATH-06 | Signup tab | "Create Account" button present | PASS |
| ATH-07 | Login tab | "Sign In" button present | PASS |
| ATH-08 | Login tab | "Forgot password?" button present | PASS |
| ATH-09 | DrawerClose | X button closes drawer | PASS |
| ATH-10 | Empty email | handleAuthSubmit → error state | PASS |
| ATH-11 | citizen@gmail.com | Routes to /dashboard/user/home | PASS |
| ATH-12 | admin@ndrf.gov.in | Routes to /dashboard/authorities/home | PASS |
| ATH-13 | official@disaster.gov.in | Routes to /dashboard/authorities/home | PASS |
| ATH-14 | Invalid email format | Handled gracefully (navigates to user) | PASS |
| ATH-15 | Passkey animation | After submit → fingerprint animation | PASS |

### 4.4 Citizen Dashboard (UserDashboard.jsx)
#### 4.4.1 Layout & Navigation
| ID | Component | Test | Expected |
|----|-----------|------|----------|
| USR-01 | DashboardLayout | BACHAV logo clickable → navigates to / | PASS |
| USR-02 | DashboardLayout | Nav links: Home, Map, Help | PASS |
| USR-03 | DashboardLayout | Active link highlighted | PASS |
| USR-04 | DashboardLayout | Bell icon opens notifications | PASS |
| USR-05 | DashboardLayout | Profile icon opens profile modal | PASS |
| USR-06 | Profile modal | Photo upload input present | PASS |
| USR-07 | Profile modal | Name, Email, Phone, Blood Group editable | PASS |
| USR-08 | Profile modal | Cancel & Save Changes buttons | PASS |
| USR-09 | Notifications | "Evacuation Route Updated" notification | PASS |
| USR-10 | Notifications | "Heavy Rainfall Alert" notification | PASS |
| USR-11 | Notifications | "View All" expands more notifications | PASS |
| USR-12 | Mobile nav | Bottom tab bar visible | PASS |

#### 4.4.2 User Home Tab
| ID | Component | Test | Expected |
|----|-----------|------|----------|
| USH-01 | Weather card | Temperature displayed (°) | PASS |
| USH-02 | Weather card | Wind speed (km/h) | PASS |
| USH-03 | Weather card | Humidity (%) | PASS |
| USH-04 | Weather card | Weather description | PASS |
| USH-05 | Weather card | Dynamic weather icon | PASS |
| USH-06 | Alert header | Red/Orange/Yellow/Green based on rain | PASS |
| USH-07 | Rainfall gauge | Current rainfall (mm/h) | PASS |
| USH-08 | Soil gauge | Saturation % + color bar | PASS |
| USH-09 | River level | Level value + description | PASS |
| USH-10 | Impact time | Minutes estimate | PASS |
| USR-11 | Advisory text | Context-aware advisory message | PASS |
| USR-12 | AI Prediction card | XGBoost label + risk tier badge | PASS |
| USR-13 | AI Prediction card | SHAP top drivers shown | PASS |
| USR-14 | 12-hour timeline | 12 hourly bars rendered | PASS |
| USR-15 | 12-hour timeline | Risk colors match thresholds | PASS |
| USR-16 | SOS button | "EMERGENCY SOS" visible | PASS |
| USR-17 | SOS button | Click → "Transmitting Coordinates..." | PASS |
| USR-18 | SOS button | After 2s → "SOS SENT — AUTHORITIES ALERTED" | PASS |
| USR-19 | SOS button | Disabled during loading/sent states | PASS |
| USR-20 | SOS button | Resets after 5 seconds | PASS |
| USR-21 | Live prediction | Calls /api/predict/live on mount | PASS |

#### 4.4.3 User Map Tab
| ID | Component | Test | Expected |
|----|-----------|------|----------|
| UMP-01 | Search bar | Text input present | PASS |
| UMP-02 | Search bar | Enter key → Nominatim search | PASS |
| UMP-03 | Search bar | Map pans to result | PASS |
| UMP-04 | Location info | Lat/Lon displayed | PASS |
| UMP-05 | Radius slider | Min 1, Max 25, default 5 | PASS |
| UMP-06 | Radius slider | Changing updates display value | PASS |
| UMP-07 | Download button | "Download Offline Map" | PASS |
| UMP-08 | Download button | Click → "Downloading..." spinner | PASS |
| UMP-09 | Download button | After 1.5s → new map in list | PASS |
| UMP-10 | Downloaded list | Shows name, radius, size, date | PASS |
| UMP-11 | Downloaded list | Click → navigates map to that region | PASS |
| UMP-12 | Delete button | Hover reveals Trash icon | PASS |
| UMP-13 | Delete button | Click → removes from list | PASS |
| UMP-14 | Map circle | Radius circle rendered on map | PASS |
| UMP-15 | Map circles | Downloaded areas shown as dashed circles | PASS |
| UMP-16 | Map controls | Zoom in/out buttons | PASS |
| UMP-17 | Map controls | "Locate me" button | PASS |

#### 4.4.4 User Help Tab
| ID | Component | Test | Expected |
|----|-----------|------|----------|
| UHP-01 | Emergency Profile | Name, Phone, Blood Group, Medical, Address shown | PASS |
| UHP-02 | Edit button | Opens edit modal | PASS |
| UHP-03 | Edit modal | All fields editable | PASS |
| UHP-04 | Edit modal | Save Changes updates profile | PASS |
| UHP-05 | Edit modal | X button closes modal | PASS |
| UHP-06 | Emergency Contacts | Shows existing contacts | PASS |
| UHP-07 | Add Contact button | Opens add contact modal | PASS |
| UHP-08 | Add Contact modal | Name, Relation, Phone fields | PASS |
| UHP-09 | Add Contact | Submit → adds to list | PASS |
| UHP-10 | Delete Contact | Hover → Trash icon | PASS |
| UHP-11 | Delete Contact | Click → confirm → removes | PASS |
| UHP-12 | SOS button (Help) | "SOS" button → broadcasting → sent | PASS |
| UHP-13 | Helplines | NDRF 1078, Ambulance 108, Police 100 | PASS |
| UHP-14 | Evacuation Guide | Click card → opens guide modal | PASS |
| UHP-15 | Guide modal | Essentials to Pack checklist | PASS |
| UHP-16 | Guide modal | Before Evacuating protocol | PASS |
| UHP-17 | Guide modal | On the Move protocol | PASS |
| UHP-18 | Guide modal | "I Understand" closes modal | PASS |

### 4.5 Authorities Dashboard (AuthoritiesDashboard.jsx)
| ID | Component | Test | Expected |
|----|-----------|------|----------|
| AUTH-01 | Emergency Hub header | Title + subtitle | PASS |
| AUTH-02 | Critical counter | Shows active alert count | PASS |
| AUTH-03 | Alert card (SOS ACTIVE) | Red badge, title, location, time | PASS |
| AUTH-04 | Alert card (MEDICAL) | Orange badge | PASS |
| AUTH-05 | Alert card (RESOLVED) | Green badge, 40% opacity | PASS |
| AUTH-06 | Expand alert | Click → shows details (Individuals, Contact, Battery, Water) | PASS |
| AUTH-07 | Expand alert | Message displayed | PASS |
| AUTH-08 | Dispatch button | "Dispatch NDRF Boat" → status=DISPATCHED | PASS |
| AUTH-09 | Dispatch button | Visual style changes (blue) | PASS |
| AUTH-10 | Resolve button | "Mark Resolved" → status=RESOLVED | PASS |
| AUTH-11 | Collapse alert | Click collapsed → expands | PASS |
| AUTH-12 | Tactical Map | Title + subtitle | PASS |
| AUTH-13 | Tactical Map | SOS marker rendered | PASS |
| AUTH-14 | Tactical Map | NDRF unit markers rendered | PASS |
| AUTH-15 | Tactical Map | HQ Center marker rendered | PASS |
| AUTH-16 | Tactical Map | Zoom in/out controls | PASS |
| AUTH-17 | Tactical Map | Locate button | PASS |
| AUTH-18 | Geolocation | Uses browser geolocation API | PASS |
| AUTH-19 | Geolocation fallback | Falls back to default coords | PASS |

---

## 5. Offline / Flood-Wayfinder Tests

| ID | Component | Test | Expected |
|----|-----------|------|----------|
| OFF-01 | File structure | WayfinderPage.tsx exists | PASS |
| OFF-02 | File structure | offlineDb.ts exists | PASS |
| OFF-03 | File structure | routing.ts exists | PASS |
| OFF-04 | File structure | wayfinder.ts exists | PASS |
| OFF-05 | File structure | osm.ts exists | PASS |
| OFF-06 | File structure | sw.js (service worker) exists | PASS |
| OFF-07 | PWA manifest | manifest.json present | PASS |
| OFF-08 | A* routing | Finds path between two nodes | PASS |
| OFF-09 | A* routing | Avoids river/torrent areas | PASS |
| OFF-10 | IndexedDB | Stores road network data | PASS |
| OFF-11 | IndexedDB | Stores shelter coordinates | PASS |
| OFF-12 | Offline tiles | Previously loaded tiles cached | PASS |
| OFF-13 | Offline mode | App loads without network | PASS (manual) |

---

## 6. Beacon Point Tests

| ID | Component | Test | Expected |
|----|-----------|------|----------|
| BCN-01 | Component renders | View, title, status badge | PASS |
| BCN-02 | Network monitor | Online/Offline status badge | PASS |
| BCN-03 | SOS button | "ACTIVATE BEACON" visible | PASS |
| BCN-04 | triggerBeacon() | Sets isBeaconActive = true | PASS |
| BCN-05 | triggerBeacon() | Shows "Beacon Activated" alert | PASS |
| BCN-06 | triggerBeacon() | Gets GPS location | PASS |
| BCN-07 | triggerBeacon() | Saves to Firestore | PASS |
| BCN-08 | Location display | Shows last known coordinates | PASS |
| BCN-09 | deactivateBeacon() | Sets status to SAFE | PASS |
| BCN-10 | Offline persistence | Firebase persistence enabled | PASS |
| BCN-11 | Deactivate button | "MARK AS SAFE" shown when active | PASS |
| BCN-12 | Status badge | Green when online, Red when offline | PASS |

---

## 7. Integration / End-to-End Tests

| ID | Flow | Test | Expected |
|----|------|------|----------|
| E2E-01 | Sign-in → Dashboard | citizen@gmail.com → /dashboard/user/home | PASS |
| E2E-02 | Sign-in → Dashboard | ndrf@ndrf.gov.in → /dashboard/authorities/home | PASS |
| E2E-03 | SOS flow (Citizen) | Press SOS → API records alert → Socket broadcast | PASS |
| E2E-04 | SOS → Authorities | SOS appears in authorities queue | PASS |
| E2E-05 | Dispatch → Map | Dispatch button → status changes → map updates | PASS |
| E2E-06 | Resolve → Archive | Resolve → opacity 40% → archived | PASS |
| E2E-07 | Live prediction | /api/predict/live → frontend AI card populated | PASS |
| E2E-08 | Map download | Search → Download → List → Delete | PASS |
| E2E-09 | Profile edit | Open → Edit fields → Save → Display updates | PASS |
| E2E-10 | Contact management | Add → List → Delete | PASS |
| E2E-11 | Shelter lookup | /api/shelters?lat=&lng → 6 sorted | PASS |
| E2E-12 | Nowcasting | /api/nowcast → 6h forecast returned | PASS |
| E2E-13 | Alert colors | Green (safe) → Yellow → Orange → Red (critical) | PASS |
| E2E-14 | Cache expiry | Weather cache TTL = 30 min | PASS |
| E2E-15 | Cold prediction | All APIs empty cache ≈ 4.2 s | PASS |
| E2E-16 | Warm prediction | Same coords, cached < 0.5 ms | PASS |

---

## 8. Performance & Stress Tests

| ID | Test | Expected |
|----|------|----------|
| PER-01 | 10 concurrent SOS requests | 9 deduplicated, 1 record | PASS |
| PER-02 | 50 concurrent /api/health requests | All return 200 | PASS |
| PER-03 | 20 concurrent predictions | All return valid results | PASS |
| PER-04 | Socket.IO 10 connections | All receive broadcasts | PASS |
| PER-05 | Frontend bundle size | < 500 KB gzipped | PASS |
| PER-06 | Leaflet map render | < 2 s on mid-range device | PASS (manual) |
| PER-07 | Memory leak | 1000 SOS create+resolve cycles | No leak (manual) |

---

## 9. Security & Resilience Tests

| ID | Test | Expected |
|----|------|----------|
| SEC-01 | CORS headers | Present on API responses | PASS |
| SEC-02 | Invalid JSON body | 400, no crash | PASS |
| SEC-03 | SQL injection | Not applicable (no SQL) | PASS |
| SEC-04 | XSS in search | Input sanitized in React | PASS (manual) |
| SEC-05 | Backend kill | Frontend shows error, not crash | PASS (manual) |
| SEC-06 | Rate limiting | Rapid SOS calls deduplicated | PASS |
| SEC-07 | Coordinate bounds | lat [-90,90], lng [-180,180] enforced | PASS |

---

## 10. Cross-Browser Tests (Manual)

| ID | Browser | Expected |
|----|---------|----------|
| BRW-01 | Chrome (latest) | All features work | PASS |
| BRW-02 | Firefox (latest) | All features work | PASS |
| BRW-03 | Edge (latest) | All features work | PASS |
| BRW-04 | Safari (latest) | Core features work | PASS (manual) |
| BRW-05 | Mobile Chrome | Responsive layout works | PASS (manual) |
| BRW-06 | Mobile Safari | Responsive layout works | PASS (manual) |

---

## Final Checklist

```
[ ] All 10 categories executed
[ ] FAIL 0 across all automated tests
[ ] Manual checks completed (PART B)
[ ] Performance benchmarks met
[ ] Cross-browser verified
[ ] TEST_REPORT.md generated with PASS/FAIL for every item
```
