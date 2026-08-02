from database import SessionLocal
from models import User

db = SessionLocal()

users = db.query(User).all()

print("=" * 50)
print(f"Total users in database: {len(users)}")
print("=" * 50)

if len(users) == 0:
    print("\n❌ NO USERS FOUND!")
    print("The database is empty. Run: python create_admin.py")
else:
    for user in users:
        print(f"\nUser ID: {user.id}")
        print(f"Name: {user.full_name}")
        print(f"Email: '{user.email}'")
        print(f"Role: {user.role}")

db.close()