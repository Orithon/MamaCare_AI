from pydantic import BaseModel, EmailStr
from typing import Optional, List
from enum import Enum


class UserRole(str, Enum):
    patient = "patient"
    provider = "provider"


class Language(str, Enum):
    en = "en"
    yo = "yo"
    ig = "ig"
    ha = "ha"


class RegisterRequest(BaseModel):
    # NOTE: firebase_uid in the body is ignored by the server.
    # The real UID is always taken from the verified Firebase JWT.
    # This field is kept so older clients don't break, but has no effect.
    firebase_uid: Optional[str] = None
    email: EmailStr
    full_name: str
    role: UserRole
    preferred_language: Optional[Language] = Language.en
    # Provider-only fields
    clinic_name: Optional[str] = None
    license_number: Optional[str] = None


class OnboardingRequest(BaseModel):
    dob: str
    state_of_residence: str
    lga: str
    estimated_due_date: str
    gestational_age_weeks: int
    previous_pregnancies: int
    previous_live_births: int
    pre_existing_conditions: List[str]
    allergies: Optional[str] = None
    provider_code: Optional[str] = None


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    profile_photo_url: Optional[str] = None
    preferred_language: Optional[Language] = None
    clinic_name: Optional[str] = None
    provider_code: Optional[str] = None
    unlink_provider: Optional[bool] = False
