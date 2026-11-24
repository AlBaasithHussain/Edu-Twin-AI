-- ============================================================
-- AI-Powered Digital Twin for Personalized Student Learning
-- MySQL Schema
--
-- This file is the reference schema for production (MySQL).
-- The FastAPI backend can create these same tables automatically
-- via SQLAlchemy (see backend/app/models/models.py) against either
-- SQLite (dev default) or this MySQL schema, controlled entirely
-- by the DATABASE_URL in backend/.env.
--
-- To use this file directly:
--   mysql -u root -p -e "CREATE DATABASE digital_twin_lms CHARACTER SET utf8mb4;"
--   mysql -u root -p digital_twin_lms < database/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS digital_twin_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE digital_twin_lms;

-- ---------------- Users & role profiles ----------------

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    role ENUM('student', 'teacher', 'parent', 'admin') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    code VARCHAR(30) NOT NULL UNIQUE,
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    department_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE parents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    roll_number VARCHAR(30) NOT NULL UNIQUE,
    department_id INT,
    parent_id INT,
    teacher_id INT,
    semester INT DEFAULT 1,
    -- Self-declared profile fields — editable by the student via PUT /api/students/me.
    -- Attendance, marks, and weak/strong subjects are intentionally NOT here: those
    -- live in their own tables below and are populated from real records / the ML
    -- pipeline, never typed in directly by the student.
    subject_interest VARCHAR(200),
    skills VARCHAR(300),
    career_goal VARCHAR(200),
    learning_style VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE SET NULL,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------- Academic records ----------------

CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT,
    month VARCHAR(20) NOT NULL,
    percentage FLOAT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT,
    title VARCHAR(200) NOT NULL,
    submitted_on_time TINYINT(1) DEFAULT 1,
    score FLOAT DEFAULT 0,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT,
    score FLOAT NOT NULL,
    max_score FLOAT DEFAULT 100,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT,
    internal_marks FLOAT NOT NULL,
    final_marks FLOAT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE study_hours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    week VARCHAR(20) NOT NULL,
    hours_per_day FLOAT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------- AI outputs ----------------

CREATE TABLE predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    predicted_final_marks FLOAT NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    weak_subject VARCHAR(120),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------- AI Agent (ChatGPT-style tutor) ----------------

CREATE TABLE agent_chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    role VARCHAR(10) NOT NULL,      -- 'user' or 'assistant'
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------- Teacher Selection System ----------------

CREATE TABLE teacher_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    teacher_id INT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',   -- pending, accepted, rejected
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    responded_at DATETIME NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------- WhatsApp-style direct chat ----------------

CREATE TABLE direct_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    teacher_id INT NOT NULL,
    sender_role VARCHAR(10) NOT NULL,   -- 'student' or 'teacher'
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------- Notifications / AI Alerts ----------------

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(30) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------- Calendar: Exams ----------------

CREATE TABLE exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    department_id INT NULL,
    title VARCHAR(200) NOT NULL,
    exam_date DATETIME NOT NULL,
    semester INT DEFAULT 1,
    created_by_teacher_id INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------- Daily / Weekly / Monthly Goals ----------------

CREATE TABLE goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    period VARCHAR(10) NOT NULL,   -- daily, weekly, monthly
    title VARCHAR(200) NOT NULL,
    target_value FLOAT DEFAULT 100,
    progress FLOAT DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    due_date DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------- Gamification ----------------

CREATE TABLE xp_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    points INT NOT NULL,
    reason VARCHAR(150) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE streak_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL UNIQUE,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_active_date DATETIME NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------- Seed reference data ----------------

INSERT INTO departments (name) VALUES ('Computer Science'), ('Electronics & Communication');

INSERT INTO subjects (name, code, department_id) VALUES
    ('Data Structures', 'CS201', 1),
    ('Database Systems', 'CS301', 1),
    ('Operating Systems', 'CS302', 1),
    ('Digital Electronics', 'EC201', 2),
    ('Signals & Systems', 'EC301', 2);

-- Demo accounts (passwords are hashed with pbkdf2_sha256 by the backend's
-- seed_data.py — run that script instead of inserting plaintext here).
-- This file only guarantees the SCHEMA and reference lookup data.
-- For the full 100-student demo dataset with attendance/marks/predictions,
-- run:  cd backend && python seed_data.py   (with DATABASE_URL pointed at MySQL)
