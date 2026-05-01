import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, User as UserIcon } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useSettingsStore from '../store/useSettingsStore';
import logo from '../assets/logo.jpg';

const Header = ({ title }) => {
  const { user, logout } = useAuthStore();
  const { language, setLanguage, t } = useSettingsStore();

  return (
    <header className="bg-white border-b border-gray-200 h-16 sm:h-20 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-3">
        <img src={logo} alt="Lamba Wheels" className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-contain bg-white shadow-sm" />
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">{title}</h1>
          <p className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-wider">{t('portal') || 'Foreman Portal'}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 ml-auto">
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-gray-50 text-xs font-bold text-gray-700 border border-gray-200 rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hidden sm:block"
        >
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
          <option value="pa">ਪੰਜਾਬੀ</option>
        </select>
        
        <div className="flex items-center gap-2 sm:border-l border-gray-200 sm:pl-4">
          <Link to="/profile" className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold hover:ring-2 ring-blue-500 transition shadow-sm">
            <UserIcon className="w-5 h-5" />
          </Link>
          <button 
            onClick={logout}
            className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full transition-colors shadow-sm"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
