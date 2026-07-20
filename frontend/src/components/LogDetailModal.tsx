import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import clsx from 'clsx';

interface LogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  logData: any; // We'll type this properly later
}

export default function LogDetailModal({ isOpen, onClose, logData }: LogDetailModalProps) {
  if (!isOpen || !logData) return null;

  const isSuccess = logData.status === 'berhasil';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            {isSuccess ? (
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            )}
            <h2 className="text-lg font-bold text-slate-800">Detail Eksekusi</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors hover:cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* General Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nama Scheduler</label>
              <p className="text-slate-900 font-medium">{logData.name}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Waktu Eksekusi</label>
              <p className="text-slate-700">{logData.time}</p>
            </div>
          </div>

          <div className="h-px bg-slate-200" />

          {/* URLs */}
          <div className="space-y-4">
            {logData.trigger !== 'Manual' && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">URL Sumber</label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 break-all">
                  {logData.source}
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">URL Tujuan</label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 break-all">
                {logData.target}
              </div>
            </div>
          </div>

          {/* System Message Log */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Info className="w-3 h-3" /> Log Pesan Sistem
            </label>
            <div className={clsx(
              "p-4 rounded-xl text-sm font-mono whitespace-pre-wrap overflow-x-auto border",
              isSuccess 
                ? "bg-slate-900 text-emerald-400 border-slate-800" 
                : "bg-red-50 text-red-700 border-red-200"
            )}>
              {logData.message || (isSuccess ? "[BERHASIL] Eksekusi berhasil dijalankan tanpa kendala." : "[ERROR] Terjadi kesalahan sistem.")}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors hover:cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
