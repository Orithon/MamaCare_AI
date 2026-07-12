from fastapi import APIRouter, Depends
from datetime import datetime, timezone, date
from core.database import get_db
from middleware.auth_middleware import get_current_patient
from services.gemini import generate_health_tip

router = APIRouter(prefix="/api/v1/tips", tags=["Health Tips"])


@router.get("/today")
async def get_today_tip(
    current_user: dict = Depends(get_current_patient)
):
    """
    Returns a personalized daily health tip for the patient.
    Generated once per day per user — cached in MongoDB for 24 hours.
    Personalized by gestational week, conditions, and preferred language.
    """
    db = get_db()
    uid = current_user["uid"]
    today = date.today().isoformat()

    # Check cache first
    cached = await db.health_tips.find_one(
        {"patient_id": uid, "date": today},
        {"_id": 0}
    )
    if cached:
        return {"tip": cached["tip"], "date": today, "cached": True}

    # Get patient profile for personalization
    profile = await db.patient_profiles.find_one(
        {"user_id": uid},
        {"_id": 0, "gestational_age_weeks": 1, "pre_existing_conditions": 1, "preferred_language": 1}
    )

    gestational_weeks = profile.get("gestational_age_weeks", 20) if profile else 20
    conditions = profile.get("pre_existing_conditions", []) if profile else []
    language = profile.get("preferred_language", "en") if profile else "en"

    # Generate new tip from Gemini
    tip = await generate_health_tip(gestational_weeks, conditions, language)

    # Cache it
    await db.health_tips.insert_one({
        "patient_id": uid,
        "date": today,
        "tip": tip,
        "gestational_age_weeks": gestational_weeks,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    return {"tip": tip, "date": today, "cached": False}
