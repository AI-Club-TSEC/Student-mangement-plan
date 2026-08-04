from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Note, Announcement
from schemas import StudentOut, NoteOut, AnnouncementOut
from auth import get_current_user
from models import User
from models import Note, Announcement, User, Attendance  # Add Attendance

router = APIRouter(dependencies=[Depends(get_current_user)])

@router.get("/profile", response_model=StudentOut)
def get_profile(current_user: User = Depends(get_current_user)):
    """Return the authenticated student's details."""
    return current_user

@router.get("/notes", response_model=List[NoteOut])
def list_notes(db: Session = Depends(get_db)):
    """All notes, newest first."""
    return db.query(Note).order_by(Note.created_at.desc()).all()

@router.get("/announcements", response_model=List[AnnouncementOut])
def list_announcements(db: Session = Depends(get_db)):
    """All announcements, newest first."""
    return db.query(Announcement).order_by(Announcement.created_at.desc()).all()

@router.get("/attendance")
def get_my_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get attendance record for logged-in student."""
    records = db.query(Attendance).filter(
        Attendance.student_id == current_user.id
    ).order_by(Attendance.date.desc()).all()
    
    total = len(records)
    present = sum(1 for r in records if r.status == "present")
    absent = total - present
    percentage = (present / total * 100) if total > 0 else 0
    
    return {
        "records": records,
        "total_days": total,
        "present_days": present,
        "absent_days": absent,
        "percentage": round(percentage, 2)
    }