import json
import time
import logging
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.log_model import ExecutionLog
from app.services.api_client import push_destination_data
from app.services.sync_engine import execute_sync_job as _run_sync_engine

logger = logging.getLogger(__name__)

def execute_sync_job(scheduler_id: int):
    """
    Fungsi utama yang dieksekusi secara otomatis oleh APScheduler.
    Mendelegasikan proses ke sync_engine agar payload_sample dan durasi selalu tercatat.
    """
    _run_sync_job_from_scheduler(scheduler_id)

def _run_sync_job_from_scheduler(scheduler_id: int):
    _run_sync_engine(scheduler_id=scheduler_id, trigger_type="Scheduler", require_active=True)

def execute_passive_sync_job(scheduler_id: int):
    """
    Eksekusi untuk Passive Scheduler yang terjadwal.
    """
    db: Session = SessionLocal()
    start_time = time.time()
    from app.models.passive_model import PassiveScheduler
    
    config = db.query(PassiveScheduler).filter(PassiveScheduler.id == scheduler_id).first()
    
    if not config or config.status != "terjadwal":
        logger.warning(f"Job dibatalkan. Passive Scheduler ID {scheduler_id} tidak ditemukan atau tidak terjadwal.")
        db.close()
        return

    status = "berhasil"
    error_msg = None
    payload_list = config.payload if isinstance(config.payload, list) else ([config.payload] if config.payload else [])
    records_count = len(payload_list)
    payload_sample_str = json.dumps(payload_list[:3], ensure_ascii=False) if payload_list else None

    try:
        logger.info(f"Memulai tugas sinkronisasi pasif untuk: {config.app_name}")
        target_headers_dict = {
            h["key"]: h["value"]
            for h in (config.target_headers or [])
            if isinstance(h, dict) and h.get("key", "").strip()
        }
        
        if not config.target or not config.target.strip():
            raise ValueError("URL tujuan kosong.")
            
        if not payload_list:
            raise ValueError("Isi data kosong.")
        
        # Langsung dorong data karena sudah ada di payload
        push_destination_data(url=config.target, payload=config.payload, headers=target_headers_dict)
        
    except Exception as e:
        status = "gagal"
        error_msg = str(e)
        logger.error(f"Gagal mengeksekusi passive scheduler {config.app_name}: {error_msg}")

    finally:
        duration = int(time.time() - start_time)
        new_log = ExecutionLog(
            name=config.app_name,
            source=config.source_url,
            target=config.target,
            status=status,
            trigger="Scheduler Pasif",
            message=error_msg or f"[INFO] Berhasil mengirim {records_count} data yang diterima secara pasif ke target.",
            payload_sample=payload_sample_str,
            records_processed=records_count if status == "berhasil" else 0,
            duration_seconds=duration
        )
        db.add(new_log)
        
        from app.scheduler.engine import remove_passive_job
        
        if status == "berhasil":
            db.delete(config)
            remove_passive_job(scheduler_id)
        else:
            config.status = "menunggu"
            
        db.commit()
        logger.info(f"Selesai! Status akhir pasif: {status} untuk: {config.app_name}")
        db.close()
