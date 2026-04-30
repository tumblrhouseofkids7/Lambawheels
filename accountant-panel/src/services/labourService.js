import api from '../utils/axios';

export const getLabours = async () => {
  const { data } = await api.get('/labours');
  return data;
};

export const createLabour = async (labourData) => {
  const { data } = await api.post('/labours', labourData);
  return data;
};

export const updateLabour = async (id, labourData) => {
  const { data } = await api.put(`/labours/${id}`, labourData);
  return data;
};

export const deleteLabour = async (id) => {
  const { data } = await api.delete(`/labours/${id}`);
  return data;
};
