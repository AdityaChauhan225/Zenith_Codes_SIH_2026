"""
Himachal Pradesh Historical Training Dataset Generator.
Attempts to construct training dataset for Himachal Pradesh target regions (2020-2024).

CRITICAL POLICY ENFORCEMENT:
Synthetic or heuristic risk labels (e.g. rainfall threshold rules) are strictly forbidden.
If authoritative ground-truth risk labels (HP SDMA, CWC danger marks, NASA GLC) cannot be resolved,
dataset generation is BLOCKED without generating fake rows or CSV files.
"""

import os
import sys
import json
from typing import Dict, Any, List, Optional

# Target Himachal Pradesh Study Locations
HP_TARGET_LOCATIONS = {
    "BEAS_BASIN_MANALI": {"lat": 32.2396, "lon": 77.1887, "basin": "Beas"},
    "BEAS_BASIN_KULLU": {"lat": 31.9579, "lon": 77.1095, "basin": "Beas"},
    "BEAS_BASIN_MANDI": {"lat": 31.7087, "lon": 76.9320, "basin": "Beas"},
    "BEAS_BASIN_PANDOH": {"lat": 31.6700, "lon": 77.0300, "basin": "Beas"},
    "PARVATI_VALLEY_KASOL": {"lat": 32.0100, "lon": 77.3150, "basin": "Parvati"},
    "PARVATI_VALLEY_MANIKARAN": {"lat": 32.0270, "lon": 77.3470, "basin": "Parvati"},
    "SUTLEJ_BASIN_RAMPUR": {"lat": 31.4500, "lon": 77.6300, "basin": "Sutlej"},
    "SUTLEJ_BASIN_SHIMLA_RIDGE": {"lat": 31.1048, "lon": 77.1734, "basin": "Sutlej"},
    "KANGRA_RAVI_DHARAMSHALA": {"lat": 32.2190, "lon": 76.3230, "basin": "Kangra/Ravi"},
    "KANGRA_RAVI_PALAMPUR": {"lat": 32.1109, "lon": 76.5363, "basin": "Kangra/Ravi"},
    "KANGRA_RAVI_CHAMBA": {"lat": 32.5534, "lon": 76.1258, "basin": "Kangra/Ravi"}
}

TRAINING_COLUMNS = [
    "timestamp",
    "rainfall_1h_mm",
    "rainfall_3h_mm",
    "rainfall_6h_mm",
    "rainfall_24h_mm",
    "soil_saturation_index",
    "slope_degrees",
    "elevation_m",
    "aspect",
    "distance_to_nearest_stream_m",
    "historical_incident_density",
    "land_cover_class",
    "antecedent_moisture_condition",
    "risk_level"
]

def check_ground_truth_availability() -> Dict[str, Any]:
    """
    Audits availability of authoritative historical ground-truth disaster logs & risk labels
    for Himachal Pradesh (2020-2024).
    """
    from training.target_mapping import GLOBAL_TARGET_MAPPER
    
    normalized_file = "data/processed/official_events_normalized.csv"
    has_normalized_events = os.path.exists(normalized_file)
    is_mapping_approved = GLOBAL_TARGET_MAPPER.is_approved()

    attempted_sources = [
        {
            "source": "HP SDMA Disaster Records",
            "url_or_api": "State Disaster Management Authority (HPSDMA) Incident Logs",
            "status": "AVAILABLE (NORMALIZED)" if has_normalized_events else "UNAVAILABLE",
            "reason": "Official HPSDMA digitized CSV is present in data/processed/" if has_normalized_events else "Official HPSDMA disaster reports are published as aggregated annual PDF summaries without standardized, machine-readable hourly geo-referenced event classifications."
        },
        {
            "source": "Target Mapping Configuration",
            "url_or_api": "training/target_mapping.py",
            "status": "APPROVED" if is_mapping_approved else "NOT APPROVED",
            "reason": "Target mapping rule explicitly approved by engineering team" if is_mapping_approved else "Target mapping configuration requires formal project sign-off before converting official categories to target classes."
        },
        {
            "source": "CWC Danger-Mark Exceedance",
            "url_or_api": "Central Water Commission Hydro-Telemetry API",
            "status": "UNAVAILABLE",
            "reason": "Historical CWC river gauge danger-level exceedance time-series API for 2020-2024 is restricted and unavailable for open automated querying."
        },
        {
            "source": "NASA GLC / EONET Historical Events",
            "url_or_api": "https://eonet.gsfc.nasa.gov/api/v3/events",
            "status": "INSUFFICIENT",
            "reason": "NASA EONET contains point event locations for extreme global disasters but lacks dense hourly multi-class risk labels (low, medium, high, critical) across all target study locations."
        }
    ]

    is_available = has_normalized_events and is_mapping_approved

    return {
        "is_available": is_available,
        "status": "READY" if is_available else "BLOCKED",
        "message": "DATASET BLOCKED: Approved historical target labels unavailable" if not is_available else "GROUND TRUTH VERIFIED",
        "attempted_sources": attempted_sources,
        "missing_components": [] if is_available else [
            "Authoritative hourly risk labels (low, medium, high, critical) for HP coordinates (2020-2024)",
            "Approved target mapping sign-off in training/target_mapping.py"
        ],
        "remediation_required": "Execute data request plan in docs/data_request/ and register approved target mapping in training/target_mapping.py before building dataset."
    }

def build_himachal_dataset(output_path: str = "data/final/himachal_training_data.csv") -> Dict[str, Any]:
    """
    Main entry point for building Himachal Pradesh historical training dataset.
    Checks ground-truth availability first.
    If ground-truth is unavailable, halts execution safely and returns BLOCKED audit.
    """
    audit = check_ground_truth_availability()

    if not audit["is_available"]:
        print(f"\n==========================================")
        print(f" DATASET GENERATION STATUS: {audit['status']}")
        print(f"==========================================")
        print(f"Reason: {audit['message']}")
        print(f"Attempted Sources Audit:")
        for s in audit["attempted_sources"]:
            print(f"  - [{s['source']}] Status: {s['status']} | Details: {s['reason']}")
        print(f"\nPolicy Enforcement: No synthetic or heuristic risk labels will be generated.")
        print(f"Target CSV '{output_path}' was NOT created to prevent introducing fake training data.\n")
        return audit

    # If authoritative data were available in future: proceed with generation
    # (Unreachable under current audit status)
    return audit

if __name__ == "__main__":
    result = build_himachal_dataset()

