"""
Dataset Validation Module for Himachal Pradesh Flash Flood Training CSV.
Validates exact 13-column schema, numeric ranges, enum values, temporal ascending order,
duplicate detection, missing values, and temporal leakage constraints.
"""

import csv
from datetime import datetime
from typing import List, Dict, Any, Tuple

EXPECTED_13_COLUMNS = [
    "timestamp",
    "rainfall_1h_mm",
    "rainfall_3h_mm",
    "rainfall_6h_mm",
    "rainfall_24h_mm",
    "soil_saturation_index",
    "slope_degrees",
    "elevation_m",
    "aspect",
    "distance_to_nearest_stream_m",
    "historical_incident_density",
    "land_cover_class",
    "antecedent_moisture_condition",
    "risk_level"
]

VALID_LAND_COVER = {"forest", "agriculture", "urban", "barren"}
VALID_AMC = {"dry", "normal", "wet"}
VALID_RISK_LEVELS = {"low", "medium", "high", "critical"}

def parse_timestamp(ts_str: str) -> datetime:
    """
    Parses timestamp string in standard formats.
    """
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%S%z"):
        try:
            return datetime.strptime(ts_str, fmt)
        except ValueError:
            pass
    return datetime.fromisoformat(ts_str)

def validate_training_dataset_rows(rows: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Validates in-memory list of dictionary rows against dataset requirements.
    """
    if not rows:
        raise ValueError("Dataset is empty: 0 rows found.")

    # 1. Check column schema on first row
    first_row_cols = list(rows[0].keys())
    if first_row_cols != EXPECTED_13_COLUMNS:
        raise ValueError(f"CSV column mismatch.\nExpected: {EXPECTED_13_COLUMNS}\nGot: {first_row_cols}")

    seen_records = set()
    prev_dt = None

    for idx, row in enumerate(rows):
        line_num = idx + 2  # header is line 1

        # 2. Missing values check
        for k, v in row.items():
            if v is None or str(v).strip() == "":
                raise ValueError(f"Missing value for column '{k}' at row {line_num}")

        # 3. Duplicate check
        rec_tuple = tuple(row[k] for k in EXPECTED_13_COLUMNS)
        if rec_tuple in seen_records:
            raise ValueError(f"Duplicate row detected at row {line_num}")
        seen_records.add(rec_tuple)

        # 4. Timestamp & Chronological Order check
        ts_str = row["timestamp"]
        try:
            dt = parse_timestamp(ts_str)
        except Exception as err:
            raise ValueError(f"Invalid timestamp format '{ts_str}' at row {line_num}: {err}")

        if prev_dt is not None:
            if dt < prev_dt:
                raise ValueError(f"Temporal order violation at row {line_num}: timestamp {dt} is earlier than previous timestamp {prev_dt}")
        prev_dt = dt

        # 5. Numeric & Accumulation checks
        r1 = float(row["rainfall_1h_mm"])
        r3 = float(row["rainfall_3h_mm"])
        r6 = float(row["rainfall_6h_mm"])
        r24 = float(row["rainfall_24h_mm"])
        soil = float(row["soil_saturation_index"])
        slope = float(row["slope_degrees"])
        elev = float(row["elevation_m"])
        aspect = float(row["aspect"])
        dist_stream = float(row["distance_to_nearest_stream_m"])
        hist_dens = float(row["historical_incident_density"])

        if r1 < 0:
            raise ValueError(f"rainfall_1h_mm < 0 at row {line_num}: {r1}")
        if r3 < r1:
            raise ValueError(f"Rainfall monotonicity violation (3h < 1h) at row {line_num}: {r3} < {r1}")
        if r6 < r3:
            raise ValueError(f"Rainfall monotonicity violation (6h < 3h) at row {line_num}: {r6} < {r3}")
        if r24 < r6:
            raise ValueError(f"Rainfall monotonicity violation (24h < 6h) at row {line_num}: {r24} < {r6}")

        if not (0.0 <= soil <= 1.0):
            raise ValueError(f"soil_saturation_index out of bounds [0, 1] at row {line_num}: {soil}")
        if not (5.0 <= slope <= 65.0):
            raise ValueError(f"slope_degrees out of bounds [5, 65] at row {line_num}: {slope}")
        if not (300.0 <= elev <= 3800.0):
            raise ValueError(f"elevation_m out of bounds [300, 3800] at row {line_num}: {elev}")
        if not (0.0 <= aspect <= 360.0):
            raise ValueError(f"aspect out of bounds [0, 360] at row {line_num}: {aspect}")
        if not (5.0 <= dist_stream <= 2500.0):
            raise ValueError(f"distance_to_nearest_stream_m out of bounds [5, 2500] at row {line_num}: {dist_stream}")
        if not (0.0 <= hist_dens <= 5.0):
            raise ValueError(f"historical_incident_density out of bounds [0, 5] at row {line_num}: {hist_dens}")

        # 6. Categorical Enums
        lc = row["land_cover_class"]
        if lc not in VALID_LAND_COVER:
            raise ValueError(f"Invalid land_cover_class '{lc}' at row {line_num}")

        amc = row["antecedent_moisture_condition"]
        if amc not in VALID_AMC:
            raise ValueError(f"Invalid antecedent_moisture_condition '{amc}' at row {line_num}")

        risk = row["risk_level"]
        if risk not in VALID_RISK_LEVELS:
            raise ValueError(f"Invalid risk_level '{risk}' at row {line_num}")

    return {
        "valid": True,
        "total_rows": len(rows),
        "columns": EXPECTED_13_COLUMNS,
        "first_timestamp": str(parse_timestamp(rows[0]["timestamp"])),
        "last_timestamp": str(parse_timestamp(rows[-1]["timestamp"]))
    }

def validate_csv_file(file_path: str) -> Dict[str, Any]:
    """
    Reads CSV file and validates schema and constraints.
    """
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    return validate_training_dataset_rows(rows)

def perform_temporal_split(rows: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Splits rows chronologically: TRAIN (2020-2023) and TEST (2024).
    Prevents temporal leakage across train/test boundary.
    """
    train_rows = []
    test_rows = []

    for row in rows:
        dt = parse_timestamp(str(row["timestamp"]))
        if dt.year < 2024:
            train_rows.append(row)
        else:
            test_rows.append(row)

    return train_rows, test_rows
