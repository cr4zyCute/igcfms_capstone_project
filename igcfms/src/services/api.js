import axios from 'axios';
import API_BASE_URL from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL, 
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Optionally clear invalid tokens, but no redirect to avoid page refresh during login
      // localStorage.removeItem('auth_token');
      // localStorage.removeItem('token');
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
      const response = await api.get('/user/profile');
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
      console.log(`[API] PUT /users/${id}`, userData);
      const response = await api.put(`/users/${id}`, userData);
      console.log(`[API] PUT /users/${id} - Success:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`[API] PUT /users/${id} - Error:`, error.response?.data || error.message);
      throw error;
    }
  };

  export const toggleUserStatus = async (id) => {
    try {
      const response = await api.patch(`/users/${id}/toggle-status`);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  export const deleteUser = async (id) => {
    try {
      console.log(`[API] DELETE /users/${id}`);
      const response = await api.delete(`/users/${id}`);
      console.log(`[API] DELETE /users/${id} - Success:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`[API] DELETE /users/${id} - Error:`, error.response?.data || error.message);
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
    export const updateFundAccount = async (id, data) => {
      try {
        const response = await api.put(`/fund-accounts/${id}`, data);
        return response.data;
      } catch (error) {
        throw error;
      }
    };
    export const deleteFundAccount = async (id) => {
      const response = await api.delete(`/fund-accounts/${id}`);
      return response.data;
    };


  export const createTransaction = async (transactionData) => {
    try {
      const response = await api.post('/transactions', transactionData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Receipts API
  export const getReceipts = async (params = {}) => {
    try {
      const response = await api.get('/receipts', { params });
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.data)) return data.data;
      return data?.receipts ?? [];
    } catch (error) {
      throw error;
    }
  };

  export const createReceipt = async (receiptData) => {
    try {
      const response = await api.post('/receipts', receiptData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  export const updateReceipt = async (id, receiptData) => {
    try {
      const response = await api.put(`/receipts/${id}`, receiptData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  export const deleteReceipt = async (id) => {
    try {
      const response = await api.delete(`/receipts/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  export const cancelReceipt = async (id, data = {}) => {
    try {
      const response = await api.post(`/receipts/${id}/cancel`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  export const getCollectionTransactions = async (params = {}) => {
    try {
      const response = await getTransactions({ type: 'Collection', ...params });
      if (Array.isArray(response)) return response;
      return response?.data || response?.transactions || [];
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
      const response = await api.post('/transactions/override', requestData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  export const updateOverrideRequest = async (id, requestData) => {
    try {
      const response = await api.put(`/override_requests/${id}/review`, requestData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Reports API
  export const generateReport = async (reportData) => {
    try {
      const response = await api.post('/reports', reportData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  export const getReports = async (params = {}) => {
    try {
      const response = await api.get('/reports', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  export const deleteReport = async (reportId) => {
    try {
      const response = await api.delete(`/reports/${reportId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Cheques API
  export const getCheques = async (params = {}) => {
    try {
      // First try to fetch from /disbursements with method=Cheque filter
      const response = await api.get('/disbursements', { 
        params: {
          ...params,
          method: 'Cheque'
        } 
      });
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.data)) return data.data;
      return data?.disbursements ?? [];
    } catch (error) {
      // Fallback to /cheques endpoint if /disbursements fails
      try {
        const fallbackResponse = await api.get('/cheques', { params });
        const fallbackData = fallbackResponse.data;
        if (Array.isArray(fallbackData)) return fallbackData;
        if (Array.isArray(fallbackData?.data)) return fallbackData.data;
        return fallbackData?.cheques ?? [];
      } catch (fallbackError) {
        throw error;
      }
    }
  };

  export const createCheque = async (chequeData) => {
    try {
        const response = await api.post('/disbursements', chequeData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateCheque = async (id, chequeData) => {
    try {
        const response = await api.patch(`/cheques/${id}`, chequeData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

  export const getDisbursementTransactions = async (params = {}) => {
    try {
      const response = await getTransactions({ type: 'Disbursement', ...params });
      if (Array.isArray(response)) return response;
      return response?.data || response?.transactions || [];
    } catch (error) {
      throw error;
    }
  };

  export default api;