# CWC Raw Data Directory

Place original, unmodified CWC (Central Water Commission / India-WRIS) river gauge telemetry and flood appraisal files here (e.g. `cwc_gauge_telemetry_2020_2024_raw.csv`).

## Policy Rules
- **NEVER** modify or overwrite original source files placed in this directory.
- **NEVER** invent missing gauge levels or inject synthetic telemetry into raw files.
- Processed, normalized files will be written to `data/processed/` by `training/import_official_historical.py`.
