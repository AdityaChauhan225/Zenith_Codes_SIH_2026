"""
Flash-Flood Risk Prediction Inference Module.

Exposes a clean, standalone inference function:
    predict_risk(features: dict) -> {
        "risk_level": "low" | "medium" | "high" | "critical",
        "risk_score": float (0-1),
        "explanation": {feature_name: contribution_value, ...}
    }

Computes sample-level SHAP values to explain feature contributions towards
flash-flood risk in Indian mountainous catchments.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
import shap

# Default model path
DEFAULT_MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "xgb_flash_flood.joblib")

# Schema definitions
REQUIRED_NUMERIC_FEATURES = [
    "rainfall_1h_mm",
    "rainfall_3h_mm",
    "rainfall_6h_mm",
    "rainfall_24h_mm",
    "soil_saturation_index",
    "slope_degrees",
    "elevation_m",
    "aspect",
    "historical_incident_density",
    "distance_to_nearest_stream_m"
]

REQUIRED_CATEGORICAL_FEATURES = [
    "land_cover_class",
    "antecedent_moisture_condition"
]

ALL_REQUIRED_FEATURES = REQUIRED_NUMERIC_FEATURES + REQUIRED_CATEGORICAL_FEATURES

# Global cache for model and explainer
_CACHED_BUNDLE = None
_CACHED_EXPLAINER = None
_CACHED_MODEL_PATH = None

def load_pipeline(model_path: str = None):
    """
    Loads and caches the model bundle and SHAP TreeExplainer.
    """
    global _CACHED_BUNDLE, _CACHED_EXPLAINER, _CACHED_MODEL_PATH

    path = model_path or os.getenv("FLASH_FLOOD_MODEL_PATH", DEFAULT_MODEL_PATH)

    if _CACHED_BUNDLE is not None and _CACHED_MODEL_PATH == path:
        return _CACHED_BUNDLE, _CACHED_EXPLAINER

    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Flash-flood risk model not found at '{path}'. "
            "Please train the model first by running: python train.py"
        )

    bundle = joblib.load(path)
    model = bundle["model"]

    # Initialize SHAP TreeExplainer for the XGBoost model
    explainer = shap.TreeExplainer(model)

    _CACHED_BUNDLE = bundle
    _CACHED_EXPLAINER = explainer
    _CACHED_MODEL_PATH = path

    return _CACHED_BUNDLE, _CACHED_EXPLAINER

def validate_features(features: dict) -> pd.DataFrame:
    """
    Validates input feature schema and formats into a single-row DataFrame.
    """
    if not isinstance(features, dict):
        raise TypeError(f"Expected features to be a dict, got {type(features).__name__}")

    missing = [f for f in ALL_REQUIRED_FEATURES if f not in features]
    if missing:
        raise ValueError(f"Missing required feature(s): {missing}. Required features are: {ALL_REQUIRED_FEATURES}")

    # Validate categories
    valid_land_covers = {"forest", "agriculture", "barren", "urban"}
    lc = str(features["land_cover_class"]).lower()
    if lc not in valid_land_covers:
        raise ValueError(f"Invalid land_cover_class '{lc}'. Must be one of {valid_land_covers}")

    valid_amc = {"dry", "normal", "wet"}
    amc = str(features["antecedent_moisture_condition"]).lower()
    if amc not in valid_amc:
        raise ValueError(f"Invalid antecedent_moisture_condition '{amc}'. Must be one of {valid_amc}")

    # Validate physical ranges and monotonicity
    r1 = float(features["rainfall_1h_mm"])
    r3 = float(features["rainfall_3h_mm"])
    r6 = float(features["rainfall_6h_mm"])
    r24 = float(features["rainfall_24h_mm"])
    if r1 < 0 or r3 < 0 or r6 < 0 or r24 < 0:
        raise ValueError("Rainfall accumulation cannot be negative")
    if r3 < r1 or r6 < r3 or r24 < r6:
        raise ValueError(f"Rainfall accumulation must be monotonically non-decreasing (1h <= 3h <= 6h <= 24h). Got 1h={r1}, 3h={r3}, 6h={r6}, 24h={r24}")

    slope = float(features["slope_degrees"])
    if slope < 0.0 or slope >= 90.0:
        raise ValueError(f"slope_degrees must be between 0.0 and <90.0 degrees, got {slope}")

    # Construct single-row DataFrame with strict column order
    row = {
        "rainfall_1h_mm": r1,
        "rainfall_3h_mm": r3,
        "rainfall_6h_mm": r6,
        "rainfall_24h_mm": r24,
        "soil_saturation_index": float(np.clip(features["soil_saturation_index"], 0.0, 1.0)),
        "slope_degrees": slope,
        "elevation_m": float(features["elevation_m"]),
        "aspect": float(features["aspect"]),
        "historical_incident_density": float(features["historical_incident_density"]),
        "distance_to_nearest_stream_m": float(features["distance_to_nearest_stream_m"]),
        "land_cover_class": lc,
        "antecedent_moisture_condition": amc
    }

    return pd.DataFrame([row])

def predict_risk(features: dict, model_path: str = None) -> dict:
    """
    Standalone Flash-Flood Risk Prediction Function.

    Parameters:
        features (dict): Pre-computed environmental, meteorological, and topographic features.
        model_path (str, optional): Custom path to the trained model joblib artifact.

    Returns:
        dict:
            {
                "risk_level": "low" | "medium" | "high" | "critical",
                "risk_score": float,  # Calibrated hazard score between 0.0 and 1.0
                "explanation": {
                    feature_name: contribution_value,  # Positive: increases risk, Negative: reduces risk
                    ...
                }
            }
    """
    bundle, explainer = load_pipeline(model_path)
    model = bundle["model"]
    preprocessor = bundle["preprocessor"]
    transformed_feature_names = bundle["feature_names_transformed"]
    tier_map = bundle["tier_map"]
    tier_weights = np.array(bundle.get("tier_weights", [0.08, 0.38, 0.68, 0.94]))

    # 1. Validate and convert features
    df_input = validate_features(features)

    # 2. Transform features
    X_trans = preprocessor.transform(df_input)

    # 3. Predict probabilities & risk tier
    probs = model.predict_proba(X_trans)[0]  # shape: (4,) [P(low), P(med), P(high), P(crit)]
    predicted_class_idx = int(np.argmax(probs))
    predicted_risk_level = tier_map[predicted_class_idx]

    # Continuous calibrated risk score (0.0 to 1.0)
    risk_score = float(np.dot(probs, tier_weights))
    risk_score = round(float(np.clip(risk_score, 0.01, 0.99)), 4)

    # 4. Compute SHAP Values for Explainability
    shap_vals = explainer.shap_values(X_trans)

    # For multiclass, shap_vals is either a list of 4 arrays or array of shape (1, n_features, 4)
    # We compute the net hazard contribution: weighted sum of class contributions across severity
    # positive weight towards high/critical, negative weight towards low
    severity_direction = np.array([-1.0, 0.0, 1.0, 2.0])

    if isinstance(shap_vals, list):
        # List of 4 arrays, each shape (1, n_trans_features)
        feature_impacts = np.zeros(len(transformed_feature_names))
        for c_idx in range(4):
            feature_impacts += severity_direction[c_idx] * shap_vals[c_idx][0]
    elif len(shap_vals.shape) == 3:
        # Array of shape (1, n_trans_features, 4)
        feature_impacts = np.dot(shap_vals[0], severity_direction)
    else:
        # Single array
        feature_impacts = shap_vals[0]

    # Normalize contributions so sum of absolute values correlates with risk score shifts
    scale_factor = 0.35 / (np.max(np.abs(feature_impacts)) + 1e-6)
    scaled_impacts = feature_impacts * scale_factor

    # 5. Map transformed features back to the 12 primary features
    explanation = {}
    for feat in REQUIRED_NUMERIC_FEATURES:
        if feat in transformed_feature_names:
            idx = transformed_feature_names.index(feat)
            explanation[feat] = round(float(scaled_impacts[idx]), 4)
        else:
            explanation[feat] = 0.0

    # Categorical: land_cover_class
    lc_val = df_input["land_cover_class"].iloc[0]
    lc_col_name = f"land_cover_class_{lc_val}"
    if lc_col_name in transformed_feature_names:
        idx = transformed_feature_names.index(lc_col_name)
        explanation["land_cover_class"] = round(float(scaled_impacts[idx]), 4)
    else:
        # Sum of non-zero active category
        explanation["land_cover_class"] = 0.0

    # Categorical: antecedent_moisture_condition
    amc_val = df_input["antecedent_moisture_condition"].iloc[0]
    amc_col_name = f"antecedent_moisture_condition_{amc_val}"
    if amc_col_name in transformed_feature_names:
        idx = transformed_feature_names.index(amc_col_name)
        explanation["antecedent_moisture_condition"] = round(float(scaled_impacts[idx]), 4)
    else:
        explanation["antecedent_moisture_condition"] = 0.0

    # Sort explanation dictionary by absolute impact descending so the most influential drivers are first
    sorted_explanation = dict(sorted(explanation.items(), key=lambda item: abs(item[1]), reverse=True))

    return {
        "risk_level": predicted_risk_level,
        "risk_score": risk_score,
        "explanation": sorted_explanation
    }

if __name__ == "__main__":
    import pprint
    # Quick standalone test
    sample_input = {
        "rainfall_1h_mm": 52.4,
        "rainfall_3h_mm": 88.0,
        "rainfall_6h_mm": 110.5,
        "rainfall_24h_mm": 165.0,
        "soil_saturation_index": 0.88,
        "slope_degrees": 38.5,
        "elevation_m": 1850.0,
        "aspect": 195.0,
        "historical_incident_density": 1.85,
        "land_cover_class": "barren",
        "distance_to_nearest_stream_m": 85.0,
        "antecedent_moisture_condition": "wet"
    }

    print("Running predict_risk() on sample input:")
    try:
        result = predict_risk(sample_input)
        pprint.pprint(result)
    except FileNotFoundError as e:
        print(f"Notice: {e}")
