import api from '../utils/axios';

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
};

export const userService = {
  getLabours: () => api.get('/labours'),
  createLabour: (data) => api.post('/labours', data),
  deleteLabour: (id) => api.delete(`/labours/${id}`),
};

export const systemUserService = {
  getUsers: () => api.get('/users'),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getDashboardStats: (date) => api.get('/users/dashboard-stats', { params: date ? { date } : {} }),
  getForemen: () => api.get('/users/foremen'),
};

export const productionService = {
  getProductions: (params) => api.get('/production', { params }),
  addProduction: (data) => api.post('/production', data),
};

export const dispatchService = {
  getDispatches: (params) => api.get('/dispatch', { params }),
  exportPDFUrl: (params) => {
    const base = api.defaults.baseURL;
    const qs = new URLSearchParams(params).toString();
    return `${base}/dispatch/export/pdf${qs ? '?' + qs : ''}`;
  },
};

export const salaryService = {
  getSalarySheet: (month, year) => api.get('/salary', { params: { month, year } }),
};


