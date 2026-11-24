from statistics import mean
from sqlalchemy.orm import Session

from app.models.models import Attendance, Marks, Assignment, Quiz, StudyHours, Student, Prediction, Recommendation


def latest_attendance_avg(db: Session, student_id: int) -> float:
    rows = db.query(Attendance).filter(Attendance.student_id == student_id).all()
    if not rows:
        return 75.0
    return mean([r.percentage for r in rows])


def latest_marks_avg(db: Session, student_id: int) -> float:
    rows = db.query(Marks).filter(Marks.student_id == student_id).all()
    if not rows:
        return 60.0
    return mean([r.internal_marks for r in rows])


def latest_assignment_avg(db: Session, student_id: int):
    rows = db.query(Assignment).filter(Assignment.student_id == student_id).all()
    if not rows:
        return 70.0, False
    avg_score = mean([r.score for r in rows])
    any_late = any(r.submitted_on_time == 0 for r in rows)
    return avg_score, any_late


def latest_quiz_avg(db: Session, student_id: int) -> float:
    rows = db.query(Quiz).filter(Quiz.student_id == student_id).all()
    if not rows:
        return 65.0
    return mean([(r.score / r.max_score) * 100 for r in rows])


def latest_study_hours_avg(db: Session, student_id: int) -> float:
    rows = db.query(StudyHours).filter(StudyHours.student_id == student_id).all()
    if not rows:
        return 2.0
    return mean([r.hours_per_day for r in rows])


def weakest_subject(db: Session, student_id: int):
    rows = db.query(Marks).filter(Marks.student_id == student_id).all()
    if not rows:
        return None
    weakest = min(rows, key=lambda r: r.internal_marks)
    return weakest.subject.name if weakest.subject else None
