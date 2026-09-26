"""
Caching Layer for Data Ingestion Pipeline.
Provides WeatherCache (30-minute TTL) and StaticCache (long-lived geospatial cache).
"""

import time
import threading
from typing import Dict, Any, Optional, Tuple

def normalize_coordinate_key(lat: float, lon: float, precision: int = 2) -> Tuple[float, float]:
    """
    Normalizes coordinates to a grid cell key to avoid duplicate API queries
    for near-identical locations. Default precision=2 decimal places (~1.1 km).
    """
    return (round(float(lat), precision), round(float(lon), precision))

class WeatherCache:
    """
    30-minute TTL (1800s) cache for weather telemetry data.
    """
    def __init__(self, ttl_seconds: float = 1800.0, time_fn=time.time, grid_precision: int = 2):
        self.ttl_seconds = ttl_seconds
        self.time_fn = time_fn
        self.grid_precision = grid_precision
        self._store: Dict[Tuple[float, float], Tuple[float, Dict[str, Any]]] = {}
        self._lock = threading.Lock()

    def get(self, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        """
        Retrieves cached weather payload if present and not expired.
        Returns None on cache miss or expiration.
        """
        key = normalize_coordinate_key(lat, lon, self.grid_precision)
        now = self.time_fn()
        with self._lock:
            if key in self._store:
                timestamp, data = self._store[key]
                if now - timestamp <= self.ttl_seconds:
                    return data
                else:
                    # Expired entry - remove safely
                    del self._store[key]
        return None

    def set(self, lat: float, lon: float, data: Dict[str, Any]) -> None:
        """
        Stores weather payload with current timestamp.
        """
        key = normalize_coordinate_key(lat, lon, self.grid_precision)
        now = self.time_fn()
        with self._lock:
            self._store[key] = (now, data)

    def clear(self) -> None:
        """
        Clears all cached entries.
        """
        with self._lock:
            self._store.clear()

class StaticCache:
    """
    Long-lived in-memory cache for static/geospatial features
    (elevation, slope, aspect, stream distance, land cover, historical density).
    Designed to be easily swappable with external stores (e.g. Redis).
    """
    def __init__(self, grid_precision: int = 4):
        self.grid_precision = grid_precision
        self._store: Dict[Tuple[float, float], Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def get(self, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        """
        Retrieves static feature dict if cached.
        """
        key = normalize_coordinate_key(lat, lon, self.grid_precision)
        with self._lock:
            return self._store.get(key)

    def set(self, lat: float, lon: float, data: Dict[str, Any]) -> None:
        """
        Stores static feature dict.
        """
        key = normalize_coordinate_key(lat, lon, self.grid_precision)
        with self._lock:
            self._store[key] = dict(data)

    def clear(self) -> None:
        """
        Clears static cache.
        """
        with self._lock:
            self._store.clear()

# Global singleton cache instances
global_weather_cache = WeatherCache()
global_static_cache = StaticCache()
