# backend/app/models/user.py
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timezone

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserInDB(BaseModel):
    name: str
    email: str
    password_hash: str
    created_at: datetime = datetime.now(timezone.utc)

class UserResponse(BaseModel):
    id: str
    name: str
    email: str