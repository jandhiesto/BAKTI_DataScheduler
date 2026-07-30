import { useState, useEffect } from 'react';
import { Filter, Eye, Search } from 'lucide-react';
import clsx from 'clsx';
import FilterDropdown from '../components/FilterDropdown';
import LogDetailModal from '../components/LogDetailModal';

import type { FilterState } from '../components/FilterDropdown';

export default function LogHistory() {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  
  const [filterConfig, setFilterConfig] = useState<FilterState | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalData, setTotalData] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      if (appliedSearchTerm) {
        queryParams.append('search', appliedSearchTerm);
      }

      if (filterConfig) {
        if (filterConfig.statuses.length > 0) {
          queryParams.append('statuses', filterConfig.statuses.join(','));
        }
        if (filterConfig.year) {
          queryParams.append('year', filterConfig.year);
        }
        if (filterConfig.month) {
          queryParams.append('month', filterConfig.month);
        }
      }

      const res = await fetch(`http://localhost:8000/api/logs?${queryParams.toString()}`);
      const data = await res.json();
      
      setLogs(data.data || []);
      setTotalData(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('Failed to fetch logs', err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit, appliedSearchTerm, filterConfig]);

  const handleSearchClick = () => {
    setAppliedSearchTerm(searchTerm);
    setPage(1); // Reset to first page on new search
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

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

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      buttons.push(
        <button key={1} onClick={() => setPage(1)} className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50 text-sm">
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(<span key="dots-start" className="px-2 text-slate-400">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button 
          key={i} 
          onClick={() => setPage(i)}
          className={clsx(
            "px-3 py-1 border rounded text-sm transition-colors",
            i === page 
              ? "bg-navy-600 text-white border-navy-600" 
              : "border-slate-300 hover:bg-slate-50 text-slate-700"
          )}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="dots-end" className="px-2 text-slate-400">...</span>);
      }
      buttons.push(
        <button key={totalPages} onClick={() => setPage(totalPages)} className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50 text-sm">
          {totalPages}
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="space-y-6">
      {/* Top Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-1 max-w-md gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
            placeholder="Ketik kata kunci pencarian..."
          />
          <button
            onClick={handleSearchClick}
            className="flex items-center justify-center p-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors hover: cursor-pointer"
            title="Cari"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
        
        <div className="relative flex items-center gap-3 w-full sm:w-auto">
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors hover:cursor-pointer"
            >
              <Filter className="w-4 h-4" />
              Filter
              {(filterConfig?.statuses.length || filterConfig?.month || filterConfig?.year) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>

            {isFilterOpen && (
              <FilterDropdown 
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                type="log"
                onApply={(config) => {
                  setFilterConfig(config);
                  setPage(1); // Reset to first page when filtering
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Waktu Eksekusi
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Nama Scheduler
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Pemicu
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  URL Sumber
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  URL Tujuan
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {logs.length > 0 ? (
                logs.map((log) => (
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
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada log riwayat ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Tampilkan</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1); // Reset page on limit change
              }}
              className="border border-slate-300 rounded px-2 py-1 text-sm text-slate-700 bg-white hover:cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-slate-600">dari {totalData} data</span>
          </div>

          <div className="flex items-center gap-2 hover:cursor-pointer">
            {renderPaginationButtons()}
          </div>
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
