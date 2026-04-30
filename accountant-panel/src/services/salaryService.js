import api from '../utils/axios';

export const generateSalary = async (startDate, endDate) => {
  const { data } = await api.post('/salary/generate', { startDate, endDate });
  return data;
};

export const updateSalary = async (id, updateData) => {
  const { data } = await api.put(`/salary/update/${id}`, updateData);
  return data;
};

// Assuming there's a GET route if needed, else we rely on generate to return the updated/existing ones
export const getSalarySheet = async (startDate, endDate) => {
  const { data } = await api.get('/salary', { params: { startDate, endDate } });
  return data;
};
