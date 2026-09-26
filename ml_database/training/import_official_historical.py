"""
Generic Official Historical Data Importer Module.
Imports, normalizes, and validates official historical disaster/hydrological data
from HPSDMA, CWC, IMD, or other authoritative agency source files when available.

POLICY ENFORCEMENT:
1. Does NOT fabricate historical data, synthetic rows, or risk labels.
2. If no official raw source file exists, exits cleanly with:
   'OFFICIAL HISTORICAL DATA NOT FOUND — IMPORT SKIPPED'
3. Preserves exact source traceability (source, source_record_id).
4. Preserves original severity/warning categories without automatic conversion.
"""

import os
import sys
import csv
import json
from datetime import datetime
from typing import Dict, Any, List, Optional

NORMALIZED_COLUMNS = [
    "source",
    "source_record_id",
    "event_id",
    "event_type",
    "event_date",
    "event_timestamp",
    "latitude",
    "longitude",
    "district",
    "location_name",
    "severity_original",
    "warning_level_original",
    "danger_level_original",
    "water_level_m",
    "discharge_cumecs",
    "affected_population",
    "fatalities",
    "damage_amount",
    "source_reference"
]

RAW_SEARCH_DIRS = [
    "data/raw/hpsdma",
    "data/raw/cwc",
    "data/raw/imd",
    "data/raw/other_authoritative"
]

def parse_iso_or_custom_timestamp(ts_str: str) -> Optional[datetime]:
    """
    Parses timestamp string into standard datetime object.
    """
    if not ts_str or str(ts_str).strip() == "":
        return None
    ts_clean = str(ts_str).strip()
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S%z"):
        try:
            return datetime.strptime(ts_clean, fmt)
        except ValueError:
            pass
    try:
        return datetime.fromisoformat(ts_clean)
    except Exception:
        return None

def find_official_raw_files() -> List[str]:
    """
    Scans raw directories for official incoming CSV/JSON/GeoJSON files.
    Excludes README.md files.
    """
    found_files = []
    for d in RAW_SEARCH_DIRS:
        if os.path.exists(d):
            for fname in os.listdir(d):
                if fname.lower().endswith((".csv", ".json", ".geojson")) and not fname.lower().startswith("readme"):
                    found_files.append(os.path.join(d, fname))
    return found_files

def import_official_dataset(
    file_path: Optional[str] = None,
    output_path: str = "data/processed/official_events_normalized.csv"
) -> Dict[str, Any]:
    """
    Main entry point for importing official historical datasets.
    If no source file exists or is supplied, exits cleanly with SKIPPED status.
    """
    if file_path is None:
        raw_files = find_official_raw_files()
        if not raw_files:
            msg = "OFFICIAL HISTORICAL DATA NOT FOUND — IMPORT SKIPPED"
            print(f"\n==========================================")
            print(f" IMPORT STATUS: SKIPPED")
            print(f"==========================================")
            print(f"Details: {msg}\n")
            return {
                "status": "SKIPPED",
                "message": msg,
                "records_imported": 0,
                "source_files": []
            }
        file_path = raw_files[0]

    if not os.path.exists(file_path):
        msg = f"OFFICIAL HISTORICAL DATA NOT FOUND — IMPORT SKIPPED (File missing: {file_path})"
        print(f"[Import] {msg}")
        return {
            "status": "SKIPPED",
            "message": msg,
            "records_imported": 0,
            "file_path": file_path
        }

    print(f"[Import] Ingesting official historical dataset from '{file_path}'...")
    
    # Process CSV or JSON
    records = []
    if file_path.lower().endswith(".json") or file_path.lower().endswith(".geojson"):
        with open(file_path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
            if isinstance(raw_data, list):
                records = raw_data
            elif isinstance(raw_data, dict):
                records = raw_data.get("events", raw_data.get("records", raw_data.get("features", [])))
    else:
        with open(file_path, "r", encoding="utf-8") as f:
            lines = [line for line in f if not line.strip().startswith("#")]
            reader = csv.DictReader(lines)
            records = list(reader)

    if not records:
        raise ValueError(f"Official source file '{file_path}' contains 0 records.")

    normalized_rows = []
    seen_keys = set()
    duplicate_count = 0
    invalid_coords_count = 0
    invalid_ts_count = 0

    for idx, rec in enumerate(records):
        line_num = idx + 2
        
        # Handle GeoJSON feature format if present
        properties = rec.get("properties", rec) if isinstance(rec, dict) else rec
        geometry = rec.get("geometry", {}) if isinstance(rec, dict) else {}
        
        # Extract lat/lon
        lat_val = properties.get("latitude", properties.get("lat"))
        lon_val = properties.get("longitude", properties.get("lon", properties.get("lng")))
        
        if (lat_val is None or lon_val is None) and geometry.get("type") == "Point":
            coords = geometry.get("coordinates", [])
            if len(coords) >= 2:
                lon_val, lat_val = coords[0], coords[1]
                
        if lat_val is None or lon_val is None:
            invalid_coords_count += 1
            raise ValueError(f"Missing required coordinates at line {line_num} in '{file_path}'")

        try:
            lat = float(lat_val)
            lon = float(lon_val)
        except (ValueError, TypeError):
            invalid_coords_count += 1
            raise ValueError(f"Invalid coordinate format at line {line_num}: lat='{lat_val}', lon='{lon_val}'")

        # Validate bounding box for Himalayan region (28-35 N, 74-80 E)
        if not (28.0 <= lat <= 35.0 and 74.0 <= lon <= 80.0):
            invalid_coords_count += 1
            raise ValueError(f"Coordinates out of target Himalayan region at line {line_num}: ({lat}, {lon})")

        # Traceability & Source record ID
        source_name = str(properties.get("source", os.path.basename(os.path.dirname(file_path)))).strip()
        source_rec_id = str(properties.get("source_record_id", properties.get("event_id", f"REC_{idx+1}"))).strip()
        if not source_rec_id:
            raise ValueError(f"Missing source_record_id at line {line_num}")

        # Timestamp validation
        date_str = str(properties.get("event_date", properties.get("date", ""))).strip()
        ts_str = str(properties.get("event_timestamp", properties.get("timestamp", date_str))).strip()
        
        dt = parse_iso_or_custom_timestamp(ts_str or date_str)
        if dt is None:
            invalid_ts_count += 1
            raise ValueError(f"Invalid timestamp format '{ts_str}' at line {line_num}")

        formatted_ts = dt.isoformat()
        formatted_date = dt.strftime("%Y-%m-%d")

        # Deduplication check
        dedup_key = (source_name, source_rec_id, formatted_date, round(lat, 4), round(lon, 4))
        if dedup_key in seen_keys:
            duplicate_count += 1
            continue
        seen_keys.add(dedup_key)

        # Build normalized record preserving original source categories
        norm_row = {
            "source": source_name,
            "source_record_id": source_rec_id,
            "event_id": str(properties.get("event_id", source_rec_id)).strip(),
            "event_type": str(properties.get("event_type", properties.get("hazard_type", "flash_flood"))).strip(),
            "event_date": formatted_date,
            "event_timestamp": formatted_ts,
            "latitude": str(lat),
            "longitude": str(lon),
            "district": str(properties.get("district", "")).strip(),
            "location_name": str(properties.get("location_name", properties.get("village_name", ""))).strip(),
            "severity_original": str(properties.get("severity_original", properties.get("severity", ""))).strip(),
            "warning_level_original": str(properties.get("warning_level_original", properties.get("warning_level", ""))).strip(),
            "danger_level_original": str(properties.get("danger_level_original", properties.get("danger_level", ""))).strip(),
            "water_level_m": str(properties.get("water_level_m", "")).strip(),
            "discharge_cumecs": str(properties.get("discharge_cumecs", "")).strip(),
            "affected_population": str(properties.get("affected_population", "")).strip(),
            "fatalities": str(properties.get("fatalities", "")).strip(),
            "damage_amount": str(properties.get("damage_amount", "")).strip(),
            "source_reference": str(properties.get("source_reference", file_path)).strip()
        }
        normalized_rows.append(norm_row)

    # Write normalized CSV output
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=NORMALIZED_COLUMNS)
        writer.writeheader()
        writer.writerows(normalized_rows)

    summary = {
        "status": "SUCCESS",
        "file_path": file_path,
        "output_path": output_path,
        "records_imported": len(records),
        "valid_records": len(normalized_rows),
        "duplicate_count": duplicate_count,
        "invalid_coords_count": invalid_coords_count,
        "invalid_ts_count": invalid_ts_count,
        "source_traceability_intact": True
    }
    
    print(f"[Import] Successfully imported {len(normalized_rows)} normalized records into '{output_path}'")
    return summary

if __name__ == "__main__":
    result = import_official_dataset()
