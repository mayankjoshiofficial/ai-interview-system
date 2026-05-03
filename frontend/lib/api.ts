// frontend/lib/api.ts
import axios from 'axios';

const API_BASE_URL = 'https://ai-interview-system-yh8y.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/api/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),
};

// Interview APIs
export const interviewAPI = {
  init: (formData: FormData) =>
    api.post('/api/interview/init', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  submitAnswer: (formData: FormData) =>
    api.post('/api/interview/submit-answer', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  endInterview: (interviewId: string) => {
    const formData = new FormData();
    formData.append('interview_id', interviewId);
    return api.post('/api/interview/end', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getReport: (interviewId: string) =>
    api.get(`/api/interview/report/${interviewId}`),

  getMyInterviews: () =>
    api.get('/api/interview/my-interviews'),
};

export default api;