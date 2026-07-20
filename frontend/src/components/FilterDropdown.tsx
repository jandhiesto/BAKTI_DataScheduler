import { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import clsx from 'clsx';

export type FilterType = 'scheduler' | 'log';

interface FilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  type: FilterType;
  onApply: (filters: FilterState) => void;
}

export interface FilterState {
  year: string;
  month: string;
  statuses: string[];
}

const YEARS = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];
const MONTHS = [
  { id: '1', name: 'Januari' },
  { id: '2', name: 'Februari' },
  { id: '3', name: 'Maret' },
  { id: '4', name: 'April' },
  { id: '5', name: 'Mei' },
  { id: '6', name: 'Juni' },
  { id: '7', name: 'Juli' },
  { id: '8', name: 'Agustus' },
  { id: '9', name: 'September' },
  { id: '10', name: 'Oktober' },
  { id: '11', name: 'November' },
  { id: '12', name: 'Desember' },
];

const SCHEDULER_STATUSES = [
  { id: 'aktif', label: 'Aktif' },
  { id: 'dijeda', label: 'Dijeda' },
];

const LOG_STATUSES = [
  { id: 'sukses', label: 'Sukses' },
  { id: 'gagal', label: 'Gagal' },
];

export default function FilterDropdown({ isOpen, onClose, type, onApply }: FilterDropdownProps) {
  const [filters, setFilters] = useState<FilterState>({
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString(),
    statuses: [],
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const statuses = type === 'scheduler' ? SCHEDULER_STATUSES : LOG_STATUSES;

  const toggleStatus = (id: string) => {
    setFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(id)
        ? prev.statuses.filter((s) => s !== id)
        : [...prev.statuses, id],
    }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl ring-1 ring-black/5 z-50 overflow-hidden flex flex-col"
    >
      <div className="p-4 space-y-4">
        {/* Periode */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Periode</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Tahun</label>
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg py-1.5 px-2 focus:ring-navy-500 focus:border-navy-500"
              >
                <option value="">Semua</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Bulan</label>
              <select
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg py-1.5 px-2 focus:ring-navy-500 focus:border-navy-500"
              >
                <option value="">Semua</option>
                {MONTHS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-200 -mx-4" />

        {/* Status */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</h4>
          <div className="flex flex-col gap-2">
            {statuses.map((status) => (
              <label 
                key={status.id}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className={clsx(
                  "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                  filters.statuses.includes(status.id) 
                    ? "bg-navy-600 border-navy-600" 
                    : "bg-white border-slate-300 group-hover:border-navy-400"
                )}>
                  {filters.statuses.includes(status.id) && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm text-slate-700">{status.label}</span>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={filters.statuses.includes(status.id)}
                  onChange={() => toggleStatus(status.id)}
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-md transition-colors"
        >
          Batal
        </button>
        <button
          onClick={handleApply}
          className="px-3 py-1.5 text-xs font-medium text-white bg-navy-600 hover:bg-navy-700 rounded-md transition-colors"
        >
          Terapkan
        </button>
      </div>
    </div>
  );
}
