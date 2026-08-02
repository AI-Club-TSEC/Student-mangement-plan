# Student-management-plan
Learning and grasping knowledge by developing a full stack project.

A full-stack web application for managing students, notes, and announcements. Built with **FastAPI** (Python backend) and **Vanilla JavaScript** (frontend).

---

## Features

### Admin Panel
- ✅ Secure JWT authentication
- ✅ Create, Read, Update, Delete students
- ✅ Upload PDF notes with file storage
- ✅ Post announcements
- ✅ View dashboard statistics

### Student Panel
- ✅ View personal profile
- ✅ Access uploaded notes (with PDF download)
- ✅ View announcements
- ✅ Responsive sidebar navigation

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI |
| Database | SQLite (SQLAlchemy ORM) |
| Authentication | JWT (JSON Web Tokens) |
| Password Hashing | Passlib (pbkdf2_sha256) |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| File Storage | Local `/uploads/notes` directory |

---

## Project Structure

student_management_backend/
├── backend/
│ ├── main.py # Application entry point
│ ├── database.py # Database connection & session
│ ├── models.py # SQLAlchemy ORM models
│ ├── schemas.py # Pydantic validation schemas
│ ├── auth.py # JWT & password utilities
│ ├── create_admin.py # Script to create admin user
│ ├── routers/
│ │ ├── init.py
│ │ ├── auth_router.py # Login endpoint
│ │ ├── admin.py # Admin-only endpoints
│ │ └── student.py # Student endpoints
│ └── uploads/
│ └── notes/ # Uploaded PDF files
│
├── frontend/
│ ├── index.html # Login page
│ ├── admin-dashboard.html # Admin dashboard
│ ├── student-dashboard.html # Student dashboard
│ ├── css/
│ │ └── style.css # Complete stylesheet
│ └── js/
│ ├── auth.js # Login logic
│ ├── admin-dashboard.js # Admin dashboard logic
│ └── dashboard.js # Student dashboard logic
│
└── README.md

