import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Request interceptor to attach bearer token if stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('codearena_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for unified error extraction
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If unauthenticated on a protected action, clear local token
      if (localStorage.getItem('codearena_token') && !window.location.pathname.startsWith('/login')) {
        // Only clear if on protected page
      }
    }
    return Promise.reject(error);
  }
);
