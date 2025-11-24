import axios from "axios";
import { debugLog } from "./debug";

const instance = axios.create({
  withCredentials: true,
});

// Prevent multiple ban-triggered logouts/reloads
let banHandled = false;
if (typeof window !== 'undefined') {
  banHandled = false; // Reset on page load
}

let isRefreshing = false;
let refreshFailed = false; // Prevent multiple refresh attempts
let failedQueue: Array<{resolve: Function, reject: Function}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't intercept auth-related endpoints to avoid loops
    if (
      originalRequest.url?.includes('/api/login') ||
      originalRequest.url?.includes('/api/logout') ||
      originalRequest.url?.includes('/api/refresh') ||
      originalRequest.url?.includes('/api/me')
    ) {
      throw error;
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      // If already failed once or on login page, don't retry
      const isOnLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';
      if (refreshFailed || isOnLoginPage) {
        throw error;
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return instance(originalRequest);
          })
          .catch((err) => {
            throw err;
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Use native axios to avoid interceptor recursion
        await axios.post('/api/refresh', {}, { withCredentials: true });
        processQueue(null, null);
        refreshFailed = false; // Reset on successful refresh
        return instance(originalRequest);
      } catch (refreshError) {
        refreshFailed = true; // Mark refresh as failed
        processQueue(refreshError, null);
        
        // Only redirect if not already on login page
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        throw refreshError;
      } finally {
        isRefreshing = false;
      }
    }

    throw error;
  }
);

export default instance;
