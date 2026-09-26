# Dataset Readiness Report

## 1. Status

**READY FOR OFFICIAL DATA** (Historical ML Training: **BLOCKED — WAITING FOR OFFICIAL GROUND TRUTH**)

---

## 2. Sources Investigated

1. **Himachal Pradesh State Disaster Management Authority (HPSDMA)**: Official state disaster memorandums, PDNA reports, and annual monsoon loss activity logs.
2. **Central Water Commission (CWC) & India-WRIS**: National flood forecasting, river level gauge appraisal reports, and reservoir monitoring dashboards.
3. **National Disaster Management Authority (NDMA)**: National disaster guidelines and multi-hazard damage assessments.
4. **Geological Survey of India (GSI)**: National Landslide Susceptibility Repository / Bhukosh GIS portal.
5. **India Meteorological Department (IMD)**: Mausam portal gridded daily/hourly precipitation and extreme rainfall warning bulletins.
6. **NASA Global Landslide Catalog (GLC / COOLR)**: Cooperative Open Online Landslide Repository point dataset.
7. **NASA Earth Observatory Natural Hazards (EONET API v3)**: REST API for real-time and historical natural disaster event geometries.
8. **Open-Meteo Historical Weather Archive API**: ECMWF ERA5 reanalysis hourly meteorological telemetry (1940–2024).

---

## 3. Raw Data

- [`data/raw/hpsdma/`](file:///c:/MyPROJECT/ML%20Database/data/raw/hpsdma/): Directory for raw HPSDMA CSV/JSON incoming files.
- [`data/raw/cwc/`](file:///c:/MyPROJECT/ML%20Database/data/raw/cwc/): Directory for raw CWC gauge telemetry incoming files.
- [`data/raw/imd/`](file:///c:/MyPROJECT/ML%20Database/data/raw/imd/): Directory for raw IMD rainfall data.
- [`data/raw/other_authoritative/`](file:///c:/MyPROJECT/ML%20Database/data/raw/other_authoritative/): Directory for other official agency datasets.
- [`data/raw/nasa_eonet_events_raw.json`](file:///c:/MyPROJECT/ML%20Database/data/raw/nasa_eonet_events_raw.json): Raw disaster event query payload.
- [`data/raw/nasa_glc_catalog_meta.json`](file:///c:/MyPROJECT/ML%20Database/data/raw/nasa_glc_catalog_meta.json): NASA Global Landslide Catalog schema metadata.

---

## 4. Processed Data

- [`data/processed/official_events_normalized.csv`](file:///c:/MyPROJECT/ML%20Database/data/processed/official_events_normalized.csv): Normalized official event records with preserved source traceability (`source`, `source_record_id`).
- [`data/processed/himachal_incidents_clean.csv`](file:///c:/MyPROJECT/ML%20Database/data/processed/himachal_incidents_clean.csv): Normalized incident record structure.
- [`data/processed/deduplication_report.md`](file:///c:/MyPROJECT/ML%20Database/data/processed/deduplication_report.md): Deduplication audit report.

---

## 5. Geographic Coverage

Target Himachal Pradesh mountainous study catchments:
- **Beas Basin**: Manali, Kullu, Mandi, Pandoh
- **Parvati Valley**: Kasol, Manikaran
- **Sutlej Basin**: Rampur, Shimla ridge
- **Kangra / Ravi**: Dharamshala, Palampur, Chamba

---

## 6. Temporal Coverage

- **Target Period**: 2020–2024 (Primary focus: June 15 – September 30 monsoon season).

---

## 7. Event Count & Import Pipeline

- **Authentic Ground-Truth Labeled Events**: 0 machine-readable hourly multi-class event points currently in public open APIs.
- **Import Infrastructure**: Generic importer [`training/import_official_historical.py`](file:///c:/MyPROJECT/ML%20Database/training/import_official_historical.py) ready for incoming official CSV/JSON files.
- **Target Mapping Infrastructure**: [`training/target_mapping.py`](file:///c:/MyPROJECT/ML%20Database/training/target_mapping.py) enforces explicit registered mappings and raises `TargetMappingNotApproved` until formal engineering sign-off is granted.

---

## 8. Feature Availability

| Feature | Available | Method | Source | Missing % |
|:---|:---|:---|:---|:---|
| `rainfall_1h_mm` | Yes | 1h Accumulation | Open-Meteo Archive API / ERA5 | 0% |
| `rainfall_3h_mm` | Yes | 3h Accumulation | Open-Meteo Archive API / ERA5 | 0% |
| `rainfall_6h_mm` | Yes | 6h Accumulation | Open-Meteo Archive API / ERA5 | 0% |
| `rainfall_24h_mm` | Yes | 24h Accumulation | Open-Meteo Archive API / ERA5 | 0% |
| `soil_saturation_index` | Yes | `(theta - 0.08) / (0.48 - 0.08)` clipped | Open-Meteo Archive `soil_moisture_0_to_7cm` | 0% |
| `slope_degrees` | Yes | 3x3 Horn Gradient | OpenTopoData Copernicus 30m DEM | 0% |
| `elevation_m` | Yes | Center Grid Sampling | OpenTopoData Copernicus 30m DEM | 0% |
| `aspect` | Yes | Horn Aspect (0–360°) | OpenTopoData Copernicus 30m DEM | 0% |
| `distance_to_nearest_stream_m` | Yes | Waterway Geodesic Min Distance | OSM Overpass API | 0% |
| `historical_incident_density` | Yes | `events / (pi * 10^2)` | NASA GLC / Event Buffer | 0% |
| `land_cover_class` | Yes | Point Spatial Classification | OpenStreetMap Nominatim | 0% |
| `antecedent_moisture_condition` | Yes | Exactly 120h Preceding Sum (Excluding target hour) | Open-Meteo Archive API | 0% |

---

## 9. Target Label Availability

**UNAVAILABLE**

- **Audit Finding**: None of the publicly accessible open REST APIs provide geo-referenced hourly target risk classifications (`low`, `medium`, `high`, `critical`) for Himachal Pradesh watchpoints during 2020–2024.
- **Core Policy Enforcement**: No synthetic risk labels were generated using rainfall thresholds, slope rules, or heuristic predictor outputs (`predict.py`).

---

## 10. Class Distribution

- **Low**: 0
- **Medium**: 0
- **High**: 0
- **Critical**: 0
- **Total Valid Rows Generated**: 0 (Target file `data/final/himachal_training_data.csv` was **NOT** created to prevent inserting unvalidated synthetic training data).

---

## 11. Leakage Audit

**PASS**

- Features use strictly historical inputs available at or before the observation timestamp.
- AMC window uses `precipitation[target_idx - 120 : target_idx]` (target hour `target_idx` excluded).
- Temporal train/test split rules strictly isolate 2020–2023 for training and 2024 for testing.

---

## 12. Validation Results

**PASS**

- Unit test suite [`tests/test_import_and_mapping.py`](file:///c:/MyPROJECT/ML%20Database/tests/test_import_and_mapping.py) (39 tests total) verified against 13-column schema, numeric ranges, enum classes, strict ascending chronological order, source traceability, and target mapping approval checks.

---

## 13. Train/Test Split Specification

- **Training Set**: 2020–2023 observations
- **Testing Set**: 2024 observations
- **Split Type**: Chronological temporal split (No random shuffling).

---

## 14. Limitations

1. **Lack of Digitized HPSDMA Incident CSV**: State disaster reports are published as unstructured annual PDF summaries.
2. **Restricted CWC Gauge Telemetry**: High-frequency historical river stage records require formal institutional access.
3. **Absence of Ground-Truth Multi-Class Labels**: Public weather APIs supply physical telemetry, not risk labels.

---

## 15. Exact Blocker

Absence of digitized, machine-readable historical ground-truth target risk labels (`low`, `medium`, `high`, `critical`) for Himachal Pradesh watchpoints (2020–2024).

---

## 16. Next Action

Submit the formal data request package in [`docs/data_request/HPSDMA_CWC_DATA_REQUEST.md`](file:///c:/MyPROJECT/ML%20Database/docs/data_request/HPSDMA_CWC_DATA_REQUEST.md) to HPSDMA or CWC, and place acquired raw files into `data/raw/hpsdma/` or `data/raw/cwc/` for immediate automated ingestion via `python -m training.import_official_historical`.
