"""
WhatsApp-style real-time chat between a student and their linked teacher.

- REST endpoints give history, send, mark-read (works even without WS).
- The WebSocket endpoint pushes new messages instantly and relays typing
  indicators; a lightweight in-memory ConnectionManager tracks who's online.
- Image/PDF/voice-note attachments are intentionally out of scope for this
  pass — see README for what's still open.
"""
import json
from datetime import datetime
from typing import Dict

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session

from app.core.database import get_db, SessionLocal
from app.core.deps import require_role
from app.core.security import decode_access_token
from app.models.models import User, Student, Teacher, DirectMessage
from app.schemas.schemas import DirectMessageOut, DirectMessageRequest

router = APIRouter(prefix="/api/chat", tags=["Chat"])


class ConnectionManager:
    def __init__(self):
        self.active: Dict[int, WebSocket] = {}  # user_id -> socket

    async def connect(self, user_id: int, ws: WebSocket):
        await ws.accept()
        self.active[user_id] = ws

    def disconnect(self, user_id: int):
        self.active.pop(user_id, None)

    def is_online(self, user_id: int) -> bool:
        return user_id in self.active

    async def send_to(self, user_id: int, payload: dict):
        ws = self.active.get(user_id)
        if ws:
            try:
                await ws.send_text(json.dumps(payload))
            except Exception:
                self.disconnect(user_id)


manager = ConnectionManager()


def _get_pair(db: Session, current_user: User):
    """Resolve the (student, teacher) pair for the current user, whichever role they hold."""
    if current_user.role.value == "student":
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student or not student.teacher_id:
            raise HTTPException(status_code=400, detail="You don't have a linked teacher yet")
        return student, student.teacher
    elif current_user.role.value == "teacher":
        teacher = current_user.teacher_profile
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher profile not found")
        return None, teacher  # student resolved per-thread for teachers (they have many)
    raise HTTPException(status_code=403, detail="Only students and teachers can use direct chat")


@router.get("/threads")
def my_threads(current_user: User = Depends(require_role("teacher")), db: Session = Depends(get_db)):
    """For a teacher: one thread per linked student, with last message + unread count."""
    teacher = current_user.teacher_profile
    students = db.query(Student).filter(Student.teacher_id == teacher.id).all()
    threads = []
    for s in students:
        last = (
            db.query(DirectMessage)
            .filter(DirectMessage.student_id == s.id, DirectMessage.teacher_id == teacher.id)
            .order_by(DirectMessage.created_at.desc())
            .first()
        )
        unread = (
            db.query(DirectMessage)
            .filter(
                DirectMessage.student_id == s.id, DirectMessage.teacher_id == teacher.id,
                DirectMessage.sender_role == "student", DirectMessage.is_read == False,  # noqa: E712
            )
            .count()
        )
        threads.append({
            "student_id": s.id,
            "student_name": s.user.name,
            "online": manager.is_online(s.user_id),
            "last_message": last.content if last else None,
            "last_message_at": last.created_at.isoformat() if last else None,
            "unread_count": unread,
        })
    threads.sort(key=lambda t: t["last_message_at"] or "", reverse=True)
    return threads


@router.get("/history", response_model=list[DirectMessageOut])
def student_history(current_user: User = Depends(require_role("student")), db: Session = Depends(get_db)):
    student, teacher = _get_pair(db, current_user)
    msgs = (
        db.query(DirectMessage)
        .filter(DirectMessage.student_id == student.id, DirectMessage.teacher_id == teacher.id)
        .order_by(DirectMessage.created_at.asc())
        .all()
    )
    for m in msgs:
        if m.sender_role == "teacher":
            m.is_read = True
    db.commit()
    return msgs


@router.get("/history/{student_id}", response_model=list[DirectMessageOut])
def teacher_history(student_id: int, current_user: User = Depends(require_role("teacher")), db: Session = Depends(get_db)):
    teacher = current_user.teacher_profile
    student = db.query(Student).filter(Student.id == student_id, Student.teacher_id == teacher.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found in your class")
    msgs = (
        db.query(DirectMessage)
        .filter(DirectMessage.student_id == student_id, DirectMessage.teacher_id == teacher.id)
        .order_by(DirectMessage.created_at.asc())
        .all()
    )
    for m in msgs:
        if m.sender_role == "student":
            m.is_read = True
    db.commit()
    return msgs


async def _persist_and_push(db: Session, student: Student, teacher: Teacher, sender_role: str, content: str):
    msg = DirectMessage(student_id=student.id, teacher_id=teacher.id, sender_role=sender_role, content=content)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    payload = {
        "type": "message", "id": msg.id, "sender_role": sender_role, "content": content,
        "created_at": msg.created_at.isoformat(), "student_id": student.id,
    }
    recipient_user_id = teacher.user_id if sender_role == "student" else student.user_id
    await manager.send_to(recipient_user_id, payload)
    return msg


@router.post("/send", response_model=DirectMessageOut)
async def student_send(payload: DirectMessageRequest, current_user: User = Depends(require_role("student")), db: Session = Depends(get_db)):
    student, teacher = _get_pair(db, current_user)
    return await _persist_and_push(db, student, teacher, "student", payload.content.strip())


@router.post("/send/{student_id}", response_model=DirectMessageOut)
async def teacher_send(student_id: int, payload: DirectMessageRequest, current_user: User = Depends(require_role("teacher")), db: Session = Depends(get_db)):
    teacher = current_user.teacher_profile
    student = db.query(Student).filter(Student.id == student_id, Student.teacher_id == teacher.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found in your class")
    return await _persist_and_push(db, student, teacher, "teacher", payload.content.strip())


@router.get("/online/{user_id}")
def is_online(user_id: int):
    return {"online": manager.is_online(user_id)}


@router.websocket("/ws")
async def chat_ws(websocket: WebSocket, token: str = Query(...)):
    """Authenticate via ?token=<jwt> (WebSocket can't send Authorization headers
    from the browser easily), then relay messages and typing indicators."""
    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=4401)
        return
    user_id = int(payload.get("sub"))

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            await websocket.close(code=4401)
            return

        await manager.connect(user_id, websocket)

        # Figure out the other party in this chat for typing-indicator relay.
        if user.role.value == "student":
            student = db.query(Student).filter(Student.user_id == user_id).first()
            other_user_id = student.teacher.user_id if student and student.teacher else None
        elif user.role.value == "teacher":
            other_user_id = None  # teacher may chat with many students; peer id comes from the payload
        else:
            other_user_id = None

        try:
            while True:
                raw = await websocket.receive_text()
                data = json.loads(raw)
                if data.get("type") == "typing":
                    peer_id = data.get("peer_user_id") or other_user_id
                    if peer_id:
                        await manager.send_to(peer_id, {"type": "typing", "from_user_id": user_id})
        except WebSocketDisconnect:
            manager.disconnect(user_id)
    finally:
        db.close()
