import api from '../utils/axios';

// ── Dispatch Sheets ──────────────────────────────────────────────────────────
export const getDispatches = async ({ date, shift, foremanId } = {}) => {
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  if (shift) params.append('shift', shift);
  if (foremanId) params.append('foremanId', foremanId);
  const { data } = await api.get(`/dispatch?${params.toString()}`);
  return data;
};

export const createDispatch = async (dispatchData) => {
  const { data } = await api.post('/dispatch', dispatchData);
  return data;
};

export const updateDispatch = async (id, dispatchData) => {
  const { data } = await api.put(`/dispatch/${id}`, dispatchData);
  return data;
};

export const deleteDispatch = async (id) => {
  const { data } = await api.delete(`/dispatch/${id}`);
  return data;
};

// ── Foreman Entry ────────────────────────────────────────────────────────────
export const addEntry = async (entryData) => {
  const { data } = await api.post('/dispatch/add-entry', entryData);
  return data;
};

export const deleteEntry = async (dispatchId, entryId) => {
  const { data } = await api.delete(`/dispatch/${dispatchId}/entries/${entryId}`);
  return data;
};

// ── PDF Export ───────────────────────────────────────────────────────────────
export const exportPDF = async ({ date, shift, foremanId, partyName } = {}) => {
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  if (shift) params.append('shift', shift);
  if (foremanId) params.append('foremanId', foremanId);
  if (partyName) params.append('partyName', partyName);
  const response = await api.get(`/dispatch/export/pdf?${params.toString()}`, {
    responseType: 'blob',
  });
  return response.data;
};

// ── Foreman On-Duty check ────────────────────────────────────────────────────
export const getForemanShiftsForDate = async (date) => {
  const { data } = await api.get(`/shifts/fordate?date=${date}`);
  return data;
};

// ── All Registered Foremen ───────────────────────────────────────────────────
export const getAllForemen = async () => {
  const { data } = await api.get('/users/foremen');
  return data;
};
