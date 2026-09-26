"""
Test package initialization. Ensures ml_database directory is in sys.path.
"""
import sys
import os

_ML_DB_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ML_DB_DIR not in sys.path:
    sys.path.insert(0, _ML_DB_DIR)
