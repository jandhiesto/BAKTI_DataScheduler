from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import SessionLocal
from app.models.log_model import ExecutionLog
from app.schemas.scheduler_schema import LogResponse
from app.services.api_client import push_destination_data

router = APIRouter(prefix="/api")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from fastapi import Query
from sqlalchemy import extract
from math import ceil
from typing import Optional
from app.schemas.scheduler_schema import PaginatedLogResponse

@router.get("/logs", response_model=PaginatedLogResponse)
def get_all_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    statuses: Optional[str] = None,
    month: Optional[str] = None,
    year: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ExecutionLog)
    
    if search:
        # Case insensitive search on name
        query = query.filter(ExecutionLog.name.ilike(f"%{search}%"))
        
    if statuses:
        status_list = [s.strip().lower() for s in statuses.split(",")]
        # Map frontend 'sukses' to backend 'berhasil'
        status_list = ['berhasil' if s == 'sukses' else s for s in status_list]
        query = query.filter(ExecutionLog.status.in_(status_list))
        
    if year:
        query = query.filter(extract('year', ExecutionLog.created_at) == int(year))
        
    if month:
        query = query.filter(extract('month', ExecutionLog.created_at) == int(month))
        
    total = query.count()
    total_pages = ceil(total / limit) if total > 0 else 1
    
    logs = query.order_by(ExecutionLog.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    
    return {
        "data": logs,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }

@router.post("/manual-sync")
def manual_sync(payload: dict, db: Session = Depends(get_db)):
    # Payload dari frontend InputData.tsx: { targetUrl: string, headers: [{key, value}], payload: [dict] }
    target_url = payload.get("targetUrl", "")
    headers_list = payload.get("headers", [])
    data_payload = payload.get("payload", [])
    
    # Format headers to dict
    headers_dict = {h["key"]: h["value"] for h in headers_list if h["key"].strip()}
    
    status = "berhasil"
    error_msg = None
    records_count = len(data_payload)
    
    try:
        push_destination_data(url=target_url, payload=data_payload, headers=headers_dict)
    except Exception as e:
        status = "gagal"
        error_msg = str(e)
        
    # Catat ke log
    new_log = ExecutionLog(
        name="Manual Data Input",
        source="",
        target=target_url,
        status=status,
        trigger="Manual",
        message=error_msg or f"[INFO] Berhasil mensinkronkan {records_count} baris data secara manual.",
        records_processed=records_count if status == "berhasil" else 0
    )
    db.add(new_log)
    db.commit()
    
    if status == "gagal":
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=error_msg)
        
    return {"message": "Data berhasil dikirim"}

@router.post("/test-connection")
def test_connection(payload: dict):
    import httpx
    from fastapi import HTTPException
    
    url = payload.get("url")
    headers_list = payload.get("headers", [])
    headers_dict = {h["key"]: h["value"] for h in headers_list if h.get("key", "").strip()}
    
    if not url:
        raise HTTPException(status_code=400, detail="URL tidak boleh kosong")
        
    try:
        # Lakukan request GET sederhana
        response = httpx.get(url, headers=headers_dict, timeout=10.0)
        response.raise_for_status()
        return {"message": "Koneksi berhasil", "status_code": response.status_code}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal terhubung: {str(e)}")
