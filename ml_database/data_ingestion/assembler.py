"""
Phase 6: 12-Feature Pipeline Assembler.
Orchestrates end-to-end ingestion and feature engineering to produce the exact 12-feature schema.
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, Any

try:
    import zoneinfo
    KOLKATA_TZ = zoneinfo.ZoneInfo("Asia/Kolkata")
except Exception:
    KOLKATA_TZ = timezone(timedelta(hours=5, minutes=30))

from .validators import validate_coordinates_and_timestamp, validate_12_features
from .weather import fetch_open_meteo_weather, extract_weather_features
from .topography import extract_topography_features
from .hydrology import extract_hydrology_features
from .landcover import extract_land_cover_features
from .historical import extract_historical_features
from .cache import global_weather_cache, global_static_cache

from concurrent.futures import ThreadPoolExecutor

def assemble_features_from_coords(
    lat: float,
    lon: float,
    timestamp: str = None
) -> Dict[str, Any]:
    """
    Transforms raw latitude, longitude, and ISO-8601 timestamp into the exact 12-feature dictionary.
    Uses WeatherCache, StaticCache, and ThreadPoolExecutor for high-performance live ingestion.
    """
    if timestamp is None:
        dt = datetime.now(KOLKATA_TZ)
        timestamp_str = dt.isoformat()
    else:
        timestamp_str = timestamp
        dt = validate_coordinates_and_timestamp(lat, lon, timestamp_str)

    print(f"Ingesting real-time feature telemetry for coordinates ({lat}, {lon}) at timestamp {timestamp_str}...")

    # Check caches
    weather_data = global_weather_cache.get(lat, lon)
    static_data = global_static_cache.get(lat, lon)

    # Concurrently fetch any uncached external sources
    futures = {}
    with ThreadPoolExecutor(max_workers=5) as executor:
        if weather_data is None:
            futures["weather"] = executor.submit(fetch_open_meteo_weather, lat, lon)
        if static_data is None:
            futures["topo"] = executor.submit(extract_topography_features, lat, lon)
            futures["hydro"] = executor.submit(extract_hydrology_features, lat, lon)
            futures["land"] = executor.submit(extract_land_cover_features, lat, lon)
            futures["hist"] = executor.submit(extract_historical_features, lat, lon)

    if weather_data is None:
        weather_data = futures["weather"].result()
        global_weather_cache.set(lat, lon, weather_data)

    weather_feats = extract_weather_features(weather_data, dt)

    if static_data is None:
        topo_feats = futures["topo"].result()
        hydro_feats = futures["hydro"].result()
        land_feats = futures["land"].result()
        hist_feats = futures["hist"].result()

        static_data = {
            "slope_degrees": topo_feats["slope_degrees"],
            "elevation_m": topo_feats["elevation_m"],
            "aspect": topo_feats["aspect"],
            "distance_to_nearest_stream_m": hydro_feats["distance_to_nearest_stream_m"],
            "land_cover_class": land_feats["land_cover_class"],
            "historical_incident_density": hist_feats["historical_incident_density"]
        }
        global_static_cache.set(lat, lon, static_data)

    features = {
        "rainfall_1h_mm": weather_feats["rainfall_1h_mm"],
        "rainfall_3h_mm": weather_feats["rainfall_3h_mm"],
        "rainfall_6h_mm": weather_feats["rainfall_6h_mm"],
        "rainfall_24h_mm": weather_feats["rainfall_24h_mm"],
        "soil_saturation_index": weather_feats["soil_saturation_index"],
        "slope_degrees": static_data["slope_degrees"],
        "elevation_m": static_data["elevation_m"],
        "aspect": static_data["aspect"],
        "historical_incident_density": static_data["historical_incident_density"],
        "land_cover_class": static_data["land_cover_class"],
        "distance_to_nearest_stream_m": static_data["distance_to_nearest_stream_m"],
        "antecedent_moisture_condition": weather_feats["antecedent_moisture_condition"]
    }

    validate_12_features(features)
    return features
