import json
import os

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_role
from app.core.config import settings
from app.models.models import Department, Subject, User, Student, Teacher, Parent
from app.ml.train_model import train

router = APIRouter(prefix="/api/admin", tags=["Admin"])


class DepartmentIn(BaseModel):
    name: str


class SubjectIn(BaseModel):
    name: str
    code: str
    department_id: int


@router.get("/users")
def list_users(current_user=Depends(require_role("admin")), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{"id": u.id, "name": u.name, "email": u.email, "role": u.role.value} for u in users]


@router.delete("/users/{user_id}")
def delete_user(user_id: int, current_user=Depends(require_role("admin")), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"detail": "User deleted"}


@router.get("/departments")
def list_departments(current_user=Depends(require_role("admin", "teacher")), db: Session = Depends(get_db)):
    return [{"id": d.id, "name": d.name} for d in db.query(Department).all()]


@router.post("/departments")
def create_department(payload: DepartmentIn, current_user=Depends(require_role("admin")), db: Session = Depends(get_db)):
    dept = Department(name=payload.name)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return {"id": dept.id, "name": dept.name}


@router.get("/subjects")
def list_subjects(current_user=Depends(require_role("admin", "teacher")), db: Session = Depends(get_db)):
    return [
        {"id": s.id, "name": s.name, "code": s.code, "department_id": s.department_id}
        for s in db.query(Subject).all()
    ]


@router.post("/subjects")
def create_subject(payload: SubjectIn, current_user=Depends(require_role("admin")), db: Session = Depends(get_db)):
    subject = Subject(name=payload.name, code=payload.code, department_id=payload.department_id)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return {"id": subject.id, "name": subject.name, "code": subject.code}


@router.get("/reports/summary")
def reports_summary(current_user=Depends(require_role("admin")), db: Session = Depends(get_db)):
    return {
        "total_students": db.query(Student).count(),
        "total_teachers": db.query(Teacher).count(),
        "total_parents": db.query(Parent).count(),
        "total_departments": db.query(Department).count(),
        "total_subjects": db.query(Subject).count(),
    }


@router.get("/ai-model/metrics")
def model_metrics(current_user=Depends(require_role("admin"))):
    metrics_path = os.path.join(os.path.dirname(settings.MODEL_PATH), "metrics.json")
    if not os.path.exists(metrics_path):
        return {"detail": "Model has not been trained yet."}
    with open(metrics_path) as f:
        return json.load(f)


@router.post("/ai-model/retrain")
def retrain_model(current_user=Depends(require_role("admin"))):
    metrics = train()
    return {"detail": "Model retrained successfully", "metrics": metrics}
