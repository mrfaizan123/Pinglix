import axios from 'axios';

const baseURL = import.meta.env.MODE === 'development'
  ? 'http://localhost:5000/api'
  : 'https://pinglix-backend.onrender.com/api';

const api = axios.create({
  baseURL: baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to handle global errors like 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the error is 401 and we aren't on the login page, we might want to redirect
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        // Optional: you could force logout here or redirect to login
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
