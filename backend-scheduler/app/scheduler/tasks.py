import logging
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.scheduler_model import SchedulerConfig
from app.models.log_model import ExecutionLog
from app.services.api_client import fetch_source_data, push_destination_data
from app.services.data_transformer import transform_payload

logger = logging.getLogger(__name__)

def execute_sync_job(scheduler_id: int):
    """
    Ini adalah fungsi utama yang akan dieksekusi secara otomatis oleh APScheduler.
    Alurnya: Ambil Config -> Tarik Data -> Transformasi -> Dorong Data -> Catat Log.
    """
    # Membuka sesi database baru khusus untuk job ini
    db: Session = SessionLocal()
    
    # Mencari konfigurasi scheduler berdasarkan ID
    config = db.query(SchedulerConfig).filter(SchedulerConfig.id == scheduler_id).first()
    
    if not config or config.status != "aktif":
        logger.warning(f"Job dibatalkan. Scheduler ID {scheduler_id} tidak ditemukan atau tidak aktif.")
        db.close()
        return

    # Inisialisasi variabel untuk log
    status = "berhasil"
    error_msg = None
    records_count = 0

    try:
        # 1. TARIK DATA DARI SUMBER
        logger.info(f"Memulai tugas sinkronisasi untuk: {config.name}")
        source_headers_dict = {h["key"]: h["value"] for h in config.source_headers if h.get("key", "").strip()}
        target_headers_dict = {h["key"]: h["value"] for h in config.target_headers if h.get("key", "").strip()}
        
        raw_data = fetch_source_data(url=config.source, headers=source_headers_dict)
        
        # Asumsi: Jika data yang ditarik berbentuk list (array of objects), kita proses satu per satu.
        # Jika bentuknya bukan list, kita bungkus ke dalam list agar mudah dilooping.
        if isinstance(raw_data, dict):
            raw_data = [raw_data]
            
        records_count = len(raw_data)
        
        # 2. DORONG DATA KE TUJUAN (Tanpa Transformasi)
        push_destination_data(url=config.target, payload=raw_data, headers=target_headers_dict)

    except Exception as e:
        # Menangkap segala jenis error
        status = "gagal"
        error_msg = str(e)
        logger.error(f"Gagal mengeksekusi scheduler {config.name}: {error_msg}")

    finally:
        # 4. CATAT LOG RIWAYAT KE DATABASE (Pasti dijalankan baik saat sukses maupun gagal)
        new_log = ExecutionLog(
            scheduler_id=config.id,
            name=config.name,
            source=config.source,
            target=config.target,
            status=status,
            trigger="Scheduler",
            message=error_msg or f"[INFO] Berhasil mensinkronkan {records_count} baris data dari sumber ke target.",
            records_processed=records_count if status == "berhasil" else 0
        )
        db.add(new_log)
        db.commit()
        logger.info(f"Selesai! Status akhir: {status} untuk scheduler: {config.name}")
        db.close()

def execute_passive_sync_job(scheduler_id: int):
    """
    Eksekusi untuk Passive Scheduler yang terjadwal.
    """
    db: Session = SessionLocal()
    from app.models.passive_model import PassiveScheduler
    
    config = db.query(PassiveScheduler).filter(PassiveScheduler.id == scheduler_id).first()
    
    if not config or config.status != "terjadwal":
        logger.warning(f"Job dibatalkan. Passive Scheduler ID {scheduler_id} tidak ditemukan atau tidak terjadwal.")
        db.close()
        return

    status = "berhasil"
    error_msg = None
    records_count = len(config.payload)

    try:
        logger.info(f"Memulai tugas sinkronisasi pasif untuk: {config.app_name}")
        target_headers_dict = {h["key"]: h["value"] for h in config.target_headers if h.get("key", "").strip()}
        
        if not config.target or not config.target.strip():
            raise ValueError("URL tujuan kosong.")
            
        if not config.payload or len(config.payload) == 0:
            raise ValueError("Isi data kosong.")
        
        # Langsung dorong data karena sudah ada di payload
        push_destination_data(url=config.target, payload=config.payload, headers=target_headers_dict)
        
    except Exception as e:
        status = "gagal"
        error_msg = str(e)
        logger.error(f"Gagal mengeksekusi passive scheduler {config.app_name}: {error_msg}")

    finally:
        new_log = ExecutionLog(
            name=config.app_name,
            source=config.source_url,
            target=config.target,
            status=status,
            trigger="Scheduler Pasif",
            message=error_msg or f"[INFO] Berhasil mengirim {records_count} data yang diterima secara pasif ke target.",
            records_processed=records_count if status == "berhasil" else 0
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