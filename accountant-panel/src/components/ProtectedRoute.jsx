import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import Loader from './Loader';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      localStorage.setItem('token', token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    checkAuth();
  }, []);

  if (isLoading) return <Loader fullScreen message="Verifying session..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  // Enforce role-based access for the accountant panel
  const useAuth = useAuthStore.getState();
  if (useAuth.user && !['accountant', 'superadmin'].includes(useAuth.user.role)) {
    // If they logged in as foreman on another port, force them to log in here properly
    useAuth.logout();
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
