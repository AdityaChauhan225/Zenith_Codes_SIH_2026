# Historical Data Pipeline & Reproducibility Documentation

## 1. Directory Structure

```
data/
├── HISTORICAL_DATA_SOURCE_MATRIX.md   # Comprehensive audit matrix of disaster sources
├── MANUAL_DATA_ACQUISITION_PLAN.md    # Manual data acquisition plan for HPSDMA/CWC
├── README.md                           # Pipeline documentation and reproducibility guide
├── raw/                                # Untouched raw source payloads (JSON / Meta / CSV)
│   ├── hpsdma/                         # Official HPSDMA raw disaster logs & reports
│   ├── cwc/                            # Official CWC river gauge telemetry & flood appraisals
│   ├── imd/                            # Official IMD rainfall station & gridded data
│   ├── other_authoritative/            # Other official agency raw data files
│   ├── nasa_eonet_events_raw.json      # NASA EONET raw disaster query JSON
│   └── nasa_glc_catalog_meta.json      # NASA Global Landslide Catalog metadata
├── processed/                          # Standardized and deduplicated event records
│   ├── official_events_normalized.csv  # Normalized official event records
│   ├── himachal_incidents_clean.csv    # Cleaned incident records with coordinates
│   └── deduplication_report.md         # Deduplication audit report
├── features/                           # Intermediate reconstructed feature sets
└── final/                              # Validated production CSV (Generated ONLY when READY)
```

## 2. Ingestion & Validation Workflow

1. **Source Discovery & Raw Acquisition**:
   - `python training/ingest_historical.py` fetches untouched raw payloads from official sources and saves them in `data/raw/`.
2. **Official Data Import & Normalization**:
   - `python training/import_official_historical.py` parses incoming raw CSV/JSON files in `data/raw/` into normalized format under `data/processed/official_events_normalized.csv` while preserving source traceability (`source`, `source_record_id`).
3. **Explicit Target Mapping**:
   - `training/target_mapping.py` maps official source classifications to target classes (`low`, `medium`, `high`, `critical`) only after formal engineering sign-off.
4. **Ground-Truth Audit**:
   - `python training/build_himachal_dataset.py` audits ground-truth risk label availability and target mapping sign-off status.
5. **Validation & Temporal Leakage Check**:
   - `python training/validate_dataset.py` validates schema contract (13 columns), numeric bounds, AMC 120-hour window length (excluding target hour), and enforces chronological train/test splitting (2020–2023 Train / 2024 Test).

## 3. Data Integrity & Core Rules

- **Zero Synthetic Data**: No fake rows or synthetic coordinates are generated to pad row counts.
- **Zero Synthetic Labels**: Risk labels are **NEVER** generated using rainfall thresholds, slope rules, or demonstrator predictor outputs (`predict.py`).
- **Immutable Raw Data**: Raw payloads in `data/raw/` are preserved without modification. Original incoming files in `data/raw/hpsdma/` or `data/raw/cwc/` must never be overwritten.
- **Explicit Dataset Status**: If authoritative ground-truth risk labels are unavailable, dataset status is set to `BLOCKED` or `INSUFFICIENT AUTHENTIC DATA` rather than creating fake production training CSVs in `data/final/`.
