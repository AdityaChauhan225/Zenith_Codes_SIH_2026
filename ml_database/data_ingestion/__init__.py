"""
Data Ingestion Package
Exposes assemble_features_from_coords for real-time feature engineering.
"""

from .assembler import assemble_features_from_coords
from .validators import validate_12_features, validate_coordinates_and_timestamp
from .live import fetch_live_payload

__all__ = [
    "assemble_features_from_coords",
    "validate_12_features",
    "validate_coordinates_and_timestamp",
    "fetch_live_payload"
]
