import base64
import json
import firebase_admin
from firebase_admin import credentials, auth
from core.config import get_settings

settings = get_settings()

_firebase_app = None


def init_firebase():
    global _firebase_app
    if _firebase_app:
        return

    # Decode base64 service account JSON
    service_account_json = base64.b64decode(
        settings.FIREBASE_SERVICE_ACCOUNT_B64
    ).decode("utf-8")
    service_account_dict = json.loads(service_account_json)

    cred = credentials.Certificate(service_account_dict)
    _firebase_app = firebase_admin.initialize_app(cred)
    print("✅ Firebase Admin initialized")


def verify_firebase_token(id_token: str) -> dict:
    """Verify Firebase JWT and return decoded claims."""
    try:
        decoded = auth.verify_id_token(id_token)
        return decoded
    except Exception as e:
        raise ValueError(f"Invalid Firebase token: {str(e)}")
