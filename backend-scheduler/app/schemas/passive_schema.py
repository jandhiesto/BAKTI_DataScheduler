from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime

class PassiveSchedulerBase(BaseModel):
    app_name: str
    source_url: str
    target: str
    target_headers: List[Dict[str, str]]
    payload: List[Any]
    columns: List[str]
    col_widths: List[int]
    col_types: List[str]
    days: List[str]
    time: str
    status: str

class PassiveSchedulerCreate(PassiveSchedulerBase):
    pass

class PassiveSchedulerUpdate(BaseModel):
    target: Optional[str] = None
    target_headers: Optional[List[Dict[str, str]]] = None
    payload: Optional[List[Any]] = None
    columns: Optional[List[str]] = None
    col_widths: Optional[List[int]] = None
    col_types: Optional[List[str]] = None
    days: Optional[List[str]] = None
    time: Optional[str] = None
    status: Optional[str] = None

class PassiveSchedulerResponse(PassiveSchedulerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
