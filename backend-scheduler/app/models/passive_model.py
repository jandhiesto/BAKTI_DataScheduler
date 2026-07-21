from sqlalchemy import Column, Integer, String, JSON, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class PassiveScheduler(Base):
    __tablename__ = "passive_schedulers"

    id = Column(Integer, primary_key=True, index=True)
    app_name = Column(String, index=True, default="Unknown App")
    source_url = Column(String, default="")
    target = Column(String, default="")
    target_headers = Column(JSON, default=list) # list of {key, value}
    payload = Column(JSON, default=list) # The raw data received
    columns = Column(JSON, default=list) # Array of column names
    col_widths = Column(JSON, default=list)
    col_types = Column(JSON, default=list)
    days = Column(JSON, default=list) # e.g. ["mon", "tue"]
    time = Column(String, default="") # e.g. "10:00"
    status = Column(String, default="menunggu") # menunggu, terjadwal
    created_at = Column(DateTime, server_default=func.now())
