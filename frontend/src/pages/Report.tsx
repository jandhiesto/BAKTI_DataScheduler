import { useState } from 'react';
import { Download, FileText } from 'lucide-react';

export default function Report() {
  const [days, setDays] = useState(7);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      // Endpoint ini akan kita buat di backend setelah ini
      const response = await fetch(`http://localhost:8000/api/reports/download?days=${days}`);
      
      if (!response.ok) throw new Error("Gagal mengunduh laporan");

      // Mengubah response dari backend menjadi file PDF yang bisa diunduh browser
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laporan_Scheduler_${days}_Hari.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat mengunduh PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Laporan Sinkronisasi</h1>
              <p className="text-sm text-slate-500">Ekspor rekapitulasi data log ke format PDF</p>
            </div>
          </div>
        </div>

        <div className="flex items-end gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-slate-700 mb-2">Rentang Waktu</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value={7}>1 Minggu Terakhir</option>
              <option value={30}>1 Bulan Terakhir</option>
              <option value={90}>3 Bulan Terakhir</option>
            </select>
          </div>

          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            {isDownloading ? "Menyusun PDF..." : "Export to PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}