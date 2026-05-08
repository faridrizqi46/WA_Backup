"""
Training script for Product Recommendation Models

This script trains XGBoost models for LC and SCF product recommendations.
Initially starts with synthetic data, can be retrained with real feedback.
"""

import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score, f1_score
import numpy as np
import json
from pathlib import Path

MODEL_DIR = Path(__file__).parent / "model"
MODEL_DIR.mkdir(exist_ok=True)

FEATURES = {
    "LC": [
        "internationalTradeActivity",
        "transactionValue",
        "paymentRiskExposure",
        "counterpartyTrustLevel",
        "documentationComplexity"
    ],
    "SCF": [
        "anchorCertainty",
        "tradeRelationship",
        "importExportActivity",
        "supplyChainRole",
        "workingCapitalPattern"
    ]
}


def generate_synthetic_data(parameter: str, n_samples: int = 1000) -> tuple:
    np.random.seed(42)
    features = FEATURES[parameter]

    X = np.random.randint(20, 100, size=(n_samples, len(features)))
    y = np.zeros(n_samples)

    if parameter == "SCF":
        y = ((X[:, 0] > 50) & (X[:, 1] > 50) & (X[:, 2] > 50)).astype(int)
    else:
        y = ((X[:, 0] > 60) & (X[:, 2] > 50)).astype(int)

    flip_indices = np.random.choice(n_samples, size=int(n_samples * 0.05), replace=False)
    y[flip_indices] = 1 - y[flip_indices]

    return X, y, features


def train_model(parameter: str):
    print(f"\n{'='*50}")
    print(f"Training model for: {parameter}")
    print(f"{'='*50}")

    X, y, feature_names = generate_synthetic_data(parameter)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"Training samples: {len(X_train)}")
    print(f"Test samples: {len(X_test)}")
    print(f"Positive class ratio: {y.mean():.2%}")

    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        objective='binary:logistic',
        eval_metric='auc',
        random_state=42
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    print(f"\nClassification Report:")
    print(classification_report(y_test, y_pred))

    auc = roc_auc_score(y_test, y_proba)
    print(f"ROC-AUC: {auc:.4f}")

    print(f"\nFeature Importance:")
    for name, imp in sorted(zip(feature_names, model.feature_importances_), key=lambda x: -x[1]):
        print(f"  {name}: {imp:.4f}")

    best_threshold = 0.5
    best_f1 = 0
    for t in np.arange(0.3, 0.7, 0.05):
        y_pred_t = (y_proba >= t).astype(int)
        f1 = f1_score(y_test, y_pred_t)
        if f1 > best_f1:
            best_f1 = f1
            best_threshold = t

    print(f"\nOptimal threshold: {best_threshold:.2f}")

    model_path = MODEL_DIR / f"{parameter.lower()}_model.json"
    model.save_model(str(model_path))
    print(f"Model saved: {model_path}")

    threshold_path = MODEL_DIR / f"{parameter.lower()}_threshold.txt"
    with open(threshold_path, 'w') as f:
        f.write(str(best_threshold))
    print(f"Threshold saved: {threshold_path}")

    feature_names_path = MODEL_DIR / f"{parameter.lower()}_features.json"
    with open(feature_names_path, 'w') as f:
        json.dump(feature_names, f, indent=2)
    print(f"Feature names saved: {feature_names_path}")

    return model, best_threshold


def main():
    print("Product Recommendation Model Training")
    print("="*50)

    for parameter in ["LC", "SCF"]:
        train_model(parameter)

    print("\n" + "="*50)
    print("Training Complete!")
    print("="*50)


if __name__ == "__main__":
    main()