from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from app.config import setting
from app.routes.appointments import router as appointments_router
from app.routes.login import router as login
from app.routes.patients import router as patients_router
from app.routes.users import router as users_router
from app.services.appointments import change_to_noshow

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(timezone="UTC")


@asynccontextmanager
async def lifespan(app: FastAPI):
    if getattr(setting, "ENABLE_SCHEDULER", True):
        interval_minutes = getattr(setting, "SCHEDULER_INTERVAL_MINUTES", 1)
        scheduler.add_job(
            change_to_noshow,
            trigger="interval",
            minutes=interval_minutes,
            id="change_to_noshow",
            replace_existing=True,
            max_instances=1,
            coalesce=True,
            misfire_grace_time=60,
        )
        scheduler.start()
        logger.info(
            f"APScheduler started: 'change_to_noshow' job running every {interval_minutes} minute(s)."
        )
    try:
        yield
    finally:
        if scheduler.running:
            scheduler.shutdown(wait=False)
            logger.info("APScheduler shut down.")


app = FastAPI(
    title="Medical Billing API",
    version="1.0.0",
    lifespan=lifespan,
)

#CORS configuration for web clients
cors_origins = (
    [origin.strip() for origin in setting.CORS_ORIGINS.split(",")]
    if isinstance(setting.CORS_ORIGINS, str)
    else setting.CORS_ORIGINS
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=setting.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(patients_router)
app.include_router(users_router)
app.include_router(appointments_router)
app.include_router(login)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}
# uv run uvicorn app.main:app --reload
# uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload {HOST FOR PHONE}
# agy --dangerously-skip-permissions
# cd socket-server    node server.js