from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.aggregates import (
    latest_attendance_avg, latest_marks_avg, latest_assignment_avg,
    latest_quiz_avg, latest_study_hours_avg, weakest_subject,
)
from app.ml.prediction import predict_final_marks, compute_risk_level
from app.ml.recommendation import generate_recommendations
from app.core import gamification
from app.models.models import Student, User, Prediction, Recommendation
from app.schemas.schemas import PredictionOut, PredictionInput

router = APIRouter(prefix="/api/predictions", tags=["Predictions"])


def _authorize(current_user: User, student: Student):
    if current_user.role.value == "student" and student.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if current_user.role.value == "parent":
        parent = current_user.parent_profile
        if not parent or student.parent_id != parent.id:
            raise HTTPException(status_code=403, detail="Not authorized")


@router.post("/run/{student_id}", response_model=PredictionOut)
def run_prediction(student_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    _authorize(current_user, student)

    attendance = latest_attendance_avg(db, student.id)
    marks = latest_marks_avg(db, student.id)
    assignment_score, any_late = latest_assignment_avg(db, student.id)
    quiz_score = latest_quiz_avg(db, student.id)
    study_hours = latest_study_hours_avg(db, student.id)

    predicted = predict_final_marks(attendance, marks, assignment_score, quiz_score, study_hours)
    risk = compute_risk_level(predicted, attendance)
    weak_subject = weakest_subject(db, student.id)

    prediction = Prediction(
        student_id=student.id,
        predicted_final_marks=round(predicted, 1),
        risk_level=risk,
        weak_subject=weak_subject,
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)

    # Regenerate recommendations based on the same signals
    for category, message in generate_recommendations(attendance, marks, any_late, study_hours):
        db.add(Recommendation(student_id=student.id, message=message, category=category))
    db.commit()

    if current_user.role.value == "student":
        gamification.award_xp(db, student.id, 10, "Checked AI Prediction")

    return PredictionOut.model_validate(prediction)


@router.post("/manual", response_model=PredictionOut)
def run_manual_prediction(payload: PredictionInput, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Run a what-if prediction with custom inputs (used by teacher/admin tools) without persisting inputs."""
    student = db.query(Student).filter(Student.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    _authorize(current_user, student)

    predicted = predict_final_marks(
        payload.attendance_percentage, payload.average_marks,
        payload.assignment_score, payload.quiz_score, payload.study_hours_per_day,
    )
    risk = compute_risk_level(predicted, payload.attendance_percentage)

    prediction = Prediction(
        student_id=student.id,
        predicted_final_marks=round(predicted, 1),
        risk_level=risk,
        weak_subject=weakest_subject(db, student.id),
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return PredictionOut.model_validate(prediction)
