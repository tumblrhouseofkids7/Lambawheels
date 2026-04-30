import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const pageTitles = {
  '/dashboard': { title: 'Dashboard', sub: 'Overview of operations' },
  '/labour': { title: 'Labour Management', sub: 'Manage workforce records' },
  '/salary': { title: 'Salary Sheet', sub: 'Generate and export salary data' },
  '/dispatch': { title: 'Dispatch (Contacter) Control', sub: 'Track product targets and dispatch' },
  '/profile': { title: 'Account Profile', sub: 'Manage your personal details' },
};

const Navbar = () => {
  const { pathname } = useLocation();
  const { user } = useAuthStore();
  const page = pageTitles[pathname] || { title: 'Lamba Wheels ERP', sub: '' };

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center px-6 gap-4 sticky top-0 z-20">
      {/* Page Title */}
      <div className="flex-1">
        <h1 className="text-gray-900 font-bold text-lg leading-tight">{page.title}</h1>
        <p className="text-gray-500 text-xs">{page.sub}</p>
      </div>

      {/* Date */}
      <span className="text-gray-500 text-xs hidden lg:block">{dateStr}</span>

      {/* Bell */}
      <button className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors border border-gray-200">
        <Bell size={16} className="text-gray-600" />
      </button>

      {/* Avatar */}
      <button 
        onClick={() => window.location.href = '/profile'}
        className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center shadow-lg shadow-black/50 cursor-pointer hover:ring-2 hover:ring-gray-300 transition-all"
      >
        {user?.profilePic ? (
           <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover rounded-xl" />
        ) : (
          <span className="text-white font-bold text-sm">
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </span>
        )}
      </button>
    </header>
  );
};

export default Navbar;
