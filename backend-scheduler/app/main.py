from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import pengaturan database yang sudah kita buat sebelumnya
from app.core.database import engine, Base
# Import model agar SQLAlchemy mengenali struktur tabel sebelum membuat file .db
from app.models import scheduler_model, log_model

# TRIGGER PEMBUATAN DATABASE
# Saat server menyala, perintah ini mengecek apakah scheduler.db sudah ada.
# Jika belum, ia akan membuatnya otomatis beserta seluruh tabelnya.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Data Scheduler API",
    description="Backend engine middleware untuk sinkronisasi otomatis",
    version="1.0.0"
)

# Konfigurasi CORS agar frontend React (Vite) bisa berkomunikasi tanpa diblokir browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Endpoint dasar untuk mengecek apakah server menyala dan sehat (Health Check)
@app.get("/")
def read_root():
    return {
        "status": "success",
        "message": "Server Data Scheduler Engine berhasil menyala!",
        "database_status": "Terkoneksi dan tabel sudah disiapkan."
    }