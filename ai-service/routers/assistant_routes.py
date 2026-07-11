from fastapi import APIRouter
from pydantic import BaseModel
from services.gemini_services import ask_gemini

router = APIRouter( prefix="/assistant",tags = ["assistant"])

class AssistantRequest(BaseModel):
    question: str
    language: str  # "en","yo","ig","ha"

@router.post("/ask")
def ask_assistant(payload: AssistantRequest):
    prompt = f""" You are MamaCare, a friendly maternal health assistant.
                Only answer questions related to pregnancy, maternal health, nutrition, symptoms 
                and when to see a doctor. If asked off-topic questions, politely redirect to maternal health.
                Always consider that the pregnant woman is a nigerian and is based in nigeria
                Always repsond in {payload.language}. Keep responses under 150 words.

                Question: {payload.question}"""

    answer = ask_gemini(prompt)
    return {"answer":answer}

@router.get("/ping")
def ping():
    return {"status":"assistant router is working"}