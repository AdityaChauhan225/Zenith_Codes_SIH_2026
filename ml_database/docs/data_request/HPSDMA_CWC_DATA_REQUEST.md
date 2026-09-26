# Formal Data Acquisition Request: Himachal Pradesh Historical Disaster & Hydrological Telemetry (2020–2024)

**To**:
1. Himachal Pradesh State Disaster Management Authority (HPSDMA), Shimla
2. Department of Revenue (Disaster Management Cell), Government of Himachal Pradesh
3. Central Water Commission (CWC), Hydrological Data Directorate, Ministry of Jal Shakti
4. National Water Informatics Centre (NWIC) / India-WRIS

**Date**: September 23, 2026  
**Subject**: Formal Data Access Request for Machine-Readable Historical Disaster Incident Logs and Hydrological Telemetry for Flash-Flood Risk Modeling in Himachal Pradesh (2020–2024)

---

## 1. Executive Summary & Purpose

The SIH Flash-Flood Risk Modeling Project is developing high-resolution, multi-source risk assessment and early-warning tools tailored to steep mountainous catchments in Himachal Pradesh. 

To train and validate objective supervised machine learning models, the project requires authoritative, digitized, machine-readable historical disaster incident records and hydrological gauge telemetry covering the 5-year monsoon storm seasons (2020 through 2024).

---

## 2. Requested Target Geography & Watchpoints

The primary study catchments and priority watchpoints include:

- **Beas River Basin**: Manali (`32.2396° N, 77.1887° E`), Kullu (`31.9579° N, 77.1095° E`), Mandi (`31.7087° N, 76.9320° E`), Pandoh (`31.6700° N, 77.0300° E`)
- **Parvati Valley**: Kasol (`32.0100° N, 77.3150° E`), Manikaran (`32.0270° N, 77.3470° E`)
- **Sutlej River Basin**: Rampur (`31.4500° N, 77.6300° E`), Shimla Ridge (`31.1048° N, 77.1734° E`)
- **Kangra / Ravi Basins**: Dharamshala (`32.2190° N, 76.3230° E`), Palampur (`32.1109° N, 76.5363° E`), Chamba (`32.5534° N, 76.1258° E`)

---

## 3. Requested HPSDMA Disaster Incident Dataset Specification

We request digitized, point-level or village-level disaster incident registers containing the following parameters:

1. `source_record_id`: Official incident or log entry identifier
2. `event_type`: Specific hazard type (`flash_flood`, `landslide`, `cloudburst`, `river_breach`, `mudslide`)
3. `event_date`: Calendar date of event occurrence (`YYYY-MM-DD`)
4. `event_timestamp`: Time of event occurrence (`HH:MM:SS` in IST / UTC)
5. `latitude` & `longitude`: Geo-referenced point coordinates (WGS84 decimal degrees)
6. `district`, `tehsil`, `village_name`: Administrative locational identifiers
7. `official_warning_level` / `severity_classification`: Official state or district hazard severity classification
8. `casualty_count`: Number of human fatalities or injuries
9. `affected_population`: Estimated population directly impacted
10. `infrastructure_damage`: Summary of destroyed/damaged structures, roads, or bridges
11. `monetary_loss_inr`: Estimated financial damage (INR)

**Preferred Formats**: CSV, Excel (`.xlsx`), JSON, GeoJSON, Shapefile, or Spatial Database Export (`.gpkg`). If records currently exist as unstructured PDF documents, we request access to the underlying raw tabular or GIS database files used to generate those reports.

---

## 4. Requested CWC River Gauge & Telemetry Dataset Specification

We request historical gauge telemetry for CWC river monitoring stations across the Beas, Sutlej, Ravi, and Yamuna river basins in Himachal Pradesh for 2020–2024:

1. `station_id` & `station_name`: Official CWC station code and name
2. `river_name` & `basin_name`: Monitored watercourse and basin
3. `latitude` & `longitude`: Station point coordinates
4. `timestamp`: Observation date and time (Preferred resolution: **Hourly**)
5. `water_level_m`: Observed water stage (meters above mean sea level or gauge zero point)
6. `discharge_cumecs`: Observed river discharge rate ($m^3/s$)
7. `warning_level_m`: Official station Warning Level threshold
8. `danger_level_m`: Official station Danger Level threshold
9. `highest_flood_level_m` (HFL): Recorded station historical peak level

---

## 5. Inquiry Regarding Official Classification Definitions

To ensure scientific integrity and eliminate arbitrary label mapping, we respectfully request explicit documentation regarding the official classification schemas used by HPSDMA and CWC:

- *What official risk, warning, severity, danger-level, or event classification system is associated with the supplied observations?*
- *What are the precise technical thresholds, criteria, or definitions corresponding to each official classification tier (e.g., CWC `Normal`, `Above Normal`, `Severe`, `Extreme` or HPSDMA alert levels)?*

The project will preserve the source's original classification verbatim without altering or inventing mapping rules.

---

## 6. Data Usage & Confidentiality Commitments

- **Non-Commercial Research Use**: All supplied data will be used exclusively for non-commercial disaster risk reduction research and early-warning model development.
- **Data Preservation**: Raw source files will be stored in immutable directory storage (`data/raw/`) with strict source attribution (`source_record_id`).
- **Data Integrity**: No data fabrication, synthetic label generation, or unauthorized sharing will take place.
