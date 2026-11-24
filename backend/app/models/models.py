from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, ForeignKey, DateTime, Enum, Text, Boolean
)
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class RoleEnum(str, enum.Enum):
    student = "student"
    teacher = "teacher"
    parent = "parent"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    student_profile = relationship("Student", back_populates="user", uselist=False)
    teacher_profile = relationship("Teacher", back_populates="user", uselist=False)
    parent_profile = relationship("Parent", back_populates="user", uselist=False)


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), unique=True, nullable=False)

    subjects = relationship("Subject", back_populates="department")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    code = Column(String(30), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"))

    department = relationship("Department", back_populates="subjects")


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    department_id = Column(Integer, ForeignKey("departments.id"))

    user = relationship("User", back_populates="teacher_profile")
    department = relationship("Department")
    students = relationship("Student", back_populates="teacher")


class Parent(Base):
    __tablename__ = "parents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)

    user = relationship("User", back_populates="parent_profile")
    children = relationship("Student", back_populates="parent")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    roll_number = Column(String(30), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"))
    parent_id = Column(Integer, ForeignKey("parents.id"), nullable=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)  # teacher the student has chosen
    semester = Column(Integer, default=1)
    subject_interest = Column(String(200), nullable=True)  # student-editable, informs recommendations
    skills = Column(String(300), nullable=True)  # student-editable, e.g. "Python, Figma, Public Speaking"
    career_goal = Column(String(200), nullable=True)  # student-editable, e.g. "Backend Developer"
    learning_style = Column(String(50), nullable=True)  # student-editable: Visual / Auditory / Reading / Kinesthetic

    user = relationship("User", back_populates="student_profile")
    department = relationship("Department")
    parent = relationship("Parent", back_populates="children")
    teacher = relationship("Teacher", back_populates="students")

    attendance_records = relationship("Attendance", back_populates="student")
    assignments = relationship("Assignment", back_populates="student")
    quizzes = relationship("Quiz", back_populates="student")
    marks_records = relationship("Marks", back_populates="student")
    study_hours_records = relationship("StudyHours", back_populates="student")
    predictions = relationship("Prediction", back_populates="student")
    recommendations = relationship("Recommendation", back_populates="student")


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    month = Column(String(20), nullable=False)
    percentage = Column(Float, nullable=False)

    student = relationship("Student", back_populates="attendance_records")
    subject = relationship("Subject")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    title = Column(String(200), nullable=False)
    submitted_on_time = Column(Integer, default=1)  # 1 = on time, 0 = late
    score = Column(Float, default=0)

    student = relationship("Student", back_populates="assignments")
    subject = relationship("Subject")


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    score = Column(Float, nullable=False)
    max_score = Column(Float, default=100)

    student = relationship("Student", back_populates="quizzes")
    subject = relationship("Subject")


class Marks(Base):
    __tablename__ = "marks"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    internal_marks = Column(Float, nullable=False)
    final_marks = Column(Float, nullable=True)

    student = relationship("Student", back_populates="marks_records")
    subject = relationship("Subject")


class StudyHours(Base):
    __tablename__ = "study_hours"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    week = Column(String(20), nullable=False)
    hours_per_day = Column(Float, nullable=False)

    student = relationship("Student", back_populates="study_hours_records")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    predicted_final_marks = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)  # Low, Medium, High
    weak_subject = Column(String(120), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="predictions")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    message = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)  # attendance, marks, assignment, study_hours
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="recommendations")


class ChatMessage(Base):
    """A single turn in a student's conversation with the AI Agent (their
    conversational digital twin companion). Kept simple and student-scoped
    so the agent can recall earlier turns and stay grounded in that
    student's real academic data.
    """
    __tablename__ = "agent_chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), index=True, nullable=False)
    role = Column(String(10), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    student = relationship("Student")


class TeacherRequest(Base):
    """Teacher Selection System: a student requests a teacher; the teacher
    can accept or reject. Only on acceptance does Student.teacher_id get set.
    """
    __tablename__ = "teacher_requests"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False, index=True)
    status = Column(String(20), default="pending")  # pending, accepted, rejected
    created_at = Column(DateTime, default=datetime.utcnow)
    responded_at = Column(DateTime, nullable=True)

    student = relationship("Student")
    teacher = relationship("Teacher")


class DirectMessage(Base):
    """WhatsApp-style real-time chat between a student and their linked
    teacher. One implicit thread per (student, teacher) pair — a student
    only ever has one active teacher at a time.
    """
    __tablename__ = "direct_messages"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False, index=True)
    sender_role = Column(String(10), nullable=False)  # 'student' or 'teacher'
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    student = relationship("Student")
    teacher = relationship("Teacher")


class Notification(Base):
    """AI Alerts + general notifications, addressed to any user (student,
    teacher, parent, or admin). Auto-generated by app/core/alerts.py from
    live signals (attendance, marks, missed assignments, upcoming exams).
    """
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(30), nullable=False)  # attendance, marks, assignment, exam, study, system
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User")


class Exam(Base):
    """Upcoming exam entries feeding the student Calendar and AI Alerts."""
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    title = Column(String(200), nullable=False)
    exam_date = Column(DateTime, nullable=False)
    semester = Column(Integer, default=1)
    created_by_teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    subject = relationship("Subject")
    department = relationship("Department")


class Goal(Base):
    """Daily / Weekly / Monthly study goals that feed the AI Study Planner
    and gamification streak.
    """
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    period = Column(String(10), nullable=False)  # daily, weekly, monthly
    title = Column(String(200), nullable=False)
    target_value = Column(Float, default=100)
    progress = Column(Float, default=0)  # 0-100
    is_completed = Column(Boolean, default=False)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student")


class XPEvent(Base):
    """Individual XP-earning events for gamification (quiz taken, assignment
    submitted on time, goal completed, study streak maintained, etc.)."""
    __tablename__ = "xp_events"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    points = Column(Integer, nullable=False)
    reason = Column(String(150), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    student = relationship("Student")


class StreakRecord(Base):
    """Tracks each student's daily-activity streak (logging study hours,
    chatting with the AI Agent, completing a goal, etc. counts as 'active')."""
    __tablename__ = "streak_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), unique=True, nullable=False)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_active_date = Column(DateTime, nullable=True)

    student = relationship("Student")

