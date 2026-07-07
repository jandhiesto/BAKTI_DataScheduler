from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Data Scheduler Engine API",
    description="Backend untuk simulasi integrasi dan penjadwalan data",
    version="1.0.0"
)

# Konfigurasi CORS agar bisa diakses oleh Frontend React (Vite biasanya di port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Data Scheduler Engine is running!"}

# TODO: Nanti import router dari folder api/ 
# from app.api import routers_scheduler
# app.include_router(routers_scheduler.router, prefix="/api/v1")