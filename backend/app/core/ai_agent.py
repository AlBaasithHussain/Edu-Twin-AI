"""
AI Agent — the conversational face of the Digital Twin.

This is the "ChatGPT-like" tutor students talk to. Unlike a generic
chatbot, every reply is grounded in that specific student's real data:
their weak/strong subjects, attendance, predicted risk level, and recent
conversation history are injected into the system prompt (a lightweight
Retrieval-Augmented Generation pattern — the "retrieval" step pulls
structured facts straight from Postgres instead of a vector store, which
is enough context for a single student's own record).

Two modes:
  1. LIVE mode — if ANTHROPIC_API_KEY is set, calls the real Claude API.
  2. DEMO/offline mode — if no key is configured, falls back to a
     rule-based responder so the app still runs end-to-end out of the box
     (useful for grading/demo environments without internet access).
"""
import os
import re
from typing import List, Optional

from sqlalchemy.orm import Session

from app.core.digital_twin import build_digital_twin
from app.core.config import settings
from app.core.aggregates import latest_attendance_avg, latest_study_hours_avg
from app.core import gamification
from app.models.models import ChatMessage, Prediction, Student

OPENROUTER_API_KEY = settings.OPENROUTER_API_KEY.strip()
OPENROUTER_MODEL = settings.OPENROUTER_MODEL

print("OPENROUTER_API_KEY loaded:", bool(OPENROUTER_API_KEY))
HISTORY_TURNS = 12  # how many prior turns to keep in context (memory)

_client = None

print("OPENROUTER_API_KEY loaded:", bool(OPENROUTER_API_KEY))

if OPENROUTER_API_KEY:
    try:
        from openai import OpenAI
        _client = OpenAI(api_key=OPENROUTER_API_KEY, base_url='https://openrouter.ai/api/v1')
        print("Anthropic client created successfully")
    except Exception as e:
        print("Anthropic initialization failed:", str(e))
        _client = None


def _system_prompt(student: Student, twin: dict) -> str:
    strong = ", ".join(s["subject"] for s in twin["strong_subjects"]) or "not enough data yet"
    weak = ", ".join(s["subject"] for s in twin["weak_subjects"]) or "not enough data yet"
    risk = twin.get("risk_level") or "Unknown"
    predicted = twin.get("predicted_final_marks")
    predicted_str = f"{predicted:.1f}%" if predicted is not None else "not yet predicted"

    return f"""You are the AI Agent inside EduTwin — a personal AI Digital Twin and study
companion for the student named {student.user.name} (semester {student.semester}).

Ground truth about this student, pulled live from their academic record:
- Academic Health Score: {twin['health_score']}/100
- Learning Score: {twin['learning_score']}/100
- Predicted final marks: {predicted_str}
- Risk level: {risk}
- Strong subjects: {strong}
- Weak subjects: {weak}

Behave like a warm, encouraging personal tutor, not a generic assistant:
- Reference the student's real weak/strong subjects and scores when relevant, instead of speaking generically.
- When asked to explain a concept, explain step-by-step, simply, with a short example.
- When asked to switch language (e.g. "explain in Tamil"), respond fully in that language.
- When asked to generate a quiz, produce 5 numbered multiple-choice questions with the correct answer marked at the end.
- When asked to generate notes, flashcards, or a summary, use clear headings and bullet points.
- When asked to prepare for an exam, prioritize the student's own weak subjects first.
- Keep answers focused and well-formatted with markdown; avoid unnecessary padding.
- Never fabricate the student's grades or attendance — only use the figures given above.
"""


def _rule_based_reply(message: str, student: Student, twin: dict) -> str:
    """Offline fallback responder used when no ANTHROPIC_API_KEY is configured."""
    msg = message.lower().strip()
    weak = [s["subject"] for s in twin["weak_subjects"]]
    strong = [s["subject"] for s in twin["strong_subjects"]]

    if any(k in msg for k in ["quiz", "test me"]):
        topic = weak[0] if weak else "your current syllabus"
        return (
            f"**Quick Quiz — {topic}** (demo mode, no AI key configured)\n\n"
            f"1. What is the most fundamental concept in {topic}?\n"
            f"   a) Definition  b) History  c) Random fact  d) None — Answer: a\n"
            f"2. Which study method helps most with {topic}?\n"
            f"   a) Cramming  b) Spaced repetition  c) Skipping class  d) Guessing — Answer: b\n\n"
            f"Add an `ANTHROPIC_API_KEY` in backend/.env to unlock full AI-generated quizzes "
            f"tailored to {topic} with real question banks."
        )
    if any(k in msg for k in ["note", "summary", "flashcard", "mind map"]):
        topic = weak[0] if weak else "this topic"
        return (
            f"**Study Notes — {topic}** (demo mode)\n\n"
            f"- Key idea: focus revision time on {topic}, your current weak area.\n"
            f"- Suggested plan: {twin['study_plan'][0]['hours'] if twin['study_plan'] else 1} "
            f"hrs/day, alternating focused study and revision.\n"
            f"- Tip: teach the concept out loud to someone else — it's the fastest way to spot gaps.\n\n"
            f"Configure `ANTHROPIC_API_KEY` for real AI-generated notes, flashcards and mind maps."
        )
    if any(k in msg for k in ["career", "placement", "internship"]):
        anchor = strong[0] if strong else "your strongest subject"
        return (
            f"Based on your digital twin, **{anchor}** is a strength worth building a career "
            f"direction around. Your current risk level is **{twin.get('risk_level') or 'Unknown'}** "
            f"and predicted final marks are **{twin.get('predicted_final_marks') or 'N/A'}**. "
            f"I'd suggest pairing a project in {anchor} with a certification to strengthen your profile. "
            f"(Running in offline demo mode — connect an ANTHROPIC_API_KEY for deeper, personalized guidance.)"
        )
    return (
        f"Hi {student.user.name.split(' ')[0]}! I'm your AI Agent, running in **offline demo mode** "
        f"because no `ANTHROPIC_API_KEY` is set in backend/.env — so I'm answering with simple rules "
        f"instead of a real language model.\n\n"
        f"Here's what I *do* know about you right now: health score **{twin['health_score']}/100**, "
        f"weak subjects: **{', '.join(weak) or 'none flagged yet'}**, strong subjects: "
        f"**{', '.join(strong) or 'none flagged yet'}**.\n\n"
        f"Add your Anthropic API key to unlock full step-by-step explanations, multilingual answers, "
        f"quiz generation, and real conversation memory."
    )


def get_history(db: Session, student_id: int, limit: int = 50) -> List[ChatMessage]:
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.student_id == student_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(limit)
        .all()
    )


def clear_history(db: Session, student_id: int) -> None:
    db.query(ChatMessage).filter(ChatMessage.student_id == student_id).delete()
    db.commit()


def _suggestions(twin: dict) -> List[str]:
    weak = [s["subject"] for s in twin["weak_subjects"]]
    out = []
    if weak:
        out.append(f"I don't understand {weak[0]}, can you teach me?")
        out.append(f"Generate a quiz on {weak[0]}")
        out.append(f"Give me revision notes for {weak[0]}")
    out.append("Prepare me for tomorrow's exam")
    return out[:4]


def chat(db: Session, student: Student, latest_prediction: Optional[Prediction], user_message: str) -> dict:
    twin = build_digital_twin(db, student.id, latest_prediction)

    # persist the user's turn
    db.add(ChatMessage(student_id=student.id, role="user", content=user_message))
    db.commit()

    history = get_history(db, student.id, limit=HISTORY_TURNS)

    if _client is not None:
        try:
            api_messages = [{"role": m.role, "content": m.content} for m in history]
            messages=[{"role":"system","content":_system_prompt(student,twin)}]+api_messages
            response=_client.chat.completions.create(
                model=OPENROUTER_MODEL,
                messages=messages,
                max_tokens=1024,
            )
            reply_text=(response.choices[0].message.content or "").strip() or "Sorry, I couldn't generate a response just now — please try again."
        except Exception as exc:
            print("Claude API Error:", repr(exc))
            raise
    else:
        reply_text = _rule_based_reply(user_message, student, twin)

    agent_msg = ChatMessage(student_id=student.id, role="assistant", content=reply_text)
    db.add(agent_msg)
    db.commit()
    db.refresh(agent_msg)

    gamification.award_xp(db, student.id, 5, "Asked the AI Agent a question")

    return {
        "reply": reply_text,
        "created_at": agent_msg.created_at,
        "suggestions": _suggestions(twin),
    }