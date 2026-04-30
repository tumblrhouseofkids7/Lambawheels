import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Navbar from '../components/Navbar';

const ForemanLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const location = useLocation();
  
  const getPageTitle = () => {
    switch(location.pathname) {
      case '/': return 'Dashboard';
      case '/shift': return 'Manage Shift';
      case '/add-entry': return 'Add Entry';
      case '/thakdar': return 'Thakdar Dispatch';
      case '/history': return 'History';
      default: return 'Lamba Wheels';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      <Navbar 
        isOpen={isMobileMenuOpen} 
        setIsOpen={setIsMobileMenuOpen} 
        isMinimized={isMinimized}
        setIsMinimized={setIsMinimized}
      />
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isMinimized ? 'md:ml-20' : 'md:ml-64'}`}>
        <Header title={getPageTitle()} toggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <main className="flex-1 p-4 sm:p-6 overflow-auto h-[calc(100vh-4rem)]">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ForemanLayout;
