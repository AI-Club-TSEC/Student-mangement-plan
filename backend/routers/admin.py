import os, uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, Note, Announcement
from models import User, Note, Announcement, Attendance  # Add Attendance
from schemas import (
    StudentCreate, StudentUpdate, StudentOut,
    NoteOut, AnnouncementCreate, AnnouncementOut
)
from auth import require_admin, get_password_hash
from schemas import (
    StudentCreate, StudentUpdate, StudentOut,
    NoteOut, AnnouncementCreate, AnnouncementOut,
    AttendanceCreate, AttendanceRecord, AttendanceReport  # Add these
)

from datetime import datetime  # Add this if not already there

router = APIRouter(dependencies=[Depends(require_admin)])

# ---------- Student Management ----------
@router.post("/students", response_model=StudentOut, status_code=201)
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    """Admin creates a new student account."""
    # Check for duplicate email
    if db.query(User).filter(User.email == student.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        full_name=student.full_name,
        email=student.email,
        enrollment_id=student.enrollment_id,
        hashed_password=get_password_hash(student.password),
        role="student"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/students", response_model=List[StudentOut])
def list_students(db: Session = Depends(get_db)):
    """Get all students."""
    return db.query(User).filter(User.role == "student").all()

@router.put("/students/{student_id}", response_model=StudentOut)
def update_student(student_id: int, updates: StudentUpdate, db: Session = Depends(get_db)):
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    update_data = updates.dict(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))

    for field, value in update_data.items():
        setattr(student, field, value)

    db.commit()
    db.refresh(student)
    return student

@router.delete("/students/{student_id}", status_code=204)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(student)
    db.commit()
    return

# ---------- Notes Management ----------
@router.post("/notes", response_model=NoteOut, status_code=201)
async def upload_note(
    title: str,
    subject: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)   # admin already forced by router
):
    """Admin uploads a PDF note."""
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1] or ".pdf"
    unique_name = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join("notes", unique_name)
    full_path = os.path.join("uploads", file_path)

    # Save file to disk
    with open(full_path, "wb") as f:
        content = await file.read()
        f.write(content)

    file_url = f"/uploads/{file_path}"
    note = Note(
        title=title,
        subject=subject,
        file_path=file_path,
        file_url=file_url,
        uploaded_by=current_user.id
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

# ---------- Announcements ----------
@router.post("/announcements", response_model=AnnouncementOut, status_code=201)
def create_announcement(
    announcement: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    new_ann = Announcement(
        title=announcement.title,
        content=announcement.content,
        created_by=current_user.id
    )
    db.add(new_ann)
    db.commit()
    db.refresh(new_ann)
    return new_ann

# ---------- Attendance Management ----------
@router.post("/attendance", status_code=201)
def mark_attendance(
    attendance_data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Mark attendance for a student."""
    # Check if student exists
    student = db.query(User).filter(User.id == attendance_data.student_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if attendance already marked for today
    today = datetime.utcnow().date()
    existing = db.query(Attendance).filter(
        Attendance.student_id == attendance_data.student_id,
        Attendance.date >= today
    ).first()
    
    if existing:
        # Update existing attendance
        existing.status = attendance_data.status
        db.commit()
        return {"message": "Attendance updated successfully"}
    
    # Create new attendance record
    attendance = Attendance(
        student_id=attendance_data.student_id,
        status=attendance_data.status
    )
    db.add(attendance)
    db.commit()
    return {"message": "Attendance marked successfully"}

@router.get("/attendance/today", response_model=List[AttendanceRecord])
def get_today_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get attendance for all students today."""
    today = datetime.utcnow().date()
    students = db.query(User).filter(User.role == "student").all()
    
    records = []
    for student in students:
        attendance = db.query(Attendance).filter(
            Attendance.student_id == student.id,
            Attendance.date >= today
        ).first()
        
        records.append({
            "student_id": student.id,
            "student_name": student.full_name,
            "enrollment_id": student.enrollment_id,
            "status": attendance.status if attendance else "not_marked"
        })
    
    return records

@router.get("/attendance/report", response_model=List[AttendanceReport])
def get_attendance_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get attendance report for all students."""
    students = db.query(User).filter(User.role == "student").all()
    
    reports = []
    for student in students:
        total = db.query(Attendance).filter(Attendance.student_id == student.id).count()
        present = db.query(Attendance).filter(
            Attendance.student_id == student.id,
            Attendance.status == "present"
        ).count()
        absent = total - present
        percentage = (present / total * 100) if total > 0 else 0
        
        reports.append({
            "student_id": student.id,
            "student_name": student.full_name,
            "enrollment_id": student.enrollment_id,
            "total_days": total,
            "present_days": present,
            "absent_days": absent,
            "percentage": round(percentage, 2)
        })
    
    return reports