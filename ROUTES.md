# MamaCare AI Backend — API Routes Documentation

This document outlines all available backend routes, their constraints, required headers, request payloads, and expected responses.

### Base URL
During development: `http://localhost:8000`

### Global Authentication
Most endpoints require a valid Firebase ID Token passed in the headers:
```
Authorization: Bearer <your-firebase-jwt-token>
```

---

## 1. Authentication & Profiles (`/api/v1/auth`)

### `POST /api/v1/auth/register`
Creates the MongoDB user profile after a user signs up on Firebase.
* **Constraints**: Requires Auth Header.
* **Request Header**: `Authorization: Bearer <token>`
* **Request Body** (`application/json`):
  ```json
  {
    "firebase_uid": "optional_string", // Ignored by server, reads from token
    "email": "string (email)",
    "full_name": "string",
    "role": "patient" | "provider",
    
    // Patient-specific fields (optional)
    "preferred_language": "en" | "yo" | "ig" | "ha",
    
    // Provider-specific fields (optional)
    "clinic_name": "string",
    "license_number": "string"
  }
  ```
* **Response** (201 Created):
  ```json
  {
    "message": "User registered successfully",
    "role": "patient"
  }
  ```

### `POST /api/v1/auth/onboarding`
Saves the detailed patient profile from the multi-step onboarding form.
* **Constraints**: Requires Auth Header. **Patient role only.**
* **Request Header**: `Authorization: Bearer <token>`
* **Request Body** (`application/json`):
  ```json
  {
    "dob": "string (ISO date)",
    "state_of_residence": "string",
    "lga": "string",
    "estimated_due_date": "string (ISO date)",
    "gestational_age_weeks": 20,
    "previous_pregnancies": 0,
    "previous_live_births": 0,
    "pre_existing_conditions": ["string"],
    "allergies": "optional string",
    "provider_code": "optional string (e.g. 'abc-123')"
  }
  ```
* **Response** (200 OK):
  ```json
  {
    "message": "Onboarding completed successfully",
    "provider_code_invalid": true // Optional, only present if the provider_code wasn't found
  }
  ```

### `GET /api/v1/auth/me`
Fetches the logged-in user's complete profile (base user + role-specific profile).
* **Constraints**: Requires Auth Header.
* **Request Body**: None
* **Response**:
  ```json
  {
    "firebase_uid": "string",
    "email": "string",
    "full_name": "string",
    "role": "patient",
    "phone_number": "string | null",
    "profile_photo_url": "string | null",
    "created_at": "string (iso date)",
    "updated_at": "string (iso date)",
    "profile": {
       // Role-specific fields (e.g. age, gestational_age_weeks, etc)
    }
  }
  ```

### `PUT /api/v1/auth/profile`
Updates specific profile fields.
* **Constraints**: Requires Auth Header.
* **Request Body** (`application/json`): Send only the fields you wish to update.
  ```json
  {
    "full_name": "string",
    "phone_number": "string",
    "profile_photo_url": "string",
    "preferred_language": "en",
    "clinic_name": "string"
  }
  ```
* **Response**:
  ```json
  { "message": "Profile updated successfully" }
  ```

---

## 2. Voice Assistant (`/api/v1/assistant`)

### `POST /api/v1/assistant/chat`
Sends a message to the AI assistant. Maintains conversation history.
* **Constraints**: Requires Auth Header. **Patient role only.**
* **Request Body** (`application/json`):
  ```json
  {
    "message": "string (the user's question)",
    "language": "en" | "yo" | "ig" | "ha",
    "session_id": "string | null" // Null for new session, pass ID to continue
  }
  ```
* **Response**:
  ```json
  {
    "response": "string (AI's reply)",
    "session_id": "string (UUID)",
    "language": "string"
  }
  ```

### `GET /api/v1/assistant/history`
Gets a list of all past chat sessions.
* **Constraints**: Requires Auth Header. **Patient role only.**
* **Response**:
  ```json
  {
    "sessions": [
      {
        "session_id": "string",
        "language": "string",
        "messages": [ { "role": "user", "content": "string", "timestamp": "string" } ] // Only the last message is returned here
      }
    ],
    "total": 10
  }
  ```

---

## 3. Predictions (`/api/v1/predictions`)

### `POST /api/v1/predictions`
Submit vitals to get a maternal health AI risk assessment.
* **Constraints**: Requires Auth Header. **Patient role only.**
* **Request Body** (`application/json`):
  ```json
  {
    "age": 25,
    "gestational_age_weeks": 20,
    "bp_systolic": 120,
    "bp_diastolic": 80,
    "blood_sugar": 90.5,
    "temperature": 37.0,
    "heart_rate": 75,
    "symptoms": ["headache"],
    "previous_pregnancies": 0,
    "pre_existing_conditions": [],
    "language": "en" | "yo" | "ig" | "ha"
  }
  ```
* **Response**:
  ```json
  {
    "id": "string",
    "patient_id": "string",
    "risk_level": "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
    "conditions_flagged": ["string"],
    "recommendations": ["string"],
    "explanation": "string",
    "created_at": "string (iso date)"
  }
  ```

### `GET /api/v1/predictions`
Get patient's prediction history (paginated).
* **Constraints**: Requires Auth Header. **Patient role only.**
* **Query Params**: `page` (int, default 1), `limit` (int, default 10)
* **Response**:
  ```json
  {
    "predictions": [ { /* prediction object */ } ],
    "total": 5,
    "page": 1,
    "pages": 1
  }
  ```

---

## 4. Reports (`/api/v1/reports`)

### `POST /api/v1/reports/upload`
Upload a medical report (PDF or Image) for AI summarization.
* **Constraints**: Requires Auth Header. **Patient role only.**
* **Request Header**: `Content-Type: multipart/form-data`
* **Request Body**:
  * `file`: (Binary File, max 10MB. Allowed: pdf, jpg, jpeg, png, webp)
* **Response**:
  ```json
  {
    "id": "string",
    "patient_id": "string",
    "file_name": "string",
    "gridfs_file_id": "string",
    "simplified_summary": "string (plain text explanation)",
    "recommendations": ["string"],
    "created_at": "string (iso date)"
  }
  ```

### `GET /api/v1/reports`
Get all uploaded reports for the logged-in patient.
* **Constraints**: Requires Auth Header. **Patient role only.**
* **Response**:
  ```json
  {
    "reports": [ { /* report objects */ } ],
    "total": 3
  }
  ```

---

## 5. Health Tips (`/api/v1/tips`)

### `GET /api/v1/tips/today`
Gets a daily, personalized pregnancy health tip for the user.
* **Constraints**: Requires Auth Header. **Patient role only.**
* **Response**:
  ```json
  {
    "tip": "string (personalized AI tip)",
    "date": "2026-07-11",
    "cached": true // true if fetched from DB, false if newly generated today
  }
  ```

---

## 6. Provider Dashboard (`/api/v1/provider`)
*(All routes below require `role="provider"`)*

### `GET /api/v1/provider/patients`
List all patients assigned to this provider.
* **Response**: `{"patients": [ { "patient_id": "string", "full_name": "string", "latest_risk_level": "LOW" } ], "total": 10}`

### `GET /api/v1/provider/alerts`
List assigned patients who have a recent "HIGH" or "CRITICAL" risk level.
* **Response**: `{"alerts": [ { "patient_id": "string", "risk_level": "HIGH", ... } ], "total": 2}`

### `POST /api/v1/provider/assign-patient?patient_id=<uid>`
Assigns a specific patient to this provider's dashboard.
* **Query Params**: `patient_id` (string)
* **Response**: `{"message": "Patient successfully assigned to your dashboard"}`

### `GET /api/v1/provider/patients/{patient_uid}`
Get complete timeline for one patient (profile, predictions, reports, notes).
* **Response**: `{"patient": {}, "predictions": [], "reports": [], "notes": []}`

### `POST /api/v1/provider/notes`
Add a clinical note to a patient's file.
* **Request Body** (`application/json`): `{ "patient_id": "string", "note_text": "string" }`
* **Response**: `{"message": "Note added successfully", "note_id": "string"}`
