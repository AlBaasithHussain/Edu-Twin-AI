"""
AI Alerts: scans a student's live signals (attendance, marks, missed
assignments, upcoming exams, study hours) and generates human-readable
notifications. Idempotent-ish: it checks for an existing unread notification
with the same title within the last day before creating a duplicate, so
refreshing a dashboard doesn't spam the same alert every request.
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.core.aggregates import (
    latest_attendance_avg, latest_marks_avg, latest_study_hours_avg,
)
from app.models.models import (
    Assignment, Exam, Notification, Student, Subject,
)


def _already_alerted_recently(db: Session, user_id: int, title: str, hours: int = 20) -> bool:
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.title == title, Notification.created_at >= cutoff)
        .first()
        is not None
    )


def _create(db: Session, user_id: int, title: str, message: str, category: str):
    if _already_alerted_recently(db, user_id, title):
        return
    db.add(Notification(user_id=user_id, title=title, message=message, category=category))


def generate_alerts_for_student(db: Session, student: Student) -> None:
    user_id = student.user_id

    attendance = latest_attendance_avg(db, student.id)
    if attendance < 75:
        _create(
            db, user_id, "Low Attendance Alert",
            f"Your attendance is at {attendance:.1f}%, below the 75% requirement. "
            f"Attend upcoming classes to avoid an attendance shortage.",
            "attendance",
        )

    marks = latest_marks_avg(db, student.id)
    if marks < 50:
        _create(
            db, user_id, "Marks Below Passing Threshold",
            f"Your average internal marks are {marks:.1f}. Consider revisiting weak topics "
            f"and asking your AI Agent for a focused revision plan.",
            "marks",
        )

    late = db.query(Assignment).filter(Assignment.student_id == student.id, Assignment.submitted_on_time == 0).count()
    if late > 0:
        _create(
            db, user_id, "Missed / Late Assignments",
            f"You have {late} assignment(s) submitted late. Staying on schedule improves your Learning Score.",
            "assignment",
        )

    study_hours = latest_study_hours_avg(db, student.id)
    if study_hours < 1.5:
        _create(
            db, user_id, "Study Reminder",
            f"You're averaging {study_hours:.1f} hrs/day of study — try to reach at least 2 hrs/day "
            f"to keep your Academic Health Score climbing.",
            "study",
        )

    # Upcoming exams within the next 7 days for this student's department/semester
    upcoming_cutoff = datetime.utcnow() + timedelta(days=7)
    exams = (
        db.query(Exam)
        .join(Subject, Exam.subject_id == Subject.id)
        .filter(
            Exam.exam_date >= datetime.utcnow(),
            Exam.exam_date <= upcoming_cutoff,
            Exam.semester == student.semester,
        )
        .all()
    )
    for exam in exams:
        _create(
            db, user_id, f"Upcoming Exam: {exam.title}",
            f"{exam.title} ({exam.subject.name if exam.subject else 'Subject'}) is scheduled on "
            f"{exam.exam_date.strftime('%d %b %Y')}. Start revising now.",
            "exam",
        )

    db.commit()


def get_notifications(db: Session, user_id: int, unread_only: bool = False, limit: int = 50):
    query = db.query(Notification).filter(Notification.user_id == user_id)
    if unread_only:
        query = query.filter(Notification.is_read == False)  # noqa: E712
    return query.order_by(Notification.created_at.desc()).limit(limit).all()


def mark_all_read(db: Session, user_id: int):
    db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read == False).update(  # noqa: E712
        {"is_read": True}
    )
    db.commit()


def mark_one_read(db: Session, user_id: int, notification_id: int):
    notif = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user_id).first()
    if notif:
        notif.is_read = True
        db.commit()
