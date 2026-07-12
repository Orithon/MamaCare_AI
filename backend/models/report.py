from pydantic import BaseModel
from typing import List, Optional


class ReportResponse(BaseModel):
    id: str
    file_name: str
    simplified_summary: str
    flagged_values: List[str]
    firebase_storage_url: Optional[str]
    created_at: str
