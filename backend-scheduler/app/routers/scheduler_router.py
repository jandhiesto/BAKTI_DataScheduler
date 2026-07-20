from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import SessionLocal
from app.models.scheduler_model import SchedulerConfig
from app.schemas.scheduler_schema import SchedulerCreate, SchedulerResponse, SchedulerUpdate

# Membuat objek router dengan prefix agar rapi (semua endpoint akan berawalan /api/schedulers)
router = APIRouter(
    prefix="/api/schedulers",
    tags=["Schedulers"]
)

# Dependency Injection: Fungsi untuk membuka dan menutup koneksi database secara otomatis
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 1. READ: Mengambil semua data jadwal sinkronisasi
@router.get("/", response_model=List[SchedulerResponse])
def get_all_schedulers(db: Session = Depends(get_db)):
    schedulers = db.query(SchedulerConfig).all()
    return schedulers

# 2. READ (Single): Mengambil data satu jadwal beserta riwayat log-nya
@router.get("/{scheduler_id}", response_model=SchedulerResponse)
def get_scheduler(scheduler_id: int, db: Session = Depends(get_db)):
    scheduler = db.query(SchedulerConfig).filter(SchedulerConfig.id == scheduler_id).first()
    if not scheduler:
        raise HTTPException(status_code=404, detail="Scheduler tidak ditemukan")
    return scheduler

# 3. CREATE: Membuat jadwal sinkronisasi baru
@router.post("/", response_model=SchedulerResponse, status_code=status.HTTP_201_CREATED)
def create_scheduler(scheduler_in: SchedulerCreate, db: Session = Depends(get_db)):
    # Mengubah Pydantic model menjadi SQLAlchemy model menggunakan model_dump()
    new_scheduler = SchedulerConfig(**scheduler_in.model_dump())
    db.add(new_scheduler)
    db.commit()
    db.refresh(new_scheduler)
    return new_scheduler

# 4. DELETE: Menghapus jadwal
@router.delete("/{scheduler_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scheduler(scheduler_id: int, db: Session = Depends(get_db)):
    scheduler = db.query(SchedulerConfig).filter(SchedulerConfig.id == scheduler_id).first()
    if not scheduler:
        raise HTTPException(status_code=404, detail="Scheduler tidak ditemukan")
    
    db.delete(scheduler)
    db.commit()
    return None