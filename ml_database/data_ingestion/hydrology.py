"""
Phase 3: Hydrology Feature Ingestion (Distance to Nearest Stream).
Queries OpenStreetMap Overpass API for river, stream, canal geometries and computes nearest geodesic distance in meters.
"""

import math
import json
import time
import urllib.request
import urllib.parse
from typing import Dict, Any, List

OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://z.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
]

def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes great-circle distance between two (lat, lon) points in meters.
    """
    R = 6371000.0  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return R * c

def dist_to_segment_m(lat0: float, lon0: float, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes approximate distance in meters from point (lat0, lon0) to line segment (lat1, lon1)-(lat2, lon2).
    Uses planar projection around lat0.
    """
    lat_rad = math.radians(lat0)
    kx = 111320.0 * math.cos(lat_rad)
    ky = 111320.0

    # Project to meters
    x0, y0 = lon0 * kx, lat0 * ky
    x1, y1 = lon1 * kx, lat1 * ky
    x2, y2 = lon2 * kx, lat2 * ky

    dx = x2 - x1
    dy = y2 - y1

    if dx == 0 and dy == 0:
        return math.hypot(x0 - x1, y0 - y1)

    t = max(0.0, min(1.0, ((x0 - x1) * dx + (y0 - y1) * dy) / (dx * dx + dy * dy)))
    proj_x = x1 + t * dx
    proj_y = y1 + t * dy

    return math.hypot(x0 - proj_x, y0 - proj_y)

def fetch_nearest_stream_distance(lat: float, lon: float, search_radius_m: int = 3000) -> float:
    """
    Queries Overpass API for rivers, streams, canals within search_radius_m of (lat, lon).
    Returns minimum distance in meters to nearest stream.
    Raises RuntimeError on total API failure.
    """
    overpass_query = f"""
    [out:json][timeout:10];
    (
      way["waterway"~"river|stream|canal"](around:{search_radius_m},{lat},{lon});
    );
    out geom;
    """
    data_encoded = urllib.parse.urlencode({"data": overpass_query}).encode("utf-8")

    min_distance = float("inf")
    last_err = None

    for endpoint_url in OVERPASS_ENDPOINTS[:2]:
        try:
            req = urllib.request.Request(
                endpoint_url,
                data=data_encoded,
                headers={
                    "User-Agent": "FlashFloodHydrologyPipeline/1.0",
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            )
            with urllib.request.urlopen(req, timeout=2.5) as response:
                if response.status != 200:
                    raise RuntimeError(f"Overpass API HTTP Error {response.status} at {endpoint_url}")
                payload = json.loads(response.read().decode("utf-8"))
                elements = payload.get("elements", [])
                
                for elem in elements:
                    geom = elem.get("geometry", [])
                    if len(geom) < 2:
                        continue
                    for i in range(len(geom) - 1):
                        p1 = geom[i]
                        p2 = geom[i+1]
                        dist = dist_to_segment_m(lat, lon, p1["lat"], p1["lon"], p2["lat"], p2["lon"])
                        if dist < min_distance:
                            min_distance = dist
                last_err = None
                break  # Successful query
        except Exception as err:
            last_err = err

        if min_distance != float("inf"):
            break

    if min_distance == float("inf"):
        if last_err is not None:
            raise RuntimeError(f"Overpass API hydrology request failed for ({lat}, {lon}): {last_err}") from last_err
        # No stream/river found within search radius -> distance is at least search_radius_m
        return float(search_radius_m)

    return round(float(min_distance), 2)

def extract_hydrology_features(lat: float, lon: float) -> Dict[str, float]:
    """
    Extracts distance_to_nearest_stream_m for (lat, lon).
    """
    dist_m = fetch_nearest_stream_distance(lat, lon)
    return {
        "distance_to_nearest_stream_m": dist_m
    }
