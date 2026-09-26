# Historical Dataset & ML Pipeline Readiness Documentation

This directory contains the data import, target mapping, dataset validation, and historical dataset building pipeline for the Himachal Pradesh Flash-Flood Risk ML Project.

---

## Current Status

**BLOCKED — WAITING FOR OFFICIAL GROUND TRUTH**

No synthetic historical observations or artificial rainfall-threshold risk labels have been generated. The dataset builder strictly halts until official digitized disaster incident logs or hydrological gauge telemetry are imported and mapped.

---

## Pipeline Architecture

```
  Official Source File (HPSDMA / CWC / IMD)
                     ↓
  data/raw/<source_name>/<filename>.csv
                     ↓
  training/import_official_historical.py
                     ↓
  data/processed/official_events_normalized.csv
                     ↓
  training/target_mapping.py (Explicit approved mapping)
                     ↓
  Historical Feature Reconstruction (Open-Meteo ERA5, OpenTopoData DEM, OSM Overpass)
                     ↓
  training/validate_dataset.py (13-column schema, temporal order, leakage check)
                     ↓
  training/build_himachal_dataset.py
                     ↓
  data/final/himachal_training_data.csv (Generated ONLY when ground truth is verified)
```

---

## Module Overview

1. [`import_official_historical.py`](file:///c:/MyPROJECT/ML%20Database/training/import_official_historical.py): Generic importer for official raw CSV/JSON files. Normalizes columns to standard schema (`source`, `source_record_id`, `event_date`, `latitude`, `longitude`, `severity_original`, etc.) while preserving strict source traceability. Exits cleanly with `SKIPPED` status if no official data file is present.
2. [`target_mapping.py`](file:///c:/MyPROJECT/ML%20Database/training/target_mapping.py): Target mapping module enforcing explicit registered conversion rules. Raises `TargetMappingNotConfigured` or `TargetMappingNotApproved` if unapproved mappings are attempted.
3. [`target_mapping_audit.py`](file:///c:/MyPROJECT/ML%20Database/training/target_mapping_audit.py): Audits proposed mapping rules between official source categories and project risk classes (`low`, `medium`, `high`, `critical`). Current status: `NOT APPROVED`.
4. [`validate_dataset.py`](file:///c:/MyPROJECT/ML%20Database/training/validate_dataset.py): Validates training dataset rows against schema constraints, 120h AMC target-hour exclusion, monotonic rainfall accumulation, bounding box rules, and temporal train/test split.
5. [`build_himachal_dataset.py`](file:///c:/MyPROJECT/ML%20Database/training/build_himachal_dataset.py): Dataset builder entry point. Audits ground truth availability first and halts dataset generation if official ground truth is unverified.

---

## Policy Enforcement Rules

- **No Synthetic Labels**: Never generate risk labels using rainfall/slope threshold rules or demonstrator outputs (`predict.py`).
- **No Data Fabrication**: Never invent fake rows or duplicate observations to reach target counts (5,000–15,000).
- **Source Traceability**: Every imported observation must retain its original `source` and `source_record_id`.
- **Target Hour Exclusion**: Antecedent Moisture Condition (AMC) strictly excludes the target observation hour (`precipitation[target_idx - 120 : target_idx]`).
- **Temporal Train/Test Split**: Training set is strictly restricted to 2020–2023 observations; 2024 observations are reserved exclusively for testing.
