# Manual Data Acquisition Plan

## Source

Himachal Pradesh State Disaster Management Authority (HPSDMA) / Central Water Commission (CWC) Hydrological Data Directorate.

## Official URL

- **HPSDMA Portal**: https://hpsdma.hp.gov.in/
- **CWC / India-WRIS Portal**: https://indiawris.gov.in/

## Required Dataset

- **Primary**: Digitized State Disaster Incident Database / Geo-referenced Flash Flood & Landslide Incident Register (2020–2024).
- **Secondary**: High-Frequency River Gauge Telemetry and Danger-Level Exceedance Time-Series CSV Export for Himachal Catchments.

## Required Years

2020, 2021, 2022, 2023, 2024 (Focused on monsoon active storm seasons: June 15 – September 30).

## Required Geographic Coverage

11 Target Study Watchpoints in Himachal Pradesh:
- **Beas Basin**: Manali, Kullu, Mandi, Pandoh
- **Parvati Valley**: Kasol, Manikaran
- **Sutlej Basin**: Rampur, Shimla Ridge
- **Kangra / Ravi Basins**: Dharamshala, Palampur, Chamba

## Required Fields

1. `timestamp` (ISO-8601 or `YYYY-MM-DD HH:MM:SS`)
2. `latitude` (WGS84 decimal degrees)
3. `longitude` (WGS84 decimal degrees)
4. `hazard_type` (`flash_flood`, `landslide`, `cloudburst`, `river_overflow`)
5. `official_severity_class` or `risk_level` (`low`, `medium`, `high`, `critical`)
6. `casualty_count` / `damage_assessment_notes`

## Download Instructions

1. **HPSDMA Manual Request / Portal Download**:
   - Access the HPSDMA official web portal (https://hpsdma.hp.gov.in/).
   - Navigate to **Reports & Publications** > **State Disaster Incident Register**.
   - If digitized tabular datasets (CSV / Excel / GeoJSON) are unavailable on the public portal, submit a formal institutional data request / Right to Information (RTI) application to the **State Executive Committee / Disaster Management Department, Government of Himachal Pradesh, Shimla**.
   - Request raw digitized GIS shapefiles or tabular incident CSV files containing point lat/lon coordinates and severity classifications for 2020–2024.

2. **CWC Telemetry Data Access Request**:
   - Access the India-WRIS portal (https://indiawris.gov.in/).
   - Register an institutional user account and navigate to **Hydrological Data Request**.
   - Select river gauge stations for Himachal Pradesh (Beas, Sutlej, Ravi basins).
   - Download historical hourly river stage (meters) and discharge (cumecs) CSV files for 2020–2024.

## File Naming Convention

Save raw acquired files into `data/raw/` using exact standardized naming:
- `data/raw/hpsdma_incidents_2020_2024_raw.csv`
- `data/raw/cwc_gauge_telemetry_2020_2024_raw.csv`

## Raw Data Location

`data/raw/`

## Validation Procedure

1. Inspect column schema and parse timestamps using `training/ingest_historical.py`.
2. Run data integrity validation using `training/validate_dataset.py`:
   ```bash
   python -m training.validate_dataset data/raw/hpsdma_incidents_2020_2024_raw.csv
   ```
3. Ensure no missing lat/lon, valid ISO timestamps, and authoritative severity mapping.

## Import Procedure

1. Run normalization script to parse raw incident points into `data/processed/himachal_incidents_clean.csv`.
2. Reconstruct 12-feature historical telemetry (using Open-Meteo ERA5 archive, OpenTopoData Copernicus DEM, and OSM Overpass API) via `training/ingest_historical.py`.
3. Generate validated dataset using `training/build_himachal_dataset.py` to produce `data/final/himachal_training_data.csv`.

## Expected Limitations

- Historical disaster logs may exhibit spatial clustering along major state highways (e.g., NH-21 Beas Valley corridor) while steep un-populated headwater tributaries may have fewer logged non-event observations.
- Manual data acquisition dependent on government department response timelines.
