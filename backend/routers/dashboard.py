from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from core.database import get_db
from middleware.auth_middleware import get_current_patient

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])

def serialize_prediction_for_dashboard(pred: dict) -> dict:
    """Map MongoDB prediction to frontend PredictionEntry interface."""
    input_data = pred.get("input_data", {})
    return {
        "id": str(pred["_id"]),
        "date": pred.get("created_at", ""),
        "riskLevel": pred.get("risk_level", "Moderate").capitalize(),
        "summary": pred.get("explanation", "").split(".")[0] + ".", # Taking first sentence as summary
        "systolicBP": input_data.get("systolic_bp", 0),
        "diastolicBP": input_data.get("diastolic_bp", 0),
        "bloodGlucose": input_data.get("blood_glucose", 0),
        "haemoglobin": input_data.get("haemoglobin", 0),
        "heartRate": input_data.get("heart_rate", 0),
        "temperature": input_data.get("temperature", 0),
        "flaggedConditions": pred.get("conditions_flagged", []),
    }

def serialize_report_for_dashboard(report: dict) -> dict:
    """Map MongoDB report to frontend ReportEntry interface."""
    return {
        "id": str(report["_id"]),
        "filename": report.get("file_name", ""),
        "date": report.get("created_at", ""),
        "summarySnippet": report.get("simplified_summary", "").split(".")[0] + ".",
    }

@router.get("/patient")
async def get_patient_dashboard(current_user: dict = Depends(get_current_patient)):
    """Aggregate all required data for the patient dashboard."""
    db = get_db()
    uid = current_user["uid"]

    # 1. Get User and Patient Profile
    user_doc = await db.users.find_one({"firebase_uid": uid})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    profile_doc = await db.patient_profiles.find_one({"user_id": uid})
    
    # Defaults for empty profile state
    full_name = user_doc.get("full_name", "User")
    gestational_week = 0
    edd = ""
    days_until_due = 0
    conditions = []
    provider_name = None
    provider_code = None

    if profile_doc:
        gestational_week = profile_doc.get("gestational_age_weeks", 0)
        edd = profile_doc.get("estimated_due_date", "")
        conditions = profile_doc.get("pre_existing_conditions", [])
        
        # Calculate days until due
        if edd:
            try:
                edd_date = datetime.fromisoformat(edd.replace("Z", "+00:00")).replace(tzinfo=timezone.utc)
                now = datetime.now(timezone.utc)
                delta = edd_date - now
                days_until_due = max(0, delta.days)
            except ValueError:
                pass

        # Get provider name and code if assigned
        provider_id = profile_doc.get("assigned_provider_id")
        if provider_id:
            provider_user_doc = await db.users.find_one({"firebase_uid": provider_id})
            if provider_user_doc:
                provider_name = provider_user_doc.get("full_name")
            provider_profile_doc = await db.provider_profiles.find_one({"user_id": provider_id})
            if provider_profile_doc:
                provider_code = provider_profile_doc.get("provider_code")

    profile_data = {
        "fullName": full_name,
        "gestationalWeek": gestational_week,
        "edd": edd,
        "daysUntilDue": days_until_due,
        "conditions": conditions,
        "provider": provider_name,
        "providerCode": provider_code,
        "preferredLanguage": profile_doc.get("preferred_language", "en") if profile_doc else "en"
    }

    # 2. Fetch Recent Predictions
    predictions_cursor = db.predictions.find(
        {"patient_id": uid},
        {"gemini_raw_response": 0}
    ).sort("created_at", -1).limit(5)
    
    recent_predictions = []
    async for pred in predictions_cursor:
        recent_predictions.append(serialize_prediction_for_dashboard(pred))

    latest_prediction = recent_predictions[0] if recent_predictions else None

    # 3. Fetch Recent Reports
    reports_cursor = db.reports.find(
        {"patient_id": uid},
        {"extracted_text": 0}
    ).sort("created_at", -1).limit(5)

    recent_reports = []
    async for report in reports_cursor:
        recent_reports.append(serialize_report_for_dashboard(report))

    # Assemble and return
    return {
        "profile": profile_data,
        "latestPrediction": latest_prediction,
        "recentPredictions": recent_predictions,
        "recentReports": recent_reports
    }
