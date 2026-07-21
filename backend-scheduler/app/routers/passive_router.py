from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.passive_model import PassiveScheduler
from app.models.log_model import ExecutionLog
from app.schemas.passive_schema import PassiveSchedulerResponse, PassiveSchedulerUpdate
from app.scheduler.tasks import push_destination_data
from app.scheduler.engine import add_or_update_passive_job, remove_passive_job
import traceback

router = APIRouter(prefix="/api/passive-schedulers", tags=["Passive Schedulers"])

@router.post("/webhook/receive")
async def receive_webhook(request: Request, app_name: str = "Unknown App", db: Session = Depends(get_db)):
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    if not isinstance(payload, list):
        payload = [payload]

    # Extract columns from the first object
    columns = []
    if len(payload) > 0 and isinstance(payload[0], dict):
        columns = list(payload[0].keys())

    col_widths = [150 for _ in columns]
    col_types = ["string" for _ in columns]
    
    # Origin URL mapping
    client_host = request.client.host if request.client else "Unknown Origin"

    new_passive = PassiveScheduler(
        app_name=app_name,
        source_url=f"Webhook from {client_host}",
        payload=payload,
        columns=columns,
        col_widths=col_widths,
        col_types=col_types,
        status="menunggu"
    )

    db.add(new_passive)
    db.commit()
    db.refresh(new_passive)

    return {"message": "Data diterima", "id": new_passive.id}


@router.get("/", response_model=List[PassiveSchedulerResponse])
def get_passive_schedulers(db: Session = Depends(get_db)):
    return db.query(PassiveScheduler).all()


@router.get("/{scheduler_id}", response_model=PassiveSchedulerResponse)
def get_passive_scheduler(scheduler_id: int, db: Session = Depends(get_db)):
    scheduler = db.query(PassiveScheduler).filter(PassiveScheduler.id == scheduler_id).first()
    if not scheduler:
        raise HTTPException(status_code=404, detail="Passive scheduler not found")
    return scheduler


@router.put("/{scheduler_id}", response_model=PassiveSchedulerResponse)
def update_passive_scheduler(scheduler_id: int, update_data: PassiveSchedulerUpdate, db: Session = Depends(get_db)):
    scheduler = db.query(PassiveScheduler).filter(PassiveScheduler.id == scheduler_id).first()
    if not scheduler:
        raise HTTPException(status_code=404, detail="Passive scheduler not found")

    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(scheduler, key, value)

    db.commit()
    db.refresh(scheduler)

    # Sync APScheduler
    if scheduler.status == "terjadwal":
        add_or_update_passive_job(scheduler)
    else:
        remove_passive_job(scheduler.id)

    return scheduler


@router.delete("/{scheduler_id}")
def delete_passive_scheduler(scheduler_id: int, db: Session = Depends(get_db)):
    scheduler = db.query(PassiveScheduler).filter(PassiveScheduler.id == scheduler_id).first()
    if not scheduler:
        raise HTTPException(status_code=404, detail="Passive scheduler not found")

    db.delete(scheduler)
    db.commit()
    remove_passive_job(scheduler_id)
    return {"message": "Passive scheduler deleted successfully"}


@router.post("/{scheduler_id}/send-now")
def send_now(scheduler_id: int, db: Session = Depends(get_db)):
    scheduler = db.query(PassiveScheduler).filter(PassiveScheduler.id == scheduler_id).first()
    if not scheduler:
        raise HTTPException(status_code=404, detail="Passive scheduler not found")

    if not scheduler.target:
        raise HTTPException(status_code=400, detail="URL Tujuan belum diatur")

    # Format headers
    headers_dict = {h["key"]: h["value"] for h in scheduler.target_headers if h.get("key", "").strip()}

    try:
        push_destination_data(url=scheduler.target, payload=scheduler.payload, headers=headers_dict)
        
        # Sukses, catat ke log
        log = ExecutionLog(
            name=scheduler.app_name,
            source=scheduler.source_url,
            target=scheduler.target,
            status="berhasil",
            trigger="Scheduler Pasif",
            message=f"[INFO] Berhasil mengirim {len(scheduler.payload)} data yang diterima ke target.",
            records_processed=len(scheduler.payload)
        )
        db.add(log)
        
        # Hapus data passive scheduler ini (one-time send)
        db.delete(scheduler)
        db.commit()
        remove_passive_job(scheduler_id)
        
        return {"message": "Berhasil dikirim"}
        
    except Exception as e:
        log = ExecutionLog(
            name=scheduler.app_name,
            source=scheduler.source_url,
            target=scheduler.target,
            status="gagal",
            trigger="Scheduler Pasif",
            message=str(e),
            records_processed=0
        )
        db.add(log)
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))
