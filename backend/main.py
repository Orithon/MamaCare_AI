from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from core.config import get_settings
from core.database import connect_db, disconnect_db
from core.firebase import init_firebase
from routers import auth, predictions, reports, assistant, provider, tips

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    print("Starting MamaCare AI Backend...")
    init_firebase()
    await connect_db()
    print("All services initialized. MamaCare is live.")
    yield
    # Shutdown
    await disconnect_db()
    print("MamaCare backend shut down.")


from fastapi.openapi.utils import get_openapi

app = FastAPI(
    title="MamaCare AI API",
    description="Backend API for MamaCare AI — maternal health prediction, report analysis, and multilingual voice assistant.",
    version="1.0.0",
    lifespan=lifespan,
)


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    for path in schema["paths"].values():
        for method in path.values():
            method["security"] = [{"BearerAuth": []}]
    app.openapi_schema = schema
    return app.openapi_schema


app.openapi = custom_openapi

# ── CORS ──────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── ROUTERS ───────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(predictions.router)
app.include_router(reports.router)
app.include_router(assistant.router)
app.include_router(provider.router)
app.include_router(tips.router)


# ── HEALTH CHECK ──────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "MamaCare AI Backend is running",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}


# ── RUN ───────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)