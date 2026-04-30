import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Truck,
  LogOut,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  IndianRupee,
  HardHat,
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import logo from '../assets/logo.jpg';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/labour', label: 'Labour Management', icon: Users },
  { to: '/advances', label: 'Advance Ledger', icon: IndianRupee },
  { to: '/salary', label: 'Salary Sheet', icon: FileText },
  { to: '/contractor-salary', label: 'Contractor Salary', icon: HardHat },
  { to: '/dispatch', label: 'Dispatch', icon: Truck },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuthStore();

  return (
    <aside
      className={`min-h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-30 shadow-sm transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      {/* Logo + Minimize Button Row */}
      <div className="px-3 py-4 border-b border-gray-200 flex items-center justify-between gap-2">
        {/* Logo */}
        <div className={`flex items-center gap-3 overflow-hidden ${collapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-auto opacity-100'} transition-all duration-300`}>
          <img src={logo} alt="Lamba Wheels" className="w-10 h-10 rounded-lg shadow-sm object-contain bg-white flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-gray-900 font-bold text-sm leading-tight whitespace-nowrap">LAMBA WHEELS</p>
            <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap">Accountant ERP</p>
          </div>
        </div>

        {/* Collapsed state: show logo icon only */}
        {collapsed && (
          <img src={logo} alt="Lamba Wheels" className="w-10 h-10 rounded-lg shadow-sm object-contain bg-white mx-auto" />
        )}

        {/* Toggle Button */}
        {!collapsed && (
          <button
            onClick={onToggle}
            title="Minimize sidebar"
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-all duration-200"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="flex justify-center py-2 border-b border-gray-100">
          <button
            onClick={onToggle}
            title="Expand sidebar"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-all duration-200"
          >
            <PanelLeftOpen size={18} />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-black text-white shadow-md shadow-black/10'
                  : 'text-gray-600 hover:text-black hover:bg-gray-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-black'}`} />
                {!collapsed && <span className="flex-1 whitespace-nowrap">{label}</span>}
                {!collapsed && isActive && <ChevronRight size={14} className="text-white" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="px-2 py-4 border-t border-gray-200">
        {!collapsed ? (
          <>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `block px-3 py-2 mb-2 rounded-xl transition-all ${
                  isActive ? 'bg-gray-100 ring-1 ring-gray-200' : 'hover:bg-gray-50'
                }`
              }
            >
              <p className="text-gray-900 text-sm font-semibold truncate">{user?.name || 'Accountant'}</p>
              <p className="text-gray-500 text-xs truncate">{user?.email || ''}</p>
            </NavLink>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <NavLink
              to="/profile"
              title={user?.name || 'Profile'}
              className={({ isActive }) =>
                `w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  isActive ? 'bg-gray-100 ring-1 ring-gray-200' : 'hover:bg-gray-50'
                }`
              }
            >
              <span className="text-gray-900 text-xs font-bold uppercase">
                {(user?.name || 'A').charAt(0)}
              </span>
            </NavLink>
            <button
              onClick={logout}
              title="Logout"
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
