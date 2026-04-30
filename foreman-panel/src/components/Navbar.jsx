import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Clock, FileText, Truck, ScrollText, X, Users, BarChart2, ChevronLeft } from 'lucide-react';
import useSettingsStore from '../store/useSettingsStore';
import logo from '../assets/logo.jpg';

const Navbar = ({ isOpen, setIsOpen, isMinimized, setIsMinimized }) => {
  const { t } = useSettingsStore();

  const navItems = [
    { name: t('dashboard') || 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: t('shift') || 'Manage Shift', path: '/shift', icon: Clock },
    { name: t('entry') || 'Add Entry', path: '/add-entry', icon: FileText },
    { name: t('Contracter Dispatch') || 'Contracter Dispatch', path: '/thakdar', icon: Truck },
    { name: 'My Team', path: '/team', icon: Users },
    { name: t('history') || 'History', path: '/history', icon: ScrollText },
    { name: 'Total Production', path: '/total-production', icon: BarChart2 },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out ${
        isMinimized ? 'w-20' : 'w-64'
      } ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className={`p-4 flex items-center justify-between border-b border-gray-100 ${isMinimized ? 'justify-center' : ''}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <img src={logo} alt="Lamba Wheels" className="w-12 h-12 rounded-lg shadow-sm object-contain bg-white shrink-0" />
            {!isMinimized && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 leading-tight whitespace-nowrap">Lamba Wheels</h2>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Foreman</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop minimize toggle */}
        <button 
          onClick={() => setIsMinimized(!isMinimized)}
          className="hidden md:flex absolute -right-3 top-8 bg-white border border-gray-200 rounded-full p-1 text-gray-400 hover:text-black hover:border-black transition-all shadow-sm z-50"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
        </button>
        
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl transition-colors font-medium ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } ${isMinimized ? 'justify-center' : ''}`
              }
              title={isMinimized ? item.name : ''}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!isMinimized && <span className="whitespace-nowrap">{item.name}</span>}
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-gray-100 text-xs text-center text-gray-400">
          &copy; {new Date().getFullYear()} Lamba Wheels
        </div>
      </aside>
    </>
  );
};

export default Navbar;
