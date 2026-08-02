from database import SessionLocal
from models import User
from auth import verify_password

db = SessionLocal()

# Show all users
users = db.query(User).all()
print("=" * 50)
print(f"Total users in database: {len(users)}")
print("=" * 50)

for user in users:
    print(f"\nUser ID: {user.id}")
    print(f"Name: {user.full_name}")
    print(f"Email: '{user.email}'")  # Quotes show if there are spaces
    print(f"Role: {user.role}")
    print(f"Password hash: {user.hashed_password[:30]}...")  # First 30 chars of hash
    
    # Test the password
    test_result = verify_password("admin123", user.hashed_password)
    print(f"Password 'admin123' matches? {test_result}")

db.close()