import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Send, Download, Save, X, Calendar, Clock, Play, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import clsx from 'clsx';

const DAYS_OPTIONS = [
  { id: 'mon', label: 'Senin' },
  { id: 'tue', label: 'Selasa' },
  { id: 'wed', label: 'Rabu' },
  { id: 'thu', label: 'Kamis' },
  { id: 'fri', label: 'Jumat' },
  { id: 'sat', label: 'Sabtu' },
  { id: 'sun', label: 'Minggu' },
];

export default function PassiveSchedulerDetail({ mode }: { mode: 'edit' | 'view' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isReadOnly = mode === 'view';

  // State
  const [appName, setAppName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [headers, setHeaders] = useState<{ key: string, value: string }[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [scheduledTime, setScheduledTime] = useState('');
  
  // Table State
  const [columns, setColumns] = useState<string[]>([]);
  const [colWidths, setColWidths] = useState<number[]>([]);
  const [colTypes, setColTypes] = useState<string[]>([]);
  const [data, setData] = useState<any[][]>([]);

  // Resize State
  const resizingCol = useRef<number | null>(null);
  const startX = useRef<number>(0);
  const startWidth = useRef<number>(0);

  // Add Column Modal State
  const [isAddColModalOpen, setIsAddColModalOpen] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<'string' | 'integer' | 'float'>('string');
  const [newColDefault, setNewColDefault] = useState('');

  useEffect(() => {
    if (id) {
      fetchData(id);
    }
  }, [id]);

  const fetchData = async (schedulerId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/passive-schedulers/${schedulerId}`);
      if (!res.ok) throw new Error('Data tidak ditemukan');
      const passiveData = await res.json();

      setAppName(passiveData.app_name);
      setTargetUrl(passiveData.target || '');
      setHeaders(passiveData.target_headers || []);
      setColumns(passiveData.columns || []);
      setColWidths(passiveData.col_widths || []);
      setColTypes(passiveData.col_types || []);
      setSelectedDays(passiveData.days || []);
      setScheduledTime(passiveData.time || '');

      // Parse payload to tabular data
      if (passiveData.payload && passiveData.payload.length > 0 && passiveData.columns) {
        const extractedData = passiveData.payload.map((rowObj: any) => {
          return passiveData.columns.map((col: string) => {
            const val = rowObj[col];
            return val !== undefined && val !== null ? String(val) : '';
          });
        });
        setData(extractedData);
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengambil data scheduler pasif');
      navigate('/passive-scheduler');
    }
  };

  // Headers Handlers
  const addHeader = () => { if (!isReadOnly) setHeaders([...headers, { key: '', value: '' }]); };
  const updateHeader = (idx: number, field: 'key' | 'value', val: string) => {
    if (isReadOnly) return;
    const newHeaders = [...headers];
    newHeaders[idx][field] = val;
    setHeaders(newHeaders);
  };
  const removeHeader = (idx: number) => {
    if (isReadOnly) return;
    setHeaders(headers.filter((_, i) => i !== idx));
  };

  // Table Handlers
  const updateColumnName = (colIndex: number, newName: string) => {
    if (isReadOnly) return;
    const newCols = [...columns];
    newCols[colIndex] = newName;
    setColumns(newCols);
  };

  const removeColumn = (colIndex: number) => {
    if (isReadOnly) return;
    setColumns(columns.filter((_, idx) => idx !== colIndex));
    setColWidths(colWidths.filter((_, idx) => idx !== colIndex));
    setColTypes(colTypes.filter((_, idx) => idx !== colIndex));
    setData(data.map(row => row.filter((_, idx) => idx !== colIndex)));
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    if (isReadOnly) return;
    const newData = [...data];
    newData[rowIndex] = [...newData[rowIndex]];
    newData[rowIndex][colIndex] = value;
    setData(newData);
  };

  const removeRow = (rowIndex: number) => {
    if (isReadOnly) return;
    setData(data.filter((_, idx) => idx !== rowIndex));
  };

  const handleAddRow = () => {
    if (isReadOnly) return;
    if (columns.length === 0) {
      alert("Kolom masih kosong.");
      return;
    }
    const newRow = new Array(columns.length).fill('');
    setData([...data, newRow]);
  };

  const handleAddColumn = () => {
    if (isReadOnly || !newColName.trim()) return;
    
    const defaultValue = newColDefault;

    setColumns([...columns, newColName]);
    setColWidths([...colWidths, 150]);
    setColTypes([...colTypes, newColType]);
    setData(data.map(row => [...row, defaultValue]));
    
    setIsAddColModalOpen(false);
    setNewColName('');
    setNewColType('string');
    setNewColDefault('');
  };

  const handleResizeStart = (e: React.MouseEvent, idx: number) => {
    if (isReadOnly) return;
    e.preventDefault();
    resizingCol.current = idx;
    startX.current = e.pageX;
    startWidth.current = colWidths[idx] || 150;
    
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (resizingCol.current === null) return;
    const diffX = e.pageX - startX.current;
    let newWidth = startWidth.current + diffX;
    if (newWidth < 100) newWidth = 100;
    
    setColWidths(prev => {
      const updated = [...prev];
      updated[resizingCol.current!] = newWidth;
      return updated;
    });
  };

  const handleResizeEnd = () => {
    resizingCol.current = null;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  const handleExportExcel = () => {
    if (columns.length === 0) return;
    const wsData = [columns, ...data];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `export_pasif_${appName}.xlsx`);
  };

  const toggleDay = (dayId: string) => {
    if (isReadOnly) return;
    setSelectedDays(prev => 
      prev.includes(dayId) ? [] : [dayId]
    );
  };

  const buildPayload = () => {
    return data.map(row => {
      const obj: any = {};
      columns.forEach((col, idx) => {
        const type = colTypes[idx] || 'string';
        let val = row[idx];
        if (type === 'integer') {
          const parsed = parseInt(val, 10);
          val = isNaN(parsed) ? (val === '' ? null : val) : parsed;
        } else if (type === 'float') {
          const parsed = parseFloat(val);
          val = isNaN(parsed) ? (val === '' ? null : val) : parsed;
        }
        obj[col] = val;
      });
      return obj;
    });
  };

  const handleSave = async () => {
    if (isReadOnly) return;
    const payloadData = buildPayload();

    const requestData = {
      target: targetUrl,
      target_headers: headers.filter(h => h.key.trim() !== ''),
      payload: payloadData,
      columns,
      col_widths: colWidths,
      col_types: colTypes,
      days: selectedDays,
      time: scheduledTime,
      status: (selectedDays.length > 0 && scheduledTime) ? "terjadwal" : "menunggu"
    };

    try {
      const res = await fetch(`http://localhost:8000/api/passive-schedulers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      if (!res.ok) throw new Error('Gagal menyimpan perubahan');
      alert('Perubahan berhasil disimpan');
      navigate('/passive-scheduler');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSendNow = async () => {
    if (isReadOnly) return;
    
    if (!targetUrl.trim()) {
      alert("Gagal mengirim: URL Tujuan tidak boleh kosong.");
      return;
    }
    
    if (data.length === 0) {
      alert("Gagal mengirim: Data tidak boleh kosong.");
      return;
    }

    // Auto-save first
    const payloadData = buildPayload();
    const requestData = {
      target: targetUrl,
      target_headers: headers.filter(h => h.key.trim() !== ''),
      payload: payloadData,
      columns,
      col_widths: colWidths,
      col_types: colTypes,
      days: selectedDays,
      time: scheduledTime,
      status: "menunggu"
    };

    try {
      // 1. Save state
      const resPut = await fetch(`http://localhost:8000/api/passive-schedulers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      if (!resPut.ok) throw new Error('Gagal menyimpan perubahan sebelum dikirim');

      // 2. Send Now
      const resSend = await fetch(`http://localhost:8000/api/passive-schedulers/${id}/send-now`, {
        method: 'POST'
      });
      
      if (!resSend.ok) {
        const errJson = await resSend.json();
        throw new Error(errJson.detail || 'Koneksi gagal saat mengirim data');
      }

      alert('Data berhasil dikirim dan scheduler pasif telah dihapus dari antrean.');
      navigate('/passive-scheduler');
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-full mx-auto pb-12">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {isReadOnly ? 'Detail Scheduler Pasif' : 'Edit Scheduler Pasif'}
          </h2>
          <p className="text-slate-500 mt-1">Pengirim: {appName}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/passive-scheduler')}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium hover:cursor-pointer"
          >
            Kembali
          </button>
          {!isReadOnly && (
            <>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium hover:cursor-pointer"
              >
                <Save className="w-4 h-4" /> Simpan
              </button>
              <button
                onClick={handleSendNow}
                className="flex items-center gap-2 px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors font-medium hover:cursor-pointer"
              >
                <Play className="w-4 h-4" /> Kirim Langsung
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            Konfigurasi Tujuan
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">URL Tujuan</label>
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                disabled={isReadOnly}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-navy-500 focus:border-navy-500 sm:text-sm disabled:bg-slate-100"
                placeholder="https://api.tujuan.com/data"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-700">Headers Tujuan</label>
                {!isReadOnly && (
                  <button type="button" onClick={addHeader} className="text-xs text-navy-600 font-medium hover:text-navy-700 hover:cursor-pointer">
                    + Tambah Header
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {headers.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Tidak ada header kustom.</p>
                ) : (
                  headers.map((header, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Key"
                        value={header.key}
                        onChange={(e) => updateHeader(idx, 'key', e.target.value)}
                        disabled={isReadOnly}
                        className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md text-sm disabled:bg-slate-100"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={header.value}
                        onChange={(e) => updateHeader(idx, 'value', e.target.value)}
                        disabled={isReadOnly}
                        className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md text-sm disabled:bg-slate-100"
                      />
                      {!isReadOnly && (
                        <button type="button" onClick={() => removeHeader(idx)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md hover:cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-navy-600" />
            Penjadwalan Otomatis (Opsional)
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Jika hari dan jam diatur, data ini akan dikirim secara otomatis pada jadwal tersebut dan langsung dihapus.
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Hari Eksekusi</label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OPTIONS.map((day) => {
                  const isSelected = selectedDays.includes(day.id);
                  const isDisabled = isReadOnly || (!isSelected && selectedDays.length > 0);
                  return (
                    <label
                      key={day.id}
                      className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                        isSelected 
                          ? "bg-navy-600 text-white border-navy-600" 
                          : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50",
                        isDisabled ? "opacity-75 cursor-not-allowed" : "hover:cursor-pointer"
                      )}
                    >
                      <input 
                        type="checkbox"
                        disabled={isDisabled}
                        checked={isSelected}
                        onChange={() => toggleDay(day.id)}
                        className={clsx(
                          "rounded focus:ring-navy-500 border-slate-300",
                          isSelected ? "text-navy-600" : "text-slate-400"
                        )}
                      />
                      {day.label}
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Jam Eksekusi</label>
              <div className="relative max-w-[150px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="time"
                  value={scheduledTime}
                  disabled={isReadOnly}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-navy-500 focus:border-navy-500 sm:text-sm disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spreadsheet View */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800">Preview Data ({data.length} Baris)</h3>
          <div className="flex gap-2">
            {!isReadOnly && (
              <button
                onClick={() => setIsAddColModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium hover:cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tambah Kolom
              </button>
            )}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 border border-navy-200 text-navy-700 bg-navy-50 rounded-lg hover:bg-navy-100 transition-colors text-sm font-medium hover:cursor-pointer"
            >
              <Download className="w-4 h-4" /> Ekspor Excel
            </button>
          </div>
        </div>

        {columns.length > 0 ? (
          <div className="border border-slate-300 rounded-lg overflow-x-auto overflow-y-auto max-h-[500px]">
            <table className="w-full text-sm text-left border-collapse min-w-max">
              <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-3 py-2 w-12 text-center border-r border-slate-300 text-slate-500">#</th>
                  {columns.map((col, colIndex) => (
                    <th 
                      key={colIndex} 
                      className="px-2 py-2 border-r border-slate-300 font-medium text-slate-700 relative group bg-slate-100"
                      style={{ width: colWidths[colIndex], minWidth: colWidths[colIndex] }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={col}
                          onChange={(e) => updateColumnName(colIndex, e.target.value)}
                          disabled={isReadOnly}
                          className="w-full bg-transparent border-transparent focus:border-navy-500 focus:ring-1 focus:ring-navy-500 rounded px-1 disabled:opacity-100"
                        />
                        {!isReadOnly && (
                          <button 
                            onClick={() => removeColumn(colIndex)}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity p-1 rounded hover:bg-red-50 hover:cursor-pointer"
                            title="Hapus Kolom"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      
                      {/* Resize handle */}
                      {!isReadOnly && (
                        <div
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-navy-400/50"
                          onMouseDown={(e) => handleResizeStart(e, colIndex)}
                        />
                      )}
                    </th>
                  ))}
                  {!isReadOnly && <th className="px-3 py-2 w-16 bg-slate-100"></th>}
                </tr>
              </thead>
              <tbody>
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-slate-50/50 border-b border-slate-200 last:border-0">
                    <td className="px-3 py-2 text-center border-r border-slate-200 text-slate-400 font-medium">
                      {rowIndex + 1}
                    </td>
                    {row.map((cell, colIndex) => (
                      <td key={colIndex} className="border-r border-slate-200 p-0 relative">
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                          disabled={isReadOnly}
                          className="w-full h-full min-h-[36px] px-3 py-1.5 border-none focus:ring-2 focus:ring-inset focus:ring-navy-500 bg-transparent disabled:opacity-100"
                        />
                      </td>
                    ))}
                    {!isReadOnly && (
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => removeRow(rowIndex)}
                          className="text-red-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors hover:cursor-pointer"
                          title="Hapus Baris"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {!isReadOnly && data.length > 0 && (
                  <tr>
                    <td colSpan={columns.length + 2} className="p-2">
                      <button
                        onClick={handleAddRow}
                        className="flex items-center gap-1 text-sm text-navy-600 font-medium hover:text-navy-800 transition-colors hover:cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Tambah Baris
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
            <p className="text-slate-500 font-medium">Tidak ada data yang tersedia.</p>
          </div>
        )}
      </div>

      {/* Modal Tambah Kolom */}
      {isAddColModalOpen && !isReadOnly && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">Tambah Kolom Baru</h3>
              <button 
                onClick={() => setIsAddColModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors hover:cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kolom</label>
                <input
                  type="text"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                  placeholder="Misal: Nomor Telepon"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Data</label>
                <select
                  value={newColType}
                  onChange={(e) => setNewColType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                >
                  <option value="string">Teks (String)</option>
                  <option value="integer">Angka Bulat (Integer)</option>
                  <option value="float">Angka Desimal (Float)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nilai Default (Opsional)</label>
                <input
                  type="text"
                  value={newColDefault}
                  onChange={(e) => setNewColDefault(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                  placeholder="Isi untuk nilai awal..."
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setIsAddColModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors hover:cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleAddColumn}
                disabled={!newColName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-navy-600 hover:bg-navy-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm hover:cursor-pointer"
              >
                Tambah
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
