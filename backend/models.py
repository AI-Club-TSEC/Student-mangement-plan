from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    enrollment_id = Column(String, nullable=True)         # NULL for admin
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="student")  # "admin" or "student"
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    notes_uploaded = relationship("Note", back_populates="uploader")
    announcements_made = relationship("Announcement", back_populates="creator")

class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    file_path = Column(String, nullable=False)            # e.g., "notes/uuid.pdf"
    file_url = Column(String, nullable=False)             # e.g., "/uploads/notes/uuid.pdf"
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    uploader = relationship("User", back_populates="notes_uploaded")

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    creator = relationship("User", back_populates="announcements_made")