# Data Request Package Overview

This directory contains formal institutional data request documentation for acquiring official, machine-readable historical disaster incident logs and river gauge telemetry for Himachal Pradesh (2020–2024).

---

## Package Contents

1. [`HPSDMA_CWC_DATA_REQUEST.md`](file:///c:/MyPROJECT/ML%20Database/docs/data_request/HPSDMA_CWC_DATA_REQUEST.md): Formal data access request document suitable for submission to HPSDMA, CWC, NWIC, and state disaster management departments.
2. [`DATA_RECEIPT_CHECKLIST.md`](file:///c:/MyPROJECT/ML%20Database/docs/data_request/DATA_RECEIPT_CHECKLIST.md): Quality assurance and audit checklist to execute immediately when official data files are received.

---

## Data Scope & Target Geography

- **Target State**: Himachal Pradesh
- **Target Catchments**: Beas Basin, Parvati Valley, Sutlej Basin, Kangra/Ravi Region
- **Target Watchpoints**: Manali, Kullu, Mandi, Pandoh, Kasol, Manikaran, Rampur, Shimla, Dharamshala, Palampur, Chamba
- **Date Range**: January 1, 2020 through December 31, 2024 (Priority focus: June 15 – September 30 monsoon season)

---

## Storage & Processing Guidelines

1. **Storage Location**: Store all incoming, untouched raw data files under `data/raw/<source_name>/` (e.g. `data/raw/hpsdma/` or `data/raw/cwc/`).
2. **Raw File Immutability**: NEVER edit, overwrite, rename columns in, or delete raw incoming files.
3. **Normalized Output**: Use `training/import_official_historical.py` to parse raw source files into normalized representations under `data/processed/`.
4. **Target Label Policy**: DO NOT automatically rename official warning levels or severity classifications into `low`, `medium`, `high`, `critical`. Preserve original source fields until an explicit target mapping is approved via `training/target_mapping.py`.
