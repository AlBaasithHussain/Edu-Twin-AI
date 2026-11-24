# Cortex Twin — AI-Powered Digital Twin for Personalized Student Learning

A full-stack application that builds a "digital twin" of each student from
attendance, marks, assignments, quizzes and study hours, predicts final marks
with a Random Forest model, and turns that into role-specific dashboards for
students, teachers, parents and admins.

```
digital-twin-lms/
├── backend/                  FastAPI + SQLAlchemy + Random Forest
│   ├── app/
│   │   ├── core/             config, database session, JWT security, auth deps
│   │   ├── models/           SQLAlchemy ORM models (all tables)
│   │   ├── schemas/          Pydantic request/response schemas
│   │   ├── routes/           auth, students, predictions, teacher, parent, admin
│   │   ├── ml/                dataset generator, trainer, prediction + recommendation logic
│   │   └── main.py            FastAPI app entrypoint
│   ├── seed_data.py           creates demo accounts + 100 sample students
│   ├── requirements.txt
│   └── .env.example
├── frontend/                 React (Vite) + Tailwind + Chart.js + Framer Motion
│   └── src/
│       ├── pages/             landing, auth, student/teacher/parent/admin dashboards
│       ├── components/        Sidebar, Navbar, StatCard, GaugeMeter, layout
│       ├── context/            auth + theme (dark/light) providers
│       ├── hooks/               data-fetching hooks
│       └── utils/                axios client, chart.js setup
├── database/
│   └── schema.sql             MySQL schema + reference seed data
└── README.md
```

## 1. Prerequisites

- Python 3.10+
- Node.js 18+
- MySQL 8+ (optional — SQLite works out of the box for local dev)

## 2. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env if you want MySQL instead of the SQLite default:
#   DATABASE_URL=mysql+pymysql://root:yourpassword@localhost:3306/digital_twin_lms

# Train the AI model (creates backend/app/ml/artifacts/model.pkl + scaler.pkl)
python -m app.ml.train_model

# Create tables + seed 100 demo students, plus admin/teacher/parent demo logins
python seed_data.py

# Run the API
uvicorn app.main:app --reload
```

The API is now live at **http://localhost:8000** — interactive docs at
**http://localhost:8000/docs**.

### Using MySQL instead of SQLite

1. `CREATE DATABASE digital_twin_lms CHARACTER SET utf8mb4;` (or run `database/schema.sql`)
2. Set `DATABASE_URL=mysql+pymysql://<user>:<password>@localhost:3306/digital_twin_lms` in `backend/.env`
3. Run `python seed_data.py` again — SQLAlchemy will create/populate the same tables in MySQL.

### Demo logins (created by `seed_data.py`)

| Role    | Email                                   | Password     |
|---------|------------------------------------------|--------------|
| Admin   | admin@demo.com                          | admin123     |
| Teacher | teacher@demo.com                        | teacher123   |
| Parent  | parent@demo.com                         | parent123    |
| Student | student1@demo.com … student100@demo.com | student123   |

## 3. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:8000
npm run dev
```

Visit **http://localhost:5173**. Log in with any demo account above, or
register a new one from the landing page.

## 4. How the AI pipeline works

- `app/ml/generate_dataset.py` — synthesizes a labeled training set (attendance,
  marks, assignment score, quiz score, study hours → final marks) using a
  weighted formula plus noise, so the model learns a realistic relationship.
- `app/ml/train_model.py` — trains a `RandomForestRegressor`, scales features
  with `StandardScaler`, and saves `model.pkl`, `scaler.pkl`, `metrics.json`
  (MAE / RMSE / R²) and a feature-importance chart to `app/ml/artifacts/`.
- `app/ml/prediction.py` — loads the saved model at request time and predicts
  final marks + a Low/Medium/High risk level.
- `app/ml/recommendation.py` — a transparent rule engine (attendance < 75%,
  marks < 60, late assignments, study hours < 2/day) that turns the same
  signals into specific, human-readable recommendations.
- `POST /api/predictions/run/{student_id}` recomputes both the prediction and
  the recommendations from a student's latest data and persists them.
- Admins can retrain the model from **Admin → AI Model** in the UI, which
  re-runs `train_model.py` and reports the new metrics.

## 4b. AI Agent — ChatGPT-style tutor (new)

Every student now has a conversational **AI Agent** at `/student/ai-agent`,
built on top of the same Digital Twin data:

- `app/core/ai_agent.py` builds a system prompt from that student's live
  health/learning scores, weak/strong subjects, risk level, and predicted
  marks (a lightweight RAG pattern — "retrieval" pulls structured facts
  straight from Postgres/MySQL instead of a vector store), then calls the
  Anthropic API (`ANTHROPIC_API_KEY` in `backend/.env`) with recent
  conversation history so it remembers earlier turns.
- If no API key is configured, it automatically falls back to a rule-based
  **offline demo mode** so the whole app still runs end-to-end without any
  external service or internet access — useful for grading/demo machines.
- Students can ask things like *"I don't understand Binary Search"*,
  *"generate a quiz on my weakest subject"*, *"explain in Tamil"*, or
  *"prepare me for tomorrow's exam"* — covering the AI Agent, Notes
  Generator, and Recommendation Engine features from the spec through one
  conversational interface instead of separate screens.
- Chat history is persisted per-student in `agent_chat_messages` (see
  `database/schema.sql`) and exposed via `GET/DELETE /api/agent/history`
  and `POST /api/agent/chat`.

To enable live mode:
```
cd backend
pip install -r requirements.txt   # installs the anthropic SDK
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env
```

## 5. Key API endpoints

| Method | Endpoint                              | Purpose                              |
|--------|-----------------------------------------|----------------------------------------|
| POST   | `/api/auth/register`                    | Create an account (any role)           |
| POST   | `/api/auth/login`                       | Get a JWT for a given role             |
| GET    | `/api/students/me`                      | Current student's profile              |
| GET    | `/api/students/{id}/dashboard`          | Full dashboard payload for a student   |
| POST   | `/api/predictions/run/{student_id}`     | Run/refresh an AI prediction           |
| GET    | `/api/teacher/analytics`                | Class-wide attendance/marks/risk stats |
| GET    | `/api/teacher/weak-students`            | High-risk student list                 |
| GET    | `/api/teacher/export`                   | CSV report download                    |
| GET    | `/api/parent/children`                  | Children linked to a parent account    |
| GET    | `/api/parent/child/{id}/alerts`         | Prediction + recommendations for a child |
| GET/POST | `/api/admin/departments`, `/api/admin/subjects` | Manage academic structure    |
| POST   | `/api/admin/ai-model/retrain`           | Retrain the Random Forest model        |
| POST   | `/api/agent/chat`                       | Chat with the AI Agent (ChatGPT-style)  |
| GET    | `/api/agent/history`                    | Fetch a student's chat history          |
| DELETE | `/api/agent/history`                    | Clear a student's chat history          |
| POST   | `/api/students/me/choose-teacher/{id}`  | Send a request to a teacher             |
| GET    | `/api/teacher/requests`                 | Teacher's pending student requests      |
| POST   | `/api/teacher/requests/{id}/accept`     | Accept a student request                |
| POST   | `/api/teacher/requests/{id}/reject`     | Reject a student request                |
| GET/POST | `/api/chat/history`, `/api/chat/send` | Student ↔ teacher direct messages   |
| WS     | `/api/chat/ws?token=...`                | Real-time chat, typing, online status   |
| GET    | `/api/notifications`                    | AI Alerts + notifications for any user  |
| POST   | `/api/notifications/mark-all-read`      | Clear unread badge                      |
| GET    | `/api/gamification/me`                  | XP, level, streak, badges               |
| GET    | `/api/gamification/leaderboard`         | Class leaderboard                       |
| GET/POST | `/api/calendar/exams`                 | Upcoming exams                          |
| GET/POST | `/api/calendar/goals`                 | Daily/weekly/monthly goals               |

Full interactive documentation (all request/response schemas) is auto-generated
by FastAPI at `/docs`.

## 6. What's new in this build

- **Teacher Selection System** now works as specified: choosing a teacher sends
  a request; the teacher must accept it (`/teacher/requests` page) before the
  student is linked, shows up in their class, and can chat with them.
- **Real-time chat** (`/student/chat`, `/teacher/chat`) over a WebSocket —
  online status, instant delivery, per-thread unread counts. Text-only for
  now; see the scope note below.
- **Notifications / AI Alerts** (bell icon in the navbar) — auto-generated
  from live attendance, marks, assignment, study-hour, and upcoming-exam data.
- **Gamification** (`/student/gamification`) — XP, levels, daily streaks,
  badges, and a class leaderboard.
- **Calendar & Goals** (`/student/calendar`) — upcoming exams plus
  daily/weekly/monthly goals with progress tracking (completing one awards XP).

## 7. Notes on this build

- Auth uses JWT bearer tokens with role-based access control enforced on every
  protected route (`require_role(...)` dependency).
- Passwords are hashed with `pbkdf2_sha256` via Passlib.
- The frontend never talks to the database directly — every screen calls the
  FastAPI backend, which is the single source of truth.
- The dataset behind the model is synthetic (for demo purposes); swap
  `generate_dataset.py` for a real data export and re-run `train_model.py` to
  use it with genuine institutional data.

**Phase 2 / not built in this pass** (see the master build prompt for the
full list): OCR for handwritten notes, voice assistant (speech-to-text /
text-to-speech), AI Resume Builder, AI Interview Preparation, AI Exam Paper
Generator, two-factor authentication, full audit logging, chat file/voice
attachments, and parent↔teacher chat. These need real infrastructure (file
storage, OCR/speech services) beyond this scope and are called out here
rather than shipped as non-functional UI.
