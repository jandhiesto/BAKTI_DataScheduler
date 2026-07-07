from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)-9s [%(name)s] %(message)s"
)
from app.core.database import engine, Base, SessionLocal
from app.models import scheduler_model, log_model

# Import modul engine penjadwalan yang baru saja kita rakit
from app.scheduler.engine import start_scheduler, stop_scheduler, load_active_jobs

# TRIGGER PEMBUATAN DATABASE
Base.metadata.create_all(bind=engine)

# MANAGEMENT SIKLUS HIDUP APLIKASI (LIFESPAN)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- [KODE YANG BERJALAN SAAT SERVER STARTUP] ---
    # 1. Nyalakan mesin scheduler di background
    start_scheduler()
    
    # 2. Ambil session DB sejenak untuk me-load semua job aktif yang tersimpan
    db = SessionLocal()
    try:
        load_active_jobs(db)
    finally:
        db.close()
        
    yield # Server FastAPI sekarang aktif melayani request frontend
    
    # --- [KODE YANG BERJALAN SAAT SERVER SHUTDOWN] ---
    # 3. Matikan mesin scheduler dengan aman saat server dimatikan
    stop_scheduler()


app = FastAPI(
    title="Data Scheduler API",
    description="Backend engine middleware untuk sinkronisasi otomatis",
    version="1.0.0",
    lifespan=lifespan # Daftarkan fungsi lifespan ke FastAPI
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "success",
        "message": "Server Data Scheduler Engine berhasil menyala!",
        "database_status": "Terkoneksi dan tabel sudah disiapkan."
    }