# Historical Data Source Matrix

| Source | Organization | Format | 2020–2024 | Coordinates | Event Date | Hazard Type | Severity | Machine Readable | Accessible |
|---|---|---|---|---|---|---|---|---|---|
| **HPSDMA Incident Logs** | HP State Disaster Management Authority | PDF / Web Reports | Yes | District Level (Non-point) | Event Date (Day) | Flash Flood / Landslide / Cloudburst | Financial Loss / Fatalities | No (PDF summaries) | Public Web |
| **CWC Hydro-Telemetry & Flood Appraisals** | Central Water Commission (India-WRIS) | Web / PDF | Yes | River Gauge Points | Hourly / Daily | Riverine Flood Exceedance | Danger Level Exceedance | Partial (Restricted API) | Restricted / Web |
| **NASA Global Landslide Catalog (GLC/COOLR)** | NASA GSFC / COOLR | CSV / GeoJSON | Partial (Sparse 2020–2024) | Point (lat/lon) | Event Date | Landslide / Mudslide | Fatalities / Impact Note | Yes | Open API / CSV |
| **NASA EONET API v3** | NASA Earth Observatory | REST API (JSON) | Yes (2020–2024) | Point / Geometry | Event Timestamp | Landslide / Flood | Impact Description | Yes | Open API |
| **IMD Mausam & Climatological Reports** | India Meteorological Department | PDF / Grid CSV | Yes | Station / Grid (0.25°) | Daily / Hourly | Extreme Rainfall | Rainfall Depth (mm) | Yes (Grid Data) | Open / Portal |
| **Geological Survey of India (GSI) Landslide Inventory** | Geological Survey of India | Web GIS / PDF | Yes | Point / Region | Event Period | Landslide / Slope Failure | Susceptibility Class | No (Web Portal) | Web Portal |
| **National Disaster Management Authority (NDMA)** | NDMA India | PDF Reports | Yes | District Level | Event Date | Multi-Hazard | Loss Severity | No | Public Web |
| **Open-Meteo Historical Weather Archive API** | Open-Meteo / ERA5 Reanalysis | JSON REST API | Yes (1940–2024) | Point (lat/lon) | Hourly Timestamp | Precipitation & Soil Moisture | N/A (Meteorological Telemetry) | Yes | Open API |

---

## Detailed Source Audits

### 1. HP State Disaster Management Authority (HPSDMA) Incident Logs
- **Official URL**: https://hpsdma.hp.gov.in/
- **Organization**: Department of Revenue (Disaster Management), Government of Himachal Pradesh
- **Data format**: PDF Memorandums of Loss and Damage, Post-Disaster Needs Assessments (PDNA 2023), Annual Monsoon Reports
- **Geographic coverage**: Himachal Pradesh State (12 Districts: Kullu, Mandi, Shimla, Kangra, Chamba, Lahaul-Spiti, Kinnaur, Solan, Sirmaur, Hamirpur, Una, Bilaspur)
- **Temporal coverage**: 2020–2024
- **Event type**: Flash floods, landslides, cloudbursts, river breaches
- **Coordinates**: District center / Tehsil level boundaries (Lacks precise point lat/lon coordinates)
- **Severity**: Financial loss (INR Crores), fatalities, house damage count
- **Warning level**: District alert levels issued during monsoon
- **API**: None
- **Download**: Manual PDF download from web portal
- **Access restrictions**: Public web access for PDF reports
- **Ground-truth usefulness**: Low for direct automated ML training. Reports provide historical event dates and district-level impact, but lack machine-readable hourly multi-class risk labels (`low`, `medium`, `high`, `critical`) at specific lat/lon watchpoints.
- **Limitations**: PDF document format requiring manual extraction; non-point spatial resolution.

### 2. Central Water Commission (CWC) & India-WRIS
- **Official URL**: https://cwc.gov.in/ / https://indiawris.gov.in/
- **Organization**: Ministry of Jal Shakti, Government of India
- **Data format**: Hydrological telemetry dashboards, Flood Appraisal PDFs, gauge station logs
- **Geographic coverage**: Major Himachal river basins (Beas, Sutlej, Ravi, Yamuna)
- **Temporal coverage**: 2020–2024
- **Event type**: Riverine flooding, high water discharge, danger-mark exceedance
- **Coordinates**: Gauge station coordinates (e.g. Mandi, Pandoh, Rampur, Kullu)
- **Severity**: Gauge water level relative to Warning Level / Danger Level
- **Warning level**: Official CWC 4-stage flood warning (Normal, Above Normal, Severe, Extreme)
- **API**: Restricted REST API / Web dashboard
- **Download**: Restricted download; historical hourly time-series requires formal institutional application
- **Access restrictions**: Institutional / Restricted access for bulk raw time-series
- **Ground-truth usefulness**: Moderate for main stem rivers, but inadequate for ungauged steep mountain tributaries and multi-class slope risk labels across all 11 study catchments.
- **Limitations**: Covers major river channels only; restricted historical API.

### 3. NASA Global Landslide Catalog (GLC) / COOLR
- **Official URL**: https://data.nasa.gov / https://landslides.nasa.gov
- **Organization**: NASA Goddard Space Flight Center
- **Data format**: CSV, GeoJSON
- **Geographic coverage**: Global (Includes Indian Himalayan Region)
- **Temporal coverage**: 2007–present (Sparse coverage for HP in 2020–2024)
- **Event type**: Rainfall-triggered landslides and mudslides
- **Coordinates**: Latitude, Longitude (WGS84 point coordinates)
- **Severity**: Fatalities, injuries, qualitative landslide size
- **Warning level**: None
- **API**: Open Data Portal REST API / CSV Download
- **Download**: Direct CSV download available
- **Access restrictions**: Open public access
- **Ground-truth usefulness**: Useful for positive event occurrences, but lacks dense, hourly non-event baseline samples (`low`, `medium`) across target catchments.
- **Limitations**: Skewed towards high-impact events reported in news media; sparse coverage for minor flash floods.

### 4. NASA Earth Observatory Natural Hazards (EONET API v3)
- **Official URL**: https://eonet.gsfc.nasa.gov/api/v3/events
- **Organization**: NASA Earth Science Data and Information System (ESDIS)
- **Data format**: JSON REST API
- **Geographic coverage**: Global point geometries
- **Temporal coverage**: 2020–2024
- **Event type**: Severe storms, floods, landslides
- **Coordinates**: Point latitude/longitude
- **Severity**: Qualitative event category
- **Warning level**: None
- **API**: Public REST API (`https://eonet.gsfc.nasa.gov/api/v3/events`)
- **Download**: Automated JSON API response
- **Access restrictions**: Open public access
- **Ground-truth usefulness**: Provides verified hazard event timestamps, but does not provide multi-class risk level classifications (`low`, `medium`, `high`, `critical`).
- **Limitations**: High-level regional disaster events only.

### 5. India Meteorological Department (IMD) Mausam Portal
- **Official URL**: https://mausam.imd.gov.in/ / https://dsp.imd.gov.in/
- **Organization**: Ministry of Earth Sciences, Government of India
- **Data format**: Daily/hourly gridded rainfall CSV/NetCDF, PDF bulletins
- **Geographic coverage**: India gridded dataset (0.25° x 0.25°) and weather stations
- **Temporal coverage**: 2020–2024
- **Event type**: Extreme precipitation, heavy rainfall events
- **Coordinates**: Grid points / station coordinates
- **Severity**: Rainfall depth (mm/day, mm/hr)
- **Warning level**: IMD Weather Warnings (Green, Yellow, Orange, Red)
- **API**: Web portal download
- **Download**: Downloadable gridded files via registration
- **Access restrictions**: Public / Academic registration
- **Ground-truth usefulness**: Provides meteorological hazard inputs and official heavy rainfall warning levels, but rainfall warnings alone cannot be substituted for actual ground-truth flood risk labels per project policy.
- **Limitations**: Coarse grid resolution (0.25°) relative to mountain catchments.

### 6. Geological Survey of India (GSI) National Landslide Susceptibility Repository
- **Official URL**: https://bhukosh.gsi.gov.in/
- **Organization**: Geological Survey of India, Ministry of Mines
- **Data format**: Web GIS layers, susceptibility maps, PDF reports
- **Geographic coverage**: Himachal Pradesh mountainous districts
- **Temporal coverage**: Static susceptibility & historical event inventory
- **Event type**: Slope failure, landslide occurrences
- **Coordinates**: Point / Polygon spatial geometries
- **Severity**: Landslide Susceptibility Index (Low, Moderate, High, Very High)
- **Warning level**: Static susceptibility classification
- **API**: Web GIS viewer / Bhukosh Portal
- **Download**: Restricted GIS download
- **Access restrictions**: Web viewer open; vector downloads restricted
- **Ground-truth usefulness**: Useful for static terrain susceptibility validation, but does not provide dynamic hourly multi-class risk labels for 2020–2024.
- **Limitations**: Static spatial susceptibility rather than dynamic hourly risk.

### 7. National Disaster Management Authority (NDMA)
- **Official URL**: https://ndma.gov.in/
- **Organization**: Government of India
- **Data format**: Annual reports, multi-hazard guidelines, PDF bulletins
- **Geographic coverage**: National / State level
- **Temporal coverage**: 2020–2024
- **Event type**: Multi-hazard disasters (Floods, Landslides, Cloudbursts)
- **Coordinates**: State / District level summaries
- **Severity**: Aggregated loss and impact figures
- **Warning level**: State disaster severity levels
- **API**: None
- **Download**: Manual PDF download
- **Access restrictions**: Open web access
- **Ground-truth usefulness**: High-level policy and post-disaster appraisal context only.
- **Limitations**: Aggregated macro reports, no machine-readable hourly dataset feeds.

### 8. Open-Meteo Historical Weather Archive API
- **Official URL**: https://archive-api.open-meteo.com/v1/archive
- **Organization**: Open-Meteo / Copernicus ERA5 Reanalysis
- **Data format**: JSON REST API
- **Geographic coverage**: Global (~9km ERA5 reanalysis grid)
- **Temporal coverage**: 1940–2024 (Complete coverage for study period)
- **Event type**: Meteorological telemetry (Precipitation, Volumetric Soil Moisture 0–7cm, Relative Humidity, Surface Pressure)
- **Coordinates**: Arbitrary target point (lat, lon)
- **Severity**: N/A (Continuous physical telemetry)
- **Warning level**: None
- **API**: Free public REST API (`https://archive-api.open-meteo.com/v1/archive`)
- **Download**: Automated JSON REST requests
- **Access restrictions**: Open public access
- **Ground-truth usefulness**: Excellent for reconstructing historical weather inputs (`rainfall_1h_mm`, `rainfall_3h_mm`, `rainfall_6h_mm`, `rainfall_24h_mm`, `soil_saturation_index`, `antecedent_moisture_condition`), but contains **ZERO** ground-truth risk target labels.
- **Limitations**: Purely physical meteorological reanalysis.
