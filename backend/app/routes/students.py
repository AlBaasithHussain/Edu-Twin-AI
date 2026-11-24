from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.core.digital_twin import build_digital_twin
from app.core import gamification
from app.models.models import Student, User, Attendance, Marks, Assignment, Quiz, StudyHours, Prediction, Recommendation, Teacher, TeacherRequest, Subject
from app.schemas.schemas import (
    StudentOut, StudentUpdateRequest, StudentDashboardOut,
    AttendanceOut, MarksOut, AssignmentOut, QuizOut, StudyHoursOut,
    PredictionOut, RecommendationOut, StudentSelfUpdateRequest, TeacherOut, DigitalTwinOut,
    TeacherRequestOut, AttendanceIn, AttendanceUpdateIn, MarksIn, MarksUpdateIn, SubjectOut,
)


def _to_student_out(student: Student) -> StudentOut:
    return StudentOut(
        id=student.id, roll_number=student.roll_number, semester=student.semester,
        name=student.user.name, email=student.user.email,
        teacher_id=student.teacher_id,
        teacher_name=student.teacher.user.name if student.teacher else None,
        subject_interest=student.subject_interest,
        skills=student.skills,
        career_goal=student.career_goal,
        learning_style=student.learning_style,
        department=student.department.name if student.department else None,
    )

router = APIRouter(prefix="/api/students", tags=["Students"])


def _get_student_or_404(db: Session, student_id: int) -> Student:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


def _authorize_student_access(current_user: User, student: Student, db: Session):
    """Students see only themselves; parents only their children; teachers only their own class; admins see anyone."""
    if current_user.role.value == "student" and student.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this student")
    if current_user.role.value == "parent":
        parent = current_user.parent_profile
        if not parent or student.parent_id != parent.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this student")
    if current_user.role.value == "teacher":
        teacher = current_user.teacher_profile
        if not teacher or student.teacher_id != teacher.id:
            raise HTTPException(status_code=403, detail="This student is not in your class")


@router.get("/me", response_model=StudentOut)
def get_my_profile(current_user: User = Depends(require_role("student")), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return _to_student_out(student)


@router.get("/teachers/available", response_model=list[TeacherOut])
def list_available_teachers(current_user: User = Depends(require_role("student")), db: Session = Depends(get_db)):
    """Teachers a student can choose from."""
    teachers = db.query(Teacher).all()
    return [
        TeacherOut(
            id=t.id, name=t.user.name, email=t.user.email,
            department=t.department.name if t.department else None,
            student_count=len(t.students),
        )
        for t in teachers
    ]


@router.post("/me/choose-teacher/{teacher_id}", response_model=TeacherRequestOut)
def choose_teacher(teacher_id: int, current_user: User = Depends(require_role("student")), db: Session = Depends(get_db)):
    """Teacher Selection System: sends a request instead of assigning instantly.
    The teacher must accept it (see /api/teacher/requests) before the student
    becomes linked and shows up in that teacher's class."""
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    existing = (
        db.query(TeacherRequest)
        .filter(TeacherRequest.student_id == student.id, TeacherRequest.status == "pending")
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending request awaiting a teacher's response")

    req = TeacherRequest(student_id=student.id, teacher_id=teacher.id, status="pending")
    db.add(req)
    db.commit()
    db.refresh(req)
    return TeacherRequestOut(
        id=req.id, student_id=student.id, student_name=student.user.name,
        teacher_id=teacher.id, teacher_name=teacher.user.name,
        status=req.status, created_at=req.created_at,
    )


@router.get("/me/teacher-requests", response_model=list[TeacherRequestOut])
def my_teacher_requests(current_user: User = Depends(require_role("student")), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    reqs = db.query(TeacherRequest).filter(TeacherRequest.student_id == student.id).order_by(TeacherRequest.created_at.desc()).all()
    return [
        TeacherRequestOut(
            id=r.id, student_id=student.id, student_name=student.user.name,
            teacher_id=r.teacher_id, teacher_name=r.teacher.user.name if r.teacher else None,
            status=r.status, created_at=r.created_at,
        )
        for r in reqs
    ]


@router.put("/me", response_model=StudentOut)
def update_my_profile(
    payload: StudentSelfUpdateRequest,
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db),
):
    """Students can edit their own subject interest / skills / career goal / learning
    style — never attendance, marks, or weak/strong subjects, since those are real
    academic records (entered by teachers/admins) and computed ML outputs, not
    self-reported data."""
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    if payload.subject_interest is not None:
        student.subject_interest = payload.subject_interest.strip()
    if payload.skills is not None:
        student.skills = payload.skills.strip()
    if payload.career_goal is not None:
        student.career_goal = payload.career_goal.strip()
    if payload.learning_style is not None:
        student.learning_style = payload.learning_style.strip()
    db.commit()
    db.refresh(student)
    return _to_student_out(student)


@router.get("/{student_id}/dashboard", response_model=StudentDashboardOut)
def get_student_dashboard(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student = _get_student_or_404(db, student_id)
    _authorize_student_access(current_user, student, db)

    attendance = [
        AttendanceOut(id=a.id, month=a.month, percentage=a.percentage,
                      subject=a.subject.name if a.subject else None, subject_id=a.subject_id)
        for a in student.attendance_records
    ]
    marks = [
        MarksOut(id=m.id, subject=m.subject.name if m.subject else None, subject_id=m.subject_id,
                 internal_marks=m.internal_marks, final_marks=m.final_marks)
        for m in student.marks_records
    ]
    assignments = [
        AssignmentOut(title=a.title, submitted_on_time=a.submitted_on_time, score=a.score,
                       subject=a.subject.name if a.subject else None)
        for a in student.assignments
    ]
    quizzes = [
        QuizOut(score=q.score, max_score=q.max_score, subject=q.subject.name if q.subject else None)
        for q in student.quizzes
    ]
    study_hours = [StudyHoursOut(week=s.week, hours_per_day=s.hours_per_day) for s in student.study_hours_records]

    latest_prediction_obj = (
        db.query(Prediction)
        .filter(Prediction.student_id == student.id)
        .order_by(Prediction.created_at.desc())
        .first()
    )
    latest_prediction = PredictionOut.model_validate(latest_prediction_obj) if latest_prediction_obj else None

    recs = (
        db.query(Recommendation)
        .filter(Recommendation.student_id == student.id)
        .order_by(Recommendation.created_at.desc())
        .limit(10)
        .all()
    )
    recommendations = [RecommendationOut.model_validate(r) for r in recs]

    return StudentDashboardOut(
        student=_to_student_out(student),
        attendance=attendance,
        marks=marks,
        assignments=assignments,
        quizzes=quizzes,
        study_hours=study_hours,
        latest_prediction=latest_prediction,
        recommendations=recommendations,
    )


@router.put("/{student_id}", response_model=StudentOut)
def update_student(
    student_id: int,
    payload: StudentUpdateRequest,
    current_user: User = Depends(require_role("admin", "teacher")),
    db: Session = Depends(get_db),
):
    """Admin/teacher-only: change a student's semester or department."""
    student = _get_student_or_404(db, student_id)
    if current_user.role.value == "teacher":
        teacher = current_user.teacher_profile
        if not teacher or student.teacher_id != teacher.id:
            raise HTTPException(status_code=403, detail="This student is not in your class")
    if payload.semester is not None:
        student.semester = payload.semester
    if payload.department_id is not None:
        student.department_id = payload.department_id
    db.commit()
    db.refresh(student)
    return _to_student_out(student)


@router.get("/{student_id}/digital-twin", response_model=DigitalTwinOut)
def get_digital_twin(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    The AI Digital Twin: health score, learning score, strong/weak subjects,
    and a study planner — all computed transparently from the student's own
    data. Viewable by the student, their linked parent/teacher, or an admin.
    """
    student = _get_student_or_404(db, student_id)
    _authorize_student_access(current_user, student, db)

    latest_prediction = (
        db.query(Prediction)
        .filter(Prediction.student_id == student.id)
        .order_by(Prediction.created_at.desc())
        .first()
    )
    twin = build_digital_twin(db, student.id, latest_prediction)
    return DigitalTwinOut(**twin)


# ---------------------------------------------------------------------------
# Self-tracked academic records
#
# This app runs in "self-tracked" mode: the logged-in student is the source
# of truth for their own attendance and marks (no separate teacher/admin
# data-entry step is required for a student to have a working Digital Twin).
# Every endpoint below is scoped to `/me` and re-checks that the record being
# edited or deleted actually belongs to the current student before touching
# it, so one student can never see or modify another's records.
# ---------------------------------------------------------------------------

@router.get("/subjects", response_model=list[SubjectOut])
def list_subjects_for_student(current_user: User = Depends(require_role("student")), db: Session = Depends(get_db)):
    """Subjects a student can log attendance/marks against."""
    return db.query(Subject).all()


def _get_my_student(db: Session, current_user: User) -> Student:
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student


def _get_subject_or_404(db: Session, subject_id: int) -> Subject:
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject


@router.post("/me/attendance", response_model=AttendanceOut, status_code=201)
def add_my_attendance(
    payload: AttendanceIn,
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db),
):
    student = _get_my_student(db, current_user)
    _get_subject_or_404(db, payload.subject_id)
    record = Attendance(
        student_id=student.id, subject_id=payload.subject_id,
        month=payload.month.strip(), percentage=payload.percentage,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return AttendanceOut(id=record.id, month=record.month, percentage=record.percentage,
                          subject=record.subject.name if record.subject else None, subject_id=record.subject_id)


@router.put("/me/attendance/{record_id}", response_model=AttendanceOut)
def update_my_attendance(
    record_id: int,
    payload: AttendanceUpdateIn,
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db),
):
    student = _get_my_student(db, current_user)
    record = db.query(Attendance).filter(Attendance.id == record_id, Attendance.student_id == student.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    if payload.subject_id is not None:
        _get_subject_or_404(db, payload.subject_id)
        record.subject_id = payload.subject_id
    if payload.month is not None:
        record.month = payload.month.strip()
    if payload.percentage is not None:
        record.percentage = payload.percentage
    db.commit()
    db.refresh(record)
    return AttendanceOut(id=record.id, month=record.month, percentage=record.percentage,
                          subject=record.subject.name if record.subject else None, subject_id=record.subject_id)


@router.delete("/me/attendance/{record_id}", status_code=204)
def delete_my_attendance(
    record_id: int,
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db),
):
    student = _get_my_student(db, current_user)
    record = db.query(Attendance).filter(Attendance.id == record_id, Attendance.student_id == student.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    db.delete(record)
    db.commit()
    return None


@router.post("/me/marks", response_model=MarksOut, status_code=201)
def add_my_marks(
    payload: MarksIn,
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db),
):
    student = _get_my_student(db, current_user)
    _get_subject_or_404(db, payload.subject_id)
    record = Marks(
        student_id=student.id, subject_id=payload.subject_id,
        internal_marks=payload.internal_marks, final_marks=payload.final_marks,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return MarksOut(id=record.id, subject=record.subject.name if record.subject else None, subject_id=record.subject_id,
                     internal_marks=record.internal_marks, final_marks=record.final_marks)


@router.put("/me/marks/{record_id}", response_model=MarksOut)
def update_my_marks(
    record_id: int,
    payload: MarksUpdateIn,
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db),
):
    student = _get_my_student(db, current_user)
    record = db.query(Marks).filter(Marks.id == record_id, Marks.student_id == student.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Marks record not found")
    if payload.subject_id is not None:
        _get_subject_or_404(db, payload.subject_id)
        record.subject_id = payload.subject_id
    if payload.internal_marks is not None:
        record.internal_marks = payload.internal_marks
    if payload.final_marks is not None:
        record.final_marks = payload.final_marks
    db.commit()
    db.refresh(record)
    return MarksOut(id=record.id, subject=record.subject.name if record.subject else None, subject_id=record.subject_id,
                     internal_marks=record.internal_marks, final_marks=record.final_marks)


@router.delete("/me/marks/{record_id}", status_code=204)
def delete_my_marks(
    record_id: int,
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db),
):
    student = _get_my_student(db, current_user)
    record = db.query(Marks).filter(Marks.id == record_id, Marks.student_id == student.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Marks record not found")
    db.delete(record)
    db.commit()
    return None
