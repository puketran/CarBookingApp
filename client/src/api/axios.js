import axios from 'axios';

const api = axios.create({ baseURL: '/api/v1' });

// Attach the JWT on every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear auth and bounce to login — unless we're already on the login
// page (where verify-otp legitimately returns 401 for a wrong code).
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const onLogin = window.location.pathname.startsWith('/login');
    if (err.response?.status === 401 && !onLogin) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default api;
