"""
Integrated Live Ingestion & ML Risk Inference Pipeline.

Fetches real-time multi-source telemetry via `ml_database.data_ingestion` (Open-Meteo,
Copernicus 30m DEM, OSM Overpass, Nominatim, and NASA EONET) with 2-tier caching,
assembles the compliant 12-feature schema, and executes inference with SHAP explanations
via the trained XGBoost model in `predict.py`.

Usage:
    # Run for Manali, Himachal Pradesh (Default)
    python fetch_features_starter.py

    # Run for specific coordinates
    python fetch_features_starter.py --lat 32.2396 --lon 77.1887

    # Run with manual test overrides
    python fetch_features_starter.py --lat 32.2396 --lon 77.1887 --override-slope 45.0 --override-land-cover barren
"""

import sys
import os
import json
import argparse
from datetime import datetime, timezone

# Ensure workspace root and ml_database are on python path
_ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
if _ROOT_DIR not in sys.path:
    sys.path.insert(0, _ROOT_DIR)

from ml_database.data_ingestion import assemble_features_from_coords, validate_12_features
from predict import predict_risk

def main():
    parser = argparse.ArgumentParser(
        description="Fetch live telemetry via ml_database and run XGBoost flash-flood risk inference."
    )
    # Default to Manali, Upper Beas Basin, Himachal Pradesh
    parser.add_argument("--lat", type=float, default=32.2396, help="Latitude (default: 32.2396 - Manali, HP)")
    parser.add_argument("--lon", type=float, default=77.1887, help="Longitude (default: 77.1887 - Manali, HP)")
    parser.add_argument("--timestamp", type=str, default=None, help="ISO-8601 timestamp string (e.g. 2026-09-24T18:00:00+05:30)")

    # Test overrides
    parser.add_argument("--override-slope", type=float, default=None, help="[Override] Force slope in degrees")
    parser.add_argument("--override-aspect", type=float, default=None, help="[Override] Force aspect (0-360 degrees)")
    parser.add_argument("--override-stream-dist", type=float, default=None, help="[Override] Force stream distance in meters")
    parser.add_argument("--override-land-cover", type=str, default=None, choices=["forest", "agriculture", "urban", "barren"], help="[Override] Force land cover class")
    parser.add_argument("--override-incident-density", type=float, default=None, help="[Override] Force historical incident density")

    args = parser.parse_args()

    ts = args.timestamp
    if ts is None:
        ts = datetime.now(timezone.utc).isoformat()

    print("\n========================================================")
    print(" [INFO] FETCHING REAL-TIME TELEMETRY VIA ML_DATABASE")
    print(f" Coordinates: ({args.lat}, {args.lon}) | Timestamp: {ts}")
    print("========================================================")

    # 1. Assembles features via parallel cached ingestion
    features = assemble_features_from_coords(
        lat=args.lat,
        lon=args.lon,
        timestamp=ts
    )

    # Apply any test overrides
    if args.override_slope is not None:
        features["slope_degrees"] = float(args.override_slope)
    if args.override_aspect is not None:
        features["aspect"] = float(args.override_aspect)
    if args.override_stream_dist is not None:
        features["distance_to_nearest_stream_m"] = float(args.override_stream_dist)
    if args.override_land_cover is not None:
        features["land_cover_class"] = args.override_land_cover
    if args.override_incident_density is not None:
        features["historical_incident_density"] = float(args.override_incident_density)

    # 2. Strict 12-feature schema validation
    validate_12_features(features)

    print("\n========================================================")
    print(" [PAYLOAD] ASSEMBLED 12-FEATURE PAYLOAD")
    print("========================================================")
    print(json.dumps(features, indent=2))

    # 3. Model Inference via trained XGBoost & SHAP explainer
    print("\n========================================================")
    print(" [MODEL] XGBOOST FLASH-FLOOD RISK INFERENCE")
    print("========================================================")
    prediction = predict_risk(features)

    risk_tier = prediction["risk_level"].upper()
    risk_score = prediction["risk_score"]

    print(f"Risk Level : {risk_tier}")
    print(f"Risk Score : {risk_score:.4f} (0.00 = Safe, 1.00 = Extreme Danger)")
    print("\nTop Contributing Drivers (SHAP Explanations):")
    for feat, impact in list(prediction.get("explanation", {}).items())[:5]:
        direction = "(+) INCREASES RISK" if impact > 0 else "(-) REDUCES RISK"
        print(f"  * {feat:28s} : {impact:+.4f}  {direction}")

    print("\nFull JSON Response:")
    print(json.dumps(prediction, indent=2))

if __name__ == "__main__":
    main()
