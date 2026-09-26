"""
Comprehensive Test Suite for Flash-Flood Risk ML Pipeline.

Tests:
  - Input schema validation & error handling
  - Exact JSON contract adherence for predict_risk()
  - Hydrological monotonicity (extreme storm vs. dry scenario)
  - SHAP explanation structure and numerical consistency
  - Physical dataset generation checks
  - Stretch goal nowcasting shapes and bounds
"""

import os
import json
import unittest
import numpy as np
import pandas as pd

from generate_dataset import generate_synthetic_data, scs_curve_number_runoff
from predict import validate_features, predict_risk, ALL_REQUIRED_FEATURES
from nowcast import RainfallNowcasterGRU, predict_nowcast
import torch

class TestFlashFloodPipeline(unittest.TestCase):

    def setUp(self):
        sample_path = os.path.join(os.path.dirname(__file__), "sample_input.json")
        with open(sample_path, "r") as f:
            self.valid_input = json.load(f)

        self.dry_input = {
            "rainfall_1h_mm": 0.0,
            "rainfall_3h_mm": 0.0,
            "rainfall_6h_mm": 0.0,
            "rainfall_24h_mm": 0.0,
            "soil_saturation_index": 0.12,
            "slope_degrees": 12.0,
            "elevation_m": 800.0,
            "aspect": 90.0,
            "historical_incident_density": 0.1,
            "land_cover_class": "forest",
            "distance_to_nearest_stream_m": 1200.0,
            "antecedent_moisture_condition": "dry"
        }

    def test_schema_validation_success(self):
        """Valid features must produce a clean single-row DataFrame."""
        df = validate_features(self.valid_input)
        self.assertEqual(len(df), 1)
        for col in ALL_REQUIRED_FEATURES:
            self.assertIn(col, df.columns)

    def test_schema_validation_missing_key(self):
        """Missing a required key must raise ValueError with descriptive message."""
        bad_input = dict(self.valid_input)
        del bad_input["rainfall_1h_mm"]
        with self.assertRaises(ValueError):
            validate_features(bad_input)

    def test_schema_validation_invalid_category(self):
        """Invalid categorical strings must raise ValueError."""
        bad_input = dict(self.valid_input)
        bad_input["land_cover_class"] = "desert_dunes"
        with self.assertRaises(ValueError):
            validate_features(bad_input)

        bad_input2 = dict(self.valid_input)
        bad_input2["antecedent_moisture_condition"] = "super_wet"
        with self.assertRaises(ValueError):
            validate_features(bad_input2)

    def test_dataset_generator_physics(self):
        """Verify generated dataset respects physical bounds and cumulative rainfall logic."""
        df = generate_synthetic_data(n_samples=200, random_state=123)
        self.assertEqual(len(df), 200)
        self.assertFalse(df.isnull().any().any())

        # Cumulative rainfall constraint: 1h <= 3h <= 6h <= 24h
        self.assertTrue((df["rainfall_1h_mm"] <= df["rainfall_3h_mm"] + 1e-4).all())
        self.assertTrue((df["rainfall_3h_mm"] <= df["rainfall_6h_mm"] + 1e-4).all())
        self.assertTrue((df["rainfall_6h_mm"] <= df["rainfall_24h_mm"] + 1e-4).all())

        # Soil saturation bounds
        self.assertTrue((df["soil_saturation_index"] >= 0.0).all())
        self.assertTrue((df["soil_saturation_index"] <= 1.0).all())

        # Risk tiers presence
        tiers = set(df["risk_level"].unique())
        self.assertTrue(tiers.issubset({"low", "medium", "high", "critical"}))

    def test_scs_curve_number_runoff(self):
        """Verify SCS runoff increases with rain and AMC."""
        p_dry = np.array([50.0])
        q_dry = scs_curve_number_runoff(p_dry, np.array(["forest"]), np.array(["dry"]))

        p_wet = np.array([50.0])
        q_wet = scs_curve_number_runoff(p_wet, np.array(["forest"]), np.array(["wet"]))

        # Wet AMC has higher CN and therefore higher runoff Q for identical rain
        self.assertGreaterEqual(q_wet[0], q_dry[0])

    def test_prediction_contract_and_monotonicity(self):
        """Verify predict_risk() contract and monotonicity if model is available."""
        model_path = os.path.join("models", "xgb_flash_flood.joblib")
        if not os.path.exists(model_path):
            self.skipTest("Model artifact not yet trained. Run train.py first.")

        # Test extreme flash-flood storm
        result_storm = predict_risk(self.valid_input)
        self.assertIn("risk_level", result_storm)
        self.assertIn("risk_score", result_storm)
        self.assertIn("explanation", result_storm)

        self.assertIn(result_storm["risk_level"], ["low", "medium", "high", "critical"])
        self.assertGreaterEqual(result_storm["risk_score"], 0.0)
        self.assertLessEqual(result_storm["risk_score"], 1.0)
        self.assertIsInstance(result_storm["explanation"], dict)

        # Ensure all features exist in explanation
        for feat in ALL_REQUIRED_FEATURES:
            self.assertIn(feat, result_storm["explanation"])
            self.assertIsInstance(result_storm["explanation"][feat], float)

        # Test dry calm condition
        result_dry = predict_risk(self.dry_input)
        self.assertIn(result_dry["risk_level"], ["low", "medium"])
        # Severe storm must have significantly higher risk score than dry day
        self.assertGreater(result_storm["risk_score"], result_dry["risk_score"])

    def test_nowcaster_dimensions(self):
        """Verify GRU nowcaster accepts (1, 24, 3) and outputs 6 non-negative values."""
        model = RainfallNowcasterGRU()
        sample_x = torch.rand(2, 24, 3)
        out = model(sample_x)
        self.assertEqual(out.shape, (2, 6))
        self.assertTrue((out >= 0).all())

if __name__ == "__main__":
    unittest.main()
