import csv
import io
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from statistics import mean

from app.core.database import get_db
from app.core.deps import require_role
from app.core.security import hash_password
from app.core.aggregates import latest_attendance_avg, latest_marks_avg
from app.models.models import Student, Prediction, Teacher, User, RoleEnum, TeacherRequest
from app.schemas.schemas import StudentOut, TeacherAnalyticsOut, CSVImportResult, TeacherRequestOut

router = APIRouter(prefix="/api/teacher", tags=["Teacher"])


def _student_out(s: Student) -> StudentOut:
    return StudentOut(
        id=s.id, roll_number=s.roll_number, semester=s.semester, name=s.user.name, email=s.user.email,
        teacher_id=s.teacher_id,
        teacher_name=s.teacher.user.name if s.teacher else None,
        subject_interest=s.subject_interest,
    )


def _scoped_students(db: Session, current_user):
    """Admins see every student; teachers only see students who chose them (or were imported by them)."""
    query = db.query(Student)
    if current_user.role.value == "teacher":
        teacher = current_user.teacher_profile
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher profile not found")
        query = query.filter(Student.teacher_id == teacher.id)
    return query.all()


@router.get("/students", response_model=list[StudentOut])
def list_students(current_user=Depends(require_role("teacher", "admin")), db: Session = Depends(get_db)):
    students = _scoped_students(db, current_user)
    return [_student_out(s) for s in students]


@router.post("/import-students", response_model=CSVImportResult)
def import_students_csv(
    file: UploadFile = File(...),
    current_user=Depends(require_role("teacher")),
    db: Session = Depends(get_db),
):
    """
    Bulk-add students to this teacher's class from a CSV with columns:
    roll_number, name, email  (password is optional; defaults to "student123" for new accounts)

    - If a student with that email already exists, they're simply linked to this teacher
      (their existing attendance/marks/predictions are untouched).
    - If they don't exist yet, a new student account is created and linked to this teacher.
    Teachers can only VIEW student data through this — this import never edits attendance,
    marks, or predictions.
    """
    teacher = current_user.teacher_profile
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")

    content = file.file.read().decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(content))

    required_cols = {"roll_number", "name", "email"}
    if not required_cols.issubset({c.strip().lower() for c in (reader.fieldnames or [])}):
        raise HTTPException(
            status_code=400,
            detail="CSV must have columns: roll_number, name, email (password is optional)",
        )

    created, linked_existing, skipped = 0, 0, []

    for row in reader:
        row = {k.strip().lower(): (v or "").strip() for k, v in row.items()}
        roll_number, name, email = row.get("roll_number"), row.get("name"), row.get("email")
        if not (roll_number and name and email):
            skipped.append(f"{row} (missing required field)")
            continue

        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            if existing_user.role != RoleEnum.student:
                skipped.append(f"{email} (not a student account)")
                continue
            student = db.query(Student).filter(Student.user_id == existing_user.id).first()
            if not student:
                skipped.append(f"{email} (no student profile found)")
                continue
            student.teacher_id = teacher.id
            linked_existing += 1
        else:
            existing_roll = db.query(Student).filter(Student.roll_number == roll_number).first()
            if existing_roll:
                skipped.append(f"{roll_number} (roll number already taken by another student)")
                continue
            password = row.get("password") or "student123"
            new_user = User(name=name, email=email, hashed_password=hash_password(password), role=RoleEnum.student)
            db.add(new_user)
            db.flush()  # get new_user.id without committing yet
            new_student = Student(
                user_id=new_user.id, roll_number=roll_number,
                department_id=teacher.department_id, teacher_id=teacher.id, semester=1,
            )
            db.add(new_student)
            created += 1

    db.commit()
    return CSVImportResult(created=created, linked_existing=linked_existing, skipped=skipped)


@router.get("/analytics", response_model=TeacherAnalyticsOut)
def analytics(current_user=Depends(require_role("teacher", "admin")), db: Session = Depends(get_db)):
    students = _scoped_students(db, current_user)
    total = len(students) or 1

    attendances = [latest_attendance_avg(db, s.id) for s in students] or [0]
    markses = [latest_marks_avg(db, s.id) for s in students] or [0]

    at_risk = []
    for s in students:
        latest = (
            db.query(Prediction)
            .filter(Prediction.student_id == s.id)
            .order_by(Prediction.created_at.desc())
            .first()
        )
        if latest and latest.risk_level in ("High", "Medium"):
            at_risk.append({
                "student_id": s.id,
                "name": s.user.name,
                "roll_number": s.roll_number,
                "risk_level": latest.risk_level,
                "predicted_final_marks": latest.predicted_final_marks,
                "weak_subject": latest.weak_subject,
            })

    return TeacherAnalyticsOut(
        total_students=len(students),
        average_attendance=round(mean(attendances), 1),
        average_marks=round(mean(markses), 1),
        at_risk_count=len(at_risk),
        students_at_risk=at_risk,
    )


@router.get("/weak-students")
def weak_students(current_user=Depends(require_role("teacher", "admin")), db: Session = Depends(get_db)):
    students = _scoped_students(db, current_user)
    result = []
    for s in students:
        latest = (
            db.query(Prediction)
            .filter(Prediction.student_id == s.id)
            .order_by(Prediction.created_at.desc())
            .first()
        )
        if latest and latest.risk_level == "High":
            result.append({
                "student_id": s.id,
                "name": s.user.name,
                "roll_number": s.roll_number,
                "weak_subject": latest.weak_subject,
                "predicted_final_marks": latest.predicted_final_marks,
            })
    return result


@router.get("/export")
def export_report(current_user=Depends(require_role("teacher", "admin")), db: Session = Depends(get_db)):
    students = _scoped_students(db, current_user)
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["Roll Number", "Name", "Semester", "Avg Attendance", "Avg Marks", "Risk Level", "Predicted Final Marks"])

    for s in students:
        latest = (
            db.query(Prediction)
            .filter(Prediction.student_id == s.id)
            .order_by(Prediction.created_at.desc())
            .first()
        )
        writer.writerow([
            s.roll_number, s.user.name, s.semester,
            round(latest_attendance_avg(db, s.id), 1),
            round(latest_marks_avg(db, s.id), 1),
            latest.risk_level if latest else "N/A",
            latest.predicted_final_marks if latest else "N/A",
        ])

    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=student_report.csv"},
    )


# ---------- Teacher Selection System: incoming student requests ----------
def _request_out(r: TeacherRequest) -> TeacherRequestOut:
    return TeacherRequestOut(
        id=r.id, student_id=r.student_id, student_name=r.student.user.name if r.student else None,
        teacher_id=r.teacher_id, teacher_name=r.teacher.user.name if r.teacher else None,
        status=r.status, created_at=r.created_at,
    )


@router.get("/requests", response_model=list[TeacherRequestOut])
def pending_requests(current_user=Depends(require_role("teacher")), db: Session = Depends(get_db)):
    teacher = current_user.teacher_profile
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    reqs = (
        db.query(TeacherRequest)
        .filter(TeacherRequest.teacher_id == teacher.id, TeacherRequest.status == "pending")
        .order_by(TeacherRequest.created_at.desc())
        .all()
    )
    return [_request_out(r) for r in reqs]


@router.post("/requests/{request_id}/accept", response_model=TeacherRequestOut)
def accept_request(request_id: int, current_user=Depends(require_role("teacher")), db: Session = Depends(get_db)):
    teacher = current_user.teacher_profile
    req = db.query(TeacherRequest).filter(TeacherRequest.id == request_id, TeacherRequest.teacher_id == teacher.id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = "accepted"
    req.responded_at = datetime.utcnow()
    student = db.query(Student).filter(Student.id == req.student_id).first()
    student.teacher_id = teacher.id
    db.commit()
    db.refresh(req)
    return _request_out(req)


@router.post("/requests/{request_id}/reject", response_model=TeacherRequestOut)
def reject_request(request_id: int, current_user=Depends(require_role("teacher")), db: Session = Depends(get_db)):
    teacher = current_user.teacher_profile
    req = db.query(TeacherRequest).filter(TeacherRequest.id == request_id, TeacherRequest.teacher_id == teacher.id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = "rejected"
    req.responded_at = datetime.utcnow()
    db.commit()
    db.refresh(req)
    return _request_out(req)
