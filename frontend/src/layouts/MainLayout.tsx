import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Database, CalendarClock, History, LogOut } from 'lucide-react';
import clsx from 'clsx';
import logoBakti from '../assets/baktilogo.jpg';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Input Data', path: '/input-data', icon: Database },
  { name: 'Scheduler', path: '/scheduler', icon: CalendarClock },
  { name: 'Log Riwayat', path: '/log-history', icon: History },
];

export default function MainLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen w-full bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white text-black flex flex-col shadow-xl border-r border-slate-200">
        <div className="h-16 flex items-center justify-center border-b border-slate-200 overflow-hidden">
          <img src={logoBakti} alt="Logo BAKTI" className="h-32 w-auto object-contain mt-4" />

        </div>
        
        <nav className="flex-1 py-6 flex flex-col gap-2 px-4">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200',
                  isActive 
                    ? 'bg-gray-300 text-black shadow-sm' 
                    : 'text-black hover:bg-gray-200/50 hover:text-black'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4">
          <Link 
            to="/" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-black hover:bg-red-600/10 hover:text-red-600 transition-colors duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-navy-900 shadow-sm border-b border-slate-200 flex items-center px-8 shrink-0 justify-between">
          <h2 className="text-lg font-semibold text-slate-800 text-white">
            {navItems.find((i) => location.pathname.startsWith(i.path))?.name || 'Overview'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold text-sm">
              AD
            </div>
            <span className="text-sm font-medium text-slate-600 text-white">Admin</span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
