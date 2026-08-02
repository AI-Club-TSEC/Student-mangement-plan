from database import SessionLocal
from models import User
from auth import create_access_token, SECRET_KEY, ALGORITHM
import jwt

db = SessionLocal()

user = db.query(User).filter(User.email == "admin@example.com").first()

if not user:
    print("No admin user found!")
    db.close()
    exit()

print(f"Admin found: ID={user.id}, Role={user.role}")

token = create_access_token(data={"sub": user.id, "role": user.role})
print(f"Token: {token}")

try:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    print(f"Token decodes OK!")
    print(f"Payload: {payload}")
except Exception as e:
    print(f"Decode error: {e}")

db.close()