from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
import json
from services.gemini_services import ask_gemini

router = APIRouter( prefix="/predictions",tags = ["predictions"])

class RiskAssessmentRequest(BaseModel):
    systolic_bp: Optional[float]
    diastolic_bp: Optional[float]
    blood_glucose: Optional[float]
    temperature: Optional[float]
    heart_rate: Optional[float]
    haemoglobin: Optional[float]
    symptoms: List[str]
    gestational_week: Optional[int]
    language: str  # "en","yo","ig","ha"

def rule_based_check(symptoms: List[str]) -> str| None:
    """Returns a forced minimum risk level, or None if no override applies."""
    critical_symptoms = ["vaginal bleeding", "severe abdominal pain"]
    for symptom in symptoms:
        if symptom.lower() in critical_symptoms:
            return "high"
    return None

def build_risk_prompt(payload: RiskAssessmentRequest) -> str:
    health_data = {
        "systolic_bp": payload.systolic_bp,
        "diastolic_bp": payload.diastolic_bp,
        "blood_glucose": payload.blood_glucose,
        "temperature": payload.temperature,
        "heart_rate": payload.heart_rate,
        "haemoglobin": payload.haemoglobin,
        "symptoms": payload.symptoms,
        "gestational_week": payload.gestational_week,
    }

    health_data = {k:v for k,v in health_data.items() if v is not None}

    prompt = f""" You are a maternal health risk assessment AI. Analyse the provided health data and return
              a JSON response only. No markdown, no explanation outside the JSON.

            Assess the maternal health risk for a pregnant patient. Note: not all readings may be available- 
            base your assessment on whatever data is provided, and mention in your explanation if key missing 
            readings would help refine the assessment.

            Patient Data: {json.dumps(health_data)}
            Language for response : {payload.language}

            Return JSON: 
            {{
                "risk_level" : "low|moderate|high|critical",
                "conditions_flagged": ["condition1", "condition2"],
                "explanation": plain language explanation in {payload.language},
                "recommendations" : ["action1", "action2", "action3"],
            }}"""

    return prompt


RISK_LEVELS = { "low" : 0, "moderate" : 1, "high" : 2 , "critical" : 3 }
@router.post("/assess")
def assess_risk(payload: RiskAssessmentRequest):

    forced_minimum = rule_based_check(payload.symptoms)

    prompt = build_risk_prompt(payload)
    raw_response = ask_gemini(prompt)

    cleaned = raw_response.strip().removeprefix("```json").removesuffix("```").strip()
    result = json.loads(cleaned)

    if forced_minimum and RISK_LEVELS[result["risk_level"]] < RISK_LEVELS[forced_minimum]:
        result ["risk_level"] = forced_minimum

    return result