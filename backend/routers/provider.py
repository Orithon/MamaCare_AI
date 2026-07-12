from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from bson import ObjectId
from core.database import get_db
from middleware.auth_middleware import get_current_provider
from models.provider import ProviderNoteRequest

router = APIRouter(prefix="/api/v1/provider", tags=["Healthcare Provider"])


@router.get("/patients")
async def get_my_patients(
    current_user: dict = Depends(get_current_provider)
):
    """
    Get all patients assigned to this provider.
    Returns each patient with their latest risk level.
    """
    db = get_db()
    uid = current_user["uid"]

    # Get all patient profiles assigned to this provider
    cursor = db.patient_profiles.find({"assigned_provider_id": uid})
    patients = []

    async for profile in cursor:
        patient_uid = profile["user_id"]

        # Get base user info
        user = await db.users.find_one(
            {"firebase_uid": patient_uid},
            {"_id": 0, "firebase_uid": 1, "full_name": 1, "email": 1}
        )
        if not user:
            continue

        # Get latest prediction
        latest_pred = await db.predictions.find_one(
            {"patient_id": patient_uid},
            {"_id": 0, "risk_level": 1, "created_at": 1},
            sort=[("created_at", -1)]
        )

        patients.append({
            "patient_id": patient_uid,
            "full_name": user.get("full_name"),
            "email": user.get("email"),
            "gestational_age_weeks": profile.get("gestational_age_weeks"),
            "pre_existing_conditions": profile.get("pre_existing_conditions", []),
            "preferred_language": profile.get("preferred_language", "en"),
            "latest_risk_level": latest_pred.get("risk_level") if latest_pred else None,
            "last_assessment_date": latest_pred.get("created_at") if latest_pred else None,
        })

    return {"patients": patients, "total": len(patients)}


@router.get("/patients/{patient_uid}/predictions")
async def get_patient_predictions(
    patient_uid: str,
    current_user: dict = Depends(get_current_provider)
):
    """
    Provider only — get all predictions for a specific patient.
    Frontend calls: GET /api/v1/provider/patients/{uid}/predictions
    (Moved here from /predictions/patient/{uid} to avoid FastAPI route conflicts)
    """
    db = get_db()

    cursor = db.predictions.find(
        {"patient_id": patient_uid},
        {"gemini_raw_response": 0}
    ).sort("created_at", -1)

    predictions = []
    async for pred in cursor:
        pred["id"] = str(pred.pop("_id"))
        predictions.append(pred)

    return {"predictions": predictions, "total": len(predictions)}


@router.get("/patients/{patient_uid}")
async def get_patient_detail(
    patient_uid: str,
    current_user: dict = Depends(get_current_provider)
):
    """
    Full patient detail: profile, all predictions, all report summaries,
    and provider notes.
    """
    db = get_db()
    provider_uid = current_user["uid"]

    # Verify this patient is assigned to this provider
    profile = await db.patient_profiles.find_one(
        {"user_id": patient_uid, "assigned_provider_id": provider_uid},
        {"_id": 0}
    )

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Patient not found or not assigned to you"
        )

    user = await db.users.find_one(
        {"firebase_uid": patient_uid},
        {"_id": 0, "firebase_uid": 1, "full_name": 1, "email": 1, "phone_number": 1}
    )

    # All predictions
    pred_cursor = db.predictions.find(
        {"patient_id": patient_uid},
        {"gemini_raw_response": 0, "_id": 1, "risk_level": 1, "identified_risks": 1, "recommendations": 1, "created_at": 1}
    ).sort("created_at", -1)

    predictions = []
    async for pred in pred_cursor:
        pred["id"] = str(pred.pop("_id"))
        predictions.append(pred)

    # All report summaries
    report_cursor = db.reports.find(
        {"patient_id": patient_uid},
        {"extracted_text": 0}
    ).sort("created_at", -1)

    reports = []
    async for report in report_cursor:
        report["id"] = str(report.pop("_id"))
        reports.append(report)

    # Provider notes for this patient
    notes_cursor = db.provider_notes.find(
        {"patient_id": patient_uid, "provider_id": provider_uid},
        {"_id": 1, "note_text": 1, "created_at": 1}
    ).sort("created_at", -1)

    notes = []
    async for note in notes_cursor:
        note["id"] = str(note.pop("_id"))
        notes.append(note)

    return {
        "patient": {**user, **profile},
        "predictions": predictions,
        "reports": reports,
        "notes": notes,
    }


@router.post("/notes")
async def add_note(
    payload: ProviderNoteRequest,
    current_user: dict = Depends(get_current_provider)
):
    """Add a clinical note to a patient's record."""
    db = get_db()
    provider_uid = current_user["uid"]
    now = datetime.now(timezone.utc).isoformat()

    # Verify patient is assigned to this provider
    profile = await db.patient_profiles.find_one(
        {"user_id": payload.patient_id, "assigned_provider_id": provider_uid}
    )
    if not profile:
        raise HTTPException(
            status_code=403,
            detail="You can only add notes to your assigned patients"
        )

    note_doc = {
        "provider_id": provider_uid,
        "patient_id": payload.patient_id,
        "note_text": payload.note_text,
        "created_at": now,
    }
    result = await db.provider_notes.insert_one(note_doc)

    return {
        "message": "Note added successfully",
        "note_id": str(result.inserted_id),
        "created_at": now
    }


@router.get("/notes/{patient_uid}")
async def get_notes_for_patient(
    patient_uid: str,
    current_user: dict = Depends(get_current_provider)
):
    """Get all notes this provider has written for a specific patient."""
    db = get_db()
    provider_uid = current_user["uid"]

    cursor = db.provider_notes.find(
        {"patient_id": patient_uid, "provider_id": provider_uid}
    ).sort("created_at", -1)

    notes = []
    async for note in cursor:
        note["id"] = str(note.pop("_id"))
        notes.append(note)

    return {"notes": notes, "total": len(notes)}


@router.get("/alerts")
async def get_high_risk_alerts(
    current_user: dict = Depends(get_current_provider)
):
    """
    Return all patients assigned to this provider whose
    latest prediction is HIGH or CRITICAL.
    """
    db = get_db()
    provider_uid = current_user["uid"]

    # Get assigned patient IDs
    cursor = db.patient_profiles.find(
        {"assigned_provider_id": provider_uid},
        {"user_id": 1}
    )
    patient_ids = [p["user_id"] async for p in cursor]

    alerts = []
    for patient_uid in patient_ids:
        latest = await db.predictions.find_one(
            {"patient_id": patient_uid},
            sort=[("created_at", -1)]
        )
        if latest and latest.get("risk_level") in ["HIGH", "CRITICAL"]:
            user = await db.users.find_one(
                {"firebase_uid": patient_uid},
                {"_id": 0, "full_name": 1, "email": 1, "phone_number": 1}
            )
            profile = await db.patient_profiles.find_one(
                {"user_id": patient_uid},
                {"_id": 0, "gestational_age_weeks": 1}
            )
            alerts.append({
                "patient_id": patient_uid,
                "full_name": user.get("full_name") if user else "Unknown",
                "email": user.get("email") if user else None,
                "phone_number": user.get("phone_number") if user else None,
                "gestational_age_weeks": profile.get("gestational_age_weeks") if profile else None,
                "risk_level": latest["risk_level"],
                "assessment_date": latest["created_at"],
                "identified_risks": latest.get("identified_risks", []),
            })

    return {"alerts": alerts, "total": len(alerts)}


@router.post("/assign-patient")
async def assign_patient_to_provider(
    patient_id: str,
    current_user: dict = Depends(get_current_provider)
):
    """Assign a patient to this provider by patient firebase_uid."""
    db = get_db()
    provider_uid = current_user["uid"]

    result = await db.patient_profiles.update_one(
        {"user_id": patient_id},
        {"$set": {"assigned_provider_id": provider_uid}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")

    return {"message": "Patient successfully assigned to your dashboard"}
