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


def load_active_jobs(db):
    """
    Mengambil semua konfigurasi scheduler yang berstatus aktif dari database,
    lalu mendaftarkannya satu per satu ke mesin APScheduler.
    """
    from app.models.scheduler_model import SchedulerConfig
    
    # Ambil hanya scheduler yang is_active == True
    active_configs = db.query(SchedulerConfig).filter(SchedulerConfig.is_active == True).all()
    
    for config in active_configs:
        try:
            # Gunakan add_job untuk mendaftarkan pipeline tugas ke engine
            scheduler.add_job(
                func=execute_sync_job,
                trigger=CronTrigger.from_crontab(config.cron_schedule),
                id=f"sync_job_{config.id}", # ID unik untuk melacak job di memory
                args=[config.id],            # Parameter yang dilempar ke fungsi execute_sync_job
                replace_existing=True        # Timpa jika ada job dengan ID yang sama
            )
            logger.info(f"Berhasil mendaftarkan jadwal otomatis: {config.name} [{config.cron_schedule}]")
        except Exception as e:
            logger.error(f"Gagal mendaftarkan jadwal {config.name}: {str(e)}")