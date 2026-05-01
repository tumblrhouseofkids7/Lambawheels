import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

const ForemanLayout = () => {
  const location = useLocation();
  
  const getPageTitle = () => {
    if (location.pathname.startsWith('/add-entry/')) return 'Worker Entry';
    switch(location.pathname) {
      case '/': return 'Dashboard';
      case '/shift': return 'Manage Shift';
      case '/add-entry': return 'Add Entry';
      case '/thakdar': return 'Thakdar Dispatch';
      case '/history': return 'History';
      case '/team': return 'My Team';
      case '/total-production': return 'Total Production';
      case '/profile': return 'Profile';
      default: return 'Lamba Wheels';
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col font-sans pb-16 sm:pb-20">
      <Header title={getPageTitle()} />
      <main className="flex-1 p-4 overflow-x-hidden overflow-y-auto">
        <div className="max-w-md mx-auto h-full">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default ForemanLayout;
