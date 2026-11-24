"""
Generates a synthetic academic performance dataset used to train the
Random Forest regression model that predicts a student's final marks.

Run directly:
    python -m app.ml.generate_dataset
"""
import os
import numpy as np
import pandas as pd

np.random.seed(42)

N = 1200  # number of synthetic student-records


def generate(n: int = N) -> pd.DataFrame:
    attendance = np.clip(np.random.normal(78, 14, n), 30, 100)
    internal_marks = np.clip(np.random.normal(62, 16, n), 0, 100)
    assignment_score = np.clip(np.random.normal(70, 18, n), 0, 100)
    quiz_score = np.clip(np.random.normal(65, 17, n), 0, 100)
    study_hours = np.clip(np.random.normal(2.2, 1.1, n), 0, 6)

    # Ground truth final marks: weighted combination + noise
    noise = np.random.normal(0, 5, n)
    final_marks = (
        0.30 * attendance
        + 0.30 * internal_marks
        + 0.15 * assignment_score
        + 0.15 * quiz_score
        + 6.0 * study_hours
        + noise
    )
    final_marks = np.clip(final_marks, 0, 100)

    df = pd.DataFrame({
        "attendance_percentage": attendance.round(1),
        "average_marks": internal_marks.round(1),
        "assignment_score": assignment_score.round(1),
        "quiz_score": quiz_score.round(1),
        "study_hours_per_day": study_hours.round(2),
        "final_marks": final_marks.round(1),
    })
    return df


if __name__ == "__main__":
    df = generate()
    out_path = os.path.join(os.path.dirname(__file__), "artifacts", "student_dataset.csv")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} rows -> {out_path}")
