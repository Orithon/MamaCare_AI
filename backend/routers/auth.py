from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime, timezone
from core.database import get_db
from middleware.auth_middleware import get_current_user
from models.user import RegisterRequest, UpdateProfileRequest

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(
    payload: RegisterRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Called immediately after Firebase Auth creates the user on the client.
    Verifies the Firebase JWT so the UID cannot be spoofed — the uid is taken
    from the verified token, NOT from the request body.
    Creates the user document in MongoDB and the role-specific profile.
    """
    db = get_db()

    # Use the UID from the verified JWT — never trust the client-supplied value
    verified_uid = current_user["uid"]

    # Check if user already exists
    existing = await db.users.find_one({"firebase_uid": verified_uid})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already registered"
        )

    now = datetime.now(timezone.utc).isoformat()

    # Create base user document
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

    # Create role-specific profile
    if payload.role == "patient":
        profile_doc = {
            "user_id": verified_uid,
            "age": payload.age,
            "gestational_age_weeks": payload.gestational_age_weeks,
            "previous_pregnancies": payload.previous_pregnancies or 0,
            "pre_existing_conditions": payload.pre_existing_conditions or [],
            "preferred_language": payload.preferred_language or "en",
            "assigned_provider_id": None,
            "created_at": now,
            "updated_at": now,
        }
        await db.patient_profiles.insert_one(profile_doc)

    elif payload.role == "provider":
        provider_doc = {
            "user_id": verified_uid,
            "clinic_name": payload.clinic_name,
            "license_number": payload.license_number,
            "created_at": now,
            "updated_at": now,
        }
        await db.provider_profiles.insert_one(provider_doc)

    return {"message": "User registered successfully", "role": payload.role}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Returns the current user's full profile including role-specific data."""
    db = get_db()
    uid = current_user["uid"]

    user = await db.users.find_one({"firebase_uid": uid}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    response = dict(user)

    # Attach role-specific profile
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
    """Update user profile fields. Handles both user and role-specific profile."""
    db = get_db()
    uid = current_user["uid"]
    now = datetime.now(timezone.utc).isoformat()

    # Fields that go into the base users collection
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

    # Fields that go into patient_profiles
    patient_fields = {}
    if payload.age is not None:
        patient_fields["age"] = payload.age
    if payload.gestational_age_weeks is not None:
        patient_fields["gestational_age_weeks"] = payload.gestational_age_weeks
    if payload.preferred_language is not None:
        patient_fields["preferred_language"] = payload.preferred_language
    if payload.previous_pregnancies is not None:
        patient_fields["previous_pregnancies"] = payload.previous_pregnancies
    if payload.pre_existing_conditions is not None:
        patient_fields["pre_existing_conditions"] = payload.pre_existing_conditions

    if patient_fields:
        patient_fields["updated_at"] = now
        await db.patient_profiles.update_one(
            {"user_id": uid},
            {"$set": patient_fields}
        )

    # Provider-specific
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
