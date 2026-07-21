import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from app.scheduler.tasks import execute_sync_job

logger = logging.getLogger(__name__)

# Inisialisasi objek scheduler global yang berjalan di background thread
scheduler = BackgroundScheduler()

def start_scheduler():
    """
    Menyalakan mesin penjadwal otomatis di background thread.
    """
    if not scheduler.running:
        scheduler.start()
        logger.info("Mesin APScheduler berhasil dinyalakan di background.")


def stop_scheduler():
    """
    Mematikan mesin penjadwal saat aplikasi FastAPI dimatikan (Graceful Shutdown).
    """
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Mesin APScheduler berhasil dimatikan secara aman.")


def _create_cron_trigger(days: list, time_str: str) -> CronTrigger:
    # time_str e.g. "09:00"
    if not time_str:
        hour, minute = 0, 0
    else:
        parts = time_str.split(":")
        hour = int(parts[0]) if len(parts) > 0 else 0
        minute = int(parts[1]) if len(parts) > 1 else 0
        
    day_of_week = ",".join(days) if days else "*"
    return CronTrigger(day_of_week=day_of_week, hour=hour, minute=minute)

def add_or_update_job(config):
    if config.status == "dijeda":
        remove_job(config.id)
        return
        
    try:
        scheduler.add_job(
            func=execute_sync_job,
            trigger=_create_cron_trigger(config.days, config.time),
            id=f"sync_job_{config.id}",
            args=[config.id],
            replace_existing=True
        )
        logger.info(f"Berhasil mendaftarkan jadwal otomatis: {config.name} [{config.days} pada {config.time}]")
    except Exception as e:
        logger.error(f"Gagal mendaftarkan jadwal {config.name}: {str(e)}")

def remove_job(scheduler_id: int):
    job_id = f"sync_job_{scheduler_id}"
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)
        logger.info(f"Berhasil menghapus jadwal dengan ID: {scheduler_id}")

def load_active_jobs(db):
    """
    Mengambil semua konfigurasi scheduler yang berstatus aktif dari database,
    lalu mendaftarkannya satu per satu ke mesin APScheduler.
    """
    from app.models.scheduler_model import SchedulerConfig
    
    active_configs = db.query(SchedulerConfig).filter(SchedulerConfig.status == "aktif").all()
    
    for config in active_configs:
        add_or_update_job(config)

def add_or_update_passive_job(passive_scheduler):
    if passive_scheduler.status != "terjadwal":
        remove_passive_job(passive_scheduler.id)
        return
        
    try:
        from app.scheduler.tasks import execute_passive_sync_job
        scheduler.add_job(
            func=execute_passive_sync_job,
            trigger=_create_cron_trigger(passive_scheduler.days, passive_scheduler.time),
            id=f"passive_sync_job_{passive_scheduler.id}",
            args=[passive_scheduler.id],
            replace_existing=True
        )
        logger.info(f"Berhasil mendaftarkan jadwal pasif: ID {passive_scheduler.id} [{passive_scheduler.days} pada {passive_scheduler.time}]")
    except Exception as e:
        logger.error(f"Gagal mendaftarkan jadwal pasif {passive_scheduler.id}: {str(e)}")

def remove_passive_job(passive_id: int):
    job_id = f"passive_sync_job_{passive_id}"
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)
        logger.info(f"Berhasil menghapus jadwal pasif dengan ID: {passive_id}")