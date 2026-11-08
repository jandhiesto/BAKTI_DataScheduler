from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta
import io
import json
import html

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from app.core.database import get_db
from app.models.log_model import ExecutionLog

router = APIRouter(prefix="/api/reports", tags=["Reports"])


def _format_cell_value(val) -> str:
    """Format nilai cell JSON (termasuk dict/list bersarang) menjadi teks ringkas yang aman untuk XML Paragraph."""
    if val is None:
        return "-"
    if isinstance(val, dict):
        # Ambil pasangan key-value tingkat pertama yang berupa primitif agar rapi di dalam sel tabel
        parts = []
        for k, v in val.items():
            if not isinstance(v, (dict, list)):
                parts.append(f"{k}: {v}")
        text = ", ".join(parts) if parts else json.dumps(val, ensure_ascii=False)
    elif isinstance(val, list):
        text = json.dumps(val, ensure_ascii=False)
    else:
        text = str(val)

    if len(text) > 120:
        text = text[:117] + "..."
    return html.escape(text)


def _build_sample_table(payload_sample_str: str, styles, total_width: float = 535.0) -> Table:
    """
    Membangun Tabel Data Sampel dari string JSON payload_sample.
    Jika berupa list of dicts / dict, dirender menjadi tabel berkolom (header + baris sampel).
    """
    header_style = ParagraphStyle(
        "TableHeaderCell",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
    )
    cell_style = ParagraphStyle(
        "TableBodyCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#1e293b"),
    )
    empty_style = ParagraphStyle(
        "TableEmptyCell",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#64748b"),
    )

    if not payload_sample_str:
        t = Table([[Paragraph("Tidak ada sampel data yang tersimpan untuk eksekusi ini.", empty_style)]], colWidths=[total_width], hAlign="LEFT")
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.whitesmoke),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("PADDING", (0, 0), (-1, -1), 8),
        ]))
        return t

    try:
        parsed = json.loads(payload_sample_str)
    except Exception:
        safe_txt = html.escape(str(payload_sample_str))
        t = Table([[Paragraph(safe_txt, cell_style)]], colWidths=[total_width], hAlign="LEFT")
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.whitesmoke),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("PADDING", (0, 0), (-1, -1), 8),
        ]))
        return t

    if isinstance(parsed, dict):
        parsed = [parsed]

    # Jika berupa list of dictionaries, bangun tabel berkolom (Header + Baris Data Sampel)
    if isinstance(parsed, list) and len(parsed) > 0 and isinstance(parsed[0], dict):
        all_keys = []
        for item in parsed[:3]:
            if isinstance(item, dict):
                for k in item.keys():
                    if k not in all_keys:
                        all_keys.append(k)

        # Batasi maksimal 6 kolom agar lebar kolom tetap proporsional di halaman A4.
        # Jika jumlah kolom > 6, prioritaskan kolom bernilai primitif (string/angka) dibanding objek bersarang.
        max_cols = 6
        if len(all_keys) > max_cols:
            primitive_keys = [k for k in all_keys if not isinstance(parsed[0].get(k), (dict, list))]
            complex_keys = [k for k in all_keys if isinstance(parsed[0].get(k), (dict, list))]
            display_keys = (primitive_keys + complex_keys)[:max_cols]
        else:
            display_keys = all_keys

        if display_keys:
            num_cols = len(display_keys)
            col_width = total_width / num_cols

            # Baris Header Tabel
            header_row = [Paragraph(html.escape(str(k)), header_style) for k in display_keys]
            table_data = [header_row]

            # Baris Isi Data Sampel (maks 3 baris)
            for row_dict in parsed[:3]:
                if isinstance(row_dict, dict):
                    row_cells = [
                        Paragraph(_format_cell_value(row_dict.get(k, "-")), cell_style)
                        for k in display_keys
                    ]
                    table_data.append(row_cells)

            t = Table(table_data, colWidths=[col_width] * num_cols, hAlign="LEFT", repeatRows=1)
            style_cmds = [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]
            # Zebra striping untuk baris data
            for r_idx in range(1, len(table_data)):
                bg_color = colors.white if r_idx % 2 == 1 else colors.HexColor("#f8fafc")
                style_cmds.append(("BACKGROUND", (0, r_idx), (-1, r_idx), bg_color))

            t.setStyle(TableStyle(style_cmds))
            return t

    # Fallback jika JSON bukan list of dicts (misal array primitif)
    formatted_json = html.escape(json.dumps(parsed, indent=2, ensure_ascii=False))
    sample_html = formatted_json.replace("\n", "<br/>").replace("  ", "&nbsp;&nbsp;")
    t = Table([[Paragraph(sample_html, cell_style)]], colWidths=[total_width], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.whitesmoke),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


@router.get("/download")
def download_report(days: int = 7, db: Session = Depends(get_db)):
    # 1. Hitung batas tanggal (gunakan UTC karena CURRENT_TIMESTAMP SQLite disimpan dalam UTC)
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    # 2. Ambil data log dari database sesuai rentang waktu
    logs = (
        db.query(ExecutionLog)
        .filter(ExecutionLog.created_at >= cutoff_date)
        .order_by(desc(ExecutionLog.created_at))
        .all()
    )

    total_success = sum(1 for log in logs if (log.status or "").lower() == "berhasil")
    total_failed = sum(1 for log in logs if (log.status or "").lower() == "gagal")

    # 3. Siapkan Dokumen Platypus di memori
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30,
    )
    elements = []
    styles = getSampleStyleSheet()

    # 4. Header Laporan
    elements.append(Paragraph(f"<b>Laporan Sinkronisasi Data ({days} Hari Terakhir)</b>", styles["Title"]))
    elements.append(Spacer(1, 10))

    # 5. Tabel Ringkasan Statistik
    stats_data = [
        ["Total Data Log", str(len(logs))],
        ["Berhasil", str(total_success)],
        ["Gagal", str(total_failed)],
    ]
    stats_table = Table(stats_data, colWidths=[130, 60], hAlign="LEFT")
    stats_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("TEXTCOLOR", (0, 1), (1, 1), colors.HexColor("#16a34a")),
        ("TEXTCOLOR", (0, 2), (1, 2), colors.HexColor("#dc2626")),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(stats_table)
    elements.append(Spacer(1, 20))

    # 6. Bagian Detail Riwayat & Tabel Sampel Data
    elements.append(Paragraph("<b>Detail Riwayat &amp; Tabel Sampel Data:</b>", styles["Heading3"]))
    elements.append(Spacer(1, 8))

    if not logs:
        elements.append(Paragraph("Tidak ada data riwayat sinkronisasi pada rentang waktu ini.", styles["Normal"]))
    else:
        for idx, log in enumerate(logs, start=1):
            status_upper = (log.status or "-").upper()
            status_color = "#16a34a" if status_upper == "BERHASIL" else "#dc2626"

            # Konversi waktu UTC dari SQLite ke WIB (UTC+7)
            if log.created_at:
                wib_time = (log.created_at + timedelta(hours=7)).strftime("%Y-%m-%d %H:%M:%S WIB")
            else:
                wib_time = "-"

            safe_name = html.escape(log.name or "-")
            safe_trigger = html.escape(log.trigger or "-")
            log_info = (
                f"<b>{idx}. {safe_name}</b> &nbsp;|&nbsp; "
                f"Pemicu: <b>{safe_trigger}</b> &nbsp;|&nbsp; "
                f"Status: <font color='{status_color}'><b>{status_upper}</b></font> &nbsp;|&nbsp; "
                f"Data: <b>{log.records_processed or 0} baris</b> &nbsp;|&nbsp; "
                f"Waktu: {wib_time}"
            )
            elements.append(Paragraph(log_info, styles["Normal"]))
            elements.append(Spacer(1, 4))

            # Bangun Tabel Data Sampel
            sample_table = _build_sample_table(log.payload_sample, styles, total_width=535.0)
            elements.append(sample_table)
            elements.append(Spacer(1, 14))

    # 7. Render PDF ke Buffer
    doc.build(elements)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Laporan_{days}_Hari.pdf"},
    )
