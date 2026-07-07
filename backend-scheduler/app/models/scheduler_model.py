from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class SchedulerConfig(Base):
    __tablename__ = "schedulers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    
    # Konfigurasi Endpoint
    source_url = Column(String, nullable=False)
    target_url = Column(String, nullable=False)
    
    # Pengaturan Waktu
    cron_schedule = Column(String, nullable=False) # Contoh: "0 0 * * *"
    
    # Logika Mapping (Tipe datanya JSON agar fleksibel)
    field_mappings = Column(JSON, default={}) 
    static_parameters = Column(JSON, default={})
    
    # Status Scheduler
    is_active = Column(Boolean, default=True)
    
    # Timestamp otomatis
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())