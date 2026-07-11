from fastapi import FastAPI
from routers import assistant_routes, predictions_routes,reports_routes

app = FastAPI()
app.include_router(assistant_routes.router)
app.include_router(predictions_routes.router)
app.include_router(reports_routes.router)

@app.get("/")
def home():
    return {"message":"MamaCare AI backend running"}

#uvicorn main:app --reload