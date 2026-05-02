# backend/app/services/audio_service.py
import os
import aiofiles
from groq import Groq
from app.config import settings
from datetime import datetime

client = Groq(api_key=settings.GROQ_API_KEY)

UPLOAD_DIR = "uploads"

async def save_audio_file(audio_bytes: bytes, interview_id: str) -> str:
    """Save audio file locally and return the file path."""
    
    # Create uploads directory if it doesn't exist
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Create unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{interview_id}_{timestamp}.wav"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    # Save file
    async with aiofiles.open(filepath, 'wb') as f:
        await f.write(audio_bytes)
    
    return filepath


async def transcribe_audio(file_path: str) -> str:
    """Transcribe audio file using Groq Whisper."""
    
    try:
        with open(file_path, 'rb') as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-large-v3",
                file=audio_file,
                response_format="text"
            )
        
        return transcription.strip()
        
    except Exception as e:
        raise Exception(f"Transcription failed: {str(e)}")