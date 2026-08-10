from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors

from app.core.database import get_db
from app.models.log_model import ExecutionLog

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/download")
def download_report(days: int = 7, db: Session = Depends(get_db)):
    # 1. Hitung batas tanggal
    cutoff_date = datetime.now() - timedelta(days=days)
    
    # 2. Ambil data log dari database sesuai rentang waktu
    logs = db.query(ExecutionLog).filter(ExecutionLog.created_at >= cutoff_date).order_by(desc(ExecutionLog.created_at)).all()
    
    # Hitung statistik
    total_success = sum(1 for log in logs if log.status.lower() == "berhasil")
    total_failed = sum(1 for log in logs if log.status.lower() == "gagal")
    
    # 3. Siapkan "Kanvas" PDF di memori (tanpa perlu save file fisik ke hardisk)
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # --- MULAI MENGGAMBAR PDF ---
    # Judul
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, f"Laporan Sinkronisasi Data ({days} Hari Terakhir)")
    
    # Statistik
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 80, f"Total Data Log: {len(logs)}")
    c.setFillColor(colors.green)
    c.drawString(50, height - 100, f"Berhasil: {total_success}")
    c.setFillColor(colors.red)
    c.drawString(50, height - 120, f"Gagal: {total_failed}")
    
    # Reset warna
    c.setFillColor(colors.black)
    c.drawString(50, height - 150, "Data sampel akan ditampilkan dalam bentuk tabel di sini...")
    
    # Selesai menggambar
    c.showPage()
    c.save()
    
    # 4. Kirim file ke Frontend
    buffer.seek(0)
    return StreamingResponse(
        buffer, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Laporan_{days}_Hari.pdf"}
    )