import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'https://netmark-pro-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  updateProfilePicture: (formData) => api.put('/auth/profile-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  removeProfilePicture: () => api.delete('/auth/profile-picture'),
};

export const followupService = {
  getAll: (params) => api.get('/followups', { params }),
  getById: (id) => api.get(`/followups/${id}`),
  create: (data) => api.post('/followups', data),
  update: (id, data) => api.put(`/followups/${id}`, data),
  delete: (id) => api.delete(`/followups/${id}`),
  whatsappClick: (id) => api.put(`/followups/${id}/whatsapp-click`),
  markFollowed: (id, notes) => api.put(`/followups/${id}/mark-followed`, { notes }),
  convert: (id, data) => api.put(`/followups/${id}/convert`, data),
};

export const goalService = {
  getAll: () => api.get('/goals'),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
};

export const galleryService = {
  getAll: (params) => api.get('/gallery', { params }),
  upload: (formData) => api.post('/gallery', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  }),
  delete: (id) => api.delete(`/gallery/${id}`),
};

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getCalendar: (month, year) => api.get('/dashboard/calendar', { params: { month, year } }),
};

export default api;
