# backend/app/routes/auth.py
from fastapi import APIRouter, HTTPException, status
from app.models.user import UserRegister, UserLogin
from app.database import get_users_collection
from app.utils.jwt_handler import create_access_token
from datetime import datetime, timezone
import bcrypt

router = APIRouter()

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

@router.post("/register", status_code=201)
async def register(user: UserRegister):
    users = get_users_collection()
    existing = await users.find_one({"email": user.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    hashed_password = hash_password(user.password)
    user_doc = {
        "name": user.name,
        "email": user.email,
        "password_hash": hashed_password,
        "created_at": datetime.now(timezone.utc)
    }
    result = await users.insert_one(user_doc)
    return {
        "message": "User registered successfully",
        "user_id": str(result.inserted_id)
    }

@router.post("/login")
async def login(credentials: UserLogin):
    users = get_users_collection()
    user = await users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    token = create_access_token({
        "sub": str(user["_id"]),
        "email": user["email"],
        "name": user["name"]
    })
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"]
        }
    }