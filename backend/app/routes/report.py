# backend/app/routes/report.py
from fastapi import APIRouter, HTTPException, Depends
from app.database import get_interviews_collection, get_questions_collection
from app.utils.jwt_handler import get_current_user
from bson import ObjectId

router = APIRouter()


@router.get("/report/{interview_id}")
async def get_interview_report(
    interview_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get the full report for a completed interview."""
    
    interviews = get_interviews_collection()
    questions = get_questions_collection()
    
    # Get interview
    interview = await interviews.find_one({"_id": ObjectId(interview_id)})
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Verify ownership
    if interview["user_id"] != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all questions for this interview
    all_questions = await questions.find(
        {"interview_id": interview_id}
    ).to_list(length=100)
    
    # Format questions for response
    questions_data = []
    for q in all_questions:
        questions_data.append({
            "question_id": str(q["_id"]),
            "question_text": q["question_text"],
            "transcribed_text": q.get("transcribed_text"),
            "ai_score": q.get("ai_score"),
            "ai_feedback": q.get("ai_feedback"),
            "filler_words_detected": q.get("filler_words_detected", [])
        })
    
    # Calculate stats
    answered = [q for q in questions_data if q["ai_score"] is not None]
    avg_score = round(
        sum(q["ai_score"] for q in answered) / len(answered), 1
    ) if answered else 0
    
    return {
        "interview_id": interview_id,
        "job_role": interview["job_role"],
        "status": interview["status"],
        "overall_score": interview.get("overall_score", avg_score),
        "total_questions": len(questions_data),
        "answered_questions": len(answered),
        "average_score": avg_score,
        "created_at": str(interview["created_at"]),
        "questions": questions_data
    }


@router.get("/my-interviews")
async def get_my_interviews(
    current_user: dict = Depends(get_current_user)
):
    """Get all interviews for the logged in user."""
    
    interviews = get_interviews_collection()
    
    all_interviews = await interviews.find(
        {"user_id": current_user["sub"]}
    ).sort("created_at", -1).to_list(length=50)
    
    result = []
    for interview in all_interviews:
        result.append({
            "interview_id": str(interview["_id"]),
            "job_role": interview["job_role"],
            "status": interview["status"],
            "overall_score": interview.get("overall_score"),
            "created_at": str(interview["created_at"])
        })
    
    return {"interviews": result}