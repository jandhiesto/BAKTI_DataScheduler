from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from datetime import datetime

# SCHEMA UNTUK EXECUTION LOG
class LogResponse(BaseModel):
    id: int
    scheduler_id: Optional[int] = None
    name: str
    source: Optional[str] = None
    target: str
    status: str
    trigger: str
    message: Optional[str] = None
    records_processed: int
    duration_seconds: int
    created_at: datetime

    class Config:
        from_attributes = True

class PaginatedLogResponse(BaseModel):
    data: List[LogResponse]
    total: int
    page: int
    limit: int
    total_pages: int


# SCHEMA UNTUK SCHEDULER CONFIGURATION

class HeaderField(BaseModel):
    key: str
    value: str

# 1. Base Schema (Kolom yang pasti ada saat membuat atau mengedit)
class SchedulerBase(BaseModel):
    name: str = Field(..., example="Sync Employee Data")
    description: Optional[str] = Field(None, example="Tarik dari sistem HR ke kementerian")
    source: str = Field(..., example="https://api.hr.system/employees")
    source_headers: List[HeaderField] = Field(default_factory=list)
    target: str = Field(..., example="https://api.bakti.go.id/users")
    target_headers: List[HeaderField] = Field(default_factory=list)
    days: List[str] = Field(default_factory=list, example=["mon", "tue"])
    time: str = Field(..., example="09:00")
    status: str = Field(default="aktif", example="aktif")

# 2. Schema untuk menerima data POST dari Frontend
class SchedulerCreate(SchedulerBase):
    pass

# 3. Schema untuk menerima data PUT/PATCH (Update) dari Frontend
class SchedulerUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    source: Optional[str] = None
    source_headers: Optional[List[HeaderField]] = None
    target: Optional[str] = None
    target_headers: Optional[List[HeaderField]] = None
    days: Optional[List[str]] = None
    time: Optional[str] = None
    status: Optional[str] = None

# 4. Schema untuk mengirim data dari Backend ke Frontend (GET)
class SchedulerResponse(SchedulerBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    logs: List[LogResponse] = [] 

    class Config:
        from_attributes = True