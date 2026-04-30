import axios from 'axios';

// All requests send cookies automatically — no tokens in localStorage.
// Auth redirects are handled by checkAuth() + ProtectedRoute, NOT here.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // sends HTTP-only session cookie with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
