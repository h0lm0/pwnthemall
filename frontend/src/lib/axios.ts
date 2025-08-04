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

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle ban logic for specific endpoints, not logout requests
    const isLogoutRequest = error.config?.url?.includes('/api/logout');
    const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';
    
    if (
      error.response?.status === 401 &&
      error.response?.data?.error === "banned" &&
      typeof window !== "undefined" &&
      !isLogoutRequest &&
      !isLoginPage
    ) {
      if (!banHandled) {
        banHandled = true;
        debugLog("User is banned, triggering logout");
        
        // Clear translation cache
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("translations_")) {
            localStorage.removeItem(key);
          }
        });
        
        // Dispatch auth refresh event
        window.dispatchEvent(new CustomEvent("auth:refresh"));
        
        // Redirect to login
        window.location.href = "/login";
      }
      // Do nothing on subsequent triggers
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default instance;
