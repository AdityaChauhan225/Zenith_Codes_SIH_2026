# Model Evaluation & ML Readiness Report

## 1. Executive Summary & Training Status

**ML TRAINING STATUS: BLOCKED**

No machine-learning model (`model.pkl`, `model.joblib`, `model.onnx`) was trained in this phase. Per strict data integrity policies, supervised model training cannot take place until authoritative historical target labels are imported from official sources (HPSDMA / CWC) and formally approved.

---

## 2. Prepared Evaluation Protocol

When official ground-truth dataset files are imported via `training/import_official_historical.py` and mapped via `training/target_mapping.py`, the training pipeline will execute the following evaluation protocol:

### A. Chronological Temporal Holdout Split
- **Training Set**: 2020–2023 observations (Monsoon storm seasons)
- **Testing Set**: 2024 observations (Monsoon storm season)
- **Rule**: Strict temporal cutoff at `2024-01-01 00:00:00`. No random shuffling or cross-validation sampling across the 2023/2024 boundary to prevent temporal leakage.

### B. Preprocessing & Feature Encoding Pipeline
- **Numerical Features** (`rainfall_1h_mm`, `rainfall_3h_mm`, `rainfall_6h_mm`, `rainfall_24h_mm`, `soil_saturation_index`, `slope_degrees`, `elevation_m`, `aspect`, `historical_incident_density`, `distance_to_nearest_stream_m`): Preprocessed using `StandardScaler`.
- **Categorical Features** (`land_cover_class`, `antecedent_moisture_condition`): Encoded using `OneHotEncoder(handle_unknown='ignore')`.
- **Pipeline Assembly**: Combined via `ColumnTransformer` and serialized along with the classifier to prevent data leakage between train and test splits.

### C. Multiclass Metrics Protocol
Upon training, the following metrics will be calculated and reported:
- **Overall Accuracy**
- **Macro F1-Score & Weighted F1-Score**
- **Per-Class Precision, Recall, and F1-Score** (`low`, `medium`, `high`, `critical`)
- **Multiclass Confusion Matrix**
- **Multiclass Log Loss / Brier Score** (where probability outputs are available)

---

## 3. Artifact Serialization Spec

Final trained model pipelines will be saved as:
- **Model Pipeline**: `models/himachal_flash_flood_model.joblib`
- **Model Metadata**: `models/model_metadata.json`

Metadata payload will store:
```json
{
  "model_type": "RandomForestClassifier / XGBoost",
  "feature_contract": [
    "rainfall_1h_mm", "rainfall_3h_mm", "rainfall_6h_mm", "rainfall_24h_mm",
    "soil_saturation_index", "slope_degrees", "elevation_m", "aspect",
    "historical_incident_density", "land_cover_class", "distance_to_nearest_stream_m",
    "antecedent_moisture_condition"
  ],
  "training_period": "2020-2023",
  "test_period": "2024",
  "target_classes": ["low", "medium", "high", "critical"],
  "evaluation_metrics": {}
}
```

---

## 4. Policy Compliance

- **Zero Synthetic Metrics**: No fake accuracy, F1-scores, or confusion matrices were reported.
- **Demonstrator Status**: The current `predict.py` module remains a heuristic demonstrator until a trained model pipeline artifact is generated from legitimate historical data.
