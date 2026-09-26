"""
Model Evaluation and Explainability Analysis Suite.

Computes:
  - Precision, Recall, and F1-score per risk tier (low, medium, high, critical).
  - Multi-class Confusion Matrix with percentage annotations.
  - Global and local SHAP summary visualizations (beeswarm and feature importance).
  - Out-of-time temporal performance report.
"""

import os
import json
import argparse
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt
from sklearn.metrics import classification_report, confusion_matrix, cohen_kappa_score
import shap

from train import time_based_split, NUMERIC_FEATURES, CATEGORICAL_FEATURES, TIER_TO_INT, INT_TO_TIER

def plot_confusion_matrix(y_true, y_pred, class_names, output_path: str):
    """
    Plots a visually clean confusion matrix with counts and percentages.
    """
    cm = confusion_matrix(y_true, y_pred)
    cm_norm = cm.astype('float') / (cm.sum(axis=1)[:, np.newaxis] + 1e-9)

    fig, ax = plt.subplots(figsize=(8, 6), dpi=300)
    cax = ax.matshow(cm, cmap="Blues")
    fig.colorbar(cax)

    ax.set_xticks(range(len(class_names)))
    ax.set_yticks(range(len(class_names)))
    ax.set_xticklabels(class_names, fontsize=11, fontweight="bold")
    ax.set_yticklabels(class_names, fontsize=11, fontweight="bold")
    ax.set_xlabel("Predicted Flash-Flood Risk Tier", fontsize=12, fontweight="bold", labelpad=10)
    ax.set_ylabel("Actual Ground Truth Tier", fontsize=12, fontweight="bold", labelpad=10)
    ax.set_title("Flash-Flood Risk Confusion Matrix (Out-of-Time Test Set)", fontsize=13, fontweight="bold", pad=20)

    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            cell_text = f"{cm[i, j]}\n({cm_norm[i, j]:.1%})"
            color = "white" if cm[i, j] > (cm.max() / 2) else "black"
            ax.text(j, i, cell_text, ha="center", va="center", color=color, fontsize=10, fontweight="bold")

    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()
    print(f"Saved confusion matrix plot to {output_path}")

def generate_shap_plots(model, X_trans, feature_names, reports_dir: str):
    """
    Generates SHAP beeswarm and global feature importance plots.
    """
    print("Generating SHAP explanations on test partition...")
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_trans)

    # In multiclass, shap_values can be a list of 4 arrays or shape (N, feats, 4)
    # Target high & critical classes (index 2 & 3) to illustrate flash flood hazards
    if isinstance(shap_values, list):
        # Contribution towards high/critical risk
        combined_shap = shap_values[2] + shap_values[3]
    elif len(shap_values.shape) == 3:
        combined_shap = shap_values[:, :, 2] + shap_values[:, :, 3]
    else:
        combined_shap = shap_values

    # 1. SHAP Beeswarm Summary Plot
    summary_path = os.path.join(reports_dir, "shap_summary.png")
    plt.figure(figsize=(10, 7), dpi=300)
    shap.summary_plot(combined_shap, X_trans, feature_names=feature_names, show=False)
    plt.title("SHAP Feature Drivers for Elevated Flash-Flood Risk (High / Critical)", fontsize=12, fontweight="bold", pad=15)
    plt.tight_layout()
    plt.savefig(summary_path)
    plt.close()
    print(f"Saved SHAP summary beeswarm plot to {summary_path}")

    # 2. SHAP Bar Plot (Global Mean Absolute Importance)
    bar_path = os.path.join(reports_dir, "shap_bar.png")
    plt.figure(figsize=(10, 6), dpi=300)
    shap.summary_plot(combined_shap, X_trans, feature_names=feature_names, plot_type="bar", show=False)
    plt.title("Top Global Risk Predictors (Mean |SHAP Value|)", fontsize=12, fontweight="bold", pad=15)
    plt.tight_layout()
    plt.savefig(bar_path)
    plt.close()
    print(f"Saved SHAP bar plot to {bar_path}")

def main():
    parser = argparse.ArgumentParser(description="Evaluate flash-flood risk model on unseen test split.")
    parser.add_argument("--data", type=str, default="data/flash_flood_data.csv", help="Path to full dataset CSV")
    parser.add_argument("--model", type=str, default="models/xgb_flash_flood.joblib", help="Path to trained model")
    parser.add_argument("--reports-dir", type=str, default="reports", help="Directory to save evaluation reports")
    args = parser.parse_args()

    if not os.path.exists(args.model):
        raise FileNotFoundError(f"Model not found at {args.model}. Run train.py first.")
    if not os.path.exists(args.data):
        raise FileNotFoundError(f"Dataset not found at {args.data}. Run generate_dataset.py first.")

    os.makedirs(args.reports_dir, exist_ok=True)

    print(f"Loading bundle from {args.model}...")
    bundle = joblib.load(args.model)
    model = bundle["model"]
    preprocessor = bundle["preprocessor"]
    feature_names = bundle["feature_names_transformed"]

    df = pd.read_csv(args.data)
    _, test_df = time_based_split(df, test_year_cutoff=2024)
    print(f"Evaluating on {len(test_df)} unseen test samples ({test_df['timestamp'].min()} to {test_df['timestamp'].max()})...")

    X_test = test_df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y_test = test_df["risk_level"].map(TIER_TO_INT).values

    X_test_trans = preprocessor.transform(X_test)
    y_pred = model.predict(X_test_trans)
    y_proba = model.predict_proba(X_test_trans)

    class_names = ["low", "medium", "high", "critical"]
    report_dict = classification_report(
        y_test, y_pred, target_names=class_names, output_dict=True, zero_division=0
    )
    report_text = classification_report(
        y_test, y_pred, target_names=class_names, zero_division=0
    )
    kappa = cohen_kappa_score(y_test, y_pred)

    print("\n" + "=" * 55)
    print("FLASH-FLOOD RISK MODEL EVALUATION REPORT (TEST SET)")
    print("=" * 55)
    print(report_text)
    print(f"Cohen's Kappa (Inter-Tier Agreement): {kappa:.4f}")
    print("=" * 55 + "\n")

    # Generate plots
    cm_path = os.path.join(args.reports_dir, "confusion_matrix.png")
    plot_confusion_matrix(y_test, y_pred, class_names, cm_path)

    # Subsample for SHAP computation if test set is large
    sample_size = min(500, len(X_test_trans))
    indices = np.random.RandomState(42).choice(len(X_test_trans), size=sample_size, replace=False)
    generate_shap_plots(model, X_test_trans[indices], feature_names, args.reports_dir)

    # Save structured evaluation report
    eval_json_path = os.path.join(args.reports_dir, "evaluation_report.json")
    eval_summary = {
        "test_partition": {
            "num_samples": len(test_df),
            "start_time": test_df["timestamp"].min(),
            "end_time": test_df["timestamp"].max(),
        },
        "metrics": {
            "accuracy": round(report_dict["accuracy"], 4),
            "macro_f1": round(report_dict["macro avg"]["f1-score"], 4),
            "weighted_f1": round(report_dict["weighted avg"]["f1-score"], 4),
            "cohen_kappa": round(kappa, 4),
            "per_tier": {
                tier: {
                    "precision": round(report_dict[tier]["precision"], 4),
                    "recall": round(report_dict[tier]["recall"], 4),
                    "f1_score": round(report_dict[tier]["f1-score"], 4),
                    "support": int(report_dict[tier]["support"])
                }
                for tier in class_names
            }
        },
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist()
    }

    with open(eval_json_path, "w") as f:
        json.dump(eval_summary, f, indent=2)
    print(f"Saved evaluation report JSON to {eval_json_path}")

if __name__ == "__main__":
    main()
