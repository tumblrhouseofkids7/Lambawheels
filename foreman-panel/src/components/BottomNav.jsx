import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Truck, ScrollText } from 'lucide-react';
import useSettingsStore from '../store/useSettingsStore';

const BottomNav = () => {
  const { t } = useSettingsStore();

  const navItems = [
    { name: t('dashboard') || 'Home', path: '/', icon: LayoutDashboard },
    { name: t('entry') || 'Entry', path: '/add-entry', icon: FileText },
    { name: t('Contracter Dispatch') || 'Dispatch', path: '/thakdar', icon: Truck },
    { name: t('history') || 'History', path: '/history', icon: ScrollText },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16 sm:h-20 max-w-md mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-6 h-6 sm:w-7 sm:h-7 mb-1 ${isActive ? 'fill-blue-100/50 text-blue-600' : ''}`} />
                <span className="text-[10px] sm:text-xs font-bold leading-none">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
