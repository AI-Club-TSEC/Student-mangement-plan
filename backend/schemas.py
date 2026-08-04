from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime

# ---------- Auth ----------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str

# ---------- Student ----------
class StudentCreate(BaseModel):
    full_name: str
    email: EmailStr
    enrollment_id: Optional[str] = None
    password: str

class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    enrollment_id: Optional[str] = None
    password: Optional[str] = None

class StudentOut(BaseModel):
    id: int
    full_name: str
    email: str
    enrollment_id: Optional[str]
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ---------- Notes ----------
class NoteOut(BaseModel):
    id: int
    title: str
    subject: str
    file_url: str
    uploaded_by: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ---------- Announcements ----------
class AnnouncementCreate(BaseModel):
    title: str
    content: str

class AnnouncementOut(BaseModel):
    id: int
    title: str
    content: str
    created_by: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ---------- Attendance ----------
class AttendanceCreate(BaseModel):
    student_id: int
    status: str

class AttendanceOut(BaseModel):
    id: int
    student_id: int
    date: datetime
    status: str

    model_config = ConfigDict(from_attributes=True)

class AttendanceRecord(BaseModel):
    student_id: int
    student_name: str
    enrollment_id: Optional[str]
    status: str

class AttendanceReport(BaseModel):
    student_id: int
    student_name: str
    enrollment_id: Optional[str]
    total_days: int
    present_days: int
    absent_days: int
    percentage: float