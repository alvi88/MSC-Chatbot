import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// 🔥 OLLAMA CLOUD CONFIGURATION
// ============================================
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'https://ollama.com';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'qwen3-coder:480b-cloud';

const TAGS_URL = `${OLLAMA_HOST}/api/tags`;
const CHAT_URL = `${OLLAMA_HOST}/api/chat`;

console.log('🔑 API Key loaded:', !!OLLAMA_API_KEY);
console.log('🔗 API Host:', OLLAMA_HOST);
console.log('📡 Chat URL:', CHAT_URL);

if (!OLLAMA_API_KEY) {
  console.error('❌ ERROR: OLLAMA_API_KEY is not set!');
  console.error('Get your key from: https://ollama.com/settings/keys');
}

const AVAILABLE_MODELS = [
  'qwen3-coder:480b-cloud',
  'gpt-oss:120b-cloud',
  'deepseek-v3.1:671b-cloud',
  'glm-4.6:cloud',
  'kimi-k2.6',
  'mistral-large-3:675b',
  'gemma3:27b'
];

// ============================================
// 📂 CONVERSATION STORAGE
// ============================================
const conversations = new Map();

// ============================================
// 🛠️ MIDDLEWARE
// ============================================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

// ============================================
// 🔥 HEALTH CHECK
// ============================================
app.get('/api/health', async (req, res) => {
  console.log('✅ Health check requested');
  
  try {
    const response = await axios.get(TAGS_URL, {
      headers: {
        'Authorization': `Bearer ${OLLAMA_API_KEY}`
      }
    });
    
    const models = response.data?.models?.map(m => m.name) || [];
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      ollama: 'cloud-connected',
      models: models.length > 0 ? models : AVAILABLE_MODELS,
      defaultModel: DEFAULT_MODEL,
      apiType: 'ollama-cloud'
    });
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    res.json({ 
      status: 'degraded', 
      timestamp: new Date().toISOString(),
      ollama: 'cloud-disconnected',
      models: AVAILABLE_MODELS,
      defaultModel: DEFAULT_MODEL,
      error: error.message || 'Check your OLLAMA_API_KEY'
    });
  }
});

// ============================================
// 🔥 CHAT ENDPOINT - SIMPLE (No Streaming)
// ============================================
app.post('/api/chat', async (req, res) => {
  console.log('💬 Chat request received');
  
  try {
    const { 
      message, 
      conversationId = null, 
      model = DEFAULT_MODEL,
      temperature = 0.7,
      maxTokens = 512,
      systemPrompt = 'You are an experienced and helpful science communicator at the MagnifiScience Centre.'
    } = req.body;

    console.log(`📝 Message: ${message?.substring(0, 50)}...`);
    console.log(`🤖 Model: ${model}`);

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create conversation history
    let history = [];
    if (conversationId && conversations.has(conversationId)) {
      history = conversations.get(conversationId);
    }

    // Prepare messages for Ollama API
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message }
    ];

    console.log(`📤 Sending ${messages.length} messages to Ollama`);

    // ============================================
    // CALL OLLAMA CLOUD API - NO STREAMING
    // ============================================
    const response = await axios({
      method: 'POST',
      url: CHAT_URL,
      data: {
        model: model,
        messages: messages,
        stream: false,  // ✅ No streaming
        options: {
          temperature: temperature,
          num_predict: maxTokens
        }
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OLLAMA_API_KEY}`
      },
      timeout: 300000 // 5 minutes
    });

    // Extract the assistant's reply from Ollama response
    const assistantReply = response.data.message?.content || '';
    
    // Get token usage
    const usage = {
      total_tokens: response.data.total_duration || 0,
      prompt_tokens: response.data.prompt_eval_count || 0,
      completion_tokens: response.data.eval_count || 0
    };

    console.log(`✅ Received reply: ${assistantReply?.substring(0, 50)}...`);

    // Store conversation
    const newConversationId = conversationId || `conv_${Date.now()}`;
    if (!conversations.has(newConversationId)) {
      conversations.set(newConversationId, []);
    }
    conversations.get(newConversationId).push(
      { role: 'user', content: message },
      { role: 'assistant', content: assistantReply }
    );

    // Send response
    res.json({
      success: true,
      conversationId: newConversationId,
      reply: assistantReply,
      usage: usage,
      model: model,
      apiType: 'ollama-cloud'
    });

  } catch (error) {
    console.error('❌ Chat error:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        error: 'Invalid Ollama Cloud API key. Please check your OLLAMA_API_KEY' 
      });
    }
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Cannot connect to Ollama Cloud. Please check your internet connection.' 
      });
    }

    res.status(500).json({ 
      error: error.response?.data?.error || error.message 
    });
  }
});

// ============================================
// 📂 CONVERSATION ENDPOINTS
// ============================================

app.get('/api/conversations', (req, res) => {
  const allConversations = Array.from(conversations.keys()).map(id => ({
    id,
    messageCount: conversations.get(id).length,
    lastMessage: conversations.get(id)[conversations.get(id).length - 1]?.content || ''
  }));
  res.json({ success: true, conversations: allConversations });
});

app.get('/api/conversations/:id', (req, res) => {
  const { id } = req.params;
  if (conversations.has(id)) {
    res.json({
      success: true,
      conversationId: id,
      messages: conversations.get(id)
    });
  } else {
    res.status(404).json({ error: 'Conversation not found' });
  }
});

app.delete('/api/conversations/:id', (req, res) => {
  const { id } = req.params;
  if (conversations.has(id)) {
    conversations.delete(id);
    res.json({ success: true, message: 'Conversation cleared' });
  } else {
    res.status(404).json({ error: 'Conversation not found' });
  }
});

app.delete('/api/conversations', (req, res) => {
  conversations.clear();
  res.json({ success: true, message: 'All conversations cleared' });
});

// ============================================
// 🌐 ROOT
// ============================================
app.get('/', (req, res) => {
  res.json({
    name: 'MagnifiScience Chatbot API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /api/health',
      chat: 'POST /api/chat',
      conversations: 'GET /api/conversations'
    }
  });
});

// ============================================
// 🚀 START
// ============================================
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 MagnifiScience Chat Backend`);
  console.log(`${'='.repeat(50)}`);
  console.log(`📡 Running on: http://localhost:${PORT}`);
  console.log(`☁️  Ollama Cloud API: ${OLLAMA_HOST}`);
  console.log(`📋 Default model: ${DEFAULT_MODEL}`);
  console.log(`🔑 API Key set: ${!!OLLAMA_API_KEY}`);
  console.log(`\n✅ Test: http://localhost:${PORT}/api/health`);
  console.log(`${'='.repeat(50)}\n`);
});

export default app;