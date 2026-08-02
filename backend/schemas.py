from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# ---- Auth ----
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str

# ---- Student (Admin creates / updates) ----
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

    class Config:
        orm_mode = True

# ---- Notes ----
class NoteOut(BaseModel):
    id: int
    title: str
    subject: str
    file_url: str
    uploaded_by: int
    created_at: datetime

    class Config:
        orm_mode = True

# ---- Announcements ----
class AnnouncementCreate(BaseModel):
    title: str
    content: str

class AnnouncementOut(BaseModel):
    id: int
    title: str
    content: str
    created_by: int
    created_at: datetime

    class Config:
        orm_mode = True