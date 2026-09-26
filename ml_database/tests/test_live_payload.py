"""
Unit and Integration Tests for Live Payload Ingestion Interface.
"""

import os
import sys
import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone, timedelta

_ML_DB_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ML_DB_DIR not in sys.path:
    sys.path.insert(0, _ML_DB_DIR)

from data_ingestion.live import fetch_live_payload
from data_ingestion.validators import REQUIRED_12_FEATURES, validate_12_features
from data_ingestion.cache import global_weather_cache, global_static_cache
from predict import predict_risk

class TestLivePayloadInterface(unittest.TestCase):

    def setUp(self):
        global_weather_cache.clear()
        global_static_cache.clear()

    def tearDown(self):
        global_weather_cache.clear()
        global_static_cache.clear()

    @patch("data_ingestion.assembler.fetch_open_meteo_weather")
    @patch("data_ingestion.assembler.extract_topography_features")
    @patch("data_ingestion.assembler.extract_hydrology_features")
    @patch("data_ingestion.assembler.extract_land_cover_features")
    @patch("data_ingestion.assembler.extract_historical_features")
    def test_fetch_live_payload_mocked_contract(self, mock_hist, mock_lc, mock_hydro, mock_topo, mock_weather):
        base_dt = datetime(2026, 9, 18, 0, 0, tzinfo=timezone.utc)
        times = [(base_dt + timedelta(hours=h)).isoformat()[:16] for h in range(160)]
        mock_weather.return_value = {
            "hourly": {
                "time": times,
                "precipitation": [2.0] * 160,
                "soil_moisture_0_to_7cm": [0.30] * 160
            }
        }
        mock_topo.return_value = {
            "elevation_m": 2050.0,
            "slope_degrees": 25.0,
            "aspect": 180.0
        }
        mock_hydro.return_value = {
            "distance_to_nearest_stream_m": 250.0
        }
        mock_lc.return_value = {
            "land_cover_class": "forest"
        }
        mock_hist.return_value = {
            "historical_incident_density": 0.015
        }

        # Target dt at hour 140 (so 140 preceding hours exist)
        target_ts = (base_dt + timedelta(hours=140)).isoformat()
        payload_manali = fetch_live_payload(32.2396, 77.1887, target_ts)

        # 1. Exact 12 keys check
        self.assertEqual(len(payload_manali), 12)
        self.assertEqual(set(payload_manali.keys()), set(REQUIRED_12_FEATURES))

        # 2. No forbidden keys (lat, lon, timestamp, risk_level, etc.)
        forbidden_keys = {"lat", "lon", "timestamp", "risk_level", "risk_score", "explanation", "status"}
        for fk in forbidden_keys:
            self.assertNotIn(fk, payload_manali)

        # 3. Data types check
        self.assertIsInstance(payload_manali["rainfall_1h_mm"], float)
        self.assertIsInstance(payload_manali["soil_saturation_index"], float)
        self.assertIsInstance(payload_manali["land_cover_class"], str)

        # 4. validate_12_features compatibility
        self.assertTrue(validate_12_features(payload_manali))

        # 5. predict_risk compatibility
        prediction = predict_risk(payload_manali)
        self.assertIn("risk_level", prediction)
        self.assertIn("risk_score", prediction)

    @patch("data_ingestion.assembler.fetch_open_meteo_weather")
    @patch("data_ingestion.assembler.extract_topography_features")
    @patch("data_ingestion.assembler.extract_hydrology_features")
    @patch("data_ingestion.assembler.extract_land_cover_features")
    @patch("data_ingestion.assembler.extract_historical_features")
    def test_fetch_live_payload_mandi_mocked(self, mock_hist, mock_lc, mock_hydro, mock_topo, mock_weather):
        base_dt = datetime(2026, 9, 18, 0, 0, tzinfo=timezone.utc)
        times = [(base_dt + timedelta(hours=h)).isoformat()[:16] for h in range(160)]
        mock_weather.return_value = {
            "hourly": {
                "time": times,
                "precipitation": [0.5] * 160,
                "soil_moisture_0_to_7cm": [0.25] * 160
            }
        }
        mock_topo.return_value = {
            "elevation_m": 760.0,
            "slope_degrees": 15.0,
            "aspect": 90.0
        }
        mock_hydro.return_value = {
            "distance_to_nearest_stream_m": 50.0
        }
        mock_lc.return_value = {
            "land_cover_class": "urban"
        }
        mock_hist.return_value = {
            "historical_incident_density": 0.005
        }

        # Test Mandi mock
        target_ts = (base_dt + timedelta(hours=140)).isoformat()
        payload_mandi = fetch_live_payload(31.7087, 76.9320, target_ts)
        self.assertEqual(len(payload_mandi), 12)
        self.assertEqual(set(payload_mandi.keys()), set(REQUIRED_12_FEATURES))
        self.assertEqual(payload_mandi["elevation_m"], 760.0)

        # Predict risk check
        pred = predict_risk(payload_mandi)
        self.assertIn(pred["risk_level"], ["low", "moderate", "high", "critical"])

if __name__ == "__main__":
    unittest.main()
