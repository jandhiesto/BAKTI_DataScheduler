import httpx
import logging

# Setup logging sederhana untuk melihat aktivitas di terminal
# logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fetch_source_data(url: str, method: str = "GET", headers: dict = None) -> dict:
    """
    Tugas: Menarik data mentah dari API Sumber (Perusahaan).
    """
    if headers is None:
        headers = {}
    
    logger.info(f"Mencoba menarik data dari sumber: {url}")
    
    # timeout = 10 agar sistem tidak error/menggantung jika server sumber sedang down
    with httpx.Client(timeout=10.0) as client:
        response = client.request(method, url, headers=headers)
        
        # raise_for_status() akan otomatis melempar error jika status gagal (misal: 404 atau 500)
        # Error ini nanti akan ditangkap oleh Scheduler Engine untuk dicatat di log_model
        response.raise_for_status() 
        
        return response.json()


def push_destination_data(url: str, payload: dict, method: str = "POST", headers: dict = None) -> dict:
    """
    Tugas: Mendorong data yang sudah di-mapping ke API Tujuan (Kementerian).
    """
    if headers is None:
        headers = {}
        
    logger.info(f"Mencoba mengirim data ke tujuan: {url}")
        
    with httpx.Client(timeout=10.0) as client:
        # Perhatikan kita menambahkan parameter 'json=payload' untuk mengirimkan datanya
        response = client.request(method, url, headers=headers, json=payload)
        response.raise_for_status()
        
        # Beberapa API tidak merespons dengan JSON saat sukses, 
        # Gunakan try-except agar tidak error saat mencoba membaca responsnya.
        try:
            return response.json()
        except Exception:
            return {"status_code": response.status_code, "text": response.text}