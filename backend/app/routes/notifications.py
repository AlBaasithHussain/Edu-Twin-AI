from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core import alerts
from app.models.models import User, Student
from app.schemas.schemas import NotificationOut

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("", response_model=list[NotificationOut])
def list_notifications(unread_only: bool = False, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Students get a fresh scan of their live signals every time they check their inbox.
    if current_user.role.value == "student":
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if student:
            alerts.generate_alerts_for_student(db, student)
    return alerts.get_notifications(db, current_user.id, unread_only=unread_only)


@router.get("/unread-count")
def unread_count(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    count = len(alerts.get_notifications(db, current_user.id, unread_only=True, limit=200))
    return {"count": count}


@router.post("/mark-all-read")
def mark_all_read(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    alerts.mark_all_read(db, current_user.id)
    return {"status": "ok"}


@router.post("/{notification_id}/mark-read")
def mark_one_read(notification_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    alerts.mark_one_read(db, current_user.id, notification_id)
    return {"status": "ok"}
