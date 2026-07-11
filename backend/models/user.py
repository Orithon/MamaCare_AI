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
    # Patient-only fields
    age: Optional[int] = None
    gestational_age_weeks: Optional[int] = None
    preferred_language: Optional[Language] = Language.en
    previous_pregnancies: Optional[int] = 0
    pre_existing_conditions: Optional[List[str]] = []
    # Provider-only fields
    clinic_name: Optional[str] = None
    license_number: Optional[str] = None


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    profile_photo_url: Optional[str] = None
    age: Optional[int] = None
    gestational_age_weeks: Optional[int] = None
    preferred_language: Optional[Language] = None
    previous_pregnancies: Optional[int] = None
    pre_existing_conditions: Optional[List[str]] = None
    clinic_name: Optional[str] = None
