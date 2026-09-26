# SIH Flash-Flood Risk Assessment System

A high-performance, multi-source data ingestion, feature engineering, and flash-flood risk assessment system optimized for steep mountainous catchments in Himachal Pradesh.

---

## 1. Project Architecture

```
                                  USER REQUEST
                       (latitude, longitude, timestamp)
                                      │
                                      ▼
                        LIVE INGESTION PIPELINE
                     (data_ingestion/assembler.py)
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
  Open-Meteo API             OpenTopoData 30m DEM          OSM Overpass API
 (Precip, Soil Moist)        (Elev, Slope, Aspect)        (Waterway Distance)
        │                             │                             │
        └─────────────────────────────┼─────────────────────────────┘
                                      ▼
                         CACHING LAYER (cache.py)
                   (30-min WeatherCache + StaticCache)
                                      │
                                      ▼
                        EXACT 12-FEATURE PAYLOAD
                 (120h AMC excluding target hour)
                                      │
                                      ▼
                         PAYLOAD VALIDATOR SUITE
                       (validators.py / pipeline)
                                      │
                                      ▼
                     MODEL PREDICTOR INTERFACE (predict.py)
                       (Risk Level, Score, Rationale)
```

---

## 2. Data Sources

1. **Open-Meteo Weather API & ERA5 Historical Archive**: Reanalysis hourly precipitation and volumetric soil moisture (0–7 cm).
2. **OpenTopoData Copernicus 30m DEM**: Terrain surface elevation, 3x3 Horn gradient slope in degrees, aspect (0–360°).
3. **OpenStreetMap Overpass API**: Geodesic distance to nearest stream/waterway line geometry.
4. **NASA Global Landslide Catalog (GLC) & EONET v3**: Historical disaster event geometries for 10 km buffer incident density.
5. **HPSDMA & CWC**: Official Himachal Pradesh State Disaster Management Authority & Central Water Commission disaster logs and river gauge telemetry.

---

## 3. Production 12-Feature Contract

The live ingestion payload and model feature contract MUST contain EXACTLY these 12 features:

1. `rainfall_1h_mm`: 1-hour precipitation depth in mm
2. `rainfall_3h_mm`: 3-hour precipitation accumulation in mm
3. `rainfall_6h_mm`: 6-hour precipitation accumulation in mm
4. `rainfall_24h_mm`: 24-hour precipitation accumulation in mm
5. `soil_saturation_index`: Normalized soil moisture `(theta - 0.08) / (0.48 - 0.08)` clipped `[0, 1]`
6. `slope_degrees`: Terrain slope derived from 3x3 Horn DEM gradient (degrees)
7. `elevation_m`: Terrain elevation above sea level in meters
8. `aspect`: Terrain slope aspect in degrees (0–360°)
9. `historical_incident_density`: Historical incidents per 314.16 km² (10 km radius buffer)
10. `land_cover_class`: Categorical land cover enum (`forest`, `agriculture`, `urban`, `barren`)
11. `distance_to_nearest_stream_m`: Geodesic distance to nearest OSM waterway line in meters
12. `antecedent_moisture_condition`: AMC classification (`dry`, `normal`, `wet`) derived from exactly 120 preceding hourly observations (excluding target hour)

---

## 4. Live Ingestion & Caching Layer

The live ingestion pipeline (`data_ingestion/assembler.py`, `data_ingestion/live.py`) queries external APIs in parallel and utilizes a 2-tier caching system:
- **WeatherCache**: 30-minute time-to-live (TTL) memory cache for weather and antecedent moisture telemetry.
- **StaticCache**: Persistent JSON cache for static DEM terrain attributes (slope, elevation, aspect) and stream distances.

### Performance Benchmarks
- **Cold Request Latency**: ~4.2 seconds (initial API fetch & static DEM grid calculation)
- **Warm Request Latency**: ~0.4 ms (Mandi), ~0.5 ms (Manali) (sub-millisecond execution via cache hit)

---

## 5. Historical Data Import & Readiness Pipeline

1. **Formal Data Request**: Institutional data request package prepared in [`docs/data_request/HPSDMA_CWC_DATA_REQUEST.md`](file:///c:/MyPROJECT/ML%20Database/docs/data_request/HPSDMA_CWC_DATA_REQUEST.md).
2. **Generic Data Importer**: [`training/import_official_historical.py`](file:///c:/MyPROJECT/ML%20Database/training/import_official_historical.py) parses raw CSV/JSON files in `data/raw/` into normalized records under `data/processed/official_events_normalized.csv` while preserving source traceability (`source`, `source_record_id`).
3. **Explicit Target Mapping**: [`training/target_mapping.py`](file:///c:/MyPROJECT/ML%20Database/training/target_mapping.py) enforces registered label mapping and raises `TargetMappingNotApproved` on unapproved label conversions.
4. **Ground-Truth Audit**: `training/build_himachal_dataset.py` audits target availability and halts dataset generation if target mapping is unapproved.

---

## 6. Target-Label & Data Integrity Policies

- **Zero Synthetic Data**: No fake rows, duplicate records, or random coordinates are generated to pad row counts.
- **Zero Synthetic Labels**: Risk labels are **NEVER** generated using rainfall thresholds, slope rules, or demonstrator predictor outputs (`predict.py`).
- **Immutable Raw Data**: Files in `data/raw/` are preserved untouched. Original incoming CSVs are never overwritten.
- **Explicit Blocker Status**: If machine-readable target labels are unavailable, historical ML training remains `BLOCKED` rather than generating fake production training CSVs in `data/final/`.

---

## 7. Temporal Leakage Prevention

- **AMC Target Hour Exclusion**: Antecedent Moisture Condition (AMC) window uses `precipitation[target_idx - 120 : target_idx]`, strictly excluding the target observation hour `target_idx`.
- **Incident Density Exclusion**: The target incident itself is explicitly excluded from the 10 km buffer count.
- **Chronological Train/Test Partition**: Dataset is partitioned into Training (2020–2023) and Testing (2024). No random time-series shuffling is permitted.

---

## 8. Training & Evaluation Protocol

- **Chronological Temporal Holdout**: Training on 2020–2023, Testing on 2024.
- **Preprocessing**: `ColumnTransformer` with `StandardScaler` for numeric features and `OneHotEncoder` for categorical features (`land_cover_class`, `antecedent_moisture_condition`).
- **Multiclass Metrics**: Accuracy, Macro F1, Weighted F1, Per-Class Precision/Recall/F1 (`low`, `medium`, `high`, `critical`), Multiclass Confusion Matrix.
- **Status**: Supervised ML Training is currently **BLOCKED** waiting for official ground-truth data receipt.

---

## 9. Prediction Interface & Integration

`predict.py` provides the standard interface `predict_risk(features: dict) -> dict`:

```python
from predict import predict_risk

payload = {
    "rainfall_1h_mm": 12.5,
    "rainfall_3h_mm": 35.0,
    "rainfall_6h_mm": 65.0,
    "rainfall_24h_mm": 120.0,
    "soil_saturation_index": 0.85,
    "slope_degrees": 28.5,
    "elevation_m": 2050.0,
    "aspect": 145.0,
    "historical_incident_density": 0.12,
    "land_cover_class": "forest",
    "distance_to_nearest_stream_m": 120.0,
    "antecedent_moisture_condition": "wet"
}

prediction = predict_risk(payload)
# returns {"risk_level": "high", "risk_score": 0.785, "explanation": {...}}
```

---

## 10. Testing & Reproducibility

Run the complete automated unit test suite:

```bash
python -m unittest discover tests -v
```

**Test Baseline**: 39 tests passed, 0 failed, 0 errors.

---

## 11. Project Limitations

1. **Absence of Machine-Readable Ground Truth**: Public weather REST APIs supply physical telemetry, not risk labels. State disaster reports from HPSDMA are published as district-level PDF summaries.
2. **Restricted CWC Gauge Telemetry**: Historical high-frequency river stage records require formal institutional authorization.

---

## 12. Reproduction Guide

1. Clone repository and run baseline unit tests (`python -m unittest discover tests -v`).
2. Run live feature assembly:
   ```python
   from data_ingestion.assembler import assemble_features_from_coords
   payload = assemble_features_from_coords(31.7087, 76.9320)  # Mandi watchpoint
   ```
3. Place official acquired incident CSV in `data/raw/hpsdma/` or `data/raw/cwc/` and execute import:
   ```bash
   python -m training.import_official_historical
   ```
4. Audit target mapping in `training/target_mapping_audit.py` and register approved rules in `training/target_mapping.py`.
5. Build validated dataset and execute training via `training/build_himachal_dataset.py`.
