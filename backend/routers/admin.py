import os, uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, Note, Announcement
from schemas import (
    StudentCreate, StudentUpdate, StudentOut,
    NoteOut, AnnouncementCreate, AnnouncementOut
)
from auth import require_admin, get_password_hash

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