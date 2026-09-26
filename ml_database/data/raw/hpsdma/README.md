# HPSDMA Raw Data Directory

Place original, unmodified HPSDMA (Himachal Pradesh State Disaster Management Authority) source files here (e.g. `hpsdma_incidents_2020_2024_raw.csv`).

## Policy Rules
- **NEVER** modify or overwrite original source files placed in this directory.
- **NEVER** invent missing values or inject synthetic data into raw files.
- Processed, normalized files will be written to `data/processed/` by `training/import_official_historical.py`.
