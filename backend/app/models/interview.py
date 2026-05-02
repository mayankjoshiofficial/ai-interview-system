# backend/app/models/interview.py
from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

class InterviewCreate(BaseModel):
    job_role: str

class InterviewInDB(BaseModel):
    user_id: str
    resume_text: str
    job_role: str
    overall_score: Optional[float] = None
    status: Literal["in-progress", "completed"] = "in-progress"
    created_at: datetime = datetime.utcnow()

class InterviewResponse(BaseModel):
    interview_id: str
    job_role: str
    status: str
    first_question: str