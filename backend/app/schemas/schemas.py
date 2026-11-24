from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    role: str  # student | teacher | parent | admin
    roll_number: Optional[str] = None  # required if role == student


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    user_id: int


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True


# ---------- Student ----------
class StudentOut(BaseModel):
    id: int
    roll_number: str
    semester: int
    name: str
    email: str
    teacher_id: Optional[int] = None
    teacher_name: Optional[str] = None
    subject_interest: Optional[str] = None
    skills: Optional[str] = None
    career_goal: Optional[str] = None
    learning_style: Optional[str] = None
    department: Optional[str] = None

    class Config:
        from_attributes = True


class StudentUpdateRequest(BaseModel):
    semester: Optional[int] = None
    department_id: Optional[int] = None


class StudentSelfUpdateRequest(BaseModel):
    """Fields a student is allowed to edit about themselves.

    Deliberately excludes attendance, marks, and computed weak/strong subjects —
    those come from real academic records (teacher/admin entry and the ML
    pipeline) and must never be self-reported, or the Digital Twin's
    predictions and analytics would no longer reflect reality.
    """
    subject_interest: Optional[str] = None
    skills: Optional[str] = None
    career_goal: Optional[str] = None
    learning_style: Optional[str] = None


# ---------- Teacher (as seen by students choosing one) ----------
class TeacherOut(BaseModel):
    id: int
    name: str
    email: str
    department: Optional[str] = None
    student_count: int = 0

    class Config:
        from_attributes = True


class CSVImportResult(BaseModel):
    created: int
    linked_existing: int
    skipped: List[str]


# ---------- AI Digital Twin ----------
class SubjectScoreOut(BaseModel):
    subject: str
    marks: float


class StudyPlanItemOut(BaseModel):
    day: str
    subject: str
    hours: float
    type: str


class DigitalTwinOut(BaseModel):
    health_score: float
    learning_score: float
    strong_subjects: List[SubjectScoreOut]
    weak_subjects: List[SubjectScoreOut]
    study_plan: List[StudyPlanItemOut]
    predicted_final_marks: Optional[float] = None
    risk_level: Optional[str] = None


# ---------- Attendance / Marks / Assignments ----------
class AttendanceOut(BaseModel):
    id: Optional[int] = None
    month: str
    percentage: float
    subject: Optional[str] = None
    subject_id: Optional[int] = None

    class Config:
        from_attributes = True


class MarksOut(BaseModel):
    id: Optional[int] = None
    subject: Optional[str] = None
    subject_id: Optional[int] = None
    internal_marks: float
    final_marks: Optional[float] = None

    class Config:
        from_attributes = True


class AttendanceIn(BaseModel):
    subject_id: int
    month: str
    percentage: float = Field(ge=0, le=100)


class AttendanceUpdateIn(BaseModel):
    subject_id: Optional[int] = None
    month: Optional[str] = None
    percentage: Optional[float] = Field(default=None, ge=0, le=100)


class MarksIn(BaseModel):
    subject_id: int
    internal_marks: float = Field(ge=0, le=100)
    final_marks: Optional[float] = Field(default=None, ge=0, le=100)


class MarksUpdateIn(BaseModel):
    subject_id: Optional[int] = None
    internal_marks: Optional[float] = Field(default=None, ge=0, le=100)
    final_marks: Optional[float] = Field(default=None, ge=0, le=100)


class SubjectOut(BaseModel):
    id: int
    name: str
    code: str
    department_id: Optional[int] = None

    class Config:
        from_attributes = True


class AssignmentOut(BaseModel):
    title: str
    submitted_on_time: int
    score: float
    subject: Optional[str] = None

    class Config:
        from_attributes = True


class QuizOut(BaseModel):
    score: float
    max_score: float
    subject: Optional[str] = None

    class Config:
        from_attributes = True


class StudyHoursOut(BaseModel):
    week: str
    hours_per_day: float

    class Config:
        from_attributes = True


# ---------- Prediction ----------
class PredictionInput(BaseModel):
    student_id: int
    attendance_percentage: float
    average_marks: float
    assignment_score: float
    quiz_score: float
    study_hours_per_day: float


class PredictionOut(BaseModel):
    predicted_final_marks: float
    risk_level: str
    weak_subject: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RecommendationOut(BaseModel):
    message: str
    category: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Dashboard aggregates ----------
class StudentDashboardOut(BaseModel):
    student: StudentOut
    attendance: List[AttendanceOut]
    marks: List[MarksOut]
    assignments: List[AssignmentOut]
    quizzes: List[QuizOut]
    study_hours: List[StudyHoursOut]
    latest_prediction: Optional[PredictionOut]
    recommendations: List[RecommendationOut]


class TeacherAnalyticsOut(BaseModel):
    total_students: int
    average_attendance: float
    average_marks: float
    at_risk_count: int
    students_at_risk: List[dict]


# ---------- AI Agent ----------
class ChatMessageOut(BaseModel):
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    created_at: datetime
    suggestions: List[str] = []


# ---------- Teacher Selection (request / accept / reject) ----------
class TeacherRequestOut(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    teacher_id: int
    teacher_name: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Direct Chat (student <-> teacher) ----------
class DirectMessageOut(BaseModel):
    id: int
    sender_role: str
    content: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DirectMessageRequest(BaseModel):
    content: str


# ---------- Notifications / AI Alerts ----------
class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    category: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Calendar: Exams ----------
class ExamOut(BaseModel):
    id: int
    title: str
    subject_name: Optional[str] = None
    exam_date: datetime
    semester: int

    class Config:
        from_attributes = True


class ExamCreateRequest(BaseModel):
    subject_id: int
    title: str
    exam_date: datetime
    semester: int = 1


# ---------- Goals (daily / weekly / monthly) ----------
class GoalOut(BaseModel):
    id: int
    period: str
    title: str
    target_value: float
    progress: float
    is_completed: bool
    due_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class GoalCreateRequest(BaseModel):
    period: str
    title: str
    target_value: float = 100
    due_date: Optional[datetime] = None


class GoalProgressUpdate(BaseModel):
    progress: float


# ---------- Gamification ----------
class GamificationStatsOut(BaseModel):
    total_xp: int
    level: int
    xp_into_level: int
    xp_for_next_level: int
    current_streak: int
    longest_streak: int
    badges: List[str]
    recent_events: List[dict]


class LeaderboardEntryOut(BaseModel):
    student_id: int
    name: str
    total_xp: int
    level: int
