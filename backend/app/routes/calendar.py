from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_role, get_current_user
from app.core import gamification
from app.models.models import User, Student, Exam, Goal, Teacher
from app.schemas.schemas import (
    ExamOut, ExamCreateRequest, GoalOut, GoalCreateRequest, GoalProgressUpdate,
)

router = APIRouter(prefix="/api/calendar", tags=["Calendar"])


def _get_student(db: Session, current_user: User) -> Student:
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student


def _exam_out(e: Exam) -> ExamOut:
    return ExamOut(
        id=e.id, title=e.title, subject_name=e.subject.name if e.subject else None,
        exam_date=e.exam_date, semester=e.semester,
    )


# ---------- Exams ----------
@router.get("/exams", response_model=list[ExamOut])
def list_upcoming_exams(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Exam).filter(Exam.exam_date >= datetime.utcnow())
    if current_user.role.value == "student":
        student = _get_student(db, current_user)
        query = query.filter(Exam.semester == student.semester)
    exams = query.order_by(Exam.exam_date.asc()).all()
    return [_exam_out(e) for e in exams]


@router.post("/exams", response_model=ExamOut)
def create_exam(
    payload: ExamCreateRequest,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db),
):
    teacher = current_user.teacher_profile
    exam = Exam(
        subject_id=payload.subject_id, title=payload.title, exam_date=payload.exam_date,
        semester=payload.semester, created_by_teacher_id=teacher.id if teacher else None,
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return _exam_out(exam)


@router.delete("/exams/{exam_id}")
def delete_exam(exam_id: int, current_user: User = Depends(require_role("teacher", "admin")), db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    db.delete(exam)
    db.commit()
    return {"status": "deleted"}


# ---------- Goals (daily / weekly / monthly) ----------
@router.get("/goals", response_model=list[GoalOut])
def list_goals(period: str = None, current_user: User = Depends(require_role("student")), db: Session = Depends(get_db)):
    student = _get_student(db, current_user)
    query = db.query(Goal).filter(Goal.student_id == student.id)
    if period:
        query = query.filter(Goal.period == period)
    return query.order_by(Goal.created_at.desc()).all()


@router.post("/goals", response_model=GoalOut)
def create_goal(payload: GoalCreateRequest, current_user: User = Depends(require_role("student")), db: Session = Depends(get_db)):
    if payload.period not in ("daily", "weekly", "monthly"):
        raise HTTPException(status_code=400, detail="period must be daily, weekly, or monthly")
    student = _get_student(db, current_user)
    goal = Goal(student_id=student.id, period=payload.period, title=payload.title,
                target_value=payload.target_value, due_date=payload.due_date)
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.put("/goals/{goal_id}/progress", response_model=GoalOut)
def update_goal_progress(
    goal_id: int, payload: GoalProgressUpdate,
    current_user: User = Depends(require_role("student")), db: Session = Depends(get_db),
):
    student = _get_student(db, current_user)
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.student_id == student.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal.progress = max(0, min(100, payload.progress))
    just_completed = goal.progress >= 100 and not goal.is_completed
    if just_completed:
        goal.is_completed = True
    db.commit()
    if just_completed:
        gamification.award_xp(db, student.id, 25, f"Completed {goal.period} goal: {goal.title}")
    db.refresh(goal)
    return goal


@router.delete("/goals/{goal_id}")
def delete_goal(goal_id: int, current_user: User = Depends(require_role("student")), db: Session = Depends(get_db)):
    student = _get_student(db, current_user)
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.student_id == student.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"status": "deleted"}
