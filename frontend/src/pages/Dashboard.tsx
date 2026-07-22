import { useState, useEffect } from 'react';
import { Activity, Clock, CheckCircle2, XCircle, Calendar, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

interface DashboardStats {
  total_active: number;
  total_passive: number;
  total_success: number;
  total_failed: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    total_active: 0,
    total_passive: 0,
    total_success: 0,
    total_failed: 0
  });
  
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [upcomingSchedulers, setUpcomingSchedulers] = useState<any[]>([]);
  
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');

  const months = [
    { value: 'all', label: 'Semua Bulan' },
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
  ];

  const years = ['all', 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];

  const fetchDashboardData = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (selectedMonth !== 'all') queryParams.append('month', selectedMonth.toString());
      if (selectedYear !== 'all') queryParams.append('year', selectedYear.toString());
      
      const statsRes = await fetch(`http://localhost:8000/api/dashboard/stats?${queryParams.toString()}`);
      const statsData = await statsRes.json();
      setStats(statsData);

      const logsRes = await fetch('http://localhost:8000/api/dashboard/recent-logs');
      const logsData = await logsRes.json();
      setRecentLogs(logsData);

      const upcomingRes = await fetch('http://localhost:8000/api/dashboard/upcoming-schedulers');
      const upcomingData = await upcomingRes.json();
      setUpcomingSchedulers(upcomingData);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth, selectedYear]);

  const formatDateTime = (dateStr: string) => {
    const utcDateStr = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`;
    const d = new Date(utcDateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  const getLogTitle = () => {
    if (selectedMonth === 'all' && selectedYear === 'all') {
      return '(Semua Waktu)';
    } else if (selectedMonth === 'all') {
      return `(Tahun ${selectedYear})`;
    } else if (selectedYear === 'all') {
      const monthLabel = months.find(m => m.value === selectedMonth)?.label;
      return `(${monthLabel})`;
    } else {
      const monthLabel = months.find(m => m.value === selectedMonth)?.label;
      return `(${monthLabel} ${selectedYear})`;
    }
  };

  return (
    <div className="space-y-6 max-w-full mx-auto pb-12">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-slate-500 mt-1">Ringkasan aktivitas sinkronisasi data</p>
        </div>
        <div className="flex items-center">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors font-medium text-sm shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Muat Ulang
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Scheduler Aktif</p>
                <h3 className="text-2xl font-bold text-slate-800">{stats.total_active}</h3>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Antrean Scheduler Pasif</p>
                <h3 className="text-2xl font-bold text-slate-800">{stats.total_passive}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Execution Metrics with Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h3 className="font-bold text-slate-800 text-lg">Riwayat Eksekusi</h3>
            <div className="flex items-center gap-3">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-navy-500 focus:border-navy-500 text-sm"
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-navy-500 focus:border-navy-500 text-sm"
              >
                <option value="all">Semua Tahun</option>
                {years.filter(y => y !== 'all').map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-800">Berhasil {getLogTitle()}</p>
                <h3 className="text-xl font-bold text-emerald-900">{stats.total_success}</h3>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-red-800">Gagal {getLogTitle()}</p>
                <h3 className="text-xl font-bold text-red-900">{stats.total_failed}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            Aktivitas Terbaru
          </h3>
          <div className="space-y-4">
            {recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div key={log.id} className="flex gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="mt-1">
                    {log.status === 'berhasil' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{log.name}</h4>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{log.message}</p>
                    <p className="text-xs text-slate-400 mt-2 font-medium">
                      {formatDateTime(log.created_at)} • Pemicu: {log.trigger}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center py-4">Belum ada log aktivitas.</p>
            )}
          </div>
        </div>

        {/* Upcoming Executions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-navy-600" />
            Jadwal Eksekusi Hari Ini (Aktif)
          </h3>
          <div className="space-y-4">
            {upcomingSchedulers.length > 0 ? (
              upcomingSchedulers.map((scheduler) => (
                <div key={scheduler.id} className="flex items-center justify-between p-4 rounded-lg bg-blue-50/50 border border-blue-100">
                  <div>
                    <h4 className="font-semibold text-slate-800">{scheduler.name}</h4>
                    <p className="text-sm text-slate-500 mt-1">{scheduler.source}</p>
                  </div>
                  <div className="flex items-center gap-2 text-navy-700 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200 font-semibold text-sm">
                    <Clock className="w-4 h-4" />
                    {scheduler.time ? scheduler.time : 'Sepanjang Hari'}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500">Tidak ada scheduler aktif yang dijadwalkan berjalan hari ini.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
