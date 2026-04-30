import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, User as UserIcon, Menu } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useSettingsStore from '../store/useSettingsStore';
import logo from '../assets/logo.jpg';

const Header = ({ title, toggleMenu }) => {
  const { user, logout } = useAuthStore();
  const { language, setLanguage, t } = useSettingsStore();

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleMenu} 
          className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 md:hidden">
          <img src={logo} alt="Lamba Wheels" className="w-8 h-8 rounded object-contain bg-white" />
          <h1 className="text-xl font-semibold text-gray-800">Lamba Wheels</h1>
        </div>
        <div className="hidden md:block">
          <h1 className="text-lg font-bold text-gray-900 leading-tight">{title}</h1>
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{t('portal') || 'Foreman Portal'}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-gray-50 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hidden sm:block"
        >
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
          <option value="pa">ਪੰਜਾਬੀ</option>
        </select>
        
        <div className="flex items-center gap-2 sm:gap-3 sm:border-l border-gray-200 sm:pl-4">
          <Link to="/profile" className="hidden sm:block text-right hover:text-blue-600 transition-colors">
            <p className="text-sm font-semibold text-gray-900">{user?.name || 'Foreman'}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role || 'Foreman'}</p>
          </Link>
          <Link to="/profile" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0 hover:ring-2 ring-blue-500 transition">
            <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <button 
            onClick={logout}
            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors sm:ml-2"
            title="Logout"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
