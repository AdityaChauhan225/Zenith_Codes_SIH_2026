"""
Phase 1: Meteorological Feature Ingestion & Feature Engineering.
Fetches telemetry from Open-Meteo API and calculates rainfall accumulations, AMC, and soil saturation index.
"""

import json
import urllib.request
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Tuple

def fetch_open_meteo_weather(lat: float, lon: float, past_days: int = 7) -> Dict[str, Any]:
    """
    Fetches hourly weather data from Open-Meteo API for given lat/lon.
    Includes precipitation and soil_moisture_0_to_7cm for past_days + 1 forecast day.
    """
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}&"
        f"hourly=precipitation,relative_humidity_2m,surface_pressure,soil_moisture_0_to_7cm&"
        f"past_days={past_days}&forecast_days=1&timezone=Asia%2FKolkata"
    )
    attempts = 2
    last_err = None

    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "FlashFloodIngestionPipeline/1.0"})
            with urllib.request.urlopen(req, timeout=12) as response:
                if response.status != 200:
                    raise RuntimeError(f"Open-Meteo API returned status code {response.status}")
                payload = json.loads(response.read().decode("utf-8"))
                if "hourly" not in payload or "time" not in payload["hourly"]:
                    raise ValueError("Malformed Open-Meteo API response: missing 'hourly.time'")
                return payload
        except Exception as err:
            last_err = err

    raise RuntimeError(f"Open-Meteo API request failed for ({lat}, {lon}): {last_err}") from last_err

def find_target_hour_index(hourly_times: list, target_dt: datetime) -> int:
    """
    Finds the index of the hourly timestamp closest to target_dt (without exceeding target_dt if possible).
    Open-Meteo time strings are in ISO format like '2026-09-23T00:00'.
    """
    if not hourly_times:
        raise ValueError("hourly_times list is empty")

    target_cmp = target_dt.replace(tzinfo=None) if target_dt.tzinfo else target_dt

    parsed_times = []
    for t_str in hourly_times:
        try:
            dt = datetime.fromisoformat(t_str)
            dt_naive = dt.replace(tzinfo=None) if dt.tzinfo else dt
            parsed_times.append(dt_naive)
        except ValueError:
            parsed_times.append(target_cmp)

    best_idx = 0
    min_diff = abs((parsed_times[0] - target_cmp).total_seconds())

    for idx, dt in enumerate(parsed_times):
        diff = abs((dt - target_cmp).total_seconds())
        if diff < min_diff:
            min_diff = diff
            best_idx = idx

    return best_idx

def compute_rainfall_accumulations(precip_series: list, target_idx: int) -> Tuple[float, float, float, float]:
    """
    Calculates 1h, 3h, 6h, 24h rainfall preceding target_idx (inclusive of target hour or preceding).
    """
    def safe_sum(slice_list):
        total = 0.0
        for val in slice_list:
            if val is not None and isinstance(val, (int, float)) and val >= 0:
                total += val
        return max(0.0, total)

    # 1h: preceding 1 hour slice
    r1 = safe_sum(precip_series[max(0, target_idx):target_idx + 1])
    r3 = safe_sum(precip_series[max(0, target_idx - 2):target_idx + 1])
    r6 = safe_sum(precip_series[max(0, target_idx - 5):target_idx + 1])
    r24 = safe_sum(precip_series[max(0, target_idx - 23):target_idx + 1])

    return (
        round(float(r1), 2),
        round(float(r3), 2),
        round(float(r6), 2),
        round(float(r24), 2)
    )

def compute_amc(past_5_days_rain_mm: float, month: int) -> str:
    """
    Classifies Antecedent Moisture Condition (AMC) using standard SCS-CN criteria.
    June-October is considered growing/monsoon season.
    """
    is_monsoon = 6 <= month <= 10

    if is_monsoon:
        if past_5_days_rain_mm < 35.0:
            return "dry"
        elif past_5_days_rain_mm <= 53.0:
            return "normal"
        else:
            return "wet"
    else:
        if past_5_days_rain_mm < 12.5:
            return "dry"
        elif past_5_days_rain_mm <= 27.5:
            return "normal"
        else:
            return "wet"

def compute_soil_saturation(volumetric_moisture: float) -> float:
    """
    Normalizes volumetric soil moisture (theta_dry=0.08, theta_sat=0.48) into a 0.0 - 1.0 index.
    """
    if volumetric_moisture is None:
        raise ValueError("Soil moisture data is missing or None from Open-Meteo telemetry")

    theta_dry = 0.08
    theta_sat = 0.48

    norm = (volumetric_moisture - theta_dry) / (theta_sat - theta_dry)
    clipped = max(0.0, min(1.0, norm))
    return round(float(clipped), 4)

def extract_weather_features(weather_data: Dict[str, Any], target_dt: datetime) -> Dict[str, Any]:
    """
    Extracts rainfall_1h, 3h, 6h, 24h, AMC, and soil saturation index from Open-Meteo weather_data.
    """
    hourly = weather_data.get("hourly", {})
    times = hourly.get("time", [])
    precip_series = hourly.get("precipitation", [])
    soil_series = hourly.get("soil_moisture_0_to_7cm", [])

    if not times or not precip_series:
        raise ValueError("Weather telemetry contains empty hourly precipitation series")

    target_idx = find_target_hour_index(times, target_dt)

    r1, r3, r6, r24 = compute_rainfall_accumulations(precip_series, target_idx)

    # 5-day prior rain sum (EXACTLY 120 preceding full hourly observations, excluding target_idx)
    if target_idx < 120:
        raise ValueError(f"Insufficient preceding hourly weather telemetry for AMC: available indices before target {target_idx}, required 120")

    slice_120 = precip_series[target_idx - 120 : target_idx]
    if len(slice_120) < 120:
        raise ValueError(f"Insufficient preceding hourly weather observations for AMC: expected 120, got {len(slice_120)}")

    slice_5d = [p for p in slice_120 if p is not None and isinstance(p, (int, float)) and p >= 0]
    p5_rain = sum(slice_5d)

    amc = compute_amc(p5_rain, target_dt.month)

    soil_val = soil_series[target_idx] if target_idx < len(soil_series) else None
    soil_saturation = compute_soil_saturation(soil_val)

    return {
        "rainfall_1h_mm": r1,
        "rainfall_3h_mm": r3,
        "rainfall_6h_mm": r6,
        "rainfall_24h_mm": r24,
        "soil_saturation_index": soil_saturation,
        "antecedent_moisture_condition": amc
    }
