# backend/app/services/ai_service.py
from groq import Groq
from app.config import settings
import json
import re

# Initialize Groq client
client = Groq(api_key=settings.GROQ_API_KEY)

def generate_first_question(resume_text: str, job_role: str) -> str:
    """Generate the first interview question based on resume."""
    
    prompt = f"""You are a Senior Technical Hiring Manager interviewing a candidate for the role of {job_role}.

Based on this resume:
{resume_text[:3000]}

Generate ONE highly specific technical interview question based on the candidate's actual experience and skills mentioned in the resume. 
Make it relevant to the {job_role} position.
Return ONLY the question, nothing else."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        max_tokens=200,
        temperature=0.7
    )
    
    return response.choices[0].message.content.strip()


def evaluate_answer(
    question: str,
    answer: str,
    job_role: str,
    resume_text: str
) -> dict:
    """Evaluate the candidate's answer and generate next question."""
    
    system_prompt = f"""You are a Senior Technical Hiring Manager. 
You are interviewing a candidate for the role of {job_role}.
Base your questions strictly on this resume text: {resume_text[:2000]}

You must respond ONLY with a valid JSON object. No extra text before or after.
The JSON must have exactly these keys:
- score: integer from 1 to 10
- feedback: string explaining the score
- next_question: string with the next interview question based on resume"""

    user_prompt = f"""Grade the user's answer to the interview question.

Question asked: {question}
Candidate's answer: {answer}

Evaluate technical accuracy and communication clarity.
Return ONLY a valid JSON object like this:
{{"score": 7, "feedback": "Good answer but missing details about X", "next_question": "Can you explain your experience with Y?"}}"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        max_tokens=500,
        temperature=0.3
    )
    
    response_text = response.choices[0].message.content.strip()
    
    # Extract JSON from response
    try:
        # Try direct parsing first
        result = json.loads(response_text)
    except json.JSONDecodeError:
        # Find JSON pattern in response
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
        else:
            # Fallback if AI doesn't return proper JSON
            result = {
                "score": 5,
                "feedback": response_text,
                "next_question": "Can you tell me about a challenging project you worked on?"
            }
    
    return result


def detect_filler_words(text: str) -> list:
    """Detect filler words in the transcribed answer."""
    filler_words = [
        "um", "uh", "like", "you know", "basically", 
        "literally", "actually", "so", "right", "okay",
        "hmm", "err", "ah", "kind of", "sort of"
    ]
    
    text_lower = text.lower()
    detected = []
    
    for word in filler_words:
        if f" {word} " in f" {text_lower} ":
            count = text_lower.count(word)
            if count > 0:
                detected.append(f"{word} (x{count})")
    
    return detected