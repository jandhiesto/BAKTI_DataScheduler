from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class ExecutionLog(Base):
    __tablename__ = "execution_logs"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Key untuk menghubungkan log ini dengan scheduler tertentu
    scheduler_id = Column(Integer, ForeignKey("schedulers.id", ondelete="CASCADE"), nullable=False)
    
    # Status eksekusi (contoh: "SUCCESS", "FAILED", "PARTIAL")
    status = Column(String(50), nullable=False)
    
    # Berapa banyak baris data yang berhasil ditarik & didorong
    records_processed = Column(Integer, default=0)
    
    # Menyimpan pesan error asli dari API kementerian jika terjadi kegagalan 
    error_message = Column(Text, nullable=True)
    
    # Durasi eksekusi dalam detik
    duration_seconds = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relasi kembali ke tabel scheduler
    scheduler = relationship("SchedulerConfig", backref="logs")