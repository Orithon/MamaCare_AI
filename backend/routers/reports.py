from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from datetime import datetime, timezone
from bson import ObjectId
import motor.motor_asyncio
from core.database import get_db
from middleware.auth_middleware import get_current_patient
from services.gemini import summarize_report
from services.extractor import extract_text
import gridfs
from motor.motor_asyncio import AsyncIOMotorGridFSBucket

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])

ALLOWED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp"
]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def serialize_report(report: dict) -> dict:
    report["id"] = str(report.pop("_id"))
    report.pop("extracted_text", None)
    return report


@router.post("/upload")
async def upload_report(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_patient)
):
    """
    Accept uploaded medical report file from frontend.
    1. Validate file type and size
    2. Store file in MongoDB GridFS (replaces Firebase Storage)
    3. Extract text (PDF or image)
    4. Send to Gemini for simplification
    5. Save report record to MongoDB
    6. Return summary to frontend
    """
    db = get_db()
    uid = current_user["uid"]

    # Get patient's preferred language
    patient = await db.patient_profiles.find_one({"user_id": uid})
    language = patient.get("preferred_language", "en") if patient else "en"

    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Please upload PDF, JPG, or PNG."
        )

    # Read file bytes
    file_bytes = await file.read()

    # Validate file size
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 10MB."
        )

    now = datetime.now(timezone.utc)

    # Store file in MongoDB GridFS
    file_id = None
    try:
        fs_bucket = AsyncIOMotorGridFSBucket(db)
        file_id = await fs_bucket.upload_from_stream(
            file.filename,
            file_bytes,
            metadata={"patient_id": uid, "content_type": file.content_type}
        )
    except Exception as e:
        print(f"GridFS upload failed: {e}")
        # Continue anyway — summary is more important than file storage

    # Extract text from file
    try:
        extracted_text = extract_text(file_bytes, file.content_type)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    if not extracted_text or len(extracted_text.strip()) < 20:
        raise HTTPException(
            status_code=422,
            detail="Could not extract readable text from this file. Please upload a clearer document."
        )

    # Gemini summarization
    ai_result = await summarize_report(extracted_text, language=language)

    # Save report record to MongoDB
    report_doc = {
        "patient_id": uid,
        "file_name": file.filename,
        "gridfs_file_id": str(file_id) if file_id else None,
        "extracted_text": extracted_text[:5000],
        "simplified_summary": ai_result.get("simplified_summary", ""),
        "recommendations": ai_result.get("recommendations", []),
        "created_at": now.isoformat(),
    }

    result = await db.reports.insert_one(report_doc)
    report_doc["id"] = str(result.inserted_id)
    report_doc.pop("_id", None)
    report_doc.pop("extracted_text", None)

    return report_doc


@router.get("")
async def get_my_reports(
    current_user: dict = Depends(get_current_patient)
):
    """Get all reports for the current patient, newest first."""
    db = get_db()
    uid = current_user["uid"]

    cursor = db.reports.find(
        {"patient_id": uid},
        {"extracted_text": 0}
    ).sort("created_at", -1)

    reports = []
    async for report in cursor:
        reports.append(serialize_report(report))

    return {"reports": reports, "total": len(reports)}


@router.get("/{report_id}")
async def get_report_detail(
    report_id: str,
    current_user: dict = Depends(get_current_patient)
):
    """Get full details of a single report."""
    db = get_db()
    uid = current_user["uid"]

    try:
        obj_id = ObjectId(report_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid report ID")

    report = await db.reports.find_one(
        {"_id": obj_id, "patient_id": uid},
        {"extracted_text": 0}
    )

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return serialize_report(report)
