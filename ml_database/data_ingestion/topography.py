"""
Phase 2: Topography & Elevation Feature Ingestion.
Calculates real elevation_m, slope_degrees, and aspect from a 3x3 elevation DEM grid.
"""

import math
import json
import urllib.request
from typing import Dict, Any, List, Tuple

def fetch_elevation_grid(lat: float, lon: float, delta_deg: float = 0.0003) -> List[List[float]]:
    """
    Fetches a 3x3 elevation grid around target (lat, lon) using OpenTopoData Copernicus 30m API.
    Returns 3x3 matrix of elevation values in meters.
    """
    # 3x3 grid coordinates: row 0 (north) to row 2 (south), col 0 (west) to col 2 (east)
    lats = [lat + delta_deg, lat, lat - delta_deg]
    lons = [lon - delta_deg, lon, lon + delta_deg]

    loc_strs = []
    for r in lats:
        for c in lons:
            loc_strs.append(f"{r:.6f},{c:.6f}")

    locations_param = "|".join(loc_strs)
    url = f"https://api.opentopodata.org/v1/srtm30m?locations={locations_param}"

    attempts = 2
    last_err = None

    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "FlashFloodTopographyPipeline/1.0"})
            with urllib.request.urlopen(req, timeout=12) as response:
                if response.status != 200:
                    raise RuntimeError(f"OpenTopoData API HTTP Error {response.status} for grid around ({lat}, {lon})")
                payload = json.loads(response.read().decode("utf-8"))
                results = payload.get("results", [])
                if len(results) == 9:
                    grid = [[0.0]*3 for _ in range(3)]
                    idx = 0
                    for r in range(3):
                        for c in range(3):
                            elev = results[idx].get("elevation")
                            if elev is None:
                                raise ValueError(f"OpenTopoData returned None elevation for grid point {idx}")
                            grid[r][c] = float(elev)
                            idx += 1
                    return grid
                else:
                    raise ValueError(f"OpenTopoData returned {len(results)} results instead of expected 9 grid points")
        except Exception as err:
            last_err = err

    raise RuntimeError(f"OpenTopoData topography ingestion failed for ({lat}, {lon}): {last_err}") from last_err

def fetch_single_elevation(lat: float, lon: float) -> float:
    """
    Fetches elevation for a single coordinate from OpenTopoData.
    """
    url = f"https://api.opentopodata.org/v1/srtm30m?locations={lat},{lon}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "FlashFloodTopographyPipeline/1.0"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            if resp.status != 200:
                raise RuntimeError(f"OpenTopoData single elevation HTTP Error {resp.status}")
            data = json.loads(resp.read().decode())
            results = data.get("results", [])
            if results and results[0].get("elevation") is not None:
                return float(results[0]["elevation"])
            raise ValueError("OpenTopoData single elevation response missing elevation value")
    except Exception as err:
        raise RuntimeError(f"OpenTopoData single elevation fetch failed for ({lat}, {lon}): {err}") from err

def calculate_slope_aspect(grid: List[List[float]], lat: float, delta_deg: float = 0.0003) -> Tuple[float, float]:
    """
    Calculates slope (degrees) and aspect (degrees 0-360) from 3x3 elevation grid.
    Uses Horn's method for spatial gradient calculation.
    """
    # Grid indexing:
    # z00, z01, z02  (north)
    # z10, z11, z12  (center)
    # z20, z21, z22  (south)
    z00, z01, z02 = grid[0][0], grid[0][1], grid[0][2]
    z10, z11, z12 = grid[1][0], grid[1][1], grid[1][2]
    z20, z21, z22 = grid[2][0], grid[2][1], grid[2][2]

    # Convert delta degrees to meters
    lat_rad = math.radians(lat)
    dy = delta_deg * 111320.0
    dx = delta_deg * 111320.0 * math.cos(lat_rad)

    if dx <= 0:
        dx = dy

    # Horn's 3x3 spatial gradient formulas:
    # dz/dx (east-west gradient)
    dz_dx = ((z02 + 2 * z12 + z22) - (z00 + 2 * z10 + z20)) / (8.0 * dx)

    # dz/dy (north-south gradient, y increasing north: z0 is north, z2 is south)
    dz_dy = ((z00 + 2 * z01 + z02) - (z20 + 2 * z21 + z22)) / (8.0 * dy)

    # Slope in degrees
    slope_rad = math.atan(math.sqrt(dz_dx**2 + dz_dy**2))
    slope_deg = math.degrees(slope_rad)

    # Aspect in degrees (0-360)
    if abs(dz_dx) < 1e-7 and abs(dz_dy) < 1e-7:
        aspect_deg = 0.0  # flat surface aspect default
    else:
        # standard aspect formula: mod(180 + rad2deg(atan2(dz_dy, -dz_dx)), 360)
        aspect_rad = math.atan2(dz_dy, -dz_dx)
        aspect_deg = (180.0 + math.degrees(aspect_rad)) % 360.0

    return round(float(max(0.0, slope_deg)), 2), round(float(aspect_deg), 2)

def extract_topography_features(lat: float, lon: float) -> Dict[str, float]:
    """
    Extracts elevation_m, slope_degrees, and aspect for (lat, lon).
    """
    grid = fetch_elevation_grid(lat, lon)
    center_elevation = grid[1][1]
    slope, aspect = calculate_slope_aspect(grid, lat)

    return {
        "elevation_m": round(float(center_elevation), 2),
        "slope_degrees": slope,
        "aspect": aspect
    }
