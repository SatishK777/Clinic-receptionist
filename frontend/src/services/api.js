import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach access token and tenant headers dynamically
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      const activeTenantId = localStorage.getItem('activeTenantId');
      if (activeTenantId) {
        config.headers['X-Tenant-ID'] = activeTenantId;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Seamlessly refresh expired access tokens (401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        if (typeof window !== 'undefined') {
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            throw new Error('Refresh token is missing');
          }

          // Trigger token update
          const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
            refreshToken,
          });
          const { accessToken } = res.data;

          localStorage.setItem('accessToken', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          // Retry the failed request with new access token
          return api(originalRequest);
        }
      } catch (refreshError) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
