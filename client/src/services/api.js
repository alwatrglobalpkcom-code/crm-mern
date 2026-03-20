import axios from 'axios';
import { getApiErrorMessage, isNetworkError } from '../utils/apiError';

// Use env var for explicit URL, else proxy (package.json) forwards /api to localhost:5002
export const API_BASE = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config._silent = config._silent ?? config._skipErrorToast;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    const status = err.response?.status;
    const isLoginRequest = err.config?.url?.includes('/auth/login');
    const isAuthMe = err.config?.url?.includes('/auth/me');
    const isSilent = err.config?._silent === true;

    if (status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      if (!isAuthMe) {
        err._handled = true;
        window.location.href = '/login';
      } else {
        err._silent = true;
      }
    }

    if (err && !err.userMessage) {
      err.userMessage = getApiErrorMessage(err);
    }

    err._silent = err._silent ?? isSilent ?? err.config?._silent;
    err._isNetwork = isNetworkError(err);
    return Promise.reject(err);
  }
);

export default api;
