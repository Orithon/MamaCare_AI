from pydantic import BaseModel
from typing import Optional
from enum import Enum


class Language(str, Enum):
    en = "en"
    yo = "yo"
    ig = "ig"
    ha = "ha"


class ChatRequest(BaseModel):
    message: str
    language: Language = Language.en
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    session_id: str
    language: str
