import api from '../utils/axios';

export const startShift = async (shiftType) => {
  const { data } = await api.post('/shifts', { shiftType });
  return data;
};

export const getActiveShift = async () => {
  const { data } = await api.get('/shifts/active');
  return data;
};

export const endShift = async (id) => {
  const { data } = await api.put(`/shifts/${id}/end`);
  return data;
};

export const resumeShift = async (id) => {
  const { data } = await api.put(`/shifts/${id}/resume`);
  return data;
};

export const getShiftHistory = async (date) => {
  const params = date ? { date } : {};
  const { data } = await api.get('/shifts/history', { params });
  return data;
};

export const getMyShiftForDate = async (date) => {
  const { data } = await api.get(`/shifts/my-shift?date=${date}`);
  return data;
};

export const startShiftWithDate = async (shiftType, date) => {
  const { data } = await api.post('/shifts', { shiftType, date });
  return data;
};
