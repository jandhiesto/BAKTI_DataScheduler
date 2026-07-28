from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from app.scheduler.engine import add_or_update_job, remove_job
from app.services.sync_engine import execute_sync_job
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
    
    # Daftarkan ke APScheduler menggunakan fungsi bawaan
    if new_scheduler.status == "aktif":
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
    
    # Perbarui jadwal di mesin otomatis, atau hapus jika dijeda
    if scheduler.status == "aktif":
        add_or_update_job(scheduler) # Cukup lempar objeknya
    else:
        remove_job(scheduler.id)
        
    return scheduler

# 5. DELETE: Menghapus jadwal
@router.delete("/{scheduler_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scheduler(scheduler_id: int, db: Session = Depends(get_db)):
    scheduler = db.query(SchedulerConfig).filter(SchedulerConfig.id == scheduler_id).first()
    if not scheduler:
        raise HTTPException(status_code=404, detail="Scheduler tidak ditemukan")
    
    db.delete(scheduler)
    db.commit()
    
    # Cabut jadwal dari mesin otomatis
    remove_job(scheduler_id)
    
    return

# 6. ACTION: Menjalankan scheduler secara manual (Trigger / Sync Now)
@router.post("/{scheduler_id}/trigger", status_code=status.HTTP_200_OK)
def trigger_scheduler(
    scheduler_id: int, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    scheduler = db.query(SchedulerConfig).filter(SchedulerConfig.id == scheduler_id).first()
    if not scheduler:
        raise HTTPException(status_code=404, detail="Scheduler tidak ditemukan")

    # if not scheduler.is_active:
    #     raise HTTPException(status_code=400, detail="Scheduler sedang dalam status non-aktif")

    # Masukkan fungsi kurir data ke dalam antrean background FastAPI
    background_tasks.add_task(execute_sync_job, scheduler.id)

    return {
        "status": "success", 
        "message": f"Proses sinkronisasi untuk '{scheduler.name}' sedang dijalankan di latar belakang."
    }