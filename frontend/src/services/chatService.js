import axios from 'axios';

// Use relative URL - proxy will handle it
const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 300000,
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

// ============================================
// ✅ EXPORT: Health check
// ============================================
export const getHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

// ============================================
// 🔥 EXPORT: Streaming chat function
// ============================================
export const sendMessageStream = async (data, onChunk, onComplete, onError) => {
  console.log('📤 Sending streaming request...');
  
  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        console.log('✅ Stream complete');
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine === '') continue;
        
        if (trimmedLine.startsWith('data: ')) {
          try {
            const jsonData = JSON.parse(trimmedLine.slice(6));
            
            if (jsonData.error) {
              console.error('❌ Stream error:', jsonData.error);
              onError(jsonData.error);
              return;
            }
            
            if (jsonData.done) {
              console.log('✅ Stream complete, conversationId:', jsonData.conversationId);
              onComplete(jsonData.conversationId, jsonData.total_tokens);
              return;
            }
            
            if (jsonData.content) {
              onChunk(jsonData.content);
            }
          } catch (e) {
            console.error('❌ Parse error:', e, 'Line:', trimmedLine);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Stream error:', error.message);
    onError(error.message);
  }
};

// ============================================
// ✅ EXPORT: Regular send message (for compatibility)
// ============================================
export const sendMessage = async (data) => {
  const response = await api.post('/chat', data);
  return response.data;
};

// ============================================
// ✅ EXPORT: Conversation management
// ============================================
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