# Data Quality Report

## 1. Overall Quality Status

**GROUND TRUTH BLOCKED**

No machine-readable, multi-class target risk labels (`low`, `medium`, `high`, `critical`) exist in publicly accessible REST APIs or disaster repositories for the Himachal Pradesh study locations during 2020–2024. Per strict project policy, no synthetic or heuristic training rows were fabricated.

---

## 2. Dataset Metrics

- **Total Rows Generated**: 0
- **Valid Rows**: 0
- **Invalid / Rejected Rows**: 0
- **Missing Values**: N/A (Production training file `data/final/himachal_training_data.csv` was NOT created)
- **Exact Duplicate Records**: 0

---

## 3. Class Distribution

| Risk Class | Count | Percentage |
|---|---|---|
| `low` | 0 | 0.0% |
| `medium` | 0 | 0.0% |
| `high` | 0 | 0.0% |
| `critical` | 0 | 0.0% |
| **Total** | **0** | **0.0%** |

---

## 4. Geographic Coverage

Target Himachal Pradesh mountainous study catchments:
- **Beas River Basin**: Manali (`32.2396, 77.1887`), Kullu (`31.9579, 77.1095`), Mandi (`31.7087, 76.9320`), Pandoh (`31.6700, 77.0300`)
- **Parvati Valley**: Kasol (`32.0100, 77.3150`), Manikaran (`32.0270, 77.3470`)
- **Sutlej River Basin**: Rampur (`31.4500, 77.6300`), Shimla Ridge (`31.1048, 77.1734`)
- **Kangra / Ravi Basins**: Dharamshala (`32.2190, 76.3230`), Palampur (`32.1109, 76.5363`), Chamba (`32.5534, 76.1258`)

---

## 5. Temporal Coverage

- **Target Period**: January 1, 2020 through December 31, 2024
- **Primary Storm Windows**: June 15 – September 30 (Monsoon season)

---

## 6. Source Distribution & Audit

- **Open-Meteo ERA5 Historical Weather API**: Reconstructed physical weather telemetry (`rainfall_1h_mm`, `rainfall_3h_mm`, `rainfall_6h_mm`, `rainfall_24h_mm`, `soil_saturation_index`, `antecedent_moisture_condition`). Supply physical telemetry, **NOT** target risk labels.
- **OpenTopoData Copernicus 30m DEM**: Terrain elevation, 3x3 Horn gradient slope, aspect.
- **OpenStreetMap Overpass API**: Geodesic stream distance.
- **HPSDMA Annual Disaster Memorandums**: Published as aggregated annual district PDF loss summaries. Lacks machine-readable hourly point coordinates with multi-class risk labels.
- **CWC / India-WRIS Telemetry**: Historical gauge danger exceedance APIs require formal institutional access.

---

## 7. Rejection Rationale & Policy Enforcement

- **Policy**: Synthetic risk labels generated via rainfall thresholds, slope rules, or demonstrator outputs (`predict.py`) are strictly prohibited.
- **Enforcement**: Dataset generation halts at `build_himachal_dataset.py` until official digitized CSVs are imported and target mapping is approved.
