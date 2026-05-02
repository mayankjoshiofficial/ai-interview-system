# backend/app/database.py
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client: AsyncIOMotorClient = None

async def connect_db():
    global client
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    print("✅ Connected to MongoDB Atlas")

async def close_db():
    global client
    if client:
        client.close()
        print("🔌 MongoDB connection closed")

def get_database():
    return client[settings.DB_NAME]

def get_users_collection():
    return get_database()["users"]

def get_interviews_collection():
    return get_database()["interviews"]

def get_questions_collection():
    return get_database()["questions"]