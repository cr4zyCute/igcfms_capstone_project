// import axios from 'axios';

// const api = axios.create({
//    //connnection to the backend 
//     baseURL: 'http://localhost:8000/api',
//     withCredentials: true,
// });

// //requesting the interceptor to add the auth token 
// export const loginUser = async (email, password) => {
//   try {
//     const response = await api.post('/login', { email, password });
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };

// export default api;

// In src/services/api.js
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