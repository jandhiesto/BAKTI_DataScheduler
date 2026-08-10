import httpx
import time
import json
from datetime import datetime
from app.core.database import SessionLocal
from app.models.scheduler_model import SchedulerConfig
from app.models.log_model import ExecutionLog

def execute_sync_job(scheduler_id: int):
    db = SessionLocal()
    start_time = time.time()
    payload_sample_str = None # Deklarasi awal agar tidak error jika gagal di awal
    
    try:
        config = db.query(SchedulerConfig).filter(SchedulerConfig.id == scheduler_id).first()
        if not config:
            return 

        with httpx.Client(timeout=30.0) as client:
            source_response = client.get(config.source_url)
            source_response.raise_for_status() 
            
            data = source_response.json()
            
            # Ambil 3 sampel
            if isinstance(data, list):
                sample_data = data[:3]
            else:
                sample_data = data # Jika bentuknya bukan list, ambil semua
                
            # Ubah menjadi string agar bisa disimpan di database
            payload_sample_str = json.dumps(sample_data)
            
            target_response = client.post(
                config.target_url, 
                json=data
            )
            target_response.raise_for_status()
            
            duration = int(time.time() - start_time)
            records_processed = len(data) if isinstance(data, list) else 1
            
            new_log = ExecutionLog(
                scheduler_id=config.id,
                name=config.name,
                source=config.source_url,
                target=config.target_url,
                status="berhasil",
                trigger="Manual", # Sesuaikan jika ini dari Cron
                message="Data berhasil disinkronisasi",
                payload_sample=payload_sample_str,
                records_processed=records_processed,
                duration_seconds=duration,
                created_at=datetime.now()
            )
            db.add(new_log)
            db.commit()

    except Exception as e:
        duration = int(time.time() - start_time)
        error_msg = str(e)[:250] 
        
        # Ambil config lagi (kalau gagalnya di koneksi, config masih bisa dipakai untuk nama log)
        config = db.query(SchedulerConfig).filter(SchedulerConfig.id == scheduler_id).first()
        
        new_log = ExecutionLog(
            scheduler_id=scheduler_id,
            name=config.name if config else "Unknown",
            source=config.source_url if config else "-",
            target=config.target_url if config else "-",
            status="gagal",
            trigger="Manual",
            message=error_msg,
            payload_sample=payload_sample_str, # Bisa berisi null, atau berisi data jika gagal saat proses POST
            records_processed=0,
            duration_seconds=duration,
            created_at=datetime.now()
        )
        db.add(new_log)
        db.commit()
    finally:
        db.close()