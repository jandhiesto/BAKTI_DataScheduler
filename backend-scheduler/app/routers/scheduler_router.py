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
    new_scheduler = SchedulerConfig(**scheduler_in.model_dump())
    db.add(new_scheduler)
    db.commit()
    db.refresh(new_scheduler)
    
    from app.scheduler.engine import add_or_update_job
    add_or_update_job(new_scheduler)
    return new_scheduler

# 4. UPDATE: Mengedit jadwal sinkronisasi
@router.put("/{scheduler_id}", response_model=SchedulerResponse)
def update_scheduler(scheduler_id: int, scheduler_in: SchedulerUpdate, db: Session = Depends(get_db)):
    scheduler = db.query(SchedulerConfig).filter(SchedulerConfig.id == scheduler_id).first()
    if not scheduler:
        raise HTTPException(status_code=404, detail="Scheduler tidak ditemukan")
    
    update_data = scheduler_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(scheduler, key, value)
        
    db.commit()
    db.refresh(scheduler)
    
    from app.scheduler.engine import add_or_update_job
    add_or_update_job(scheduler)
    return scheduler

# 5. DELETE: Menghapus jadwal
@router.delete("/{scheduler_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scheduler(scheduler_id: int, db: Session = Depends(get_db)):
    scheduler = db.query(SchedulerConfig).filter(SchedulerConfig.id == scheduler_id).first()
    if not scheduler:
        raise HTTPException(status_code=404, detail="Scheduler tidak ditemukan")
    
    db.delete(scheduler)
    db.commit()
    
    from app.scheduler.engine import remove_job
    remove_job(scheduler_id)
    return None