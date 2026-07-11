from pydantic import BaseModel
from typing import Optional


class ProviderNoteRequest(BaseModel):
    patient_id: str
    note_text: str


class AssignPatientRequest(BaseModel):
    patient_id: str
