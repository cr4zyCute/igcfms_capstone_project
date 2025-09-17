import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

    api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
    
  export const loginUser = async (email, password) => {
    try {
      const response = await api.post('/login', { email, password }); 
      return response.data;
    } catch (error) {
      throw error;
    }
  };
  export const getProfile = async () => {
    try {
      const response = await api.get('/profile');
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Users API
  export const getUsers = async () => {
    try {
      const response = await api.get('/users');
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  export const createUser = async (userData) => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  export const updateUser = async (id, userData) => {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  export const toggleUserStatus = async (id) => {
    try {
      const response = await api.patch(`/users/${id}/status`);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Fund Accounts API
  export const getFundAccounts = async () => {
    const response = await api.get('/fund-accounts'); 
    return response.data;
  };

  export const getFundAccount = async (accountId) => {
    const response = await api.get(`/fund-accounts/${accountId}`);
    return response.data;
  };

  export const createFundAccount = async (accountData) => {
    const response = await api.post('/fund-accounts', accountData);
    return response.data;
  };

    export const getTransactions = async (params = {}) => {
      try {
        const response = await api.get('/transactions', { params });
        return response.data;
      } catch (error) {
        throw error;
      }
    };

  export const createTransaction = async (transactionData) => {
    try {
      const response = await api.post('/transactions', transactionData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Override Requests API
  export const getOverrideRequests = async () => {
    try {
      const response = await api.get('/override-requests');
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  export const createOverrideRequest = async (requestData) => {
    try {
      const response = await api.post('/override-requests', requestData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  export const updateOverrideRequest = async (id, requestData) => {
    try {
      const response = await api.put(`/override-requests/${id}`, requestData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Reports API
  export const generateReport = async (reportData) => {
    try {
      const response = await api.post('/reports/generate', reportData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  export const getReports = async () => {
    try {
      const response = await api.get('/reports');
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  export default api;