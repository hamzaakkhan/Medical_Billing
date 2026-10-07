from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import setting
from app.routes.login import router as login
from app.routes.patients import router as patients_router
from app.routes.users import router as users_router

app = FastAPI(
    title="Medical Billing API",
    version="1.0.0",
)

# CORS configuration for web clients
cors_origins = (
    [origin.strip() for origin in setting.CORS_ORIGINS.split(",")]
    if isinstance(setting.CORS_ORIGINS, str)
    else setting.CORS_ORIGINS
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(patients_router)
app.include_router(users_router)
app.include_router(login)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}

# uv run uvicorn app.main:app --reload
# agy --dangerously-skip-permissions
