"""
Seeds the database with:
 - 1 admin, 1 teacher, 1 parent demo login
 - 2 departments, 5 subjects
 - 100 sample students (with a matching demo login: student1@demo.com ... student100@demo.com)
 - Attendance, marks, assignments, quizzes and study-hours history for each student
 - An initial AI prediction + recommendations for every student

Run:
    python seed_data.py
"""
import random
from faker import Faker

from app.core.database import SessionLocal, Base, engine
from app.core.security import hash_password
from app.models.models import (
    User, Student, Teacher, Parent, Department, Subject,
    Attendance, Marks, Assignment, Quiz, StudyHours, RoleEnum,
)
from app.ml.prediction import predict_final_marks, compute_risk_level
from app.ml.recommendation import generate_recommendations

fake = Faker()
random.seed(7)

Base.metadata.create_all(bind=engine)
db = SessionLocal()

MONTHS = ["January", "February", "March", "April", "May"]


def get_or_create_user(name, email, password, role):
    user = db.query(User).filter(User.email == email).first()
    if user:
        return user
    user = User(name=name, email=email, hashed_password=hash_password(password), role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def seed():
    if db.query(Student).count() > 0:
        print("Database already seeded. Skipping.")
        return

    print("Seeding departments & subjects...")
    dept_cs = Department(name="Computer Science")
    dept_ec = Department(name="Electronics & Communication")
    db.add_all([dept_cs, dept_ec])
    db.commit()

    subject_names = [
        ("Data Structures", "CS201", dept_cs.id),
        ("Database Systems", "CS301", dept_cs.id),
        ("Operating Systems", "CS302", dept_cs.id),
        ("Digital Electronics", "EC201", dept_ec.id),
        ("Signals & Systems", "EC301", dept_ec.id),
    ]
    subjects = []
    for name, code, dept_id in subject_names:
        s = Subject(name=name, code=code, department_id=dept_id)
        db.add(s)
        subjects.append(s)
    db.commit()

    print("Seeding demo accounts (admin / teacher / parent)...")
    admin_user = get_or_create_user("Admin User", "admin@demo.com", "admin123", RoleEnum.admin)

    teacher_user = get_or_create_user("Dr. Ananya Rao", "teacher@demo.com", "teacher123", RoleEnum.teacher)
    teacher = Teacher(user_id=teacher_user.id, department_id=dept_cs.id)
    db.add(teacher)
    db.commit()

    parent_user = get_or_create_user("Demo Parent", "parent@demo.com", "parent123", RoleEnum.parent)
    parent = Parent(user_id=parent_user.id)
    db.add(parent)
    db.commit()

    print("Seeding 100 students with academic history...")
    students = []
    for i in range(1, 101):
        name = fake.name()
        email = f"student{i}@demo.com"
        user = get_or_create_user(name, email, "student123", RoleEnum.student)
        student = Student(
            user_id=user.id,
            roll_number=f"CS{2024000 + i}",
            department_id=random.choice([dept_cs.id, dept_ec.id]),
            parent_id=parent.id if i <= 1 else None,  # link first student to the demo parent
            semester=random.choice([1, 2, 3, 4]),
        )
        db.add(student)
        db.commit()
        db.refresh(student)
        students.append(student)

        # Attendance across 5 months
        for month in MONTHS:
            db.add(Attendance(
                student_id=student.id,
                subject_id=random.choice(subjects).id,
                month=month,
                percentage=round(random.uniform(55, 99), 1),
            ))

        # Marks + assignments + quizzes per subject
        for subject in subjects:
            internal = round(random.uniform(35, 95), 1)
            db.add(Marks(student_id=student.id, subject_id=subject.id, internal_marks=internal))
            db.add(Assignment(
                student_id=student.id, subject_id=subject.id,
                title=f"{subject.name} Assignment 1",
                submitted_on_time=random.choice([1, 1, 1, 0]),
                score=round(random.uniform(40, 100), 1),
            ))
            db.add(Quiz(
                student_id=student.id, subject_id=subject.id,
                score=round(random.uniform(20, 100), 1), max_score=100,
            ))

        # Study hours over 4 weeks
        for w in range(1, 5):
            db.add(StudyHours(student_id=student.id, week=f"Week {w}", hours_per_day=round(random.uniform(0.5, 5), 2)))

        db.commit()

    print("Running initial AI predictions for all students...")
    for student in students:
        attendance_rows = db.query(Attendance).filter(Attendance.student_id == student.id).all()
        marks_rows = db.query(Marks).filter(Marks.student_id == student.id).all()
        assignment_rows = db.query(Assignment).filter(Assignment.student_id == student.id).all()
        quiz_rows = db.query(Quiz).filter(Quiz.student_id == student.id).all()
        study_rows = db.query(StudyHours).filter(StudyHours.student_id == student.id).all()

        attendance_avg = sum(a.percentage for a in attendance_rows) / len(attendance_rows)
        marks_avg = sum(m.internal_marks for m in marks_rows) / len(marks_rows)
        assignment_avg = sum(a.score for a in assignment_rows) / len(assignment_rows)
        any_late = any(a.submitted_on_time == 0 for a in assignment_rows)
        quiz_avg = sum((q.score / q.max_score) * 100 for q in quiz_rows) / len(quiz_rows)
        study_avg = sum(s.hours_per_day for s in study_rows) / len(study_rows)

        predicted = predict_final_marks(attendance_avg, marks_avg, assignment_avg, quiz_avg, study_avg)
        risk = compute_risk_level(predicted, attendance_avg)
        weakest = min(marks_rows, key=lambda m: m.internal_marks)

        from app.models.models import Prediction, Recommendation
        db.add(Prediction(
            student_id=student.id,
            predicted_final_marks=round(predicted, 1),
            risk_level=risk,
            weak_subject=weakest.subject.name if weakest.subject else None,
        ))
        for category, message in generate_recommendations(attendance_avg, marks_avg, any_late, study_avg):
            db.add(Recommendation(student_id=student.id, message=message, category=category))

    db.commit()
    print("Seeding complete!")
    print("Demo logins:")
    print("  Admin   -> admin@demo.com   / admin123")
    print("  Teacher -> teacher@demo.com / teacher123")
    print("  Parent  -> parent@demo.com  / parent123 (linked to student1@demo.com)")
    print("  Student -> student1@demo.com ... student100@demo.com / student123")


if __name__ == "__main__":
    seed()
    db.close()
