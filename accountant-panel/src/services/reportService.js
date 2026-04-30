import api from '../utils/axios';

export const getReports = async (filters = {}) => {
  const { data } = await api.get('/reports', { params: filters });
  return data;
};

export const getDashboardSummary = async () => {
  const { data } = await api.get('/reports/summary');
  return data;
};
