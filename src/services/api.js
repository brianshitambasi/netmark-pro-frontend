import axios from 'axios';
import toast from 'react-hot-toast';

// Use live backend URL on Render
const API_URL = process.env.REACT_APP_API_URL || 'https://netmark-pro-backend.onrender.com/api';

console.log('API URL:', API_URL); // This will help you debug

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // Increased timeout for production
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout - Server might be slow');
    } else if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } else if (error.response?.status === 404) {
      toast.error('API endpoint not found. Check backend URL.');
    } else if (error.code === 'ERR_NETWORK') {
      toast.error('Cannot connect to server. Backend might be down.');
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Follow-up Services
export const followupService = {
  getAll: (params) => api.get('/followups', { params }),
  getById: (id) => api.get(`/followups/${id}`),
  create: (data) => api.post('/followups', data),
  update: (id, data) => api.put(`/followups/${id}`, data),
  delete: (id) => api.delete(`/followups/${id}`),
  bulkDelete: (ids) => api.post('/followups/bulk-delete', { ids }),
  whatsappClick: (id) => api.put(`/followups/${id}/whatsapp-click`),
  markFollowed: (id, notes) => api.put(`/followups/${id}/mark-followed`, { notes }),
  convert: (id, data) => api.put(`/followups/${id}/convert`, data),
  getAnalytics: () => api.get('/followups/analytics'),
};

// Goal Services
export const goalService = {
  getAll: (params) => api.get('/goals', { params }),
  getById: (id) => api.get(`/goals/${id}`),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
  updateProgress: (id, current) => api.put(`/goals/${id}/progress`, { current }),
  getSuggestions: () => api.get('/goals/suggestions'),
};

// Gallery Services
export const galleryService = {
  getAll: (params) => api.get('/gallery', { params }),
  getById: (id) => api.get(`/gallery/${id}`),
  upload: (formData) => {
    return api.post('/gallery', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes for file uploads
    });
  },
  update: (id, data) => api.put(`/gallery/${id}`, data),
  delete: (id) => api.delete(`/gallery/${id}`),
  bulkDelete: (ids) => api.post('/gallery/bulk-delete', { ids }),
  like: (id) => api.put(`/gallery/${id}/like`),
  share: (id) => api.put(`/gallery/${id}/share`),
};

// Dashboard Services
export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getCalendar: (month, year) => api.get('/dashboard/calendar', { params: { month, year } }),
  getAnalytics: (period) => api.get('/dashboard/analytics', { params: { period } }),
};

// Event Services
export const eventService = {
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  rsvp: (id, attendeeId, status) => api.put(`/events/${id}/rsvp`, { attendeeId, status }),
  addAttendee: (id, followupId) => api.post(`/events/${id}/attendees`, { followupId }),
};

// Task Services
export const taskService = {
  getAll: (params) => api.get('/tasks', { params }),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  updateStatus: (id, status) => api.put(`/tasks/${id}/status`, { status }),
  delete: (id) => api.delete(`/tasks/${id}`),
};

export default api;
