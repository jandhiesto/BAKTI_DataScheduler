from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class ExecutionLog(Base):
    __tablename__ = "execution_logs"

    id = Column(Integer, primary_key=True, index=True)
    
    # scheduler_id bersifat nullable karena log manual tidak terkait scheduler
    scheduler_id = Column(Integer, ForeignKey("schedulers.id", ondelete="SET NULL"), nullable=True)
    
    # Snapshot data saat dieksekusi (untuk log scheduler maupun manual)
    name = Column(String, nullable=False)
    source = Column(String, nullable=True)
    target = Column(String, nullable=False)
    
    # "berhasil" atau "gagal"
    status = Column(String(50), nullable=False)
    
    # "Scheduler" atau "Manual"
    trigger = Column(String(50), nullable=False)
    
    # Pesan detail
    message = Column(Text, nullable=True)
    
    # Berapa banyak baris data yang berhasil diproses
    records_processed = Column(Integer, default=0)
    
    # Durasi eksekusi dalam detik
    duration_seconds = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relasi kembali ke tabel scheduler
    scheduler = relationship("SchedulerConfig", backref="logs")