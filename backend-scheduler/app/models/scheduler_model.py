from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class SchedulerConfig(Base):
    __tablename__ = "schedulers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    
    # Konfigurasi Endpoint
    source = Column(String, nullable=False)
    source_headers = Column(JSON, default=[])
    target = Column(String, nullable=False)
    target_headers = Column(JSON, default=[])
    
    # Pengaturan Waktu
    days = Column(JSON, default=[]) # e.g. ["mon", "tue"]
    time = Column(String, nullable=False) # e.g. "09:00"
    
    # Status Scheduler
    status = Column(String, default="aktif") # 'aktif' atau 'dijeda'
    
    # Timestamp otomatis
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())