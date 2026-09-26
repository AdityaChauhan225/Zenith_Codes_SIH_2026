"""
Unit Tests for Official Data Importer and Target Mapping Modules.
Verifies official CSV import, column normalization, missing field detection, invalid coordinates,
invalid timestamps, source traceability, target mapping policies, and duplicate detection.
"""

import os
import sys
import unittest
import tempfile
import csv
from typing import Dict, Any

_ML_DB_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ML_DB_DIR not in sys.path:
    sys.path.insert(0, _ML_DB_DIR)

from training.import_official_historical import import_official_dataset, NORMALIZED_COLUMNS
from training.target_mapping import TargetMapper, TargetMappingNotConfigured, TargetMappingNotApproved

class TestOfficialImportAndMapping(unittest.TestCase):
    
    def setUp(self):
        self.fixture_csv = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fixtures", "sample_official_event.csv")

    def test_no_official_data_present(self):
        """1. Test behavior when no official data file exists or is passed."""
        non_existent_file = os.path.join("data", "raw", "hpsdma", "non_existent_file_xyz.csv")
        res = import_official_dataset(file_path=non_existent_file)
        self.assertEqual(res["status"], "SKIPPED")
        self.assertIn("OFFICIAL HISTORICAL DATA NOT FOUND", res["message"])
        self.assertEqual(res["records_imported"], 0)

    def test_official_csv_loading(self):
        """2. Test loading valid official CSV file from fixture."""
        with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
            tmp_out = tmp.name
        try:
            res = import_official_dataset(file_path=self.fixture_csv, output_path=tmp_out)
            self.assertEqual(res["status"], "SUCCESS")
            self.assertEqual(res["records_imported"], 2)
            self.assertEqual(res["valid_records"], 2)
            self.assertTrue(res["source_traceability_intact"])
            self.assertTrue(os.path.exists(tmp_out))
        finally:
            if os.path.exists(tmp_out):
                os.remove(tmp_out)

    def test_column_normalization(self):
        """3. Test schema normalization of imported output CSV."""
        with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
            tmp_out = tmp.name
        try:
            import_official_dataset(file_path=self.fixture_csv, output_path=tmp_out)
            with open(tmp_out, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                headers = reader.fieldnames
                rows = list(reader)
            self.assertEqual(headers, NORMALIZED_COLUMNS)
            self.assertEqual(len(rows), 2)
            self.assertEqual(rows[0]["source"], "HPSDMA_TEST")
            self.assertEqual(rows[0]["source_record_id"], "EVT_2023_001")
            self.assertEqual(rows[0]["latitude"], "32.2396")
            self.assertEqual(rows[0]["longitude"], "77.1887")
        finally:
            if os.path.exists(tmp_out):
                os.remove(tmp_out)

    def test_missing_required_field_detection(self):
        """4. Test error handling when required coordinates/source_record_id are missing."""
        bad_csv_content = (
            "source,source_record_id,event_date,latitude,longitude\n"
            "HPSDMA_TEST,,2023-07-10,32.2396,77.1887\n"
        )
        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as tmp_in:
            tmp_in.write(bad_csv_content)
            tmp_in_path = tmp_in.name

        with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp_out:
            tmp_out_path = tmp_out.name

        try:
            with self.assertRaises(ValueError) as ctx:
                import_official_dataset(file_path=tmp_in_path, output_path=tmp_out_path)
            self.assertIn("source_record_id", str(ctx.exception))
        finally:
            if os.path.exists(tmp_in_path):
                os.remove(tmp_in_path)
            if os.path.exists(tmp_out_path):
                os.remove(tmp_out_path)

    def test_invalid_coordinates_detection(self):
        """5. Test error handling for out-of-bounds or malformed coordinates."""
        bad_coords_csv = (
            "source,source_record_id,event_date,latitude,longitude\n"
            "HPSDMA_TEST,REC_001,2023-07-10,12.3456,77.1887\n"  # Lat 12.3456 is outside HP (28-35 N)
        )
        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as tmp_in:
            tmp_in.write(bad_coords_csv)
            tmp_in_path = tmp_in.name

        with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp_out:
            tmp_out_path = tmp_out.name

        try:
            with self.assertRaises(ValueError) as ctx:
                import_official_dataset(file_path=tmp_in_path, output_path=tmp_out_path)
            self.assertIn("Himalayan region", str(ctx.exception))
        finally:
            if os.path.exists(tmp_in_path):
                os.remove(tmp_in_path)
            if os.path.exists(tmp_out_path):
                os.remove(tmp_out_path)

    def test_invalid_timestamps_detection(self):
        """6. Test error handling for malformed unparseable timestamps."""
        bad_ts_csv = (
            "source,source_record_id,event_date,event_timestamp,latitude,longitude\n"
            "HPSDMA_TEST,REC_001,invalid-date,invalid-time,32.2396,77.1887\n"
        )
        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as tmp_in:
            tmp_in.write(bad_ts_csv)
            tmp_in_path = tmp_in.name

        with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp_out:
            tmp_out_path = tmp_out.name

        try:
            with self.assertRaises(ValueError) as ctx:
                import_official_dataset(file_path=tmp_in_path, output_path=tmp_out_path)
            self.assertIn("timestamp format", str(ctx.exception))
        finally:
            if os.path.exists(tmp_in_path):
                os.remove(tmp_in_path)
            if os.path.exists(tmp_out_path):
                os.remove(tmp_out_path)

    def test_source_traceability(self):
        """7. Test strict retention of source and source_record_id."""
        with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
            tmp_out = tmp.name
        try:
            res = import_official_dataset(file_path=self.fixture_csv, output_path=tmp_out)
            self.assertTrue(res["source_traceability_intact"])
            with open(tmp_out, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                rows = list(reader)
            for row in rows:
                self.assertNotEqual(row["source"], "")
                self.assertNotEqual(row["source_record_id"], "")
        finally:
            if os.path.exists(tmp_out):
                os.remove(tmp_out)

    def test_target_mapping_not_approved(self):
        """8. Test TargetMappingNotApproved when mapping is unapproved."""
        mapper = TargetMapper()
        mapper.register_mapping("CWC", "Extreme", "critical")
        # mapper._approved is False by default
        with self.assertRaises(TargetMappingNotApproved):
            mapper.map_category("CWC", "Extreme")

    def test_target_mapping_not_configured(self):
        """9. Test TargetMappingNotConfigured when category has no explicit mapping."""
        mapper = TargetMapper()
        mapper.set_approval_status(True)
        with self.assertRaises(TargetMappingNotConfigured):
            mapper.map_category("CWC", "UnconfiguredCategory")

    def test_explicit_target_mapping(self):
        """10. Test explicit target mapping execution when configured and approved."""
        mapper = TargetMapper()
        mapper.register_mapping("CWC", "Severe", "high")
        mapper.set_approval_status(True)
        res = mapper.map_category("CWC", "Severe")
        self.assertEqual(res, "high")

    def test_duplicate_source_records_detection(self):
        """11. Test deduplication of exact duplicate source records."""
        dup_csv = (
            "source,source_record_id,event_date,event_timestamp,latitude,longitude\n"
            "HPSDMA_TEST,EVT_001,2023-07-10,2023-07-10T14:30:00,32.2396,77.1887\n"
            "HPSDMA_TEST,EVT_001,2023-07-10,2023-07-10T14:30:00,32.2396,77.1887\n"
        )
        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as tmp_in:
            tmp_in.write(dup_csv)
            tmp_in_path = tmp_in.name

        with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp_out:
            tmp_out_path = tmp_out.name

        try:
            res = import_official_dataset(file_path=tmp_in_path, output_path=tmp_out_path)
            self.assertEqual(res["records_imported"], 2)
            self.assertEqual(res["valid_records"], 1)
            self.assertEqual(res["duplicate_count"], 1)
        finally:
            if os.path.exists(tmp_in_path):
                os.remove(tmp_in_path)
            if os.path.exists(tmp_out_path):
                os.remove(tmp_out_path)

    def test_no_fabricated_values(self):
        """12. Test that missing optional fields remain explicitly empty without fabrication."""
        sparse_csv = (
            "source,source_record_id,event_date,event_timestamp,latitude,longitude\n"
            "HPSDMA_TEST,EVT_SPARSE,2023-07-10,2023-07-10T14:30:00,32.2396,77.1887\n"
        )
        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as tmp_in:
            tmp_in.write(sparse_csv)
            tmp_in_path = tmp_in.name

        with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp_out:
            tmp_out_path = tmp_out.name

        try:
            import_official_dataset(file_path=tmp_in_path, output_path=tmp_out_path)
            with open(tmp_out_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                rows = list(reader)
            row = rows[0]
            self.assertEqual(row["water_level_m"], "")
            self.assertEqual(row["discharge_cumecs"], "")
            self.assertEqual(row["fatalities"], "")
            self.assertEqual(row["severity_original"], "")
        finally:
            if os.path.exists(tmp_in_path):
                os.remove(tmp_in_path)
            if os.path.exists(tmp_out_path):
                os.remove(tmp_out_path)

if __name__ == "__main__":
    unittest.main()
