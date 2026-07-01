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

// ============================================
// 🔥 CHAT ENDPOINT WITH STREAMING
// ============================================
app.post('/api/chat', async (req, res) => {
  console.log('💬 Chat request received (streaming)');
  
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

    console.log(`📤 Sending ${messages.length} messages to Ollama (streaming)`);

    // ============================================
    // SET UP STREAMING HEADERS
    // ============================================
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // ============================================
    // CALL OLLAMA WITH STREAMING
    // ============================================
    const response = await axios({
      method: 'POST',
      url: OLLAMA_API_URL,
      data: {
        model: model,
        messages: messages,
        stream: true,
        options: {
          temperature: temperature,
          num_predict: maxTokens,
          num_ctx: 2048
        }
      },
      headers: {
        'Content-Type': 'application/json'
      },
      responseType: 'stream',
      timeout: 600000 // 10 minutes
    });

    // Store conversation (without assistant response yet)
    const newConversationId = conversationId || `conv_${Date.now()}`;
    if (!conversations.has(newConversationId)) {
      conversations.set(newConversationId, []);
    }
    conversations.get(newConversationId).push(
      { role: 'user', content: message }
    );

    let fullResponse = '';
    let totalTokens = 0;

    // ============================================
    // STREAM THE RESPONSE TO THE CLIENT
    // ============================================
    response.data.on('data', (chunk) => {
      try {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.message && data.message.content) {
              const content = data.message.content;
              fullResponse += content;
              // Send each token to the client
              res.write(`data: ${JSON.stringify({ content: content, done: false })}\n\n`);
            }
            
            if (data.done) {
              totalTokens = data.total_duration || 0;
              // Update conversation with full response
              const lastConv = conversations.get(newConversationId);
              if (lastConv) {
                lastConv.push({ 
                  role: 'assistant', 
                  content: fullResponse 
                });
              }
              // Send completion signal
              res.write(`data: ${JSON.stringify({ 
                done: true, 
                conversationId: newConversationId,
                total_tokens: totalTokens 
              })}\n\n`);
            }
          }
        }
      } catch (err) {
        console.error('❌ Stream parsing error:', err.message);
      }
    });

    response.data.on('end', () => {
      console.log(`✅ Streaming complete (${fullResponse.length} chars)`);
      res.end();
    });

    response.data.on('error', (err) => {
      console.error('❌ Stream error:', err.message);
      res.write(`data: ${JSON.stringify({ error: err.message, done: true })}\n\n`);
      res.end();
    });

  } catch (error) {
    console.error('❌ Chat error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Ollama is not running. Please start Ollama first with "ollama serve"' 
      });
    }
    
    res.write(`data: ${JSON.stringify({ 
      error: error.response?.data?.error || error.message, 
      done: true 
    })}\n\n`);
    res.end();
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