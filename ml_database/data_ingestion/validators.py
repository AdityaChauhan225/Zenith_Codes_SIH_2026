"""
Input and Payload Validators for Data Ingestion Pipeline.
"""

from datetime import datetime

REQUIRED_12_FEATURES = [
    "rainfall_1h_mm",
    "rainfall_3h_mm",
    "rainfall_6h_mm",
    "rainfall_24h_mm",
    "soil_saturation_index",
    "slope_degrees",
    "elevation_m",
    "aspect",
    "historical_incident_density",
    "land_cover_class",
    "distance_to_nearest_stream_m",
    "antecedent_moisture_condition"
]

VALID_LAND_COVER_CLASSES = {"forest", "agriculture", "urban", "barren"}
VALID_AMC_STATES = {"dry", "normal", "wet"}

def validate_coordinates_and_timestamp(lat: float, lon: float, timestamp_str: str) -> datetime:
    """
    Validates latitude, longitude bounds and parses ISO-8601 timestamp string.
    """
    if not isinstance(lat, (int, float)) or not (-90.0 <= lat <= 90.0):
        raise ValueError(f"Invalid latitude {lat}. Must be between -90 and 90.")
    if not isinstance(lon, (int, float)) or not (-180.0 <= lon <= 180.0):
        raise ValueError(f"Invalid longitude {lon}. Must be between -180 and 180.")

    try:
        dt = datetime.fromisoformat(timestamp_str)
        return dt
    except (ValueError, TypeError) as err:
        raise ValueError(f"Invalid ISO-8601 timestamp '{timestamp_str}': {err}")

def validate_12_features(features: dict) -> bool:
    """
    Validates that the dictionary contains exactly the required 12 features with correct types,
    ranges, and categorical enum values.
    """
    keys = set(features.keys())
    expected_keys = set(REQUIRED_12_FEATURES)

    if keys != expected_keys:
        missing = expected_keys - keys
        extra = keys - expected_keys
        raise ValueError(f"Feature dictionary key mismatch. Missing: {missing}, Extra: {extra}")

    # Numeric checks
    numeric_features = [
        "rainfall_1h_mm", "rainfall_3h_mm", "rainfall_6h_mm", "rainfall_24h_mm",
        "soil_saturation_index", "slope_degrees", "elevation_m", "aspect",
        "historical_incident_density", "distance_to_nearest_stream_m"
    ]
    for key in numeric_features:
        val = features[key]
        if not isinstance(val, (int, float)):
            raise TypeError(f"Feature '{key}' must be numeric, got {type(val)}: {val}")

    if features["rainfall_1h_mm"] < 0:
        raise ValueError(f"rainfall_1h_mm cannot be negative: {features['rainfall_1h_mm']}")
    if features["rainfall_3h_mm"] < 0:
        raise ValueError(f"rainfall_3h_mm cannot be negative: {features['rainfall_3h_mm']}")
    if features["rainfall_6h_mm"] < 0:
        raise ValueError(f"rainfall_6h_mm cannot be negative: {features['rainfall_6h_mm']}")
    if features["rainfall_24h_mm"] < 0:
        raise ValueError(f"rainfall_24h_mm cannot be negative: {features['rainfall_24h_mm']}")

    if not (0.0 <= features["soil_saturation_index"] <= 1.0):
        raise ValueError(f"soil_saturation_index must be in [0.0, 1.0], got {features['soil_saturation_index']}")

    if features["slope_degrees"] < 0.0:
        raise ValueError(f"slope_degrees cannot be negative, got {features['slope_degrees']}")

    if not (0.0 <= features["aspect"] <= 360.0):
        raise ValueError(f"aspect must be in [0.0, 360.0], got {features['aspect']}")

    if features["historical_incident_density"] < 0.0:
        raise ValueError(f"historical_incident_density cannot be negative, got {features['historical_incident_density']}")

    if features["distance_to_nearest_stream_m"] < 0.0:
        raise ValueError(f"distance_to_nearest_stream_m cannot be negative, got {features['distance_to_nearest_stream_m']}")

    lc = features["land_cover_class"]
    if lc not in VALID_LAND_COVER_CLASSES:
        raise ValueError(f"land_cover_class must be one of {VALID_LAND_COVER_CLASSES}, got '{lc}'")

    amc = features["antecedent_moisture_condition"]
    if amc not in VALID_AMC_STATES:
        raise ValueError(f"antecedent_moisture_condition must be one of {VALID_AMC_STATES}, got '{amc}'")

    return True
