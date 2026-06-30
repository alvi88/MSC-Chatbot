import axios from 'axios';

// Use relative URL - proxy will handle it
const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add logging interceptors
api.interceptors.request.use(
  config => {
    console.log('📤 API Request:', config.method.toUpperCase(), config.url, config.data);
    return config;
  },
  error => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => {
    console.log('📥 API Response:', response.status, response.data);
    return response;
  },
  error => {
    console.error('❌ API Response Error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const getHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const sendMessage = async (data) => {
  const response = await api.post('/chat', data);
  return response.data;
};

export const getConversations = async () => {
  const response = await api.get('/conversations');
  return response.data;
};

export const getConversation = async (id) => {
  const response = await api.get(`/conversations/${id}`);
  return response.data;
};

export const clearConversation = async (id) => {
  const response = await api.delete(`/conversations/${id}`);
  return response.data;
};

export default api;