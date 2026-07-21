# BAKTI_DataScheduler

# Backend
# 1. Masuk ke folder backend
cd backend-scheduler
# 2. Buat virtual environment baru bernama 'venv'
python -m venv venv
# 3. Aktifkan virtual environment tersebut
.\venv\Scripts\Activate.ps1
# 4. Instal ulang semua library yang dibutuhkan
pip install -r requirements.txt
# 5. Jalankan server FastAPI kembali
uvicorn app.main:app --reload

# Frontend
# 1. Masuk ke folder frontend
cd frontend
# 2. Instal semua dependensi Node.js
npm install
# 3. Jalankan server development frontend
npm run dev