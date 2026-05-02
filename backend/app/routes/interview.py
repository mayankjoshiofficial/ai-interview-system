# backend/app/routes/interview.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from app.database import get_interviews_collection, get_questions_collection
from app.services.resume_service import extract_text_from_pdf, clean_resume_text
from app.services.ai_service import generate_first_question, evaluate_answer, detect_filler_words
from app.services.audio_service import save_audio_file, transcribe_audio
from app.utils.jwt_handler import get_current_user
from datetime import datetime, timezone
from bson import ObjectId

router = APIRouter()


@router.post("/init")
async def initialize_interview(
    resume: UploadFile = File(...),
    job_role: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Start a new interview session.
    Accepts PDF resume + job role.
    Returns interview_id and first question.
    """
    
    # Validate file is PDF
    if not resume.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    
    # Read PDF bytes
    pdf_bytes = await resume.read()
    
    # Extract text from PDF
    try:
        raw_text = extract_text_from_pdf(pdf_bytes)
        resume_text = clean_resume_text(raw_text)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse PDF: {str(e)}")
    
    if len(resume_text) < 50:
        raise HTTPException(status_code=400, detail="Resume appears to be empty or unreadable")
    
    # Generate first question using AI
    try:
        first_question = generate_first_question(resume_text, job_role)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
    
    # Save interview to MongoDB
    interviews = get_interviews_collection()
    questions = get_questions_collection()
    
    interview_doc = {
        "user_id": current_user["sub"],
        "resume_text": resume_text,
        "job_role": job_role,
        "overall_score": None,
        "status": "in-progress",
        "created_at": datetime.now(timezone.utc)
    }
    
    interview_result = await interviews.insert_one(interview_doc)
    interview_id = str(interview_result.inserted_id)
    
    # Save first question to questions collection
    question_doc = {
        "interview_id": interview_id,
        "question_text": first_question,
        "audio_file_path": None,
        "transcribed_text": None,
        "ai_score": None,
        "ai_feedback": None,
        "filler_words_detected": [],
        "created_at": datetime.now(timezone.utc)
    }
    
    await questions.insert_one(question_doc)
    
    return {
        "interview_id": interview_id,
        "job_role": job_role,
        "status": "in-progress",
        "first_question": first_question
    }


@router.post("/submit-answer")
async def submit_answer(
    audio: UploadFile = File(...),
    interview_id: str = Form(...),
    question_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Submit audio answer for a question.
    Transcribes audio, evaluates answer, returns next question.
    """
    
    interviews = get_interviews_collection()
    questions = get_questions_collection()
    
    # Verify interview exists
    interview = await interviews.find_one({"_id": ObjectId(interview_id)})
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Verify interview belongs to current user
    if interview["user_id"] != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get the question
    question = await questions.find_one({"_id": ObjectId(question_id)})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Read and save audio file
    audio_bytes = await audio.read()
    
    try:
        file_path = await save_audio_file(audio_bytes, interview_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save audio: {str(e)}")
    
    # Transcribe audio
    try:
        transcribed_text = await transcribe_audio(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    
    # Detect filler words
    filler_words = detect_filler_words(transcribed_text)
    
    # Evaluate answer with AI
    try:
        ai_result = evaluate_answer(
            question=question["question_text"],
            answer=transcribed_text,
            job_role=interview["job_role"],
            resume_text=interview["resume_text"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI evaluation failed: {str(e)}")
    
    # Update question in MongoDB with answer and scores
    await questions.update_one(
        {"_id": ObjectId(question_id)},
        {"$set": {
            "audio_file_path": file_path,
            "transcribed_text": transcribed_text,
            "ai_score": ai_result["score"],
            "ai_feedback": ai_result["feedback"],
            "filler_words_detected": filler_words
        }}
    )
    
    # Save next question to MongoDB
    next_question_text = ai_result["next_question"]
    
    next_question_doc = {
        "interview_id": interview_id,
        "question_text": next_question_text,
        "audio_file_path": None,
        "transcribed_text": None,
        "ai_score": None,
        "ai_feedback": None,
        "filler_words_detected": [],
        "created_at": datetime.now(timezone.utc)
    }
    
    next_question_result = await questions.insert_one(next_question_doc)
    
    return {
        "message": "Answer submitted successfully",
        "transcribed_text": transcribed_text,
        "ai_score": ai_result["score"],
        "ai_feedback": ai_result["feedback"],
        "filler_words_detected": filler_words,
        "next_question": next_question_text,
        "next_question_id": str(next_question_result.inserted_id)
    }


@router.post("/end")
async def end_interview(
    interview_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """End the interview and calculate overall score."""
    
    interviews = get_interviews_collection()
    questions = get_questions_collection()
    
    # Verify interview
    interview = await interviews.find_one({"_id": ObjectId(interview_id)})
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Get all answered questions
    all_questions = await questions.find(
        {"interview_id": interview_id, "ai_score": {"$ne": None}}
    ).to_list(length=100)
    
    # Calculate overall score
    if all_questions:
        total_score = sum(q["ai_score"] for q in all_questions)
        overall_score = round(total_score / len(all_questions), 1)
    else:
        overall_score = 0
    
    # Update interview status
    await interviews.update_one(
        {"_id": ObjectId(interview_id)},
        {"$set": {
            "status": "completed",
            "overall_score": overall_score
        }}
    )
    
    return {
        "message": "Interview completed successfully",
        "interview_id": interview_id,
        "overall_score": overall_score,
        "total_questions": len(all_questions)
    }