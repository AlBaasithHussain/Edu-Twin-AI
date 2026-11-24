"""
The AI Digital Twin: a computed, explainable profile summarizing how a
student is doing right now, built entirely from their existing data
(attendance, marks, assignments, quizzes, study hours) plus the trained
Random Forest prediction. Nothing here is a black box — every score is a
transparent weighted formula, and every recommendation traces back to a
specific signal.
"""
from statistics import mean
from typing import Optional

from sqlalchemy.orm import Session

from app.models.models import Marks, Subject, Prediction
from app.core.aggregates import (
    latest_attendance_avg, latest_marks_avg, latest_assignment_avg,
    latest_quiz_avg, latest_study_hours_avg,
)


def _clamp(value: float, lo: float = 0, hi: float = 100) -> float:
    return max(lo, min(hi, value))


def compute_health_score(attendance: float, marks: float, assignment: float, study_hours: float) -> float:
    """
    Academic Health Score (0-100): a snapshot of overall wellbeing across
    the fundamentals — are they showing up, are they scoring well, are they
    keeping pace with work, are they putting in the time.
    """
    study_component = min(study_hours / 3.0, 1.0) * 100  # 3+ hrs/day = full marks on this component
    score = 0.35 * attendance + 0.30 * marks + 0.15 * assignment + 0.20 * study_component
    return round(_clamp(score), 1)


def compute_learning_score(quiz_avg: float, assignment_avg: float, any_late: bool) -> float:
    """
    Learning Score (0-100): how well concepts seem to be landing, based on
    quiz performance and assignment quality — penalized slightly for
    consistently late submissions, which usually signals rushed learning.
    """
    score = 0.6 * quiz_avg + 0.4 * assignment_avg
    if any_late:
        score -= 5
    return round(_clamp(score), 1)


def subject_breakdown(db: Session, student_id: int, top_n: int = 3):
    """Returns (strong_subjects, weak_subjects) as lists of {subject, marks} dicts."""
    rows = db.query(Marks).filter(Marks.student_id == student_id).all()
    if not rows:
        return [], []
    ranked = sorted(rows, key=lambda r: r.internal_marks, reverse=True)
    strong = [{"subject": r.subject.name if r.subject else "Unknown", "marks": r.internal_marks} for r in ranked[:top_n]]
    weak = [{"subject": r.subject.name if r.subject else "Unknown", "marks": r.internal_marks} for r in ranked[-top_n:]][::-1]
    return strong, weak


def build_study_plan(weak_subjects: list, study_hours_avg: float) -> list:
    """
    A simple, explainable weekly study planner: more time allocated to the
    weakest subjects, spread across the week. Not AI-generated content —
    a transparent rule: weakest subject gets the most days.
    """
    if not weak_subjects:
        return []

    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    daily_hours = round(max(study_hours_avg, 1.0), 1)
    plan = []
    for i, day in enumerate(days):
        subject = weak_subjects[i % len(weak_subjects)]["subject"]
        # weekends get a lighter, revision-style session
        session_type = "Revision" if day in ("Saturday", "Sunday") else "Focused study"
        plan.append({"day": day, "subject": subject, "hours": daily_hours, "type": session_type})
    return plan


def build_digital_twin(db: Session, student_id: int, latest_prediction: Optional[Prediction] = None) -> dict:
    attendance = latest_attendance_avg(db, student_id)
    marks = latest_marks_avg(db, student_id)
    assignment_avg, any_late = latest_assignment_avg(db, student_id)
    quiz_avg = latest_quiz_avg(db, student_id)
    study_hours = latest_study_hours_avg(db, student_id)

    strong_subjects, weak_subjects = subject_breakdown(db, student_id)
    health_score = compute_health_score(attendance, marks, assignment_avg, study_hours)
    learning_score = compute_learning_score(quiz_avg, assignment_avg, any_late)
    study_plan = build_study_plan(weak_subjects, study_hours)

    return {
        "health_score": health_score,
        "learning_score": learning_score,
        "strong_subjects": strong_subjects,
        "weak_subjects": weak_subjects,
        "study_plan": study_plan,
        "predicted_final_marks": latest_prediction.predicted_final_marks if latest_prediction else None,
        "risk_level": latest_prediction.risk_level if latest_prediction else None,
    }
