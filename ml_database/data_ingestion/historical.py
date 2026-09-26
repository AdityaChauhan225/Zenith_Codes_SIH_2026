"""
Phase 5: Historical Incident Density Feature Ingestion.
Calculates historical flood/landslide incident density within 10km buffer over past 10 years.
Formula: density = incident_count / (pi * 10^2) = incident_count / 314.159 km2
"""

import math
import json
import urllib.request
from typing import Dict, Any, List

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes distance between two coordinates in kilometers.
    """
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def fetch_historical_incidents_count(lat: float, lon: float, radius_km: float = 10.0) -> int:
    """
    Queries historical landslide/flood incident records (NASA Global Landslide Catalog / EONET API)
    within radius_km of (lat, lon).
    """
    # NASA EONET events API query endpoint
    url = f"https://eonet.gsfc.nasa.gov/api/v3/events?category=landslides,floods&days=3650"
    
    attempts = 2
    last_err = None

    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "FlashFloodHistoricalPipeline/1.0"})
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status != 200:
                    raise RuntimeError(f"NASA EONET API HTTP Error {response.status} for historical query around ({lat}, {lon})")
                payload = json.loads(response.read().decode("utf-8"))
                events = payload.get("events", [])
                count = 0
                for ev in events:
                    geometries = ev.get("geometry", [])
                    for g in geometries:
                        coords = g.get("coordinates", [])
                        if len(coords) >= 2:
                            ev_lon, ev_lat = coords[0], coords[1]
                            dist = haversine_distance_km(lat, lon, ev_lat, ev_lon)
                            if dist <= radius_km:
                                count += 1
                                break
                return count
        except Exception as err:
            last_err = err

    raise RuntimeError(f"NASA GLC/EONET historical incident query failed for ({lat}, {lon}): {last_err}") from last_err

def compute_historical_incident_density(incident_count: int, radius_km: float = 10.0) -> float:
    """
    Calculates density = incident_count / (pi * radius_km^2).
    """
    area_sq_km = math.pi * (radius_km ** 2)
    density = incident_count / area_sq_km
    return round(float(max(0.0, density)), 4)

def extract_historical_features(lat: float, lon: float) -> Dict[str, float]:
    """
    Extracts historical_incident_density for (lat, lon).
    """
    count = fetch_historical_incidents_count(lat, lon, radius_km=10.0)
    density = compute_historical_incident_density(count, radius_km=10.0)
    return {
        "historical_incident_density": density
    }
