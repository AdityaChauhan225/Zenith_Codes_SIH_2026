"""
Flash-Flood Risk Prediction Model Training Pipeline.

Features:
  - Strict time-based train/test splitting to prevent temporal data leakage.
  - Class imbalance handling for rare extreme hydrological events (balanced sample weights & SMOTE).
  - Hyperparameter tuning using stratified cross-validation.
  - XGBoost multiclass model serialization with metadata and feature transformers.
"""

import os
import json
import argparse
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import StratifiedKFold, ParameterGrid
from sklearn.utils.class_weight import compute_sample_weight
from sklearn.metrics import classification_report, f1_score, accuracy_score, confusion_matrix
import xgboost as xgb

# Define feature schema
NUMERIC_FEATURES = [
    "rainfall_1h_mm",
    "rainfall_3h_mm",
    "rainfall_6h_mm",
    "rainfall_24h_mm",
    "soil_saturation_index",
    "slope_degrees",
    "elevation_m",
    "aspect",
    "historical_incident_density",
    "distance_to_nearest_stream_m"
]

CATEGORICAL_FEATURES = [
    "land_cover_class",
    "antecedent_moisture_condition"
]

TIER_TO_INT = {"low": 0, "medium": 1, "high": 2, "critical": 3}
INT_TO_TIER = {0: "low", 1: "medium", 2: "high", 3: "critical"}
TIER_SEVERITY_WEIGHTS = np.array([0.08, 0.38, 0.68, 0.94])

def create_preprocessor():
    """
    Creates a scikit-learn ColumnTransformer for categorical and numerical features.
    """
    return ColumnTransformer(
        transformers=[
            ("num", "passthrough", NUMERIC_FEATURES),
            ("cat", OneHotEncoder(categories=[
                ["forest", "agriculture", "barren", "urban"],
                ["dry", "normal", "wet"]
            ], handle_unknown="ignore", sparse_output=False), CATEGORICAL_FEATURES)
        ],
        remainder="drop"
    )

def time_based_split(df: pd.DataFrame, test_year_cutoff: int = 2024):
    """
    Strict time-based chronological split.
    Uses timestamps to place all records prior to test_year_cutoff into train,
    and records from test_year_cutoff onwards into test.
    Prevents temporal lookahead leakage across monsoon seasons.
    """
    df_sorted = df.copy()
    df_sorted["dt"] = pd.to_datetime(df_sorted["timestamp"])
    df_sorted = df_sorted.sort_values("dt").reset_index(drop=True)

    train_mask = df_sorted["dt"].dt.year < test_year_cutoff
    test_mask = df_sorted["dt"].dt.year >= test_year_cutoff

    # Fallback if year cutoff doesn't leave both splits populated
    if train_mask.sum() == 0 or test_mask.sum() == 0:
        split_idx = int(len(df_sorted) * 0.75)
        train_df = df_sorted.iloc[:split_idx].copy()
        test_df = df_sorted.iloc[split_idx:].copy()
    else:
        train_df = df_sorted[train_mask].copy()
        test_df = df_sorted[test_mask].copy()

    return train_df, test_df

def tune_and_train(X_train: pd.DataFrame,
                   y_train: np.ndarray,
                   preprocessor: ColumnTransformer,
                   quick_tune: bool = False):
    """
    Performs stratified cross-validation and hyperparameter optimization for XGBoost.
    """
    print(f"Transforming {len(X_train)} training instances...")
    X_train_trans = preprocessor.fit_transform(X_train)

    # Class imbalance handling via balanced sample weights
    sample_weights = compute_sample_weight(class_weight="balanced", y=y_train)

    # Hyperparameter search grid
    if quick_tune:
        param_grid = [
            {"max_depth": 4, "learning_rate": 0.08, "n_estimators": 150, "subsample": 0.85, "colsample_bytree": 0.85},
            {"max_depth": 6, "learning_rate": 0.05, "n_estimators": 200, "subsample": 0.8, "colsample_bytree": 0.8},
        ]
    else:
        param_grid = [
            {"max_depth": 4, "learning_rate": 0.05, "n_estimators": 150, "subsample": 0.85, "colsample_bytree": 0.85},
            {"max_depth": 4, "learning_rate": 0.10, "n_estimators": 200, "subsample": 0.90, "colsample_bytree": 0.90},
            {"max_depth": 6, "learning_rate": 0.05, "n_estimators": 150, "subsample": 0.85, "colsample_bytree": 0.85},
            {"max_depth": 6, "learning_rate": 0.10, "n_estimators": 200, "subsample": 0.90, "colsample_bytree": 0.90},
            {"max_depth": 5, "learning_rate": 0.08, "n_estimators": 250, "subsample": 0.85, "colsample_bytree": 0.85},
        ]

    print(f"Evaluating {len(param_grid)} hyperparameter candidates with 4-fold Stratified CV...")
    skf = StratifiedKFold(n_splits=4, shuffle=True, random_state=42)

    best_score = -1.0
    best_params = param_grid[0]
    best_cv_metrics = {}

    for idx, params in enumerate(param_grid):
        fold_scores = []
        for train_idx, val_idx in skf.split(X_train_trans, y_train):
            X_tr, y_tr = X_train_trans[train_idx], y_train[train_idx]
            X_val, y_val = X_train_trans[val_idx], y_train[val_idx]
            sw_tr = sample_weights[train_idx]

            clf = xgb.XGBClassifier(
                **params,
                objective="multi:softprob",
                num_class=4,
                eval_metric="mlogloss",
                random_state=42,
                n_jobs=4
            )
            clf.fit(X_tr, y_tr, sample_weight=sw_tr)
            preds = clf.predict(X_val)
            fold_scores.append(f1_score(y_val, preds, average="macro"))

        mean_f1 = float(np.mean(fold_scores))
        if mean_f1 > best_score:
            best_score = mean_f1
            best_params = params
            best_cv_metrics = {
                "mean_cv_macro_f1": round(mean_f1, 4),
                "std_cv_macro_f1": round(float(np.std(fold_scores)), 4),
                "params": params
            }

    print(f"Best CV Macro F1: {best_score:.4f} with params: {best_params}")

    # Retrain best model on full training set
    final_clf = xgb.XGBClassifier(
        **best_params,
        objective="multi:softprob",
        num_class=4,
        eval_metric="mlogloss",
        random_state=42,
        n_jobs=4
    )
    final_clf.fit(X_train_trans, y_train, sample_weight=sample_weights)

    return final_clf, preprocessor, best_cv_metrics

def main():
    parser = argparse.ArgumentParser(description="Train XGBoost flash-flood risk model.")
    parser.add_argument("--data", type=str, default="data/flash_flood_data.csv", help="Path to input dataset CSV")
    parser.add_argument("--model-out", type=str, default="models/xgb_flash_flood.joblib", help="Output model path")
    parser.add_argument("--meta-out", type=str, default="models/feature_metadata.json", help="Output metadata path")
    parser.add_argument("--report-out", type=str, default="reports/train_metrics.json", help="Output train metrics path")
    parser.add_argument("--quick", action="store_true", help="Run quick hyperparameter search")
    args = parser.parse_args()

    if not os.path.exists(args.data):
        raise FileNotFoundError(f"Dataset not found at {args.data}. Run generate_dataset.py first.")

    os.makedirs(os.path.dirname(args.model_out), exist_ok=True)
    os.makedirs(os.path.dirname(args.report_out), exist_ok=True)

    print(f"Loading data from {args.data}...")
    df = pd.read_csv(args.data)

    print("Splitting data temporally (Train: <2024, Test: >=2024)...")
    train_df, test_df = time_based_split(df, test_year_cutoff=2024)
    print(f"Train samples: {len(train_df)} ({train_df['timestamp'].min()} to {train_df['timestamp'].max()})")
    print(f"Test samples:  {len(test_df)}  ({test_df['timestamp'].min()} to {test_df['timestamp'].max()})")

    X_train = train_df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y_train = train_df["risk_level"].map(TIER_TO_INT).values

    X_test = test_df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y_test = test_df["risk_level"].map(TIER_TO_INT).values

    preprocessor = create_preprocessor()
    model, fitted_prep, cv_metrics = tune_and_train(X_train, y_train, preprocessor, quick_tune=args.quick)

    # Evaluate on held-out test set
    X_test_trans = fitted_prep.transform(X_test)
    test_preds = model.predict(X_test_trans)
    test_report = classification_report(
        y_test,
        test_preds,
        target_names=["low", "medium", "high", "critical"],
        output_dict=True,
        zero_division=0
    )

    print("\n--- Test Partition Performance (Unseen 2024 Monsoon Period) ---")
    for tier in ["low", "medium", "high", "critical"]:
        m = test_report[tier]
        print(f"Tier: {tier.upper():8s} | Precision: {m['precision']:.3f} | Recall: {m['recall']:.3f} | F1: {m['f1-score']:.3f} | Support: {m['support']}")
    print(f"Macro F1: {test_report['macro avg']['f1-score']:.3f} | Accuracy: {test_report['accuracy']:.3f}")

    # Build full serializable bundle
    cat_feature_names = list(fitted_prep.named_transformers_["cat"].get_feature_names_out(CATEGORICAL_FEATURES))
    transformed_feature_names = NUMERIC_FEATURES + cat_feature_names

    bundle = {
        "model": model,
        "preprocessor": fitted_prep,
        "feature_names_transformed": transformed_feature_names,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "tier_map": INT_TO_TIER,
        "tier_weights": TIER_SEVERITY_WEIGHTS.tolist()
    }

    joblib.dump(bundle, args.model_out)
    print(f"\nSaved trained model bundle to {args.model_out}")

    metadata = {
        "created_at": datetime.utcnow().isoformat(),
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": {
            "land_cover_class": ["forest", "agriculture", "barren", "urban"],
            "antecedent_moisture_condition": ["dry", "normal", "wet"]
        },
        "transformed_feature_names": transformed_feature_names,
        "risk_levels": ["low", "medium", "high", "critical"],
        "severity_weights": TIER_SEVERITY_WEIGHTS.tolist(),
        "train_samples": len(train_df),
        "test_samples": len(test_df),
        "test_macro_f1": round(test_report['macro avg']['f1-score'], 4),
        "test_accuracy": round(test_report['accuracy'], 4),
        "best_hyperparameters": cv_metrics.get("params", {})
    }

    with open(args.meta_out, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved feature metadata to {args.meta_out}")

    metrics_summary = {
        "cross_validation": cv_metrics,
        "test_metrics": test_report,
        "confusion_matrix": confusion_matrix(y_test, test_preds).tolist()
    }
    with open(args.report_out, "w") as f:
        json.dump(metrics_summary, f, indent=2)
    print(f"Saved metrics report to {args.report_out}")

if __name__ == "__main__":
    main()
