"""
Rule-based recommendation engine. Given a student's latest signals, returns
a list of (category, message) tuples to be persisted as Recommendation rows.
"""
from typing import List, Tuple


def generate_recommendations(
    attendance_percentage: float,
    average_marks: float,
    assignment_late: bool,
    study_hours_per_day: float,
) -> List[Tuple[str, str]]:
    recs: List[Tuple[str, str]] = []

    if attendance_percentage < 75:
        recs.append((
            "attendance",
            f"Attendance is {attendance_percentage:.0f}%, below the 75% requirement. "
            "Attend classes more consistently to avoid falling behind.",
        ))

    if average_marks < 60:
        recs.append((
            "marks",
            f"Average marks are {average_marks:.0f}. Set aside time for daily practice "
            "and revisit fundamentals in weaker subjects.",
        ))

    if assignment_late:
        recs.append((
            "assignment",
            "Recent assignments were submitted late. Plan submissions a day early to "
            "avoid last-minute penalties.",
        ))

    if study_hours_per_day < 2:
        recs.append((
            "study_hours",
            f"Study time is {study_hours_per_day:.1f} hrs/day, below the recommended 2 hrs. "
            "Increasing focused study time will steadily raise performance.",
        ))

    if not recs:
        recs.append((
            "general",
            "Performance is on track across attendance, marks, and study habits. Keep it up!",
        ))

    return recs
