import { useState } from 'react';
import { Search, Plus, MoreVertical, Eye, Edit2, Trash2, Filter } from 'lucide-react';
import clsx from 'clsx';
import SchedulerModal, { type SchedulerMode } from '../components/SchedulerModal';
import FilterDropdown from '../components/FilterDropdown';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

const dummySchedulers = [
  { id: 1, name: 'Sync Employee Data', source: 'https://api.hr.system/employees', target: 'https://api.bakti.go.id/users', status: 'aktif' },
  { id: 2, name: 'Pull Monthly Report', source: 'https://api.finance/reports', target: 'https://api.bakti.go.id/reports', status: 'dijeda' },
];

export default function Scheduler() {
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<SchedulerMode>('add');
  const [selectedScheduler, setSelectedScheduler] = useState<any>(null);

  // Delete Modal state
  const [schedulerToDelete, setSchedulerToDelete] = useState<any>(null);

  const openModal = (mode: SchedulerMode, scheduler?: any) => {
    setModalMode(mode);
    setSelectedScheduler(scheduler || null);
    setIsModalOpen(true);
    setActiveDropdown(null); // Close dropdown if open
  };

  const confirmDelete = (scheduler: any) => {
    setSchedulerToDelete(scheduler);
    setActiveDropdown(null);
  };

  const handleDelete = () => {
    console.log('Deleting scheduler:', schedulerToDelete?.id);
    // TODO: Connect to API
    setSchedulerToDelete(null);
  };

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
              type="scheduler"
              onApply={(f) => console.log('Apply', f)}
            />
          </div>
          <button 
            onClick={() => openModal('add')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-navy-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-navy-700 transition-colors shadow-sm hover:cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Baru
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
        <div className="overflow-visible">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Nama Scheduler
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
                <th scope="col" className="relative px-6 py-3 ">
                  <span className="sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {dummySchedulers.map((scheduler) => (
                <tr key={scheduler.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {scheduler.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <span className="truncate max-w-[200px] block" title={scheduler.source}>
                      {scheduler.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <span className="truncate max-w-[200px] block" title={scheduler.target}>
                      {scheduler.target}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={clsx(
                      "px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full",
                      scheduler.status === 'aktif' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    )}>
                      {scheduler.status === 'aktif' ? 'Aktif' : 'Dijeda'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                    <button 
                      onClick={() => setActiveDropdown(activeDropdown === scheduler.id ? null : scheduler.id)}
                      className="text-slate-400 hover:text-navy-600 transition-colors p-1 rounded-md hover:bg-slate-100 hover:cursor-pointer"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {activeDropdown === scheduler.id && (
                      <div className="absolute right-8 top-10 w-48 rounded-md shadow-lg bg-white ring-1 ring-black/5 z-50">
                        <div className="py-1" role="menu">
                          <button 
                            onClick={() => openModal('view', scheduler)}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:cursor-pointer" 
                            role="menuitem"
                          >
                            <Eye className="w-4 h-4" /> Lihat Detail
                          </button>
                          <button 
                            onClick={() => openModal('edit', scheduler)}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:cursor-pointer" 
                            role="menuitem"
                          >
                            <Edit2 className="w-4 h-4" /> Edit
                          </button>
                          <button 
                            onClick={() => confirmDelete(scheduler)}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:cursor-pointer" 
                            role="menuitem"
                          >
                            <Trash2 className="w-4 h-4" /> Hapus
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SchedulerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        initialData={selectedScheduler}
      />

      <ConfirmDeleteModal 
        isOpen={schedulerToDelete !== null}
        onClose={() => setSchedulerToDelete(null)}
        onConfirm={handleDelete}
        schedulerName={schedulerToDelete?.name || ''}
      />
    </div>
  );
}
