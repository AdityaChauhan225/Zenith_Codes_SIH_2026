# Ground Truth Decision

## 1. Existing Target

`low` / `medium` / `high` / `critical`

## 2. Origin of Requirement

The requirement for a four-class risk classification target originates from the external SIH project functional specification for flash-flood risk assessment. 

An inspection of the existing project codebase reveals a slight interface divergence in the demonstrator predictor stub (`predict.py`), which uses the four categories `["low", "moderate", "high", "critical"]` (substituting `moderate` for `medium`). However, the dataset validation module (`training/validate_dataset.py`) strictly enforces the standard four-class schema: `["low", "medium", "high", "critical"]`.

Neither classification exists as an automated output of open physical weather REST APIs (e.g., Open-Meteo, OpenTopoData, OSM Overpass), which return physical environmental measurements rather than risk classifications.

## 3. Authoritative Sources Investigated

1. **Himachal Pradesh State Disaster Management Authority (HPSDMA)** — Department of Revenue, HP Government
2. **Central Water Commission (CWC) & India-WRIS** — Ministry of Jal Shakti, Government of India
3. **National Disaster Management Authority (NDMA)** — Government of India
4. **Geological Survey of India (GSI)** — Ministry of Mines (National Landslide Susceptibility Repository / Bhukosh)
5. **India Meteorological Department (IMD)** — Ministry of Earth Sciences (Mausam Portal)
6. **NASA Global Landslide Catalog (GLC / COOLR)** — NASA Goddard Space Flight Center
7. **NASA Earth Observatory Natural Hazards (EONET API v3)** — NASA ESDIS
8. **Open-Meteo Historical Weather Archive API** — ECMWF ERA5 Reanalysis

## 4. Direct Four-Class Ground Truth

**Not Available**

**Detailed Rationale**:
None of the publicly accessible open databases or REST APIs provide machine-readable, hourly four-class risk labels (`low`, `medium`, `high`, `critical`) for the 11 specified Himachal Pradesh study catchments for the 2020–2024 historical period. 

HPSDMA publishes post-disaster loss assessments aggregated as annual district-level PDF summaries (e.g., total fatalities, financial damage in INR Crores) rather than fine-grained hourly point coordinates labeled with risk tiers. 

Per the critical project ground-truth policy, synthetic risk labels must **NEVER** be created using arbitrary rainfall/slope thresholds, heuristic formulas, or demonstrator model outputs (`predict.py`). Therefore, direct four-class ground truth is currently unavailable.

## 5. Other Official Classifications

Investigated authoritative sources employ alternative official classification systems:

- **CWC River Flood Warning Stages**:
  - `Normal` (Below warning level)
  - `Above Normal` (Approaching warning level)
  - `Severe` (Exceeding warning level)
  - `Extreme` (Exceeding danger mark / highest flood level)
- **IMD Weather Warnings**:
  - `Green` (No warning)
  - `Yellow` (Watch / Be updated)
  - `Orange` (Alert / Be prepared)
  - `Red` (Warning / Take action)
- **GSI Landslide Susceptibility Index**:
  - `Low`
  - `Moderate`
  - `High`
  - `Very High`

None of these official systems directly match the requested `["low", "medium", "high", "critical"]` schema at hourly point watchpoints across all 11 study catchments.

## 6. Quantitative Severity Data

Authoritative quantitative data exists in isolated repositories but lacks full spatial/temporal completeness across all study watchpoints:

- **CWC Gauge Stations**: Water stage elevation (meters) and river discharge (cumecs) at key gauge stations (e.g., Mandi, Pandoh, Rampur, Kullu).
- **IMD Weather Stations / Gridded Data**: Hourly and daily precipitation depth (mm).
- **HPSDMA Monsoon Reports**: District-level financial loss (INR Crores), human casualties, livestock loss, and damaged infrastructure counts.

## 7. Event Occurrence Data

Binary event occurrence records (hazard event vs. non-event) exist in open repositories:

- **NASA EONET v3**: Geo-referenced timestamps for major flooding and storm disasters in the Himalayan region.
- **NASA Global Landslide Catalog (GLC)**: Point coordinates (lat/lon) and timestamps for major rainfall-triggered landslides in Himachal Pradesh (e.g., Kotropi 2017, Nigulsari 2021).
- **HPSDMA Incident Dates**: Specific calendar dates of major cloudbursts and flash flood events recorded in district reports.

## 8. Geographic Coverage

Target Himachal Pradesh mountainous study catchments:
- **Beas River Basin**: Manali (`32.2396, 77.1887`), Kullu (`31.9579, 77.1095`), Mandi (`31.7087, 76.9320`), Pandoh (`31.6700, 77.0300`)
- **Parvati Valley**: Kasol (`32.0100, 77.3150`), Manikaran (`32.0270, 77.3470`)
- **Sutlej River Basin**: Rampur (`31.4500, 77.6300`), Shimla Ridge (`31.1048, 77.1734`)
- **Kangra / Ravi Basins**: Dharamshala (`32.2190, 76.3230`), Palampur (`32.1109, 76.5363`), Chamba (`32.5534, 76.1258`)

## 9. Temporal Coverage

- **Required Period**: 2020–2024
- **Primary Active Storm Season**: June 15 – September 30 (Monsoon window)

## 10. Data Volume

- **Target Observation Range**: 5,000–15,000 rows
- **Legitimate Authoritative Four-Class Observations Available**: **0**
- **Policy Compliance**: No rows were duplicated, synthesized, or artificially labeled to artificially meet the target range.

## 11. Feature Availability

| Feature | Status | Source | Notes |
|---|---|---|---|
| `rainfall_1h_mm` | Available | Open-Meteo Archive API / ERA5 | 1-hour precipitation depth |
| `rainfall_3h_mm` | Available | Open-Meteo Archive API / ERA5 | 3-hour precipitation accumulation |
| `rainfall_6h_mm` | Available | Open-Meteo Archive API / ERA5 | 6-hour precipitation accumulation |
| `rainfall_24h_mm` | Available | Open-Meteo Archive API / ERA5 | 24-hour precipitation accumulation |
| `soil_saturation_index` | Available | Open-Meteo Archive API / ERA5 | Normalized `(theta - 0.08) / (0.48 - 0.08)` clipped `[0, 1]` |
| `slope_degrees` | Available | OpenTopoData Copernicus 30m DEM | 3x3 Horn gradient on DEM grid |
| `elevation_m` | Available | OpenTopoData Copernicus 30m DEM | Surface elevation in meters above sea level |
| `aspect` | Available | OpenTopoData Copernicus 30m DEM | Terrain aspect in degrees (0–360°) |
| `distance_to_nearest_stream_m` | Available | OpenStreetMap Overpass API | Geodesic distance to nearest OSM waterway line |
| `historical_incident_density` | Available | NASA GLC / EONET Event Buffer | Events per 314.16 km² (10 km radius buffer) |
| `land_cover_class` | Available | OpenStreetMap Nominatim / WorldCover | Standardized mapping (`forest`, `agriculture`, `urban`, `barren`) |
| `antecedent_moisture_condition` | Available | Open-Meteo Archive API | Exactly 120 preceding hourly observations (excluding target hour) |

## 12. Leakage Risks

- **Target Hour Exclusion**: Antecedent Moisture Condition (AMC) strictly excludes the target observation hour (`precipitation[target_idx - 120 : target_idx]`).
- **Incident Density Windowing**: Historical incident density calculations strictly exclude the target event itself to prevent target leakage into features.
- **Chronological Split**: Training observations are strictly restricted to 2020–2023, while 2024 observations are reserved exclusively for test evaluation.

## 13. Dataset Feasibility

- **Target Range**: 5,000–15,000 legitimate observations
- **Legitimate 4-Class Observations Available**: 0
- **Feasibility Result**: Dataset construction for four-class supervised ML training cannot proceed without un-vetted synthetic label generation.

## 14. Ground-Truth Conclusion

**GROUND TRUTH BLOCKED**

Dataset generation and model training remain strictly **BLOCKED** until official digitized incident log databases (HPSDMA) or high-frequency river gauge exceedance CSV feeds (CWC) containing authoritative risk/severity classifications are manually acquired or released.
