from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import extract, desc
from typing import Optional
from datetime import datetime
from app.core.database import get_db
from app.models.scheduler_model import SchedulerConfig
from app.models.passive_model import PassiveScheduler
from app.models.log_model import ExecutionLog

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(month: Optional[int] = None, year: Optional[int] = None, db: Session = Depends(get_db)):
    # 1. Total Scheduler Aktif
    total_active = db.query(SchedulerConfig).filter(SchedulerConfig.status == "aktif").count()
    
    # 2. Total Scheduler Pasif (menunggu & terjadwal)
    total_passive = db.query(PassiveScheduler).filter(PassiveScheduler.status.in_(["menunggu", "terjadwal"])).count()
    
    # Base query for logs
    log_query = db.query(ExecutionLog)
    
    if year:
        log_query = log_query.filter(extract('year', ExecutionLog.created_at) == year)
    if month:
        log_query = log_query.filter(extract('month', ExecutionLog.created_at) == month)
        
    total_success = log_query.filter(ExecutionLog.status == "berhasil").count()
    total_failed = log_query.filter(ExecutionLog.status == "gagal").count()
    
    return {
        "total_active": total_active,
        "total_passive": total_passive,
        "total_success": total_success,
        "total_failed": total_failed
    }

@router.get("/recent-logs")
def get_recent_logs(db: Session = Depends(get_db)):
    logs = db.query(ExecutionLog).order_by(desc(ExecutionLog.created_at)).limit(10).all()
    return logs

@router.get("/upcoming-schedulers")
def get_upcoming_schedulers(db: Session = Depends(get_db)):
    # Get current day string (e.g. 'mon', 'tue')
    current_day = datetime.now().strftime('%a').lower()
    
    active_schedulers = db.query(SchedulerConfig).filter(SchedulerConfig.status == "aktif").all()
    
    upcoming = []
    for s in active_schedulers:
        # If days is empty, it means everyday. Otherwise check if current_day is in days.
        if not s.days or current_day in s.days:
            upcoming.append(s)
            
    # Sort by time
    # Time is stored as string "HH:MM", we can sort alphabetically
    upcoming.sort(key=lambda x: x.time or "00:00")
    
    return upcoming
