import React from 'react';
import useAuthStore from '../store/useAuthStore';
import { LogOut, User as UserIcon, Bell, Menu } from 'lucide-react';

const Navbar = ({ toggleMenu }) => {
  const { user, logout } = useAuthStore();

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleMenu} 
          className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800 md:hidden">Lamba Wheels</h1>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors hidden sm:block">
          <Bell className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2 sm:gap-3 sm:border-l border-gray-200 sm:pl-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-gray-900">{user?.name || 'Admin'}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role || 'Superadmin'}</p>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold shrink-0">
            <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
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

export default Navbar;
