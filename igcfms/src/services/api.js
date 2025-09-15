import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/login', { email, password }); 
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default api;