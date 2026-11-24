from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_role
from app.core import gamification
from app.models.models import User, Student
from app.schemas.schemas import GamificationStatsOut, LeaderboardEntryOut

router = APIRouter(prefix="/api/gamification", tags=["Gamification"])


def _get_student(db: Session, current_user: User) -> Student:
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student


@router.get("/me", response_model=GamificationStatsOut)
def my_stats(current_user: User = Depends(require_role("student")), db: Session = Depends(get_db)):
    student = _get_student(db, current_user)
    return gamification.get_stats(db, student.id)


@router.get("/leaderboard", response_model=list[LeaderboardEntryOut])
def class_leaderboard(current_user: User = Depends(require_role("student", "teacher")), db: Session = Depends(get_db)):
    """Students see their own class's leaderboard; teachers see their assigned class's."""
    if current_user.role.value == "student":
        student = _get_student(db, current_user)
        teacher_id = student.teacher_id
    else:
        teacher = current_user.teacher_profile
        teacher_id = teacher.id if teacher else None
    if teacher_id is None:
        return []
    return gamification.leaderboard(db, teacher_id=teacher_id)
