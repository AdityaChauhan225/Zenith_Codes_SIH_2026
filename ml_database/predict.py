"""
Predict Risk Module Interface Adapter.
Integrates with the trained XGBoost Flash-Flood Risk ML model from the root models/ directory.
Falls back to a calibrated heuristic demonstrator if the model artifact is not yet trained or loaded.
"""

import os
import sys
import importlib.util

_ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
_ROOT_PREDICT_PY = os.path.join(_ROOT_DIR, "predict.py")
DEFAULT_MODEL_PATH = os.path.join(_ROOT_DIR, "models", "xgb_flash_flood.joblib")

_ROOT_PREDICT_FUNC = None

def _get_root_predict_risk():
    global _ROOT_PREDICT_FUNC
    if _ROOT_PREDICT_FUNC is not None:
        return _ROOT_PREDICT_FUNC

    if os.path.exists(_ROOT_PREDICT_PY):
        try:
            spec = importlib.util.spec_from_file_location("root_trained_predict", _ROOT_PREDICT_PY)
            if spec and spec.loader:
                mod = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(mod)
                if hasattr(mod, "predict_risk"):
                    _ROOT_PREDICT_FUNC = mod.predict_risk
                    return _ROOT_PREDICT_FUNC
        except Exception as e:
            print(f"[Notice] Failed to import root predict.py: {e}")
    return None

def predict_risk(features: dict, model_path: str = None) -> dict:
    """
    Evaluates flash flood risk score, risk level, and explanations given the 12 required features.
    
    If models/xgb_flash_flood.joblib is present, uses the full trained XGBoost + SHAP pipeline.
    Otherwise, falls back to the calibrated heuristic demonstrator.
    """
    path = model_path or DEFAULT_MODEL_PATH

    # Attempt to use the trained XGBoost model if available
    if os.path.exists(path):
        root_func = _get_root_predict_risk()
        if root_func is not None:
            try:
                return root_func(features, model_path=path)
            except Exception as e:
                print(f"[Notice] Trained model invocation error ({e}), using heuristic fallback.")

    # Heuristic fallback if model artifact is not available
    required_features = [
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

    missing = [f for f in required_features if f not in features]
    if missing:
        raise ValueError(f"Missing required features for predict_risk: {missing}")

    r24 = float(features["rainfall_24h_mm"])
    soil = float(features["soil_saturation_index"])
    slope = float(features["slope_degrees"])
    amc = str(features["antecedent_moisture_condition"]).lower()

    amc_score = 0.3 if amc == "wet" else (0.15 if amc == "normal" else 0.0)
    raw_score = min(1.0, (r24 / 200.0) * 0.4 + soil * 0.3 + (slope / 60.0) * 0.15 + amc_score)

    if raw_score > 0.7:
        risk_level = "critical"
    elif raw_score > 0.4:
        risk_level = "high"
    elif raw_score > 0.2:
        risk_level = "medium"
    else:
        risk_level = "low"

    return {
        "risk_level": risk_level,
        "risk_score": round(float(raw_score), 4),
        "explanation": {
            "rainfall_24h_contribution": round(r24 / 200.0, 2),
            "soil_saturation_contribution": round(soil, 2),
            "topography_slope_degrees": slope,
            "amc_state": amc
        },
        "is_demonstrator_fallback": True
    }
