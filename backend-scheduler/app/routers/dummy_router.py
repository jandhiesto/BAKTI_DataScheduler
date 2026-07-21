from fastapi import APIRouter, Header, HTTPException, Request

router = APIRouter(prefix="/api/dummy")

@router.get("/source")
def get_dummy_source():
    """Endpoint sumber data (terbuka)"""
    return [
        {"id": 1, "nama": "Budi", "divisi": "IT", "gaji": 5000000},
        {"id": 2, "nama": "Siti", "divisi": "Finance", "gaji": 6000000},
        {"id": 3, "nama": "Agus", "divisi": "HR", "gaji": 4500000}
    ]

@router.get("/secure-source")
def get_secure_dummy_source(authorization: str = Header(None)):
    """Endpoint sumber data (butuh header 'Authorization: Bearer my-secret-token')"""
    if authorization != "Bearer my-secret-token":
        raise HTTPException(status_code=401, detail="Unauthorized. Invalid or missing token.")
    
    return [
        {"id": 4, "nama": "Rahma", "divisi": "CEO", "gaji": 25000000},
        {"id": 5, "nama": "Joko", "divisi": "CTO", "gaji": 20000000}
    ]

@router.post("/target")
async def post_dummy_target(request: Request):
    """Endpoint target data"""
    data = await request.json()
    return {"message": f"Berhasil menerima {len(data)} baris data", "data_received": data}
