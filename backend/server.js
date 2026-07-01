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
// Use cloud endpoint instead of localhost
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'https://ollama.com/api';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;

// Cloud model names (append -cloud suffix)
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'gpt-oss:120b-cloud';

// Available cloud models [citation:1][citation:9]
const AVAILABLE_MODELS = [
  'gpt-oss:120b-cloud',
  'gpt-oss:20b-cloud',
  'qwen3-coder:480b-cloud',
  'deepseek-v3.1:671b-cloud',
  'glm-4.6:cloud',
  'kimi-k2.6'
];

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ============================================
// 🔥 HEALTH CHECK (Cloud Version)
// ============================================
app.get('/api/health', async (req, res) => {
  console.log('✅ Health check requested');
  
  try {
    // Check if Ollama Cloud API is accessible
    const ollamaHealth = await axios.get('https://ollama.com/api/tags', {
      headers: {
        'Authorization': `Bearer ${OLLAMA_API_KEY}`
      }
    });
    
    const installedModels = ollamaHealth.data.models?.map(m => m.name) || [];
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      ollama: 'cloud-connected',
      models: installedModels.length > 0 ? installedModels : AVAILABLE_MODELS,
      defaultModel: DEFAULT_MODEL,
      apiType: 'ollama-cloud'
    });
  } catch (error) {
    console.error('❌ Ollama Cloud connection failed:', error.message);
    res.json({ 
      status: 'degraded', 
      timestamp: new Date().toISOString(),
      ollama: 'cloud-disconnected',
      models: AVAILABLE_MODELS,
      defaultModel: DEFAULT_MODEL,
      error: 'Check your OLLAMA_API_KEY'
    });
  }
});

// ============================================
// 🔥 CHAT ENDPOINT (Ollama Cloud with Streaming)
// ============================================
app.post('/api/chat', async (req, res) => {
  console.log('💬 Chat request received (Ollama Cloud)');
  
  try {
    const { 
      message, 
      conversationId = null, 
      model = DEFAULT_MODEL,
      temperature = 0.7,
      maxTokens = 1024,
      systemPrompt = 'You are an experienced and helpful science communicator at the MagnifiScience Centre.'
    } = req.body;

    console.log(`📝 Message: ${message?.substring(0, 50)}...`);
    console.log(`🤖 Model: ${model}`);

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Set up streaming headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // ============================================
    // 🔥 CALL OLLAMA CLOUD API
    // ============================================
    const response = await axios({
      method: 'POST',
      url: `${OLLAMA_HOST}/chat`,
      data: {
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        stream: true,
        options: {
          temperature: temperature,
          num_predict: maxTokens
        }
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OLLAMA_API_KEY}`
      },
      responseType: 'stream',
      timeout: 600000
    });

    let fullResponse = '';

    // Stream the response to the client
    response.data.on('data', (chunk) => {
      try {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.message && data.message.content) {
              const content = data.message.content;
              fullResponse += content;
              res.write(`data: ${JSON.stringify({ content: content, done: false })}\n\n`);
            }
            if (data.done) {
              res.write(`data: ${JSON.stringify({ 
                done: true, 
                conversationId: conversationId || `conv_${Date.now()}`,
                total_tokens: data.total_duration || 0 
              })}\n\n`);
            }
          }
        }
      } catch (err) {
        console.error('Stream parsing error:', err);
      }
    });

    response.data.on('end', () => {
      res.end();
    });

    response.data.on('error', (err) => {
      console.error('Stream error:', err);
      res.write(`data: ${JSON.stringify({ error: err.message, done: true })}\n\n`);
      res.end();
    });

  } catch (error) {
    console.error('❌ Chat error:', error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        error: 'Invalid Ollama Cloud API key. Please check your OLLAMA_API_KEY' 
      });
    }
    
    res.write(`data: ${JSON.stringify({ 
      error: error.response?.data?.error || error.message, 
      done: true 
    })}\n\n`);
    res.end();
  }
});

// ... (conversation endpoints remain the same) ...

app.listen(PORT, () => {
  console.log(`\n🚀 MagnifiScience Chat Backend running on http://localhost:${PORT}`);
  console.log(`☁️  Ollama Cloud API: ${OLLAMA_HOST}`);
  console.log(`📋 Default model: ${DEFAULT_MODEL}`);
  console.log(`🔑 API Key set: ${!!OLLAMA_API_KEY}`);
  console.log(`\n✅ Test the backend at: http://localhost:${PORT}/api/health\n`);
});