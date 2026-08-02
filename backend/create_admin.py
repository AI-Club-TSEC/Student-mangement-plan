from database import SessionLocal
from models import User
from auth import get_password_hash

# Create a database session
db = SessionLocal()

# Check if admin already exists
admin = db.query(User).filter(User.email == "admin@example.com").first()

if admin:
    print("Admin user already exists!")
    print(f"Email: {admin.email}")
else:
    # Create a new admin user
    admin = User(
        full_name="Admin User",
        email="admin@example.com",
        enrollment_id=None,
        hashed_password=get_password_hash("admin123"),
        role="admin"
    )
    db.add(admin)
    db.commit()
    print("Admin user created successfully!")
    print("Email: admin@example.com")
    print("Password: admin123")

db.close()