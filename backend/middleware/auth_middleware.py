from fastapi import Header, HTTPException, status, Depends
from core.firebase import verify_firebase_token
from core.database import get_db


async def get_current_user(authorization: str = Header(...)):
    """
    Dependency that verifies Firebase JWT from Authorization header.
    Usage: current_user = Depends(get_current_user)
    Returns decoded Firebase token dict with uid, email, etc.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must be 'Bearer <token>'"
        )

    token = authorization.split(" ")[1]

    try:
        decoded = verify_firebase_token(token)
        return decoded
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


async def get_current_patient(current_user: dict = Depends(get_current_user)):
    """Only allows users with role 'patient'."""
    db = get_db()
    user = await db.users.find_one({"firebase_uid": current_user["uid"]})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("role") != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to patients only"
        )

    return {**current_user, "db_user": user}


async def get_current_provider(current_user: dict = Depends(get_current_user)):
    """Only allows users with role 'provider'."""
    db = get_db()
    user = await db.users.find_one({"firebase_uid": current_user["uid"]})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("role") != "provider":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to healthcare providers only"
        )

    return {**current_user, "db_user": user}
