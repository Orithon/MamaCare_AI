from pydantic import BaseModel
from typing import Optional, List


class HealthInputData(BaseModel):
    age: int
    gestational_age_weeks: int
    bp_systolic: int
    bp_diastolic: int
    blood_sugar: float
    temperature: float
    heart_rate: int
    symptoms: List[str]  # e.g. ["headache", "swelling", "blurred_vision"]
    previous_pregnancies: int
    pre_existing_conditions: List[str]  # e.g. ["diabetes", "hypertension"]
    language: Optional[str] = "en"


class PredictionResponse(BaseModel):
    id: str
    risk_level: str
    conditions_flagged: List[str]
    recommendations: List[str]
    explanation: str
    created_at: str
