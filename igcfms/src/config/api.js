/**
 * API Configuration
 * Automatically detects the correct API base URL for both localhost and ngrok
 */
import axios from 'axios';

// Get the current window location
const getApiBaseUrl = () => {
  // Check if REACT_APP_API_URL is set in environment variables
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // If running in development with ngrok or custom domain
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    
    // If hostname is localhost or 127.0.0.1, use localhost:8000
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000/api';
    }
    
    // For ngrok or any other domain, use the same domain with /api
    // This ensures the API calls go through the same ngrok tunnel
    return `${protocol}//${hostname}/api`;
  }

  // Fallback to localhost
  return 'http://localhost:8000/api';
};

export const API_BASE_URL = getApiBaseUrl();

// Export a function to get headers with auth token
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Export axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
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

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access - token may be invalid');
    }
    return Promise.reject(error);
  }
);

export default API_BASE_URL;
