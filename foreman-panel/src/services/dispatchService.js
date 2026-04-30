import api from '../utils/axios';

// ── Dispatch Sheets ──────────────────────────────────────────────────────────
export const getDispatches = async ({ date, shift } = {}) => {
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  if (shift) params.append('shift', shift);
  const { data } = await api.get(`/dispatch?${params.toString()}`);
  return data;
};

// ── Add Entry (Foreman) ──────────────────────────────────────────────────────
export const addEntry = async (entryData) => {
  const { data } = await api.post('/dispatch/add-entry', entryData);
  return data;
};

export const deleteEntry = async (dispatchId, entryId) => {
  const { data } = await api.delete(`/dispatch/${dispatchId}/entries/${entryId}`);
  return data;
};

export const renameWorker = async (dispatchId, oldName, newName) => {
  const { data } = await api.put(`/dispatch/${dispatchId}/workers/rename`, { oldName, newName });
  return data;
};

export const deleteWorker = async (dispatchId, workerName) => {
  const { data } = await api.delete(`/dispatch/${dispatchId}/workers/${workerName}`);
  return data;
};

export const submitShift = async (date, shift) => {
  const { data } = await api.put('/dispatch/submit-shift', { date, shift });
  return data;
};
