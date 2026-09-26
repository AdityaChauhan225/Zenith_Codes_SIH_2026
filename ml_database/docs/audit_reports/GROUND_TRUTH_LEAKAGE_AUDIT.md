# Ground Truth Leakage Audit

## Feature-by-Feature Audit

All 12 live features have been audited to guarantee that no future telemetry, post-event disaster reports, or target label artifacts contaminate feature values at historical observation timestamps.

| Feature | Leakage Risk | Reason | Status |
|---|---|---|---|
| `rainfall_1h_mm` | Low | Uses strictly past 1-hour accumulated precipitation (`t-1` to `t`) from Open-Meteo ERA5 archive. | **PASS** |
| `rainfall_3h_mm` | Low | Uses strictly past 3-hour accumulated precipitation (`t-3` to `t`) from Open-Meteo ERA5 archive. | **PASS** |
| `rainfall_6h_mm` | Low | Uses strictly past 6-hour accumulated precipitation (`t-6` to `t`) from Open-Meteo ERA5 archive. | **PASS** |
| `rainfall_24h_mm` | Low | Uses strictly past 24-hour accumulated precipitation (`t-24` to `t`) from Open-Meteo ERA5 archive. | **PASS** |
| `soil_saturation_index` | Low | Uses volumetric soil water layer 0–7cm at observation timestamp `t`. No future soil moisture used. | **PASS** |
| `slope_degrees` | None | Static terrain property derived from Copernicus 30m DEM 3x3 Horn gradient. | **PASS** |
| `elevation_m` | None | Static terrain property derived from Copernicus 30m DEM surface elevation. | **PASS** |
| `aspect` | None | Static terrain property derived from Copernicus 30m DEM Horn aspect (0–360°). | **PASS** |
| `distance_to_nearest_stream_m` | None | Static hydrological distance derived from OpenStreetMap waterway geometries. | **PASS** |
| `historical_incident_density` | Low | Calculated over 10 km radius buffer using past historical incidents prior to timestamp `t`. Target event itself is explicitly excluded to prevent direct target leakage. | **PASS** |
| `land_cover_class` | Low | Uses static spatial land cover classification mapped to categorical enums (`forest`, `agriculture`, `urban`, `barren`). Does not use post-event damage boundaries. | **PASS** |
| `antecedent_moisture_condition` | Low | Uses exactly 120 preceding hourly observations (`t-120` to `t-1`). The target observation hour `t` is strictly excluded (`precipitation[target_idx - 120 : target_idx]`). | **PASS** |

---

## Temporal Split Audit

To ensure realistic ML model evaluation and prevent temporal leakage across training and test datasets:

- **Training Period**: 2020–2023 (Monsoon storm seasons June 15 – September 30)
- **Testing Period**: 2024 (Monsoon storm season June 15 – September 30)
- **Split Rule**: Strict chronological cutoff at `2024-01-01 00:00:00`. No random shuffling or cross-validation sampling across the 2023/2024 temporal boundary is permitted.

---

## Conclusion

**PASS**

The feature assembly design and validation suite (`training/validate_dataset.py`) enforce zero temporal leakage across all 12 input features and strictly enforce chronological train/test partitioning.
