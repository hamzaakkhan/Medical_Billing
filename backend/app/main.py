from fastapi import FastAPI
from app.routes.patients import router as patients_router
from app.routes.users import router as users_router
from app.routes.login import router as login

app = FastAPI()

app.include_router(patients_router)
app.include_router(users_router)
app.include_router(login)


# uvicorn app.main:app --reload   
# agy --dangerously-skip-permissions
