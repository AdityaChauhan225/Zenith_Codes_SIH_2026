"""
Unit Tests for Himachal Pradesh Historical Dataset Validation & Temporal Leakage Rules.
"""

import os
import sys
import unittest

_ML_DB_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ML_DB_DIR not in sys.path:
    sys.path.insert(0, _ML_DB_DIR)

from training.validate_dataset import (
    validate_training_dataset_rows,
    perform_temporal_split,
    EXPECTED_13_COLUMNS
)

class TestTrainingDatasetValidation(unittest.TestCase):

    def setUp(self):
        self.valid_sample_rows = [
            {
                "timestamp": "2020-07-01 10:00:00",
                "rainfall_1h_mm": "5.0",
                "rainfall_3h_mm": "12.0",
                "rainfall_6h_mm": "25.0",
                "rainfall_24h_mm": "60.0",
                "soil_saturation_index": "0.75",
                "slope_degrees": "30.0",
                "elevation_m": "1800.0",
                "aspect": "180.0",
                "distance_to_nearest_stream_m": "150.0",
                "historical_incident_density": "0.05",
                "land_cover_class": "forest",
                "antecedent_moisture_condition": "wet",
                "risk_level": "high"
            },
            {
                "timestamp": "2020-07-01 11:00:00",
                "rainfall_1h_mm": "8.0",
                "rainfall_3h_mm": "18.0",
                "rainfall_6h_mm": "35.0",
                "rainfall_24h_mm": "72.0",
                "soil_saturation_index": "0.82",
                "slope_degrees": "30.0",
                "elevation_m": "1800.0",
                "aspect": "180.0",
                "distance_to_nearest_stream_m": "150.0",
                "historical_incident_density": "0.05",
                "land_cover_class": "forest",
                "antecedent_moisture_condition": "wet",
                "risk_level": "critical"
            }
        ]

    def test_schema_and_valid_dataset(self):
        res = validate_training_dataset_rows(self.valid_sample_rows)
        self.assertTrue(res["valid"])
        self.assertEqual(res["total_rows"], 2)
        self.assertEqual(res["columns"], EXPECTED_13_COLUMNS)

    def test_chronological_ordering_validation(self):
        unordered_rows = list(self.valid_sample_rows)
        # Swap timestamps to create temporal order violation
        unordered_rows[0]["timestamp"], unordered_rows[1]["timestamp"] = (
            unordered_rows[1]["timestamp"], unordered_rows[0]["timestamp"]
        )
        with self.assertRaises(ValueError) as ctx:
            validate_training_dataset_rows(unordered_rows)
        self.assertIn("Temporal order violation", str(ctx.exception))

    def test_duplicate_row_detection(self):
        dup_rows = [self.valid_sample_rows[0], self.valid_sample_rows[0]]
        with self.assertRaises(ValueError) as ctx:
            validate_training_dataset_rows(dup_rows)
        self.assertIn("Duplicate row detected", str(ctx.exception))

    def test_missing_values_detection(self):
        invalid_rows = [dict(self.valid_sample_rows[0])]
        invalid_rows[0]["soil_saturation_index"] = ""
        with self.assertRaises(ValueError) as ctx:
            validate_training_dataset_rows(invalid_rows)
        self.assertIn("Missing value", str(ctx.exception))

    def test_numeric_ranges_and_monotonicity(self):
        # Monotonicity failure: 3h < 1h
        non_mono_rows = [dict(self.valid_sample_rows[0])]
        non_mono_rows[0]["rainfall_3h_mm"] = "2.0"  # 1h is 5.0
        with self.assertRaises(ValueError) as ctx:
            validate_training_dataset_rows(non_mono_rows)
        self.assertIn("Rainfall monotonicity violation", str(ctx.exception))

    def test_temporal_split_train_test(self):
        rows = [
            {"timestamp": "2020-07-01 10:00:00", "id": 1},
            {"timestamp": "2023-08-15 14:00:00", "id": 2},
            {"timestamp": "2024-07-10 09:00:00", "id": 3}
        ]
        train, test = perform_temporal_split(rows)
        self.assertEqual(len(train), 2)
        self.assertEqual(len(test), 1)
        self.assertEqual(test[0]["id"], 3)

if __name__ == "__main__":
    unittest.main()
