"""
Gamification engine: XP points, levels, badges, daily streaks, and class
leaderboards. All XP awards are explainable — every event records *why*
points were given, so students can see exactly what earned them XP.
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.models import XPEvent, StreakRecord, Student, User

LEVEL_STEP = 200  # XP required per level


def award_xp(db: Session, student_id: int, points: int, reason: str) -> None:
    db.add(XPEvent(student_id=student_id, points=points, reason=reason))
    _touch_streak(db, student_id)
    db.commit()


def _touch_streak(db: Session, student_id: int) -> StreakRecord:
    """Marks the student active today, extending or resetting their streak."""
    today = datetime.utcnow().date()
    record = db.query(StreakRecord).filter(StreakRecord.student_id == student_id).first()
    if not record:
        record = StreakRecord(student_id=student_id, current_streak=1, longest_streak=1,
                               last_active_date=datetime.utcnow())
        db.add(record)
        return record

    last_date = record.last_active_date.date() if record.last_active_date else None
    if last_date == today:
        pass  # already counted today
    elif last_date == today - timedelta(days=1):
        record.current_streak += 1
    else:
        record.current_streak = 1
    record.longest_streak = max(record.longest_streak, record.current_streak)
    record.last_active_date = datetime.utcnow()
    return record


def total_xp(db: Session, student_id: int) -> int:
    rows = db.query(XPEvent).filter(XPEvent.student_id == student_id).all()
    return sum(r.points for r in rows)


def compute_badges(xp: int, streak: int, events: list) -> list:
    badges = []
    if xp >= 100:
        badges.append("Getting Started")
    if xp >= 500:
        badges.append("Rising Star")
    if xp >= 1500:
        badges.append("Top Performer")
    if streak >= 3:
        badges.append("3-Day Streak")
    if streak >= 7:
        badges.append("Week Warrior")
    if streak >= 30:
        badges.append("Unstoppable")
    if any("quiz" in e.reason.lower() for e in events):
        badges.append("Quiz Whiz")
    if any("goal" in e.reason.lower() for e in events):
        badges.append("Goal Getter")
    return badges


def get_stats(db: Session, student_id: int) -> dict:
    events = (
        db.query(XPEvent)
        .filter(XPEvent.student_id == student_id)
        .order_by(XPEvent.created_at.desc())
        .limit(20)
        .all()
    )
    xp = total_xp(db, student_id)
    level = xp // LEVEL_STEP + 1
    xp_into_level = xp % LEVEL_STEP

    streak = db.query(StreakRecord).filter(StreakRecord.student_id == student_id).first()
    current_streak = streak.current_streak if streak else 0
    longest_streak = streak.longest_streak if streak else 0

    return {
        "total_xp": xp,
        "level": level,
        "xp_into_level": xp_into_level,
        "xp_for_next_level": LEVEL_STEP,
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "badges": compute_badges(xp, current_streak, events),
        "recent_events": [{"points": e.points, "reason": e.reason, "created_at": e.created_at.isoformat()} for e in events],
    }


def leaderboard(db: Session, teacher_id: int = None, limit: int = 10) -> list:
    """Class leaderboard. If teacher_id is given, scoped to that teacher's students."""
    query = db.query(Student)
    if teacher_id is not None:
        query = query.filter(Student.teacher_id == teacher_id)
    students = query.all()

    rows = []
    for s in students:
        xp = total_xp(db, s.id)
        rows.append({
            "student_id": s.id,
            "name": s.user.name,
            "total_xp": xp,
            "level": xp // LEVEL_STEP + 1,
        })
    rows.sort(key=lambda r: r["total_xp"], reverse=True)
    return rows[:limit]
