import { useState, useEffect } from 'react';
import { Filter, Eye,Search } from 'lucide-react';
import clsx from 'clsx';
import FilterDropdown from '../components/FilterDropdown';
import LogDetailModal from '../components/LogDetailModal';

import type { FilterState } from '../components/FilterDropdown';

export default function LogHistory() {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterConfig, setFilterConfig] = useState<FilterState | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/logs');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch logs', err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatDateTimeId = (dateStr: string) => {
    // Append 'Z' to ensure it's treated as UTC if the backend sends a naive string
    const utcDateStr = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`;
    const d = new Date(utcDateStr);
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };
  
  const handleOpenDetail = (log: any) => {
    setSelectedLog({
      ...log,
      time: formatDateTimeId(log.created_at)
    });
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = true;
    if (filterConfig) {
      if (filterConfig.statuses.length > 0) {
        // Map "sukses" from frontend filter to "berhasil" from backend
        const mappedStatuses = filterConfig.statuses.map(s => s === 'sukses' ? 'berhasil' : s);
        matchesFilter = matchesFilter && mappedStatuses.includes(log.status);
      }
      if (filterConfig.year) {
        const utcDateStr = log.created_at.endsWith('Z') ? log.created_at : `${log.created_at}Z`;
        const date = new Date(utcDateStr);
        matchesFilter = matchesFilter && (date.getFullYear().toString() === filterConfig.year);
      }
      if (filterConfig.month) {
        const utcDateStr = log.created_at.endsWith('Z') ? log.created_at : `${log.created_at}Z`;
        const date = new Date(utcDateStr);
        matchesFilter = matchesFilter && ((date.getMonth() + 1).toString() === filterConfig.month);
      }
    }

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
            placeholder="Cari scheduler..."
          />
        </div>
        
        <div className="relative flex items-center gap-3 w-full sm:w-auto">
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors hover:cursor-pointer"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <FilterDropdown 
              isOpen={isFilterOpen}
              onClose={() => setIsFilterOpen(false)}
              type="log"
              onApply={(f) => setFilterConfig(f)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Waktu
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Nama Scheduler
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Pemicu
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  URL Sumber
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  URL Tujuan
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {formatDateTimeId(log.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {log.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <span className={clsx(
                      "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md",
                      log.trigger === 'Scheduler' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    )}>
                      {log.trigger}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {log.trigger === 'Manual' ? (
                      <span className="text-slate-400 italic">Tidak ada (Manual)</span>
                    ) : (
                      <span className="truncate max-w-[150px] block" title={log.source}>
                        {log.source}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <span className="truncate max-w-[150px] block" title={log.target}>
                      {log.target}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={clsx(
                      "px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full",
                      log.status === 'berhasil' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-red-100 text-red-800'
                    )}>
                      {log.status === 'berhasil' ? 'Berhasil' : 'Gagal'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleOpenDetail(log)}
                      className="flex items-center gap-1 text-navy-600 hover:text-navy-800 font-medium transition-colors ml-auto hover:cursor-pointer"
                    >
                      <Eye className="w-4 h-4" /> Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <LogDetailModal 
        isOpen={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        logData={selectedLog}
      />
    </div>
  );
}
