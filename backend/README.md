# MamaCare AI — Backend

FastAPI backend for the MamaCare AI maternal healthcare platform.

## Stack
- **FastAPI** — REST API
- **MongoDB Atlas** — Database (via Motor async driver)
- **Firebase Admin SDK** — JWT authentication
- **Firebase Storage** — Medical report file storage
- **Google Gemini API** — AI features (risk prediction, report summarization, voice assistant, health tips)

---

## Local Setup

### 1. Clone and enter the project
```bash
git clone <your-repo-url>
cd mamacare-backend
```

### 2. Create virtual environment
```bash
python -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Fill in your .env file
Open `.env` and add all your API keys. See the section below for where to get each one.

### 5. Run the server
```bash
uvicorn main:app --reload
```

Server runs at: `http://localhost:8000`  
Swagger docs at: `http://localhost:8000/docs`

---

## Environment Variables — Where to Get Them

| Variable | Where to Get It |
|---|---|
| `GEMINI_API_KEY` | https://aistudio.google.com → Sign in → Get API Key |
| `MONGODB_URI` | MongoDB Atlas → Your Cluster → Connect → Drivers → copy the URI |
| `MONGODB_DB_NAME` | Leave as `mamacare_db` |
| `FIREBASE_SERVICE_ACCOUNT_B64` | Firebase Console → Project Settings → Service Accounts → Generate New Private Key → download JSON → run: `base64 -w 0 serviceAccountKey.json` and paste the output |
| `FIREBASE_STORAGE_BUCKET` | Firebase Console → Storage → copy the bucket name (format: yourproject.appspot.com) |
| `FRONTEND_URL` | Your Vercel frontend URL (use `http://localhost:5173` for local dev) |

---

## Deployment to Render

1. Push your code to GitHub (make sure `.env` is in `.gitignore`)
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Set Build Command: `pip install -r requirements.txt`
5. Set Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add all environment variables from your `.env` in the Render dashboard
7. Deploy

---

## API Endpoints Summary

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | /api/v1/auth/register | No | Register new user |
| GET | /api/v1/auth/me | Yes | Get current user profile |
| PUT | /api/v1/auth/profile | Yes | Update profile |
| POST | /api/v1/predictions | Patient | Submit health data for risk assessment |
| GET | /api/v1/predictions | Patient | Get prediction history |
| GET | /api/v1/predictions/{id} | Patient | Get single prediction |
| GET | /api/v1/predictions/patient/{uid} | Provider | Get patient predictions |
| POST | /api/v1/reports/upload | Patient | Upload medical report |
| GET | /api/v1/reports | Patient | Get report list |
| GET | /api/v1/reports/{id} | Patient | Get report detail |
| POST | /api/v1/assistant/chat | Patient | Send message to voice assistant |
| GET | /api/v1/assistant/history | Patient | Get chat sessions |
| GET | /api/v1/provider/patients | Provider | Get assigned patients |
| GET | /api/v1/provider/patients/{uid} | Provider | Get patient full detail |
| POST | /api/v1/provider/notes | Provider | Add clinical note |
| GET | /api/v1/provider/notes/{uid} | Provider | Get notes for patient |
| GET | /api/v1/provider/alerts | Provider | Get high-risk patient alerts |
| POST | /api/v1/provider/assign-patient | Provider | Assign patient to provider |
| GET | /api/v1/tips/today | Patient | Get personalized daily health tip |

---

## Notes for Frontend Developer

- All protected routes need: `Authorization: Bearer <firebase_jwt_token>` header
- Get the Firebase JWT on the frontend with: `const token = await auth.currentUser.getIdToken()`
- File upload to `/api/v1/reports/upload` uses `multipart/form-data` with field name `file`
- All responses are JSON
- Error responses follow: `{ "detail": "error message" }`
