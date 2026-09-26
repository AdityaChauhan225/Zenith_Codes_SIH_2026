# Official Data Receipt Checklist

Execute this checklist immediately whenever new official historical data files (HPSDMA, CWC, IMD, GSI) are received from state or central agencies.

---

## 1. File Ingestion & Immutability Verification

- [ ] **Original File Preserved**: Raw incoming file is stored untouched in `data/raw/<agency_name>/` (e.g. `data/raw/hpsdma/hpsdma_2020_2024_raw.csv`).
- [ ] **File Hash Recorded**: SHA-256 checksum recorded for raw file verification.
- [ ] **Source Agency Identified**: Official source agency and department logged.
- [ ] **Data Format Verified**: File format confirmed as CSV, JSON, GeoJSON, or Excel.

---

## 2. Spatial & Temporal Coverage Audit

- [ ] **Geographic Coverage**: Coordinates fall within target Himachal Pradesh bounding box (`28.0° N to 35.0° N`, `74.0° E to 80.0° E`).
- [ ] **Point Precision**: Latitude/longitude decimal degrees verified (WGS84).
- [ ] **Date Range Verified**: Event dates cover the target 2020–2024 period.
- [ ] **Timestamp Format**: Timestamps parsed successfully into standard ISO-8601 (`YYYY-MM-DDTHH:MM:SS`).

---

## 3. Data Integrity & Schema Audit

- [ ] **Source Traceability**: Unique `source_record_id` retained for every observation.
- [ ] **Event Classifiers**: Hazard event categories (`flash_flood`, `landslide`, `cloudburst`) identified.
- [ ] **Severity/Warning Fields**: Original severity text (`severity_original`, `warning_level_original`) preserved verbatim.
- [ ] **Missing Value Audit**: Proportion of missing entries recorded; missing fields left explicitly empty (no silent zero-filling).
- [ ] **Duplicate Record Check**: Checked for exact duplicate rows or identical `(source_record_id, timestamp, lat, lon)` entries.

---

## 4. Target Mapping & Leakage Audit

- [ ] **Target Mapping Audit**: Original source classification reviewed in `training/target_mapping_audit.py`.
- [ ] **Explicit Mapping Configured**: Target class mapping explicitly registered in `training/target_mapping.py` with formal project approval.
- [ ] **Target Leakage Check**: Confirmed that post-event damage information or future telemetry does not contaminate input features.
- [ ] **Chronological Train/Test Partition**: Dataset isolated into Train (2020–2023) and Test (2024).

---

## Sign-off

- **Audit Result**: PASS / FAIL
- **Auditor Signature**: ___________________________
- **Date**: ___________________________
