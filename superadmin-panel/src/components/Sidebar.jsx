import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, X, ClipboardList, BarChart2, Truck, FileSpreadsheet, ChevronLeft, ChevronRight, HardHat, Package, ChevronDown, ChevronUp, Circle } from 'lucide-react';
import logo from '../assets/logo.jpg';

const Sidebar = ({ isOpen, setIsOpen, isMini, setIsMini }) => {
  const [expandedItems, setExpandedItems] = useState({ 'Total Production': false });

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'User Management', path: '/users', icon: Users },
    {
      name: 'Total Production',
      path: '/total-production',
      icon: BarChart2,
      subItems: [
        { name: 'Tyre', path: '/total-production/difference-of-tyre' },
        { name: 'Molding', path: '/total-production/molding' }
      ]
    },
    { name: 'Attendance', path: '/attendance', icon: ClipboardList },
    { name: 'Dispatch', path: '/dispatch', icon: Truck },
    { name: 'Dispatch Salary', path: '/contractor-salary', icon: FileSpreadsheet },
    { name: 'Labour & Thakdar', path: '/labour-report', icon: HardHat },
    { name: 'Incoming Articles', path: '/incoming-articles', icon: Package },
    { name: 'Outgoing Articles', path: '/outgoing-articles', icon: Package },
    { name: 'Reports', path: '/reports', icon: FileText },
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
      <aside className={`${isMini ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
        <div className={`p-6 flex items-center ${isMini ? 'justify-center px-2' : 'justify-between'} border-b border-gray-100 relative`}>
          <div className="flex items-center gap-3">
            <img src={logo} alt="Lamba Wheels" className="w-10 h-10 rounded-full shadow-sm flex-shrink-0" />
            {!isMini && (
              <div className="overflow-hidden transition-opacity duration-300">
                <h2 className="text-lg font-bold text-gray-900 whitespace-nowrap">Lamba Wheels</h2>
                <p className="text-xs font-semibold text-purple-600 uppercase whitespace-nowrap">Superadmin</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors absolute right-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => (
            <div key={item.name} className="flex flex-col">
              <div className="relative flex items-center group">
                <NavLink
                  to={item.path}
                  onClick={(e) => {
                    if (item.subItems) {
                      setExpandedItems(prev => ({ ...prev, [item.name]: !prev[item.name] }));
                    } else {
                      setIsOpen(false);
                    }
                  }}
                  title={isMini ? item.name : ""}
                  className={({ isActive }) =>
                    `flex-1 flex items-center justify-between ${isMini ? 'justify-center px-2' : 'px-4'} py-3 rounded-xl transition-colors font-medium ${isActive
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!isMini && <span className="whitespace-nowrap">{item.name}</span>}
                  </div>
                  
                  {item.subItems && !isMini && (
                    <div className="text-gray-400">
                      {expandedItems[item.name] ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  )}
                </NavLink>
              </div>

                {/* Sub Items */}
                {item.subItems && !isMini && (
                  <div 
                    className={`grid transition-all duration-300 ease-in-out ${
                      expandedItems[item.name] ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="pl-11 pr-4 py-1 space-y-1">
                        {item.subItems.map((subItem) => (
                          <NavLink
                            key={subItem.name}
                            to={subItem.path}
                            onClick={() => setIsOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors font-medium ${isActive
                                ? 'bg-purple-50 text-purple-700'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                              }`
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <Circle className="w-1.5 h-1.5 flex-shrink-0" fill={isActive ? "currentColor" : "none"} />
                                <span className="whitespace-nowrap">{subItem.name}</span>
                              </>
                            )}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
            </div>
          ))}
        </nav>

        {/* Toggle Mini Mode */}
        <div className={`p-4 border-t border-gray-100 flex items-center ${isMini ? 'justify-center' : ''}`}>
          <button
            onClick={() => setIsMini(!isMini)}
            className="hidden md:flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors w-full"
            title={isMini ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isMini ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <div className="flex items-center gap-2">
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Collapse Sidebar</span>
              </div>
            )}
          </button>
        </div>

        {!isMini && (
          <div className="pb-4 text-xs text-center text-gray-400 transition-opacity duration-300 whitespace-nowrap">
            &copy; 2026 Lamba Wheels
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
