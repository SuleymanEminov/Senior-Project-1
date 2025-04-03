// This file sets up an Axios interceptor to handle token refresh logic.
// It intercepts requests to add the access token to the headers and handles 401 errors by attempting to refresh the token.
// If the refresh token is valid, it retries the original request with the new access token.
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a flag to track ongoing refresh attempts
let isRefreshing = false;
// Store pending requests that should be retried after token refresh
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// The refresh token function
const refreshToken = async () => {
  const refresh = localStorage.getItem("refresh_token");
  
  if (!refresh) {
    return Promise.reject("No refresh token available");
  }

  try {
    const response = await axios.post("http://localhost:8000/api/token/refresh/", {
      refresh: refresh,
    });
    
    const { access, refresh: newRefreshToken } = response.data;
    
    localStorage.setItem("access_token", access);
    
    if (newRefreshToken) {
      localStorage.setItem("refresh_token", newRefreshToken);
    }
    
    return access;
  } catch (error) {
    return Promise.reject(error);
  }
};

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors, particularly 401 (Unauthorized)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't retried this request yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If a token refresh is already in progress, add this request to the queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Get a new token
        const newToken = await refreshToken();
        // Process any queued requests with the new token
        processQueue(null, newToken);
        
        // Update the failed request with the new token and retry
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, process the queue with an error
        processQueue(refreshError);
        
        // Clear tokens and redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;