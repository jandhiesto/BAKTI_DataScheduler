import time
import json
import logging
from app.core.database import SessionLocal
from app.models.scheduler_model import SchedulerConfig
from app.models.log_model import ExecutionLog
from app.services.api_client import fetch_source_data, push_destination_data

logger = logging.getLogger(__name__)

def execute_sync_job(scheduler_id: int, trigger_type: str = "Manual", require_active: bool = False):
    """
    Layanan utama sinkronisasi data dari endpoint sumber ke endpoint tujuan.
    Mencatat sampel payload (maksimal 3 baris) serta durasi eksekusi ke dalam ExecutionLog.
    """
    db = SessionLocal()
    start_time = time.time()
    payload_sample_str = None
    records_count = 0
    status = "berhasil"
    error_msg = None

    config = db.query(SchedulerConfig).filter(SchedulerConfig.id == scheduler_id).first()
    if not config:
        logger.warning(f"Job dibatalkan. Scheduler ID {scheduler_id} tidak ditemukan.")
        db.close()
        return

    if require_active and config.status != "aktif":
        logger.warning(f"Job dibatalkan. Scheduler ID {scheduler_id} sedang tidak aktif.")
        db.close()
        return

    try:
        logger.info(f"Memulai tugas sinkronisasi ({trigger_type}) untuk: {config.name}")
        source_headers_dict = {
            h["key"]: h["value"]
            for h in (config.source_headers or [])
            if isinstance(h, dict) and h.get("key", "").strip()
        }
        target_headers_dict = {
            h["key"]: h["value"]
            for h in (config.target_headers or [])
            if isinstance(h, dict) and h.get("key", "").strip()
        }

        raw_data = fetch_source_data(url=config.source, headers=source_headers_dict)

        if isinstance(raw_data, dict):
            raw_data = [raw_data]

        records_count = len(raw_data) if isinstance(raw_data, list) else 1

        # Ambil maksimal 3 sampel data untuk ditampilkan pada laporan PDF
        sample_data = raw_data[:3] if isinstance(raw_data, list) else [raw_data]
        payload_sample_str = json.dumps(sample_data, ensure_ascii=False)

        push_destination_data(url=config.target, payload=raw_data, headers=target_headers_dict)

    except Exception as e:
        status = "gagal"
        error_msg = str(e)
        logger.error(f"Gagal mengeksekusi scheduler {config.name}: {error_msg}")

    finally:
        duration = int(time.time() - start_time)
        new_log = ExecutionLog(
            scheduler_id=config.id,
            name=config.name,
            source=config.source,
            target=config.target,
            status=status,
            trigger=trigger_type,
            message=error_msg or f"[INFO] Berhasil mensinkronkan {records_count} baris data dari sumber ke target.",
            payload_sample=payload_sample_str,
            records_processed=records_count if status == "berhasil" else 0,
            duration_seconds=duration
        )
        db.add(new_log)
        db.commit()
        logger.info(f"Selesai! Status akhir: {status} untuk scheduler: {config.name}")
        db.close()
