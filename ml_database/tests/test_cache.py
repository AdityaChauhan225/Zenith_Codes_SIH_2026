"""
Unit Tests for Data Ingestion Caching Layer (WeatherCache & StaticCache).
"""

import os
import sys
import unittest

_ML_DB_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ML_DB_DIR not in sys.path:
    sys.path.insert(0, _ML_DB_DIR)

from data_ingestion.cache import WeatherCache, StaticCache, normalize_coordinate_key

class MockClock:
    def __init__(self, initial_time: float = 100000.0):
        self.current_time = initial_time

    def time(self) -> float:
        return self.current_time

    def advance(self, seconds: float):
        self.current_time += seconds

class TestCachingLayer(unittest.TestCase):

    def test_coordinate_normalization(self):
        k1 = normalize_coordinate_key(32.2396123, 77.1887456, precision=2)
        k2 = normalize_coordinate_key(32.2396999, 77.1887111, precision=2)
        self.assertEqual(k1, (32.24, 77.19))
        self.assertEqual(k1, k2)

    def test_weather_cache_hit_and_miss(self):
        clock = MockClock()
        cache = WeatherCache(ttl_seconds=1800.0, time_fn=clock.time)

        # 1. Initial Cache Miss
        self.assertIsNone(cache.get(32.2396, 77.1887))

        # 2. Set Cache Value
        sample_data = {"hourly": {"precipitation": [1.0, 2.0]}}
        cache.set(32.2396, 77.1887, sample_data)

        # 3. Cache Hit (Immediate)
        hit_data = cache.get(32.2396, 77.1887)
        self.assertIsNotNone(hit_data)
        self.assertEqual(hit_data, sample_data)

        # 4. Cache Hit after 15 minutes (900 seconds)
        clock.advance(900.0)
        self.assertIsNotNone(cache.get(32.2396, 77.1887))

    def test_weather_cache_expiration_after_1800_seconds(self):
        clock = MockClock()
        cache = WeatherCache(ttl_seconds=1800.0, time_fn=clock.time)

        cache.set(32.2396, 77.1887, {"test": "data"})
        self.assertIsNotNone(cache.get(32.2396, 77.1887))

        # Advance clock to 1801 seconds (past 30 min TTL)
        clock.advance(1801.0)

        # Should be expired (Cache Miss)
        self.assertIsNone(cache.get(32.2396, 77.1887))

    def test_static_cache_persistence(self):
        cache = StaticCache(grid_precision=4)

        # Cache Miss
        self.assertIsNone(cache.get(31.7087, 76.9320))

        static_data = {
            "elevation_m": 760.0,
            "slope_degrees": 12.5,
            "aspect": 140.0,
            "distance_to_nearest_stream_m": 120.0,
            "land_cover_class": "urban",
            "historical_incident_density": 0.01
        }
        cache.set(31.7087, 76.9320, static_data)

        # Cache Hit
        res = cache.get(31.7087, 76.9320)
        self.assertIsNotNone(res)
        self.assertEqual(res["elevation_m"], 760.0)
        self.assertEqual(res["land_cover_class"], "urban")

if __name__ == "__main__":
    unittest.main()
