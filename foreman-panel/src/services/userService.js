import api from '../utils/axios';

export const updateOwnProfile = async (profileData) => {
  const { data } = await api.put('/users/profile', profileData);
  return data;
};

export const uploadProfilePic = async (file) => {
  const formData = new FormData();
  formData.append('profilePic', file);
  const { data } = await api.post('/users/profile/pic', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};
