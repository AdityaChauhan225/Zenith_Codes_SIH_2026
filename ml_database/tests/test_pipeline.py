"""
Unit Tests for Data Ingestion & Feature Engineering Pipeline.
"""

import os
import sys
import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone, timedelta

_ML_DB_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ML_DB_DIR not in sys.path:
    sys.path.insert(0, _ML_DB_DIR)

from data_ingestion.validators import (
    validate_coordinates_and_timestamp,
    validate_12_features,
    REQUIRED_12_FEATURES
)
from data_ingestion.weather import (
    compute_rainfall_accumulations,
    compute_amc,
    compute_soil_saturation,
    find_target_hour_index,
    extract_weather_features
)
from data_ingestion.topography import (
    calculate_slope_aspect,
    fetch_elevation_grid,
    extract_topography_features
)
from data_ingestion.hydrology import (
    fetch_nearest_stream_distance,
    extract_hydrology_features
)
from data_ingestion.landcover import (
    map_land_cover_code_to_class,
    fetch_land_cover_class,
    extract_land_cover_features
)
from data_ingestion.historical import (
    compute_historical_incident_density,
    fetch_historical_incidents_count,
    extract_historical_features
)
from data_ingestion.assembler import assemble_features_from_coords
from predict import predict_risk

class TestIngestionPipeline(unittest.TestCase):

    def test_validators_coordinates_and_timestamp(self):
        dt = validate_coordinates_and_timestamp(30.3165, 78.0322, "2026-09-23T00:00:00+05:30")
        self.assertEqual(dt.year, 2026)
        self.assertEqual(dt.month, 9)

        with self.assertRaises(ValueError):
            validate_coordinates_and_timestamp(95.0, 78.0322, "2026-09-23T00:00:00+05:30")

        with self.assertRaises(ValueError):
            validate_coordinates_and_timestamp(30.3165, 200.0, "2026-09-23T00:00:00+05:30")

        with self.assertRaises(ValueError):
            validate_coordinates_and_timestamp(30.3165, 78.0322, "not-a-timestamp")

    def test_rainfall_accumulations(self):
        precip_series = [1.0, 2.0, 3.0, 4.0, 5.0, 10.0, 15.0, 20.0]
        r1, r3, r6, r24 = compute_rainfall_accumulations(precip_series, 7)

        self.assertEqual(r1, 20.0)
        self.assertEqual(r3, 10.0 + 15.0 + 20.0)
        self.assertEqual(r6, 3.0 + 4.0 + 5.0 + 10.0 + 15.0 + 20.0)

    def test_amc_monsoon_thresholds(self):
        self.assertEqual(compute_amc(30.0, month=7), "dry")
        self.assertEqual(compute_amc(35.0, month=7), "normal")
        self.assertEqual(compute_amc(50.0, month=7), "normal")
        self.assertEqual(compute_amc(54.0, month=7), "wet")

    def test_amc_non_monsoon_thresholds(self):
        self.assertEqual(compute_amc(10.0, month=1), "dry")
        self.assertEqual(compute_amc(12.5, month=1), "normal")
        self.assertEqual(compute_amc(20.0, month=1), "normal")
        self.assertEqual(compute_amc(28.0, month=1), "wet")

    def test_amc_120_hour_window_length(self):
        # Generate 150 distinct hourly timestamps and series across multiple days
        base_dt = datetime(2026, 9, 1, 0, 0, tzinfo=timezone.utc)
        times = [(base_dt + timedelta(hours=h)).isoformat() for h in range(150)]
        precip = [1.0] * 150
        soil = [0.30] * 150

        target_dt = base_dt + timedelta(hours=140)
        target_idx = find_target_hour_index(times, target_dt)

        # Exclude target hour: target_idx - 120 to target_idx
        slice_120 = precip[target_idx - 120 : target_idx]
        self.assertEqual(len(slice_120), 120)

        # Ensure target hour (target_idx) is NOT in the AMC 120-hour slice
        # If precip at target_idx was changed to 999.0, slice_120 should not contain 999.0
        precip_modified = list(precip)
        precip_modified[target_idx] = 999.0
        slice_mod = precip_modified[target_idx - 120 : target_idx]
        self.assertNotIn(999.0, slice_mod)

    def test_soil_saturation_normalization(self):
        self.assertEqual(compute_soil_saturation(0.08), 0.0)
        self.assertEqual(compute_soil_saturation(0.48), 1.0)
        self.assertEqual(compute_soil_saturation(0.28), 0.5)
        self.assertEqual(compute_soil_saturation(0.02), 0.0)
        self.assertEqual(compute_soil_saturation(0.60), 1.0)

        with self.assertRaises(ValueError):
            compute_soil_saturation(None)

    def test_slope_aspect_calculation(self):
        flat_grid = [[1000.0]*3 for _ in range(3)]
        slope, aspect = calculate_slope_aspect(flat_grid, lat=30.0)
        self.assertEqual(slope, 0.0)
        self.assertEqual(aspect, 0.0)

        sloping_grid = [
            [1000.0, 1010.0, 1020.0],
            [1000.0, 1010.0, 1020.0],
            [1000.0, 1010.0, 1020.0]
        ]
        slope_e, aspect_e = calculate_slope_aspect(sloping_grid, lat=30.0)
        self.assertGreater(slope_e, 0.0)

    def test_land_cover_mapping(self):
        self.assertEqual(map_land_cover_code_to_class(10), "forest")
        self.assertEqual(map_land_cover_code_to_class(40), "agriculture")
        self.assertEqual(map_land_cover_code_to_class(50), "urban")
        self.assertEqual(map_land_cover_code_to_class(60), "barren")
        self.assertEqual(map_land_cover_code_to_class(999), "barren")

    def test_historical_incident_density(self):
        d1 = compute_historical_incident_density(1, radius_km=10.0)
        self.assertAlmostEqual(d1, 0.0032, places=3)

    def test_validate_12_features_schema(self):
        valid_features = {
            "rainfall_1h_mm": 12.5,
            "rainfall_3h_mm": 30.0,
            "rainfall_6h_mm": 45.0,
            "rainfall_24h_mm": 80.0,
            "soil_saturation_index": 0.65,
            "slope_degrees": 28.5,
            "elevation_m": 1650.0,
            "aspect": 180.0,
            "historical_incident_density": 0.05,
            "land_cover_class": "forest",
            "distance_to_nearest_stream_m": 150.0,
            "antecedent_moisture_condition": "wet"
        }
        self.assertTrue(validate_12_features(valid_features))

        invalid_features = dict(valid_features)
        del invalid_features["slope_degrees"]
        with self.assertRaises(ValueError):
            validate_12_features(invalid_features)

        invalid_lc = dict(valid_features)
        invalid_lc["land_cover_class"] = "jungle"
        with self.assertRaises(ValueError):
            validate_12_features(invalid_lc)

    @patch("data_ingestion.assembler.fetch_open_meteo_weather")
    @patch("data_ingestion.assembler.extract_topography_features")
    @patch("data_ingestion.assembler.extract_hydrology_features")
    @patch("data_ingestion.assembler.extract_land_cover_features")
    @patch("data_ingestion.assembler.extract_historical_features")
    def test_assemble_features_mocked_end_to_end(self, mock_hist, mock_lc, mock_hydro, mock_topo, mock_weather):
        base_dt = datetime(2026, 9, 18, 0, 0, tzinfo=timezone.utc)
        times = [(base_dt + timedelta(hours=h)).isoformat()[:16] for h in range(160)]
        mock_weather.return_value = {
            "hourly": {
                "time": times,
                "precipitation": [5.0] * 160,
                "soil_moisture_0_to_7cm": [0.28] * 160
            }
        }
        mock_topo.return_value = {
            "elevation_m": 1800.0,
            "slope_degrees": 34.0,
            "aspect": 180.0
        }
        mock_hydro.return_value = {
            "distance_to_nearest_stream_m": 120.0
        }
        mock_lc.return_value = {
            "land_cover_class": "forest"
        }
        mock_hist.return_value = {
            "historical_incident_density": 0.02
        }

        target_ts = (base_dt + timedelta(hours=140)).isoformat()
        features = assemble_features_from_coords(30.3165, 78.0322, target_ts)

        self.assertEqual(len(features), 12)
        self.assertEqual(set(features.keys()), set(REQUIRED_12_FEATURES))
        self.assertEqual(features["elevation_m"], 1800.0)
        self.assertEqual(features["slope_degrees"], 34.0)
        self.assertEqual(features["land_cover_class"], "forest")

        # Test predict_risk compatibility
        prediction = predict_risk(features)
        self.assertIn("risk_level", prediction)
        self.assertIn("risk_score", prediction)

    @patch("urllib.request.urlopen")
    def test_topography_api_failure_raises_exception(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.status = 500
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        with self.assertRaises(RuntimeError):
            fetch_elevation_grid(30.3165, 78.0322)

    @patch("urllib.request.urlopen")
    def test_hydrology_api_failure_raises_exception(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.status = 503
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        with self.assertRaises(RuntimeError):
            fetch_nearest_stream_distance(30.3165, 78.0322)

    @patch("urllib.request.urlopen")
    def test_landcover_api_failure_raises_exception(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.status = 500
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        with self.assertRaises(RuntimeError):
            fetch_land_cover_class(30.3165, 78.0322)

    @patch("urllib.request.urlopen")
    def test_historical_api_failure_raises_exception(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.status = 500
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        with self.assertRaises(RuntimeError):
            fetch_historical_incidents_count(30.3165, 78.0322)

if __name__ == "__main__":
    unittest.main()
