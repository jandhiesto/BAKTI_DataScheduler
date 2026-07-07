from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# SQLAlchemy membuat file database bernama 'scheduler.db'
SQLALCHEMY_DATABASE_URL = "sqlite:///./scheduler.db"

# Engine adalah jembatan utama untuk mengeksekusi perintah SQL ke SQLite
# check_same_thread=False diperlukan khusus untuk SQLite di FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# SessionLocal -> pabrik yang akan membuat koneksi/sesi setiap kali ada request
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base -> class induk yang akan diwarisi oleh semua model tabel kita
Base = declarative_base()

# Dependency untuk mengambil session database (akan sering dipakai di routing API)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()