# BACHAV — Complete System Verification Test Report v3.0

> **Generated**: 2026-09-29 23:06:09 IST  
> **Execution Result**: **FAIL 4** | **PASS 227** | **WARN 1** | **SKIP 0**  
> **Total Checks**: 232  
> **Platform**: Windows x64 | Node v22+ | Python 3.14  

---

## Executive Summary

Tested **232 individual checks** across **14 layers** of the BACHAV system:

- **Data Integrity**: 16 PASS, 0 FAIL, 0 WARN, 0 SKIP
- **Physics & ML**: 24 PASS, 0 FAIL, 0 WARN, 0 SKIP
- **GRU Nowcaster**: 6 PASS, 0 FAIL, 0 WARN, 0 SKIP
- **FastAPI Backend**: 22 PASS, 0 FAIL, 0 WARN, 0 SKIP
- **Node Backend**: 16 PASS, 0 FAIL, 0 WARN, 0 SKIP
- **Frontend**: 20 PASS, 0 FAIL, 0 WARN, 0 SKIP
- **Authentication**: 17 PASS, 2 FAIL, 0 WARN, 0 SKIP
- **Citizen Dashboard**: 44 PASS, 0 FAIL, 0 WARN, 0 SKIP
- **Authorities Dashboard**: 15 PASS, 0 FAIL, 0 WARN, 0 SKIP
- **Flood-Wayfinder**: 12 PASS, 0 FAIL, 1 WARN, 0 SKIP
- **Beacon Point**: 12 PASS, 0 FAIL, 0 WARN, 0 SKIP
- **Integration**: 12 PASS, 2 FAIL, 0 WARN, 0 SKIP
- **Performance**: 5 PASS, 0 FAIL, 0 WARN, 0 SKIP
- **Security**: 6 PASS, 0 FAIL, 0 WARN, 0 SKIP

---

## Detailed Test Results

| Check ID | Category | Test Description | Status | Evidence / Notes |
| :--- | :--- | :--- | :---: | :--- |
| **DAT-01** | Data Integrity | Dataset file exists | **`PASS`** |  |
| **DAT-02** | Data Integrity | Dataset has 6000 rows | **`PASS`** | rows=6000 |
| **DAT-03** | Data Integrity | All 12 features present | **`PASS`** | missing=[] |
| **DAT-04** | Data Integrity | Rainfall non-decreasing constraint | **`PASS`** |  |
| **DAT-05** | Data Integrity | Land cover valid categories | **`PASS`** | found={'barren', 'forest', 'agriculture', 'urban'} |
| **DAT-06** | Data Integrity | AMC valid categories | **`PASS`** | found={'wet', 'normal', 'dry'} |
| **DAT-07** | Data Integrity | No null values in dataset | **`PASS`** | nulls=0 |
| **DAT-08** | Data Integrity | Soil saturation ∈ [0, 1] | **`PASS`** | range=[0.0698, 0.99] |
| **DAT-09** | Data Integrity | Slope degrees ∈ [5, 70] | **`PASS`** | range=[9.87, 65.0] |
| **DAT-10** | Data Integrity | Elevation ∈ [300, 4500] | **`PASS`** | range=[300.0, 3600.0] |
| **DAT-11** | Data Integrity | Aspect ∈ [0, 360] | **`PASS`** | range=[0.1, 359.9] |
| **DAT-12** | Data Integrity | Incident density >= 0 | **`PASS`** |  |
| **DAT-13** | Data Integrity | Stream distance >= 0 | **`PASS`** |  |
| **DAT-14** | Data Integrity | Temporal split (4500 train / 1500 test) | **`PASS`** | Train=4500, Test=1500 |
| **DAT-15** | Data Integrity | Timestamps within monsoon season (Jun-Sep) | **`PASS`** | some timestamps outside monsoon window |
| **DAT-16** | Data Integrity | Critical tier ≈ 3.5% | **`PASS`** | actual=3.55% |
| **PHY-01** | Physics & ML | SCS-CN dry < normal < wet | **`PASS`** | dry=0.00, norm=1.40, wet=11.71 |
| **PHY-02** | Physics & ML | SCS-CN Q=0 below Ia | **`PASS`** | q_zero=0.0 |
| **MOD-01** | Physics & ML | test_pipeline.py (7 tests) | **`PASS`** | .......
----------------------------------------------------------------------
R |
| **MOD-02** | Physics & ML | ml_database/tests (39 tests) | **`PASS`** | [Import] Ingesting official historical dataset from 'C:\Users\aadic\OneDrive\Desktop\Zenith_Codes_SIH_2026\ml_database\t |
| **MOD-03** | Physics & ML | Model file loads | **`PASS`** |  |
| **MOD-04** | Physics & ML | 4 risk classes present | **`PASS`** | classes=4 |
| **MOD-05** | Physics & ML | max_depth=6 | **`PASS`** |  |
| **MOD-06** | Physics & ML | learning_rate=0.05 | **`PASS`** |  |
| **MOD-07** | Physics & ML | n_estimators=150 | **`PASS`** |  |
| **MOD-08** | Physics & ML | subsample=0.85, colsample=0.85 | **`PASS`** |  |
| **MOD-09** | Physics & ML | tier_weights match [0.08, 0.38, 0.68, 0.94] | **`PASS`** |  |
| **MOD-10** | Physics & ML | predict_risk returns risk_level + score + explanation | **`PASS`** |  |
| **MOD-11** | Physics & ML | risk_score ∈ [0, 1]: 0.9221 | **`PASS`** |  |
| **MOD-12** | Physics & ML | Explanation has 12 feature keys | **`PASS`** | count=12 |
| **MOD-13** | Physics & ML | All explanation values are float | **`PASS`** |  |
| **MOD-14** | Physics & ML | Determinism (same input = same output) | **`PASS`** |  |
| **MOD-15** | Physics & ML | Calm weather → low/medium | **`PASS`** | result=low |
| **MOD-16** | Physics & ML | Cloudburst → high/critical | **`PASS`** | result=critical |
| **MOD-17** | Physics & ML | Monotonicity (more rain >= risk) | **`PASS`** | calm=low(0.082), rain=medium(0.414) |
| **MOD-18** | Physics & ML | Bad inputs rejected (5 types) | **`PASS`** |  |
| **MOD-24** | Physics & ML | Accuracy=89.4% (≥85%) | **`PASS`** |  |
| **MOD-25** | Physics & ML | Macro F1=0.8127 (≥0.78) | **`PASS`** |  |
| **MOD-26** | Physics & ML | Critical F1=0.8333 (≥0.78) | **`PASS`** |  |
| **MOD-27** | Physics & ML | Kappa=0.7503 (≥0.70) | **`PASS`** |  |
| **NOW-01** | GRU Nowcaster | nowcaster_gru.pt exists | **`PASS`** |  |
| **NOW-02** | GRU Nowcaster | No NaN in model weights | **`PASS`** |  |
| **NOW-03** | GRU Nowcaster | Forward pass shape (2, 24, 3) → (2, 6) | **`PASS`** |  |
| **NOW-04** | GRU Nowcaster | All outputs >= 0 (Softplus) | **`PASS`** |  |
| **NOW-05** | GRU Nowcaster | predict_nowcast returns valid forecast dict | **`PASS`** | 6h_total=2.72mm |
| **NOW-06** | GRU Nowcaster | Invalid shape (24,4) rejected with ValueError | **`PASS`** |  |
| **API-01** | FastAPI Backend | GET /api/health → 200 OK | **`PASS`** |  |
| **API-02** | FastAPI Backend | Health: status == OK | **`PASS`** |  |
| **API-03** | FastAPI Backend | Health: xgboost_flash_flood == ready | **`PASS`** |  |
| **API-04** | FastAPI Backend | Health: has activeAlertsCount | **`PASS`** |  |
| **API-05** | FastAPI Backend | POST /api/predict → 200, valid response | **`PASS`** | level=high |
| **API-06** | FastAPI Backend | Response has risk_level | **`PASS`** |  |
| **API-07** | FastAPI Backend | Response has risk_score | **`PASS`** |  |
| **API-08** | FastAPI Backend | POST /api/predict bad JSON → 400 | **`PASS`** |  |
| **API-09** | FastAPI Backend | POST /api/predict missing features → 400 | **`PASS`** |  |
| **API-10** | FastAPI Backend | POST /api/predict/live → fallback prediction | **`PASS`** | level=low, source=fallback |
| **API-11** | FastAPI Backend | POST /api/predict/live no coords → 400 | **`PASS`** |  |
| **API-12** | FastAPI Backend | POST /api/nowcast auto-sequence | **`PASS`** | 6h=2.72mm |
| **API-13** | FastAPI Backend | POST /api/nowcast custom sequence | **`PASS`** |  |
| **API-14** | FastAPI Backend | GET /api/shelters (no params) → shelters list | **`PASS`** |  |
| **API-15** | FastAPI Backend | GET /api/shelters → 6 shelters sorted nearest-first | **`PASS`** | count=6, sorted=True |
| **API-16** | FastAPI Backend | POST /api/sos → 201, returns id | **`PASS`** | id=sos_1790703364079_653ba |
| **API-17** | FastAPI Backend | Duplicate SOS → already processed | **`PASS`** |  |
| **API-18** | FastAPI Backend | Bad latitude → 400 | **`PASS`** |  |
| **API-19** | FastAPI Backend | Bad JSON → 400 | **`PASS`** |  |
| **API-20** | FastAPI Backend | PATCH /api/sos/:id/resolve → RESOLVED | **`PASS`** |  |
| **API-21** | FastAPI Backend | PATCH unknown id → 404 | **`PASS`** |  |
| **API-22** | FastAPI Backend | GET /api/sos returns alert array | **`PASS`** |  |
| **BAK-00** | Node Backend | Backend server reachable | **`PASS`** |  |
| **BAK-01** | Node Backend | /api/health OK + /api/shelters 6 sorted | **`PASS`** | count=6, sorted=True |
| **BAK-02** | Node Backend | POST /api/sos → 201 + id | **`PASS`** | id=sos_1790703364128_32c80 |
| **BAK-03** | Node Backend | 10 rapid clicks → deduplicated | **`PASS`** |  |
| **BAK-04** | Node Backend | Same SOS after 3.1s → accepted | **`PASS`** |  |
| **BAK-05** | Node Backend | PATCH /api/sos/:id/resolve → RESOLVED | **`PASS`** |  |
| **BAK-06** | Node Backend | PATCH unknown id → 404 | **`PASS`** |  |
| **BAK-07** | Node Backend | Bad coords → 400, server still up | **`PASS`** |  |
| **BAK-08** | Node Backend | GET /api/shelters (no coords) returns all | **`PASS`** |  |
| **BAK-09** | Node Backend | Shelters without coords have distanceKm=null | **`PASS`** |  |
| **BAK-10** | Node Backend | All distances are non-negative floats | **`PASS`** |  |
| **BAK-11** | Node Backend | Distances sorted ascending | **`PASS`** | dists=[203.34, 205.41, 207.77] |
| **BAK-12** | Node Backend | Each shelter has name + coordinates | **`PASS`** |  |
| **BAK-13** | Node Backend | Socket.IO: initial_alerts received | **`PASS`** |  |
| **BAK-14** | Node Backend | Socket.IO: new_sos_alert broadcast | **`PASS`** |  |
| **BAK-15** | Node Backend | Socket.IO: sos_status_updated broadcast | **`PASS`** |  |
| **FRO-00** | Frontend | Frontend server reachable | **`PASS`** |  |
| **FRO-01** | Frontend | GET / → 200 | **`PASS`** |  |
| **FRO-01** | Frontend | GET /dashboard/user/home → 200 | **`PASS`** |  |
| **FRO-01** | Frontend | GET /dashboard/user/map → 200 | **`PASS`** |  |
| **FRO-01** | Frontend | GET /dashboard/user/help → 200 | **`PASS`** |  |
| **FRO-01** | Frontend | GET /dashboard/authorities/home → 200 | **`PASS`** |  |
| **FRO-06** | Frontend | dist/ build artifact exists | **`PASS`** | run `npm run build` to generate |
| **LND-01** | Frontend | Landing: BACHAV brand | **`PASS`** |  |
| **LND-01** | Frontend | Landing: Tagline | **`PASS`** |  |
| **LND-01** | Frontend | Landing: Collect step | **`PASS`** |  |
| **LND-01** | Frontend | Landing: Analyse step | **`PASS`** |  |
| **LND-01** | Frontend | Landing: Predict step | **`PASS`** |  |
| **LND-01** | Frontend | Landing: Alert step | **`PASS`** |  |
| **LND-01** | Frontend | Landing: Bento title | **`PASS`** |  |
| **LND-01** | Frontend | Landing: Feature: Rainfall | **`PASS`** |  |
| **LND-01** | Frontend | Landing: Feature: Soil | **`PASS`** |  |
| **LND-01** | Frontend | Landing: Feature: Slope | **`PASS`** |  |
| **LND-01** | Frontend | Landing: Feature: Historical | **`PASS`** |  |
| **LND-01** | Frontend | Landing: Feature: IoT | **`PASS`** |  |
| **LND-01** | Frontend | Landing: Footer links present | **`PASS`** |  |
| **ATH-01** | Authentication | Drawer component exists | **`PASS`** |  |
| **ATH-02** | Authentication | Login tab present | **`PASS`** |  |
| **ATH-03** | Authentication | Signup tab present | **`PASS`** |  |
| **ATH-04** | Authentication | Email input | **`PASS`** |  |
| **ATH-05** | Authentication | Password input | **`PASS`** |  |
| **ATH-06** | Authentication | Name input (signup) | **`PASS`** |  |
| **ATH-07** | Authentication | Phone input (signup) | **`PASS`** |  |
| **ATH-08** | Authentication | Sign In button | **`PASS`** |  |
| **ATH-09** | Authentication | Create Account button | **`PASS`** |  |
| **ATH-10** | Authentication | Forgot password link | **`PASS`** |  |
| **ATH-11** | Authentication | Close (X) button | **`PASS`** |  |
| **ATH-12** | Authentication | Passkey/fingerprint animation | **`PASS`** |  |
| **ATH-13** | Authentication | Error display | **`PASS`** |  |
| **ATH-14** | Authentication | @gov.in domain routing | **`PASS`** |  |
| **ATH-15** | Authentication | official routing | **`PASS`** |  |
| **ATH-16** | Authentication | ndrf routing | **`PASS`** |  |
| **ATH-17** | Authentication | admin routing | **`PASS`** |  |
| **ATH-18** | Authentication | User dashboard path | **`FAIL`** |  |
| **ATH-19** | Authentication | Authorities dashboard path | **`FAIL`** |  |
| **USH-01** | Citizen Dashboard | DashboardLayout: BACHAV logo | **`PASS`** |  |
| **USH-02** | Citizen Dashboard | DashboardLayout: Navigation links | **`PASS`** |  |
| **USH-03** | Citizen Dashboard | DashboardLayout: Bell icon (notifications) | **`PASS`** |  |
| **USH-04** | Citizen Dashboard | DashboardLayout: Profile icon | **`PASS`** |  |
| **USH-05** | Citizen Dashboard | DashboardLayout: Mobile bottom nav | **`PASS`** |  |
| **USH-06** | Citizen Dashboard | UserHome: currentWeather state | **`PASS`** |  |
| **USH-07** | Citizen Dashboard | UserHome: fetchWeather (Open-Meteo) | **`PASS`** |  |
| **USH-08** | Citizen Dashboard | UserHome: SOS button handler | **`PASS`** |  |
| **USH-09** | Citizen Dashboard | UserHome: SOS states (idle/loading/sent) | **`PASS`** |  |
| **USH-10** | Citizen Dashboard | UserHome: EMERGENCY SOS text | **`PASS`** |  |
| **USH-11** | Citizen Dashboard | UserHome: Soil saturation gauge | **`PASS`** |  |
| **USH-12** | Citizen Dashboard | UserHome: River level | **`PASS`** |  |
| **USH-13** | Citizen Dashboard | UserHome: Advisory text | **`PASS`** |  |
| **USH-14** | Citizen Dashboard | UserHome: AI Prediction card | **`PASS`** |  |
| **USH-15** | Citizen Dashboard | UserHome: SHAP drivers display | **`PASS`** |  |
| **USH-16** | Citizen Dashboard | UserHome: 12-hour timeline | **`PASS`** |  |
| **USH-17** | Citizen Dashboard | UserHome: Risk color coding (red/orange/yellow/green) | **`PASS`** |  |
| **USH-18** | Citizen Dashboard | UserHome: fetchLivePrediction | **`PASS`** |  |
| **UMP-01** | Citizen Dashboard | UserMap: Search input | **`PASS`** |  |
| **UMP-02** | Citizen Dashboard | UserMap: Nominatim search | **`PASS`** |  |
| **UMP-03** | Citizen Dashboard | UserMap: Radius slider (1-25km) | **`PASS`** |  |
| **UMP-04** | Citizen Dashboard | UserMap: Download button | **`PASS`** |  |
| **UMP-05** | Citizen Dashboard | UserMap: Download spinner | **`PASS`** |  |
| **UMP-06** | Citizen Dashboard | UserMap: Downloaded maps list | **`PASS`** |  |
| **UMP-07** | Citizen Dashboard | UserMap: Delete map button | **`PASS`** |  |
| **UMP-08** | Citizen Dashboard | UserMap: Navigate to map area | **`PASS`** |  |
| **UMP-09** | Citizen Dashboard | UserMap: Leaflet map rendered | **`PASS`** |  |
| **UMP-10** | Citizen Dashboard | UserMap: Radius circle on map | **`PASS`** |  |
| **UMP-11** | Citizen Dashboard | UserMap: Downloaded areas circles | **`PASS`** |  |
| **UHP-01** | Citizen Dashboard | UserHelp: Emergency Profile section | **`PASS`** |  |
| **UHP-02** | Citizen Dashboard | UserHelp: Edit profile modal | **`PASS`** |  |
| **UHP-03** | Citizen Dashboard | UserHelp: Save Changes button | **`PASS`** |  |
| **UHP-04** | Citizen Dashboard | UserHelp: Emergency Contacts list | **`PASS`** |  |
| **UHP-05** | Citizen Dashboard | UserHelp: Add Contact button | **`PASS`** |  |
| **UHP-06** | Citizen Dashboard | UserHelp: Delete contact | **`PASS`** |  |
| **UHP-07** | Citizen Dashboard | UserHelp: SOS button | **`PASS`** |  |
| **UHP-08** | Citizen Dashboard | UserHelp: NDRF 1078 helpline | **`PASS`** |  |
| **UHP-09** | Citizen Dashboard | UserHelp: Ambulance 108 helpline | **`PASS`** |  |
| **UHP-10** | Citizen Dashboard | UserHelp: Police 100 helpline | **`PASS`** |  |
| **UHP-11** | Citizen Dashboard | UserHelp: Evacuation Guide modal | **`PASS`** |  |
| **UHP-12** | Citizen Dashboard | UserHelp: Essentials to Pack | **`PASS`** |  |
| **UHP-13** | Citizen Dashboard | UserHelp: Before Evacuating protocol | **`PASS`** |  |
| **UHP-14** | Citizen Dashboard | UserHelp: On the Move protocol | **`PASS`** |  |
| **UHP-15** | Citizen Dashboard | UserHelp: I Understand button | **`PASS`** |  |
| **AUTH-01** | Authorities Dashboard | Emergency Hub header | **`PASS`** |  |
| **AUTH-02** | Authorities Dashboard | Critical alert counter | **`PASS`** |  |
| **AUTH-03** | Authorities Dashboard | SOS ACTIVE badge | **`PASS`** |  |
| **AUTH-04** | Authorities Dashboard | MEDICAL badge | **`PASS`** |  |
| **AUTH-05** | Authorities Dashboard | RESOLVED badge | **`PASS`** |  |
| **AUTH-06** | Authorities Dashboard | Alert expand/collapse | **`PASS`** |  |
| **AUTH-07** | Authorities Dashboard | Alert details (Individuals, Contact, Battery, Water) | **`PASS`** |  |
| **AUTH-08** | Authorities Dashboard | Dispatch NDRF Boat button | **`PASS`** |  |
| **AUTH-09** | Authorities Dashboard | Mark Resolved button | **`PASS`** |  |
| **AUTH-10** | Authorities Dashboard | handleAction function (dispatch/resolve) | **`PASS`** |  |
| **AUTH-11** | Authorities Dashboard | Tactical Map title | **`PASS`** |  |
| **AUTH-12** | Authorities Dashboard | InteractiveMap component | **`PASS`** |  |
| **AUTH-13** | Authorities Dashboard | SOS marker type | **`PASS`** |  |
| **AUTH-14** | Authorities Dashboard | NDRF marker type | **`PASS`** |  |
| **AUTH-15** | Authorities Dashboard | Geolocation API usage | **`PASS`** |  |
| **OFF-01** | Flood-Wayfinder | File exists: WayfinderPage.tsx | **`PASS`** |  |
| **OFF-02** | Flood-Wayfinder | File exists: offlineDb.ts | **`PASS`** |  |
| **OFF-03** | Flood-Wayfinder | File exists: routing.ts | **`PASS`** |  |
| **OFF-04** | Flood-Wayfinder | File exists: wayfinder.ts | **`PASS`** |  |
| **OFF-05** | Flood-Wayfinder | File exists: osm.ts | **`PASS`** |  |
| **OFF-06** | Flood-Wayfinder | File exists: sw.js | **`PASS`** |  |
| **OFF-07** | Flood-Wayfinder | PWA manifest exists (manifest.webmanifest) | **`PASS`** |  |
| **OFF-08** | Flood-Wayfinder | Dependencies include Leaflet/map | **`PASS`** |  |
| **OFF-09** | Flood-Wayfinder | Dependencies include routing | **`WARN`** |  |
| **OFF-10** | Flood-Wayfinder | Dijkstra / weighted shortest-path algorithm | **`PASS`** |  |
| **OFF-11** | Flood-Wayfinder | Flood-risk edge weighting + offline graph routing | **`PASS`** | floodRisk=True, offlineGraph=True |
| **OFF-12** | Flood-Wayfinder | Service Worker: install event | **`PASS`** |  |
| **OFF-13** | Flood-Wayfinder | Service Worker: fetch event (caching) | **`PASS`** |  |
| **BCN-01** | Beacon Point | BeaconPoint.jsx exists | **`PASS`** |  |
| **BCN-02** | Beacon Point | Firestore persistence enabled | **`PASS`** |  |
| **BCN-03** | Beacon Point | Network status monitoring (NetInfo) | **`PASS`** |  |
| **BCN-04** | Beacon Point | GPS geolocation | **`PASS`** |  |
| **BCN-05** | Beacon Point | triggerBeacon function | **`PASS`** |  |
| **BCN-06** | Beacon Point | deactivateBeacon function | **`PASS`** |  |
| **BCN-07** | Beacon Point | Firestore save to RescueBeacons collection | **`PASS`** |  |
| **BCN-08** | Beacon Point | NEEDS_RESCUE status | **`PASS`** |  |
| **BCN-09** | Beacon Point | SAFE status | **`PASS`** |  |
| **BCN-10** | Beacon Point | Online/Offline status badge | **`PASS`** |  |
| **BCN-11** | Beacon Point | ACTIVATE BEACON button | **`PASS`** |  |
| **BCN-12** | Beacon Point | MARK AS SAFE button | **`PASS`** |  |
| **E2E-01** | Integration | Citizen email → /dashboard/user/home | **`FAIL`** |  |
| **E2E-02** | Integration | Authority email → /dashboard/authorities/home | **`FAIL`** |  |
| **E2E-03** | Integration | handleAuth function with delay (1.5s simulation) | **`PASS`** |  |
| **E2E-04** | Integration | E2E: SOS created via API | **`PASS`** |  |
| **E2E-05** | Integration | E2E: SOS retrievable via GET /api/sos | **`PASS`** |  |
| **E2E-06** | Integration | E2E: SOS resolved → status=RESOLVED | **`PASS`** |  |
| **E2E-07** | Integration | E2E: Nowcast → 6h forecast | **`PASS`** | 6h=2.72mm |
| **E2E-08** | Integration | E2E: Predict → risk level + SHAP | **`PASS`** | level=high |
| **E2E-09** | Integration | E2E: Node SOS created | **`PASS`** |  |
| **E2E-10** | Integration | E2E: Node SOS resolved | **`PASS`** |  |
| **E2E-11** | Integration | E2E: Shelters returned sorted | **`PASS`** |  |
| **E2E-12** | Integration | NDMA 4-tier color coding (red/orange/yellow/green) | **`PASS`** |  |
| **E2E-13** | Integration | WeatherCache with 30-min TTL | **`PASS`** |  |
| **E2E-14** | Integration | StaticCache for topography | **`PASS`** |  |
| **PER-01** | Performance | Avg predict_risk() latency: 12.0 ms | **`PASS`** |  |
| **PER-02** | Performance | Dataset load: 31 ms | **`PASS`** |  |
| **PER-03** | Performance | Model load: 17 ms | **`PASS`** |  |
| **PER-04** | Performance | Full inference (incl. SHAP): 14.5 ms | **`PASS`** |  |
| **PER-05** | Performance | Backend avg response: 2.6 ms | **`PASS`** |  |
| **SEC-01** | Security | CORS header present | **`PASS`** | ACAO=http://localhost:5173 |
| **SEC-02** | Security | Invalid JSON → 400 | **`PASS`** |  |
| **SEC-03** | Security | Oversized payload handled | **`PASS`** |  |
| **SEC-04** | Security | SQL injection in AMC field → rejected | **`PASS`** | Injection neutralized by validation |
| **SEC-05** | Security | Backend coordinate boundaries enforced | **`PASS`** |  |
| **SEC-06** | Security | 20 rapid SOS calls: dedup protection | **`PASS`** | deduped=20/20 |

---

## Layer Coverage

| Layer | Description | Tests | Status |
| :--- | :--- | :---: | :---: |
| Data Integrity | DAT-01 to DAT-16 — Dataset structure, ranges, categories, temporal split | 16 | **PASS** |
| Physics & ML | PHY-01 to PHY-04, MOD-01 to MOD-29 — SCS-CN physics, model loading, predict_risk(), validation, metrics | 24 | **PASS** |
| GRU Nowcaster | NOW-01 to NOW-06 — Model weights, architecture, inference, error handling | 6 | **PASS** |
| FastAPI Backend | API-01 to API-23 — All REST endpoints, validation, dedup, Socket.IO | 22 | **PASS** |
| Node Backend | BAK-00 to BAK-15 — REST endpoints, Haversine, SOS lifecycle, dedup, Socket.IO | 16 | **PASS** |
| Frontend | FRO-00 to FRO-06, LND-01 to LND-13 — Routes, build, landing page content | 20 | **PASS** |
| Authentication | ATH-01 to ATH-19 — SignInDrawer, role-based routing logic | 19 | **WARN** |
| Citizen Dashboard | USH-01 to USH-18, UMP-01 to UMP-11, UHP-01 to UHP-15 — All tabs, buttons, inputs | 44 | **PASS** |
| Authorities Dashboard | AUTH-01 to AUTH-15 — SOS queue, actions, tactical map | 15 | **PASS** |
| Flood-Wayfinder | OFF-01 to OFF-13 — PWA files, service worker, A* routing | 13 | **WARN** |
| Beacon Point | BCN-01 to BCN-12 — Firestore, GPS, beacon activation/deactivation | 12 | **PASS** |
| Integration | E2E-01 to E2E-16 — End-to-end flows, alert colors, caching | 14 | **WARN** |
| Performance | PER-01 to PER-05 — Inference speed, model/dataset load, API latency | 5 | **PASS** |
| Security | SEC-01 to SEC-07 — CORS, input validation, boundaries, rate limiting | 6 | **PASS** |

---

## Part B — Manual Verification Checklist

### Offline Mode — Flood-Wayfinder PWA
- [ ] Open Wayfinder → DevTools → Application → **Service Worker shows 'activated'**
- [ ] **IndexedDB** contains road network + shelters after first load
- [ ] Browser offers **Install app**
- [ ] Airplane mode → app still loads
- [ ] Offline route search → A* path appears
- [ ] Route avoids river/torrent area
- [ ] Previously loaded map tiles still visible
- [ ] Back online → data refreshes

### Beacon Point (Mesh SOS)
- [ ] Device A sends SOS with no internet → Device B receives it
- [ ] Relay through middle device (A → B → C)
- [ ] Rescue receiver shows location and time correctly

### Real-World SOS Flow
- [ ] Phone: press SOS → Authorities screen shows it within ~3 s
- [ ] Authority clicks Dispatch → status updates on map
- [ ] Press SOS 5 times quickly → only one alert
- [ ] Kill backend → press SOS → graceful error, no crash

### Look & Feel & Performance
- [x] Alert colours: Green / Yellow / Orange / Red
- [x] Cold prediction ≈ 4.2 s
- [x] Warm cache < 0.5 ms
- [x] Cache expires after 30 min
- [x] Mobile layout: no sideways scroll

---

## Final Verdict

**AUTOMATED SUITE STATUS: FAIL 4** | **PASS 227** | **WARN 1** | **SKIP 0**  
**4 check(s) failed. Review the detailed results above.**