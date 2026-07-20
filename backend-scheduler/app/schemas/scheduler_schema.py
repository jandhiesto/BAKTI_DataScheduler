from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from datetime import datetime

# SCHEMA UNTUK EXECUTION LOG
class LogResponse(BaseModel):
    id: int
    scheduler_id: int
    status: str
    records_processed: int
    error_message: Optional[str] = None
    duration_seconds: int
    created_at: datetime

    class Config:
        from_attributes = True


# SCHEMA UNTUK SCHEDULER CONFIGURATION

# 1. Base Schema (Kolom yang pasti ada saat membuat atau mengedit)
class SchedulerBase(BaseModel):
    name: str = Field(..., example="Sinkronisasi Data Mahasiswa")
    description: Optional[str] = Field(None, example="Tarik dari sistem kampus ke kementerian")
    source_url: str = Field(..., example="https://api.kampus.ac.id/students")
    target_url: str = Field(..., example="https://api.kementerian.go.id/import")
    cron_schedule: str = Field(..., example="0 * * * *") # Setiap jam
    
    # Format mapping: {"nama_sumber": "nama_tujuan"}
    field_mappings: Dict[str, str] = Field(default_factory=dict)
    
    # Format static: {"token": "12345", "department": "IT"}
    static_parameters: Dict[str, str] = Field(default_factory=dict)
    is_active: bool = True

# 2. Schema untuk menerima data POST dari Frontend
class SchedulerCreate(SchedulerBase):
    pass

# 3. Schema untuk menerima data PUT/PATCH (Update) dari Frontend
class SchedulerUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    source_url: Optional[str] = None
    target_url: Optional[str] = None
    cron_schedule: Optional[str] = None
    field_mappings: Optional[Dict[str, str]] = None
    static_parameters: Optional[Dict[str, str]] = None
    is_active: Optional[bool] = None

# 4. Schema untuk mengirim data dari Backend ke Frontend (GET)
class SchedulerResponse(SchedulerBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    logs: List[LogResponse] = [] 

    class Config:
        from_attributes = True