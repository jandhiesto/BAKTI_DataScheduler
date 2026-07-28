import httpx
import time
from datetime import datetime
from app.core.database import SessionLocal
from app.models.scheduler_model import SchedulerConfig
from app.models.log_model import ExecutionLog # Pastikan nama model log-mu sesuai

def execute_sync_job(scheduler_id: int):
    """
    Fungsi ini berjalan di latar belakang (Background Task) atau dipanggil oleh APScheduler.
    """
    # Buka koneksi database baru khusus untuk proses background ini
    db = SessionLocal()
    start_time = time.time()
    
    try:
        # 1. Ambil Konfigurasi
        config = db.query(SchedulerConfig).filter(SchedulerConfig.id == scheduler_id).first()
        if not config:
            return # Keluar jika jadwal sudah terhapus

        # 2. TARIK DATA DARI SUMBER (GET)
        # Menggunakan timeout 30 detik agar server tidak hang jika API sumber mati
        with httpx.Client(timeout=30.0) as client:
            source_response = client.get(config.source_url)
            source_response.raise_for_status() # Akan memicu error jika statusnya 4xx atau 5xx
            
            data = source_response.json()
            
            # (Tempat untuk mengolah field_mappings di masa depan)
            payload = data
            
            # 3. DORONG DATA KE TUJUAN (POST)
            target_response = client.post(
                config.target_url, 
                json=payload
            )
            target_response.raise_for_status()
            
            # 4. CATAT LOG KEBERHASILAN KE DATABASE
            duration = int(time.time() - start_time)
            records_processed = len(data) if isinstance(data, list) else 1
            
            new_log = ExecutionLog(
                scheduler_id=config.id,
                status="SUCCESS",
                records_processed=records_processed,
                duration_seconds=duration,
                created_at=datetime.now()
            )
            db.add(new_log)
            db.commit()

    except Exception as e:
        # 5. CATAT LOG KEGAGALAN KE DATABASE
        duration = int(time.time() - start_time)
        error_msg = str(e)[:250] # Potong pesan error agar tidak kepanjangan di database
        
        new_log = ExecutionLog(
            scheduler_id=scheduler_id,
            status="FAILED",
            records_processed=0,
            error_message=error_msg,
            duration_seconds=duration,
            created_at=datetime.now()
        )
        db.add(new_log)
        db.commit()
    finally:
        # Selalu tutup koneksi database agar tidak terjadi kebocoran memori (memory leak)
        db.close()