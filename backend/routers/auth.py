from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime, timezone
import random
import string
from core.database import get_db
from middleware.auth_middleware import get_current_user
from models.user import RegisterRequest, UpdateProfileRequest, OnboardingRequest

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

def generate_provider_code():
    letters = "".join(random.choices(string.ascii_lowercase, k=3))
    digits = "".join(random.choices(string.digits, k=3))
    return f"{letters}-{digits}"

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(
    payload: RegisterRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Called immediately after Firebase Auth creates the user on the client.
    Verifies the Firebase JWT so the UID cannot be spoofed.
    Creates the user document in MongoDB and the role-specific profile.
    """
    db = get_db()

    verified_uid = current_user["uid"]

    existing = await db.users.find_one({"firebase_uid": verified_uid})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already registered"
        )

    now = datetime.now(timezone.utc).isoformat()

    user_doc = {
        "firebase_uid": verified_uid,
        "email": payload.email,
        "full_name": payload.full_name,
        "role": payload.role,
        "phone_number": None,
        "profile_photo_url": None,
        "created_at": now,
        "updated_at": now,
    }
    await db.users.insert_one(user_doc)

    if payload.role == "patient":
        profile_doc = {
            "user_id": verified_uid,
            "preferred_language": payload.preferred_language or "en",
            "assigned_provider_id": None,
            "onboarded": False,
            "created_at": now,
            "updated_at": now,
        }
        await db.patient_profiles.insert_one(profile_doc)

    elif payload.role == "provider":
        provider_code = generate_provider_code()
        # Ensure it's unique (basic loop, realistically won't collide fast)
        while await db.provider_profiles.find_one({"provider_code": provider_code}):
            provider_code = generate_provider_code()

        provider_doc = {
            "user_id": verified_uid,
            "clinic_name": payload.clinic_name,
            "license_number": payload.license_number,
            "provider_code": provider_code,
            "created_at": now,
            "updated_at": now,
        }
        await db.provider_profiles.insert_one(provider_doc)

    return {"message": "User registered successfully", "role": payload.role}


@router.post("/onboarding")
async def onboarding_patient(
    payload: OnboardingRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Handles the detailed patient onboarding form.
    """
    db = get_db()
    uid = current_user["uid"]
    
    user = await db.users.find_one({"firebase_uid": uid})
    if not user or user["role"] != "patient":
        raise HTTPException(status_code=403, detail="Only patients can use this onboarding route")

    now = datetime.now(timezone.utc).isoformat()
    
    assigned_provider_id = None
    provider_code_invalid = False
    
    # Process provider code if provided
    if payload.provider_code:
        provider = await db.provider_profiles.find_one({"provider_code": payload.provider_code.lower()})
        if provider:
            assigned_provider_id = provider["user_id"]
        else:
            provider_code_invalid = True

    # Update patient profile
    update_data = {
        "dob": payload.dob,
        "state_of_residence": payload.state_of_residence,
        "lga": payload.lga,
        "estimated_due_date": payload.estimated_due_date,
        "gestational_age_weeks": payload.gestational_age_weeks,
        "previous_pregnancies": payload.previous_pregnancies,
        "previous_live_births": payload.previous_live_births,
        "pre_existing_conditions": payload.pre_existing_conditions,
        "allergies": payload.allergies,
        "onboarded": True,
        "updated_at": now
    }
    
    if assigned_provider_id:
        update_data["assigned_provider_id"] = assigned_provider_id

    await db.patient_profiles.update_one(
        {"user_id": uid},
        {"$set": update_data}
    )

    response = {"message": "Onboarding completed successfully"}
    if provider_code_invalid:
        response["provider_code_invalid"] = True
        
    return response


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Returns the current user's full profile including role-specific data."""
    db = get_db()
    uid = current_user["uid"]

    user = await db.users.find_one({"firebase_uid": uid}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    response = dict(user)

    if user["role"] == "patient":
        profile = await db.patient_profiles.find_one(
            {"user_id": uid}, {"_id": 0}
        )
        response["profile"] = profile

    elif user["role"] == "provider":
        profile = await db.provider_profiles.find_one(
            {"user_id": uid}, {"_id": 0}
        )
        response["profile"] = profile

    return response


@router.put("/profile")
async def update_profile(
    payload: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile fields."""
    db = get_db()
    uid = current_user["uid"]
    now = datetime.now(timezone.utc).isoformat()

    user_fields = {}
    if payload.full_name is not None:
        user_fields["full_name"] = payload.full_name
    if payload.phone_number is not None:
        user_fields["phone_number"] = payload.phone_number
    if payload.profile_photo_url is not None:
        user_fields["profile_photo_url"] = payload.profile_photo_url

    if user_fields:
        user_fields["updated_at"] = now
        await db.users.update_one(
            {"firebase_uid": uid},
            {"$set": user_fields}
        )

    patient_fields = {}
    if payload.preferred_language is not None:
        patient_fields["preferred_language"] = payload.preferred_language

    if patient_fields:
        patient_fields["updated_at"] = now
        await db.patient_profiles.update_one(
            {"user_id": uid},
            {"$set": patient_fields}
        )

    provider_fields = {}
    if payload.clinic_name is not None:
        provider_fields["clinic_name"] = payload.clinic_name

    if provider_fields:
        provider_fields["updated_at"] = now
        await db.provider_profiles.update_one(
            {"user_id": uid},
            {"$set": provider_fields}
        )

    return {"message": "Profile updated successfully"}
