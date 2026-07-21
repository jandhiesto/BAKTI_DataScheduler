import { useState, useEffect } from 'react';
import { Search, Eye, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

export default function PassiveScheduler() {
  const [schedulers, setSchedulers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [schedulerToDelete, setSchedulerToDelete] = useState<any>(null);
  const navigate = useNavigate();

  const fetchSchedulers = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/passive-schedulers/');
      const data = await res.json();
      setSchedulers(data);
    } catch (err) {
      console.error('Failed to fetch passive schedulers', err);
    }
  };

  useEffect(() => {
    fetchSchedulers();
  }, []);

  const formatDateTimeId = (dateStr: string) => {
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

  const handleDelete = async () => {
    if (!schedulerToDelete) return;
    try {
      await fetch(`http://localhost:8000/api/passive-schedulers/${schedulerToDelete.id}`, {
        method: 'DELETE'
      });
      fetchSchedulers();
    } catch (err) {
      console.error('Failed to delete', err);
    } finally {
      setSchedulerToDelete(null);
    }
  };

  const filteredSchedulers = schedulers.filter(s => {
    return s.app_name.toLowerCase().includes(searchQuery.toLowerCase());
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
            placeholder="Cari berdasarkan nama pengirim..."
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Waktu Diterima
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Nama Aplikasi Pengirim
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  URL Sumber (Webhook)
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
              {filteredSchedulers.map((scheduler) => (
                <tr key={scheduler.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {formatDateTimeId(scheduler.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-semibold">
                    {scheduler.app_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <span className="truncate max-w-[200px] block" title={scheduler.source_url}>
                      {scheduler.source_url}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={clsx(
                      "px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full",
                      scheduler.status === 'terjadwal' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-amber-100 text-amber-800'
                    )}>
                      {scheduler.status === 'terjadwal' ? 'Terjadwal' : 'Menunggu'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/passive-scheduler/view/${scheduler.id}`)}
                        className="p-2 text-slate-400 hover:text-navy-600 hover:bg-navy-50 rounded-lg transition-colors hover:cursor-pointer"
                        title="Lihat Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => navigate(`/passive-scheduler/edit/${scheduler.id}`)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors hover:cursor-pointer"
                        title="Edit Scheduler"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setSchedulerToDelete(scheduler)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors hover:cursor-pointer"
                        title="Hapus Scheduler"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredSchedulers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Tidak ada data scheduler pasif yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDeleteModal 
        isOpen={!!schedulerToDelete}
        onClose={() => setSchedulerToDelete(null)}
        onConfirm={handleDelete}
        schedulerName={schedulerToDelete?.app_name || ''}
      />
    </div>
  );
}
