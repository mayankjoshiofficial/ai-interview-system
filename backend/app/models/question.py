# backend/app/models/question.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class QuestionInDB(BaseModel):
    interview_id: str
    question_text: str
    audio_file_path: Optional[str] = None
    transcribed_text: Optional[str] = None
    ai_score: Optional[int] = None
    ai_feedback: Optional[str] = None
    filler_words_detected: Optional[List[str]] = []
    created_at: datetime = datetime.utcnow()

class QuestionResponse(BaseModel):
    question_id: str
    question_text: str
    transcribed_text: Optional[str]
    ai_score: Optional[int]
    ai_feedback: Optional[str]
    filler_words_detected: Optional[List[str]]