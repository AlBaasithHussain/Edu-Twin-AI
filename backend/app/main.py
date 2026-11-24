from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.routes import auth, students, predictions, teacher, parent, admin, agent, notifications, gamification, calendar, chat

# Create all tables on startup (safe no-op if they already exist)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI-Powered Digital Twin for Personalized Student Learning",
    description="Backend API powering student, teacher, parent and admin dashboards, "
                "with a Random Forest model predicting academic performance.",
    version="1.0.0",
)

allowed_origins = [o.strip() for o in settings.FRONTEND_ORIGIN.split(",") if o.strip()]
allowed_origins += ["http://localhost:5173", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set(allowed_origins)),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(students.router)
app.include_router(predictions.router)
app.include_router(teacher.router)
app.include_router(parent.router)
app.include_router(admin.router)
app.include_router(agent.router)
app.include_router(notifications.router)
app.include_router(gamification.router)
app.include_router(calendar.router)
app.include_router(chat.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "Digital Twin LMS API", "docs": "/docs"}


@app.get("/api/health")
def health():
    return {"status": "healthy"}
