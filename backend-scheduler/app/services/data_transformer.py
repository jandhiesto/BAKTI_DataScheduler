def transform_payload(raw_payload: dict, field_mappings: dict, static_parameters: dict) -> dict:
    """
    Fungsi untuk mentransformasi JSON mentah menjadi JSON yang siap dikirim.
    
    :param raw_payload: Dictionary data asli dari API sumber
    :param field_mappings: Dictionary aturan mapping (contoh: {"kelas_karyawan": "class"})
    :param static_parameters: Dictionary parameter tambahan (contoh: {"kode_instansi": "KEMEN-123"})
    :return: Dictionary data yang sudah bersih dan dimodifikasi
    """
    ready_to_send_payload = {}

    # Melakukan Mapping dan Membuang Data yang Tidak Relevan
    for source_key, destination_key in field_mappings.items():
        if source_key in raw_payload:
            ready_to_send_payload[destination_key] = raw_payload[source_key]
            
    # Menyisipkan Static Parameters
    for static_key, static_value in static_parameters.items():
        ready_to_send_payload[static_key] = static_value

    return ready_to_send_payload

# --- Blok ini hanya untuk testing lokal ---
if __name__ == "__main__":
    dummy_raw = {
        "id_record": 1,
        "nama_karyawan": "Boye",
        "kelas_karyawan": "Informatika",
        "jabatan": "Backend Developer",
        "data_internal_rahasia": "jangan_dikirim"
    }
    
    dummy_mappings = {
        "nama_karyawan": "full_name",
        "kelas_karyawan": "class",
        "jabatan": "role"
    }
    
    dummy_static = {
        "instansi_pengirim": "KOMINFO-BAKTI"
    }

    hasil = transform_payload(dummy_raw, dummy_mappings, dummy_static)
    print("Hasil Transformasi:", hasil)