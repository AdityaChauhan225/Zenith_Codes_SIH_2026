"""
Live Ingestion Interface Module.
Implements fetch_live_payload(lat, lon, timestamp) using caching, concurrency, and validation.
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, Tuple

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
from .assembler import assemble_features_from_coords

def fetch_live_payload(
    lat: float,
    lon: float,
    timestamp: Optional[str] = None
) -> Dict[str, Any]:
    """
    Fetches real-time telemetry and returns the exact 12-feature dictionary
    required by the prediction interface. Delegates to assemble_features_from_coords.
    """
    return assemble_features_from_coords(lat, lon, timestamp)
