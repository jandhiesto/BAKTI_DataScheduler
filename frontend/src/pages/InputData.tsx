import { useState, useRef} from 'react';
import { Plus, Trash2, Send, FileSpreadsheet, Download, X } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function InputData() {
  const [targetUrl, setTargetUrl] = useState('');
  const [headers, setHeaders] = useState<{ key: string, value: string }[]>([]);
  
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Headers Handlers
  const addHeader = () => setHeaders([...headers, { key: '', value: '' }]);
  const updateHeader = (idx: number, field: 'key' | 'value', val: string) => {
    const newHeaders = [...headers];
    newHeaders[idx][field] = val;
    setHeaders(newHeaders);
  };
  const removeHeader = (idx: number) => setHeaders(headers.filter((_, i) => i !== idx));

  // Excel Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
      
      if (rawData.length > 0) {
        // Ensure headers are strings
        const extractedCols = rawData[0].map(String);
        setColumns(extractedCols);
        setColWidths(new Array(extractedCols.length).fill(150));
        setColTypes(new Array(extractedCols.length).fill('string'));
        
        // Fill data rows to match column length
        const extractedData = rawData.slice(1).map(row => {
          const newRow = [...row];
          while (newRow.length < extractedCols.length) newRow.push('');
          return newRow.slice(0, extractedCols.length);
        });
        setData(extractedData);
      }
    };
    reader.readAsBinaryString(file);
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Table Handlers
  const updateColumnName = (colIndex: number, newName: string) => {
    const newCols = [...columns];
    newCols[colIndex] = newName;
    setColumns(newCols);
  };

  const removeColumn = (colIndex: number) => {
    setColumns(columns.filter((_, idx) => idx !== colIndex));
    setColWidths(colWidths.filter((_, idx) => idx !== colIndex));
    setColTypes(colTypes.filter((_, idx) => idx !== colIndex));
    setData(data.map(row => row.filter((_, idx) => idx !== colIndex)));
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...data];
    newData[rowIndex] = [...newData[rowIndex]];
    newData[rowIndex][colIndex] = value;
    setData(newData);
  };

  const removeRow = (rowIndex: number) => {
    setData(data.filter((_, idx) => idx !== rowIndex));
  };

  const handleAddRow = () => {
    if (columns.length === 0) {
      alert("Silakan tambah kolom terlebih dahulu sebelum menambahkan baris.");
      return;
    }
    const newRow = new Array(columns.length).fill('');
    setData([...data, newRow]);
  };

  const handleAddColumn = () => {
    if (!newColName.trim()) return;
    
    // Default value is what the user typed. If empty, we leave it empty.
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
    if (newWidth < 100) newWidth = 100; // minimum ~ 100px (4 letters + button space)
    
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
    
    // Combine headers and data
    const wsData = [columns, ...data];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, "export_data.xlsx");
  };

  const handleSubmit = () => {
    // Validasi Tipe Data sebelum submit
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      for (let colIndex = 0; colIndex < columns.length; colIndex++) {
        const type = colTypes[colIndex] || 'string';
        const val = data[rowIndex][colIndex];
        const colName = columns[colIndex];

        if (val !== '' && val !== null && val !== undefined) {
          if (type === 'integer') {
            if (!/^-?\d+$/.test(val)) {
              alert(`Gagal mengirim data. Pada baris ${rowIndex + 1}, kolom "${colName}" hanya memperbolehkan angka bulat.`);
              return;
            }
          } else if (type === 'float') {
            if (isNaN(Number(val)) || val.trim() === '') {
              alert(`Gagal mengirim data. Pada baris ${rowIndex + 1}, kolom "${colName}" hanya memperbolehkan angka.`);
              return;
            }
          }
        }
      }
    }

    // Construct JSON payload
    const payload = data.map(row => {
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

    const requestData = {
      targetUrl,
      headers: headers.filter(h => h.key.trim() !== ''),
      payload
    };

    console.log("=== PENGIRIMAN DATA (SIMULASI) ===");
    console.log(JSON.stringify(requestData, null, 2));
    alert("Data berhasil dikonversi ke JSON dan dicetak di Console!");
    
    // Kosongkan form dan tabel setelah berhasil
    setColumns([]);
    setColWidths([]);
    setColTypes([]);
    setData([]);
    setTargetUrl('');
    setHeaders([]);
  };

  return (
    <div className="space-y-6 max-w-full mx-auto pb-12">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Input Data Manual</h2>
            <p className="text-slate-500 mt-1">Unggah file Excel dan kirim data secara manual ke endpoint tujuan.</p>
          </div>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-3 bg-navy-600 text-white font-medium rounded-lg hover:bg-navy-700 transition-colors shadow-sm hover:cursor-pointer"
          >
            <Send className="w-5 h-5" />
            Kirim Data
          </button>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">URL Tujuan</label>
          <input
            type="url"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
            placeholder="https://api.tujuan.com/data"
          />
        </div>
        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-slate-700">Custom Headers</label>
            <button 
              onClick={addHeader}
              className="text-xs flex items-center gap-1 text-navy-600 hover:text-navy-700 font-medium hover:cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Tambah Header
            </button>
          </div>
          
          {headers.length === 0 && (
            <p className="text-xs text-slate-400 italic">Tidak ada custom header.</p>
          )}
          
          {headers.map((header, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Key"
                value={header.key}
                onChange={(e) => updateHeader(idx, 'key', e.target.value)}
                className="w-1/3 px-3 py-1.5 border border-slate-300 rounded-md sm:text-sm"
              />
              <input
                type="text"
                placeholder="Value"
                value={header.value}
                onChange={(e) => updateHeader(idx, 'value', e.target.value)}
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md sm:text-sm"
              />
              <button 
                onClick={() => removeHeader(idx)}
                className="p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-500 rounded transition-colors hover:cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-500 rounded-md" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col space-y-6">
        {/* Bottom: Table */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full min-h-[500px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Data Editor</h3>
            <div className="flex gap-3">
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium rounded-lg transition-colors border border-slate-300 hover:cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Upload Excel
              </button>
              <button 
                onClick={handleExportExcel}
                disabled={columns.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium rounded-lg transition-colors border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-600" />
                Ekspor Excel
              </button>
              <button 
                onClick={handleAddRow}
                disabled={columns.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-navy-50 text-navy-700 hover:bg-navy-100 font-medium rounded-lg transition-colors border border-navy-200 disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah Baris
              </button>
              <button 
                onClick={() => setIsAddColModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-navy-50 text-navy-700 hover:bg-navy-100 font-medium rounded-lg transition-colors border border-navy-200 hover:cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah Kolom
              </button>
            </div>
          </div>

          {columns.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 py-20">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">Belum ada data</p>
              <p className="text-slate-400 text-sm mt-1">Silakan upload file Excel untuk mulai mengedit data.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto border border-slate-200 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <th className="w-10 px-3 py-3 text-center text-xs font-medium text-slate-500 uppercase bg-slate-50 border-r border-slate-200 shadow-sm">
                      #
                    </th>
                    {columns.map((col, idx) => (
                      <th 
                        key={idx} 
                        className="px-3 py-2 border-r border-slate-200 bg-slate-50 shadow-sm relative group"
                        style={{ width: colWidths[idx] || 150, minWidth: 200 }}
                      >
                        <div className="flex items-center">
                          <input 
                            type="text" 
                            value={col}
                            onChange={(e) => updateColumnName(idx, e.target.value)}
                            className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-navy-500 focus:outline-none focus:ring-0 text-sm font-semibold text-slate-700 px-1 py-1 pr-7"
                          />
                          <button 
                            onClick={() => removeColumn(idx)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:bg-red-100 transition-opacity absolute right-2 top-2 hover:cursor-pointer text-red-500 rounded-md"
                            title="Hapus Kolom"
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                        <div 
                          onMouseDown={(e) => handleResizeStart(e, idx)}
                          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-navy-400 z-10"
                        />
                      </th>
                    ))}
                    <th className="w-12 bg-slate-50 shadow-sm"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {data.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-center text-xs text-slate-400 border-r border-slate-200 select-none">
                        {rowIndex + 1}
                      </td>
                      {row.map((cell, colIndex) => (
                        <td key={colIndex} className="px-0 py-0 border-r border-slate-200">
                          <input 
                            type="text"
                            value={cell}
                            onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                            className="w-full h-full px-4 py-2.5 text-sm bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-navy-500 outline-none"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center">
                        <button 
                          onClick={() => removeRow(rowIndex)}
                          className="p-1.5 text-slate-400 hover:bg-red-100 hover:cursor-pointer rounded transition-colors "
                          title="Hapus Baris"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Column Modal */}
      {isAddColModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Tambah Kolom Baru</h3>
              <button onClick={() => setIsAddColModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kolom</label>
                <input 
                  type="text" 
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                  placeholder="Misal: status_pembayaran"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Data</label>
                <select 
                  value={newColType}
                  onChange={(e) => {
                    setNewColType(e.target.value as any);
                    // Optionally set default value based on type selection
                    if (e.target.value === 'string') setNewColDefault('-');
                    else if (e.target.value === 'integer') setNewColDefault('-1');
                    else if (e.target.value === 'float') setNewColDefault('-1.0');
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                >
                  <option value="string">String (Teks)</option>
                  <option value="integer">Integer (Angka Bulat)</option>
                  <option value="float">Float (Angka Desimal)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Default Value (Opsional)</label>
                <input 
                  type="text" 
                  value={newColDefault}
                  onChange={(e) => setNewColDefault(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                  placeholder="Kosongkan jika tidak ada"
                />
              </div>
            </div>
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button 
                onClick={() => setIsAddColModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={handleAddColumn}
                disabled={!newColName.trim()}
                className="px-4 py-2 bg-navy-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-navy-700 disabled:opacity-50 hover:cursor-pointer"
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
