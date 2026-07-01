import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'phi3:3.8b';

const AVAILABLE_MODELS = [
  'qwen3:4b',
  'llama3.1',
  'mistral',
  'gemma2',
  'phi3',
  'codellama'
];

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Ollama configuration
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_API_URL = `${OLLAMA_HOST}/api/chat`;

// Conversation storage
const conversations = new Map();

// Logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  console.log('✅ Health check requested');
  
  try {
    // Check if Ollama is running
    const ollamaHealth = await axios.get(`${OLLAMA_HOST}/api/tags`);
    const installedModels = ollamaHealth.data.models.map(m => m.name);
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      ollama: 'connected',
      models: installedModels.length > 0 ? installedModels : AVAILABLE_MODELS,
      defaultModel: DEFAULT_MODEL,
      apiType: 'ollama'
    });
  } catch (error) {
    console.error('❌ Ollama connection failed:', error.message);
    res.json({ 
      status: 'degraded', 
      timestamp: new Date().toISOString(),
      ollama: 'disconnected',
      models: AVAILABLE_MODELS,
      defaultModel: DEFAULT_MODEL,
      error: 'Ollama not running on localhost:11434'
    });
  }
});

// Chat completion endpoint - OLLAMA VERSION
app.post('/api/chat', async (req, res) => {
  console.log('💬 Chat request received');
  
  try {
    const { 
      message, 
      conversationId = null, 
      model = DEFAULT_MODEL,
      temperature = 1,
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

    // Call Ollama API
    const response = await axios.post(
      OLLAMA_API_URL,
      {
        model: model,
        messages: messages,
        stream: false,
        options: {
          temperature: temperature,
          num_predict: maxTokens
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 2 minute timeout for local models
      }
    );

    // Extract the assistant's reply from Ollama response
    const assistantReply = response.data.message.content;
    
    // Ollama doesn't provide token usage like NVIDIA, but we can estimate
    const usage = {
      total_tokens: response.data.eval_count || 0,
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
      apiType: 'ollama'
    });

  } catch (error) {
    console.error('❌ Ollama API Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Ollama is not running. Please start Ollama first with "ollama serve"' 
      });
    }
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      return res.status(error.response.status).json({ 
        error: `Ollama error: ${error.response.data.error || 'Unknown error'}` 
      });
    }

    res.status(500).json({ 
      error: 'An error occurred while processing your request.',
      details: error.message
    });
  }
});

// Get conversation history
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

// Clear conversation
app.delete('/api/conversations/:id', (req, res) => {
  const { id } = req.params;
  if (conversations.has(id)) {
    conversations.delete(id);
    res.json({ success: true, message: 'Conversation cleared' });
  } else {
    res.status(404).json({ error: 'Conversation not found' });
  }
});

// Get all conversations
app.get('/api/conversations', (req, res) => {
  const allConversations = Array.from(conversations.keys()).map(id => ({
    id,
    messageCount: conversations.get(id).length,
    lastMessage: conversations.get(id)[conversations.get(id).length - 1]?.content || ''
  }));
  res.json({ success: true, conversations: allConversations });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 MagnifiScience Chat Backend running on http://localhost:${PORT}`);
  console.log(`🦙 Ollama API: ${OLLAMA_API_URL}`);
  console.log(`📋 Available models: ${AVAILABLE_MODELS.join(', ')}`);
  console.log(`\n✅ Test the backend at: http://localhost:${PORT}/api/health\n`);
});