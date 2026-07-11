"""
get_token.py — Dev tool to get a Firebase ID token for API testing.

Reads all credentials from the .env file so no secrets are ever
hardcoded in source code.

Usage:
    python get_token.py

Requirements (already in requirements.txt via python-dotenv):
    pip install python-dotenv requests

The printed token can be used as a Bearer token in:
  - curl:       -H "Authorization: Bearer <token>"
  - Postman:    Authorization → Bearer Token
  - HTTPie:     "Authorization: Bearer <token>"
"""

import os
import sys
import json
import requests
from dotenv import load_dotenv

# Load variables from the .env file in the same directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

# ── Read config from .env ──────────────────────────────────────────────────
API_KEY   = os.getenv("FIREBASE_API_KEY")
EMAIL     = os.getenv("FIREBASE_TEST_EMAIL")
PASSWORD  = os.getenv("FIREBASE_TEST_PASSWORD")

# Validate all required vars are present
missing = [k for k, v in {"FIREBASE_API_KEY": API_KEY, "FIREBASE_TEST_EMAIL": EMAIL, "FIREBASE_TEST_PASSWORD": PASSWORD}.items() if not v]
if missing:
    print(f"[ERROR] Missing environment variables: {', '.join(missing)}")
    print("    Make sure your .env file contains all required Firebase variables.")
    sys.exit(1)

# ── Call Firebase Auth REST API ────────────────────────────────────────────
# This is the same thing the browser SDK does under the hood.
SIGNIN_URL = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}"

print(f"[*] Signing in as: {EMAIL}")

response = requests.post(
    SIGNIN_URL,
    json={"email": EMAIL, "password": PASSWORD, "returnSecureToken": True},
)

if response.status_code != 200:
    error = response.json().get("error", {})
    print(f"[ERROR] Firebase Auth failed: {error.get('message', response.text)}")
    sys.exit(1)

data  = response.json()
token = data.get("idToken")
uid   = data.get("localId")

print(f"[OK] Signed in as UID: {uid}")
print()
print("-" * 60)
print("ID TOKEN (copy everything between the lines):")
print("-" * 60)
print(token)
print("-" * 60)
print()
print("Usage example:")
print(f'  curl -H "Authorization: Bearer {token[:30]}..." http://localhost:8000/api/...')
