from fastapi import APIRouter
from pydantic import BaseModel
from services.gemini_services import ask_gemini

router = APIRouter( prefix="/reports", tags=["reports"] )

class ReportInterpretRequest(BaseModel):
    extracted_text: str
    language: str = "en"


def build_report_prompt( payload: ReportInterpretRequest ):
    prompt = f""" You are a maternal health assistant helping a pregnant patient understand her medical report.
             Use simple. compassionate language. Respond only in {payload.language}.

             Please explain this medical report to me in simple terms in not more than two sentences for each:
             
             {payload.extracted_text}
             Tell me:
            1. What the key values mean
            2. Explain (if any) side notes by the doctor
            3. Which values (if any) are abnormal
            4. What should I do next"""

    return prompt

@router.post("/interpret")
def interpret_report(payload: ReportInterpretRequest):
    prompt = build_report_prompt(payload)
    summary = ask_gemini(prompt)
    return {"summary" : summary}

