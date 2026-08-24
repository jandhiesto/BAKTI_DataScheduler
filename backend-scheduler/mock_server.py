from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
import json

app = FastAPI(title="Simulator API Interaktif")

# Tempat menyimpan data dinamis di memori
# Diberi nilai default agar tidak kosong saat pertama kali dijalankan
source_data = [
    {"id": 1, "nama": "Andi", "departemen": "IT"},
    {"id": 2, "nama": "Budi", "departemen": "HR"}
]

inbox_data = []

# --- 1. ENDPOINT SUMBER (API GET) ---
@app.get("/api/source")
def provide_data():
    return source_data

# --- 2. ENDPOINT TUJUAN (API POST) ---
@app.post("/api/target", status_code=201)
async def receive_data(request: Request):
    payload = await request.json()
    # Menyimpan data yang masuk ke posisi paling atas (terbaru)
    inbox_data.insert(0, payload)
    return {"status": "success", "message": "Data berhasil mendarat!"}

# --- 3. ENDPOINT MENGUBAH DATA SUMBER DARI UI ---
@app.post("/set-source")
async def update_source_data(json_input: str = Form(...)):
    global source_data
    try:
        # Memastikan teks yang diinput adalah JSON yang valid
        parsed_data = json.loads(json_input)
        source_data = parsed_data
    except json.JSONDecodeError:
        # Jika bukan JSON (misal ada salah ketik koma), biarkan data sebelumnya
        print("Format JSON tidak valid!")
        
    # Redirect kembali ke halaman utama setelah menyimpan
    return RedirectResponse(url="/", status_code=303)

# --- 4. WEB UI INTERAKTIF ---
@app.get("/", response_class=HTMLResponse)
def view_dashboard():
    formatted_source = json.dumps(source_data, indent=4)
    formatted_inbox = json.dumps(inbox_data, indent=4)
    
    html_content = f"""
    <html>
        <head>
            <title>Simulator API Terintegrasi</title>
            <style>
                body {{ font-family: system-ui, sans-serif; padding: 30px; background: #f8fafc; color: #0f172a; }}
                .container {{ max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }}
                .card {{ background: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }}
                textarea {{ width: 100%; height: 150px; font-family: monospace; padding: 12px; background: #1e293b; color: #10b981; border-radius: 8px; border: none; resize: vertical; }}
                button {{ margin-top: 10px; background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; }}
                button:hover {{ background: #1d4ed8; }}
                pre {{ background: #1e293b; color: #e2e8f0; padding: 16px; border-radius: 8px; overflow-x: auto; max-height: 400px; overflow-y: auto; }}
                h2 {{ margin-top: 0; color: #334155; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }}
            </style>
        </head>
        <body>
            <div class="container">
                
                <!-- BAGIAN 1: PENGATURAN SUMBER DATA -->
                <div class="card">
                    <h2>📤 Atur Data Sumber (API Source)</h2>
                    <p style="font-size: 14px; color: #64748b;">Edit format JSON di bawah ini, lalu klik Simpan. Aplikasi integrasimu akan menarik data ini dari <code>http://localhost:8001/api/source</code>.</p>
                    
                    <form action="/set-source" method="post">
                        <textarea name="json_input">{formatted_source}</textarea>
                        <button type="submit">Simpan Perubahan JSON</button>
                    </form>
                </div>

                <!-- BAGIAN 2: KOTAK MASUK TARGET -->
                <div class="card">
                    <h2>📥 Kotak Masuk (API Target)</h2>
                    <p style="font-size: 14px; color: #64748b;">Data yang berhasil didorong ke <code>http://localhost:8001/api/target</code> akan muncul di sini (Terbaru di atas).</p>
                    <p><b>Total request diterima:</b> {len(inbox_data)} kali</p>
                    <pre>{formatted_inbox}</pre>
                </div>

            </div>
        </body>
    </html>
    """
    return html_content