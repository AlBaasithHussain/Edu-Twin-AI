from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_role
from app.core import ai_agent
from app.models.models import User, Student, Prediction
from app.schemas.schemas import ChatRequest, ChatResponse, ChatMessageOut

router = APIRouter(prefix="/api/agent", tags=["AI Agent"])


def _get_student(db: Session, current_user: User) -> Student:
    return db.query(Student).filter(Student.user_id == current_user.id).first()


def _latest_prediction(db: Session, student_id: int):
    return (
        db.query(Prediction)
        .filter(Prediction.student_id == student_id)
        .order_by(Prediction.created_at.desc())
        .first()
    )


@router.get("/history", response_model=list[ChatMessageOut])
def chat_history(current_user: User = Depends(require_role("student")), db: Session = Depends(get_db)):
    student = _get_student(db, current_user)
    return ai_agent.get_history(db, student.id)


@router.post("/chat", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db),
):
    student = _get_student(db, current_user)
    prediction = _latest_prediction(db, student.id)
    result = ai_agent.chat(db, student, prediction, payload.message.strip())
    return result


@router.delete("/history")
def clear_chat_history(current_user: User = Depends(require_role("student")), db: Session = Depends(get_db)):
    student = _get_student(db, current_user)
    ai_agent.clear_history(db, student.id)
    return {"status": "cleared"}
