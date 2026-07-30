import { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Database, Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';

export type SchedulerMode = 'add' | 'edit' | 'view';

interface SchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: SchedulerMode;
  initialData?: any;
  onSave?: () => void;
}

const DAYS = [
  { id: 'mon', label: 'Senin' },
  { id: 'tue', label: 'Selasa' },
  { id: 'wed', label: 'Rabu' },
  { id: 'thu', label: 'Kamis' },
  { id: 'fri', label: 'Jumat' },
  { id: 'sat', label: 'Sabtu' },
  { id: 'sun', label: 'Minggu' },
];

interface HeaderField {
  key: string;
  value: string;
}

export default function SchedulerModal({ isOpen, onClose, mode, initialData, onSave }: SchedulerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sourceUrl: '',
    sourceHeaders: [] as HeaderField[],
    targetUrl: '',
    targetHeaders: [] as HeaderField[],
    days: [] as string[],
    time: '',
  });

  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');

  // Populate data when editing or viewing
  useEffect(() => {
    if (isOpen && (mode === 'edit' || mode === 'view') && initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        sourceUrl: initialData.source || '',
        sourceHeaders: initialData.source_headers || [],
        targetUrl: initialData.target || '',
        targetHeaders: initialData.target_headers || [],
        days: initialData.days || ['mon', 'tue', 'wed', 'thu', 'fri'],
        time: initialData.time || '09:00',
      });
      setConnectionStatus('idle');
    } else if (isOpen && mode === 'add') {
      // Reset form
      setFormData({
        name: '',
        description: '',
        sourceUrl: '',
        sourceHeaders: [],
        targetUrl: '',
        targetHeaders: [],
        days: [],
        time: '',
      });
      setConnectionStatus('idle');
    }
  }, [isOpen, mode, initialData]);

  if (!isOpen) return null;

  const isReadOnly = mode === 'view';
  const title = mode === 'add' ? 'Tambah Scheduler Baru' : mode === 'edit' ? 'Edit Scheduler' : 'Detail Scheduler';
  const submitText = mode === 'add' ? 'Buat Scheduler' : 'Simpan Perubahan';

  const handleDayToggle = (dayId: string) => {
    if (isReadOnly) return;
    setFormData((prev) => ({
      ...prev,
      days: prev.days.includes(dayId)
        ? prev.days.filter((d) => d !== dayId)
        : [...prev.days, dayId],
    }));
  };

  const handleHeaderChange = (type: 'source' | 'target', index: number, field: 'key' | 'value', val: string) => {
    if (isReadOnly) return;
    setFormData((prev) => {
      const targetList = type === 'source' ? [...prev.sourceHeaders] : [...prev.targetHeaders];
      targetList[index] = { ...targetList[index], [field]: val };
      return {
        ...prev,
        [type === 'source' ? 'sourceHeaders' : 'targetHeaders']: targetList
      };
    });
  };

  const addHeader = (type: 'source' | 'target') => {
    if (isReadOnly) return;
    setFormData((prev) => ({
      ...prev,
      [type === 'source' ? 'sourceHeaders' : 'targetHeaders']: [
        ...(type === 'source' ? prev.sourceHeaders : prev.targetHeaders),
        { key: '', value: '' }
      ]
    }));
  };

  const removeHeader = (type: 'source' | 'target', index: number) => {
    if (isReadOnly) return;
    setFormData((prev) => {
      const targetList = type === 'source' ? [...prev.sourceHeaders] : [...prev.targetHeaders];
      targetList.splice(index, 1);
      return {
        ...prev,
        [type === 'source' ? 'sourceHeaders' : 'targetHeaders']: targetList
      };
    });
  };

  const handleCheckConnection = async () => {
    if (!formData.sourceUrl || !formData.targetUrl) {
      alert("Harap isi URL Sumber dan URL Tujuan terlebih dahulu.");
      return;
    }
    setConnectionStatus('testing');
    
    try {
      const payload = {
        url: formData.sourceUrl,
        headers: formData.sourceHeaders
      };
      
      const res = await fetch('http://localhost:8000/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Koneksi gagal');
      
      setConnectionStatus('success');
    } catch (err) {
      console.error(err);
      setConnectionStatus('failed');
      alert('Koneksi ke URL Sumber gagal.');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.sourceUrl.trim() || !formData.targetUrl.trim() || !formData.time.trim()) {
      alert("Harap isi Nama Scheduler, URL Sumber, URL Tujuan, dan Jam Eksekusi. Kolom ini tidak boleh kosong.");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        source: formData.sourceUrl,
        source_headers: formData.sourceHeaders,
        target: formData.targetUrl,
        target_headers: formData.targetHeaders,
        days: formData.days,
        time: formData.time,
        status: initialData?.status || 'aktif'
      };

      const url = mode === 'add' 
        ? 'http://localhost:8000/api/schedulers/'
        : `http://localhost:8000/api/schedulers/${initialData.id}`;
      
      const method = mode === 'add' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('API request failed');
      
      if (onSave) onSave();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan data');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors hover:cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Section: Informasi Umum */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Scheduler</label>
              <input
                type="text"
                disabled={isReadOnly}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-navy-500 focus:border-navy-500 sm:text-sm disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="Contoh: Sinkronisasi Data Pegawai"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
              <textarea
                disabled={isReadOnly}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-navy-500 focus:border-navy-500 sm:text-sm disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="Jelaskan kegunaan scheduler ini..."
              />
            </div>
          </div>

          {/* Section: Konfigurasi Sumber (Source) */}
          <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
            <h3 className="font-semibold text-slate-800 text-sm">Konfigurasi Sumber (Source)</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">URL Sumber</label>
              <input
                type="url"
                disabled={isReadOnly}
                value={formData.sourceUrl}
                onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-navy-500 focus:border-navy-500 sm:text-sm disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="https://api.sumber.com/data"
              />
            </div>
            
            {/* Source Headers */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-slate-700">Custom Headers (Opsional)</label>
                {!isReadOnly && (
                  <button 
                    type="button" 
                    onClick={() => addHeader('source')}
                    className="text-xs flex items-center gap-1 text-navy-600 hover:text-navy-700 font-medium hover:cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Tambah Header
                  </button>
                )}
              </div>
              
              {formData.sourceHeaders.length === 0 && (
                <p className="text-xs text-slate-400 italic">Tidak ada header kustom.</p>
              )}
              
              {formData.sourceHeaders.map((header, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    placeholder="Key (e.g. Authorization)"
                    value={header.key}
                    onChange={(e) => handleHeaderChange('source', idx, 'key', e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-navy-500 focus:border-navy-500 sm:text-sm disabled:bg-slate-100 disabled:text-slate-500"
                  />
                  <input
                    type="text"
                    disabled={isReadOnly}
                    placeholder="Value (e.g. Bearer token...)"
                    value={header.value}
                    onChange={(e) => handleHeaderChange('source', idx, 'value', e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-navy-500 focus:border-navy-500 sm:text-sm disabled:bg-slate-100 disabled:text-slate-500"
                  />
                  {!isReadOnly && (
                    <button 
                      type="button" 
                      onClick={() => removeHeader('source', idx)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors hover:cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section: Konfigurasi Tujuan (Target) */}
          <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
            <h3 className="font-semibold text-slate-800 text-sm">Konfigurasi Tujuan (Target)</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">URL Tujuan</label>
              <input
                type="url"
                disabled={isReadOnly}
                value={formData.targetUrl}
                onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-navy-500 focus:border-navy-500 sm:text-sm disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="https://api.tujuan.com/receive"
              />
            </div>

            {/* Target Headers */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-slate-700">Custom Headers (Opsional)</label>
                {!isReadOnly && (
                  <button 
                    type="button" 
                    onClick={() => addHeader('target')}
                    className="text-xs flex items-center gap-1 text-navy-600 hover:text-navy-700 font-medium hover:cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Tambah Header
                  </button>
                )}
              </div>
              
              {formData.targetHeaders.length === 0 && (
                <p className="text-xs text-slate-400 italic">Tidak ada header kustom.</p>
              )}
              
              {formData.targetHeaders.map((header, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    placeholder="Key (e.g. X-API-Key)"
                    value={header.key}
                    onChange={(e) => handleHeaderChange('target', idx, 'key', e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-navy-500 focus:border-navy-500 sm:text-sm disabled:bg-slate-100 disabled:text-slate-500"
                  />
                  <input
                    type="text"
                    disabled={isReadOnly}
                    placeholder="Value (e.g. secret-key...)"
                    value={header.value}
                    onChange={(e) => handleHeaderChange('target', idx, 'value', e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-navy-500 focus:border-navy-500 sm:text-sm disabled:bg-slate-100 disabled:text-slate-500"
                  />
                  {!isReadOnly && (
                    <button 
                      type="button" 
                      onClick={() => removeHeader('target', idx)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors hover:cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section: Waktu Eksekusi */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-4">
            <h3 className="font-semibold text-slate-800 text-sm">Waktu Eksekusi</h3>
            
            {/* Hari */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Hari</label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <label 
                    key={day.id} 
                    className={clsx(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer select-none transition-colors",
                      formData.days.includes(day.id) 
                        ? "bg-navy-50 border-navy-500 text-navy-700 font-medium" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                      isReadOnly && "opacity-70 cursor-not-allowed"
                    )}
                  >
                    <input
                      type="checkbox"
                      disabled={isReadOnly}
                      className="hidden"
                      checked={formData.days.includes(day.id)}
                      onChange={() => handleDayToggle(day.id)}
                    />
                    <div className={clsx(
                      "w-4 h-4 rounded flex items-center justify-center border",
                      formData.days.includes(day.id) ? "bg-navy-600 border-navy-600" : "bg-white border-slate-300"
                    )}>
                      {formData.days.includes(day.id) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    {day.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Jam & Menit */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Jam Eksekusi</label>
              <input
                type="time"
                disabled={isReadOnly}
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-navy-500 focus:border-navy-500 sm:text-sm disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div>
            {!isReadOnly && (
              <button 
                type="button"
                onClick={handleCheckConnection}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:cursor-pointer",
                  connectionStatus === 'success' ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" :
                  connectionStatus === 'failed' ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" :
                  "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                )}
              >
                {connectionStatus === 'testing' ? (
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" />
                ) : connectionStatus === 'success' ? (
                  <Check className="w-4 h-4" />
                ) : connectionStatus === 'failed' ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                Cek Koneksi
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors hover:cursor-pointer"
            >
              {isReadOnly ? 'Tutup' : 'Batal'}
            </button>
            
            {!isReadOnly && (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-navy-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-navy-700 transition-colors shadow-sm hover:cursor-pointer"
              >
                {submitText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
