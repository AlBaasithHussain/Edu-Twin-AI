import os
import joblib
import numpy as np
import pandas as pd

from app.core.config import settings
from app.ml.train_model import FEATURES, train

_model = None
_scaler = None


def _load():
    global _model, _scaler
    if _model is None or _scaler is None:
        if not (os.path.exists(settings.MODEL_PATH) and os.path.exists(settings.SCALER_PATH)):
            # Auto-train on first use if artifacts are missing
            train()
        _model = joblib.load(settings.MODEL_PATH)
        _scaler = joblib.load(settings.SCALER_PATH)
    return _model, _scaler


def predict_final_marks(
    attendance_percentage: float,
    average_marks: float,
    assignment_score: float,
    quiz_score: float,
    study_hours_per_day: float,
) -> float:
    model, scaler = _load()
    X = pd.DataFrame(
        [[attendance_percentage, average_marks, assignment_score, quiz_score, study_hours_per_day]],
        columns=FEATURES,
    )
    X_scaled = scaler.transform(X)
    pred = model.predict(X_scaled)[0]
    return float(np.clip(pred, 0, 100))


def compute_risk_level(predicted_final_marks: float, attendance_percentage: float) -> str:
    if predicted_final_marks < 45 or attendance_percentage < 60:
        return "High"
    if predicted_final_marks < 65 or attendance_percentage < 75:
        return "Medium"
    return "Low"
