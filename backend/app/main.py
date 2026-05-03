# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import connect_db, close_db
from app.routes import auth, interview, report

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()

app = FastAPI(
    title="AI Interview System API",
    description="Backend for AI-Driven Mock Interview Platform",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://ai-interview-system-xxxx.vercel.app",  # Replace with your real Vercel URL
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(interview.router, prefix="/api/interview", tags=["Interview"])
app.include_router(report.router, prefix="/api/interview", tags=["Report"])

@app.get("/")
async def root():
    return {"message": "AI Interview System is running 🚀"}