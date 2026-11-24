"""
Trains a Random Forest Regressor to predict a student's final marks from
attendance, internal marks, assignment score, quiz score and study hours.

Also produces:
 - model.pkl               (trained RandomForestRegressor)
 - scaler.pkl              (StandardScaler fitted on features)
 - metrics.json             (MAE, RMSE, R2 on held-out test set)
 - feature_importance.png   (bar chart of feature importances)

Run directly:
    python -m app.ml.train_model
"""
import os
import json

import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from app.ml.generate_dataset import generate

ARTIFACT_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
FEATURES = [
    "attendance_percentage",
    "average_marks",
    "assignment_score",
    "quiz_score",
    "study_hours_per_day",
]
TARGET = "final_marks"


def train():
    os.makedirs(ARTIFACT_DIR, exist_ok=True)

    dataset_path = os.path.join(ARTIFACT_DIR, "student_dataset.csv")
    if os.path.exists(dataset_path):
        df = pd.read_csv(dataset_path)
    else:
        df = generate()
        df.to_csv(dataset_path, index=False)

    X = df[FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = RandomForestRegressor(
        n_estimators=300,
        max_depth=10,
        min_samples_leaf=3,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train_scaled, y_train)

    preds = model.predict(X_test_scaled)
    mae = mean_absolute_error(y_test, preds)
    rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
    r2 = r2_score(y_test, preds)

    metrics = {"mae": round(mae, 3), "rmse": round(rmse, 3), "r2_score": round(r2, 3)}
    with open(os.path.join(ARTIFACT_DIR, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    # Feature importance chart
    importances = model.feature_importances_
    order = np.argsort(importances)
    plt.figure(figsize=(7, 4))
    plt.barh([FEATURES[i] for i in order], importances[order], color="#6D5BD0")
    plt.title("Feature Importance - Final Marks Prediction")
    plt.xlabel("Importance")
    plt.tight_layout()
    plt.savefig(os.path.join(ARTIFACT_DIR, "feature_importance.png"))
    plt.close()

    joblib.dump(model, os.path.join(ARTIFACT_DIR, "model.pkl"))
    joblib.dump(scaler, os.path.join(ARTIFACT_DIR, "scaler.pkl"))

    print("Training complete.")
    print("Metrics:", metrics)
    return metrics


if __name__ == "__main__":
    train()
