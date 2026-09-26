"""
Phase 4: Land Cover Feature Ingestion & Classification Mapping.
Queries OpenStreetMap Nominatim REST API for point spatial classification and address features around (lat, lon),
and maps them to the exact 4 model classes: ['forest', 'agriculture', 'urban', 'barren'].

LIMITATION NOTICE:
OpenStreetMap Nominatim provides point spatial/address reverse-geocoding, which is used here as an accessible API fallback.
It is NOT equivalent to full satellite-derived raster land cover data (such as ESA WorldCover 10m, Copernicus DEM/LC, or ISRO Bhuvan).
Future production releases should integrate true ESA WorldCover or Copernicus raster tiles via GeoTIFF / STAC APIs.

Source: OpenStreetMap Nominatim Reverse Geocoding REST API
Endpoint: https://nominatim.openstreetmap.org/reverse
"""

import json
import urllib.request
import urllib.parse
from typing import Dict, Any

# Standard ESA WorldCover Code Mapping (Reference)
ESA_WORLDCOVER_MAP = {
    10: "forest",       # Tree cover
    20: "forest",       # Shrubland
    30: "barren",       # Grassland / Alpine sparse
    40: "agriculture",  # Cropland
    50: "urban",        # Built-up
    60: "barren",       # Bare / sparse vegetation
    70: "barren",       # Snow and ice
    80: "barren",       # Permanent water bodies
    90: "forest",       # Herbaceous wetland
    95: "forest",       # Mangroves
    100: "barren"       # Moss and lichen
}

# Nominatim Category / Type Mapping to 4 Model Classes
NOMINATIM_TYPE_MAP = {
    # Urban / Built-up
    "highway": "urban",
    "building": "urban",
    "residential": "urban",
    "commercial": "urban",
    "industrial": "urban",
    "amenity": "urban",
    "office": "urban",
    "shop": "urban",
    "road": "urban",
    "place": "urban",

    # Forest / Canopy
    "wood": "forest",
    "forest": "forest",
    "scrub": "forest",
    "trees": "forest",
    "wetland": "forest",

    # Agriculture
    "farmland": "agriculture",
    "farmyard": "agriculture",
    "orchard": "agriculture",
    "vineyard": "agriculture",
    "cropland": "agriculture",
    "meadow": "agriculture",

    # Barren / Rock / Open terrain
    "bare_rock": "barren",
    "scree": "barren",
    "sand": "barren",
    "glacier": "barren",
    "water": "barren",
    "heath": "barren",
    "peak": "barren"
}

def map_land_cover_code_to_class(code: int) -> str:
    """
    Maps numerical ESA WorldCover classification codes to exact model classes:
    ['forest', 'agriculture', 'urban', 'barren'].
    """
    return ESA_WORLDCOVER_MAP.get(code, "barren")

def map_nominatim_to_model_class(osm_class: str, osm_type: str, addresstype: str) -> str:
    """
    Maps Nominatim class, type, and addresstype properties to exact model class:
    ['forest', 'agriculture', 'urban', 'barren'].
    """
    c_lower = str(osm_class).lower().strip()
    t_lower = str(osm_type).lower().strip()
    a_lower = str(addresstype).lower().strip()

    if t_lower in NOMINATIM_TYPE_MAP:
        return NOMINATIM_TYPE_MAP[t_lower]

    if c_lower in NOMINATIM_TYPE_MAP:
        return NOMINATIM_TYPE_MAP[c_lower]

    if a_lower in NOMINATIM_TYPE_MAP:
        return NOMINATIM_TYPE_MAP[a_lower]

    # Built-up indicators (road, suburb, house, building)
    if c_lower in {"highway", "building", "place"} or a_lower in {"road", "suburb", "neighbourhood", "postcode"}:
        return "urban"

    # Natural terrain indicators
    if c_lower in {"natural", "waterway", "peak"}:
        if t_lower in {"wood", "forest", "scrub"}:
            return "forest"
        return "barren"

    return "barren"

def fetch_land_cover_class(lat: float, lon: float) -> str:
    """
    Queries Nominatim REST API for point spatial classification at (lat, lon).
    Returns exact model class: 'forest', 'agriculture', 'urban', or 'barren'.
    Raises RuntimeError on API failure.
    """
    url = f"https://nominatim.openstreetmap.org/reverse?lat={lat:.6f}&lon={lon:.6f}&format=json&zoom=16"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "FlashFloodLandCoverPipeline/1.0"}
    )

    attempts = 2
    last_err = None

    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(req, timeout=6) as response:
                if response.status != 200:
                    raise RuntimeError(f"Nominatim Land Cover API HTTP Error {response.status} for ({lat}, {lon})")
                data = json.loads(response.read().decode("utf-8"))
                
                osm_class = data.get("class", "")
                osm_type = data.get("type", "")
                addresstype = data.get("addresstype", "")

                return map_nominatim_to_model_class(osm_class, osm_type, addresstype)
        except Exception as err:
            last_err = err

    raise RuntimeError(f"Land cover REST API retrieval failed for coordinates ({lat}, {lon}): {last_err}") from last_err

def extract_land_cover_features(lat: float, lon: float) -> Dict[str, str]:
    """
    Extracts land_cover_class for (lat, lon).
    """
    lc_class = fetch_land_cover_class(lat, lon)
    return {
        "land_cover_class": lc_class
    }
