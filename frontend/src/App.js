import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaRobot, FaUser, FaPaperPlane, FaTrash, FaAtom } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './App.css';
import { sendMessageStream, getHealth, clearConversation } from './services/chatService';
import logo from './logo.png';

// Message component with watermark and streaming support
const Message = React.memo(({ message }) => {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;
  
  return (
    <div className={`message ${isUser ? 'user-message' : 'assistant-message'}`}>
      <div className="message-avatar">
        {isUser ? <FaUser /> : <FaRobot />}
      </div>
      <div className="message-content">
        {/* AI Response Watermark - Only for assistant messages */}
        {!isUser && (
          <div className="ai-watermark">
            <img src={logo} alt="MagnifiScience" className="watermark-logo" />
            <span className="watermark-text">MagnifiScience AI</span>
          </div>
        )}
        
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <>
            {message.content ? (
              <>
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
                {isStreaming && <span className="streaming-cursor">▋</span>}
              </>
            ) : (
              <div className="thinking-indicator">
                <span>Thinking</span>
                <div className="dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </>
        )}
        
        {message.usage && (
          <div className="message-usage">
            <small>⚡ {message.usage.total_tokens} tokens</small>
          </div>
        )}
      </div>
    </div>
  );
});

function App() {
  // ===== STATE DECLARATIONS =====
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [defaultModel, setDefaultModel] = useState('phi3:3.8b');

  const [settings, setSettings] = useState({
    model: 'qwen3-coder:480b-cloud',
    temperature: 0.7,
    maxTokens: 512,
    systemPrompt: 'You are an experienced and helpful science communicator at the MagnifiScience Centre.'
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Health check
  useEffect(() => {
    const checkConnection = async () => {
      console.log('🔍 Checking backend connection...');
      try {
        const health = await getHealth();
        console.log('✅ Backend health check successful:', health);
        setIsConnected(true);
        setError(null);
        
        if (health.defaultModel) {
          setDefaultModel(health.defaultModel);
          setSettings(prev => ({
            ...prev,
            model: health.defaultModel
          }));
        }
      } catch (err) {
        console.error('❌ Backend connection failed:', err);
        setIsConnected(false);
        setError('Cannot connect to backend. Make sure it\'s running on port 3001');
      }
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // ============================================
  // 🔥 HANDLE SEND WITH STREAMING
  // ============================================
  const handleSend = useCallback(async (e) => {
    e?.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput('');
    setError(null);
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    
    // Create a placeholder for the assistant's response
    const assistantId = Date.now();
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: '',
      id: assistantId,
      isStreaming: true
    }]);
    
    try {
      console.log('📤 Sending streaming message to backend...');
      let fullResponse = '';
      let hasReceivedContent = false;
      
      await sendMessageStream(
        {
          message: userMessage,
          conversationId,
          model: settings.model,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          systemPrompt: settings.systemPrompt
        },
        // onChunk - called for each piece of the response
        (chunk) => {
          hasReceivedContent = true;
          fullResponse += chunk;
          setMessages(prev => prev.map(msg => 
            msg.id === assistantId 
              ? { ...msg, content: fullResponse }
              : msg
          ));
        },
        // onComplete - called when response is complete
        (newConversationId, totalTokens) => {
          console.log('✅ Streaming complete');
          setConversationId(newConversationId);
          setMessages(prev => prev.map(msg => 
            msg.id === assistantId 
              ? { 
                  ...msg, 
                  isStreaming: false,
                  usage: totalTokens ? { total_tokens: totalTokens } : undefined
                }
              : msg
          ));
          setIsLoading(false);
        },
        // onError - called if there's an error
        (error) => {
          console.error('❌ Stream error:', error);
          setError(error || 'An error occurred');
          // Remove the placeholder message if no content was received
          if (!hasReceivedContent) {
            setMessages(prev => prev.filter(msg => msg.id !== assistantId));
          } else {
            // Keep what we have but mark as not streaming
            setMessages(prev => prev.map(msg => 
              msg.id === assistantId 
                ? { ...msg, isStreaming: false }
                : msg
            ));
          }
          setIsLoading(false);
        }
      );
      
    } catch (err) {
      console.error('❌ Send error:', err);
      setError(err.message || 'An error occurred');
      setMessages(prev => prev.filter(msg => msg.id !== assistantId));
      setIsLoading(false);
    } finally {
      inputRef.current?.focus();
    }
  }, [input, isLoading, conversationId, settings]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }, [handleSend]);

  const handleClearConversation = useCallback(async () => {
    if (messages.length === 0) return;
    
    if (conversationId) {
      try {
        await clearConversation(conversationId);
      } catch (err) {
        console.error('Clear error:', err);
      }
    }
    
    setMessages([]);
    setConversationId(null);
    setError(null);
    inputRef.current?.focus();
  }, [conversationId, messages.length]);

  const setSuggestion = (text) => {
    setInput(text);
    inputRef.current?.focus();
  };

  const isDeleteDisabled = messages.length === 0;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <img src={logo} alt="MagnifiScience Centre Logo" className="app-logo" />
            <div className="header-title">
              <span>AI Chat Assistant</span>
            </div>
            <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
          </div>
          <div className="header-right">
            <button 
              className={`icon-button ${isDeleteDisabled ? 'disabled' : ''}`}
              onClick={handleClearConversation}
              disabled={isDeleteDisabled}
              title={isDeleteDisabled ? 'No messages to clear' : 'Clear conversation'}
              aria-label="Clear conversation"
            >
              <FaTrash />
            </button>
          </div>
        </div>
      </header>

      <div className="chat-container">
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <FaAtom className="empty-icon" />
              <h2>Welcome to MagnifiScience Centre!</h2>
              <p>Ask me anything about science, our exhibits, or just explore the wonders of the universe.</p>
              <div className="suggestions">
                <button onClick={() => setSuggestion('What is the water cycle?')}>💧 Water Cycle</button>
                <button onClick={() => setSuggestion('Explain gravity like I\'m 5')}>🌍 Gravity</button>
                <button onClick={() => setSuggestion('How do volcanoes erupt?')}>🌋 Volcanoes</button>
                <button onClick={() => setSuggestion('Tell me a fun science fact')}>✨ Fun Fact</button>
              </div>
              <p style={{ fontSize: '14px', color: '#555', marginTop: '16px' }}>
                {isConnected ? '🔬 Start exploring science!' : '⏳ Connecting to the science lab...'}
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <Message key={index} message={msg} />
            ))
          )}
          {/* Show loading indicator when waiting for first token */}
          {isLoading && !messages.some(msg => msg.isStreaming) && (
            <div className="typing-indicator-wrapper">
              <div className="message-avatar">
                <FaRobot />
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="error-banner">
            ⚠️ {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        <form className="input-form" onSubmit={handleSend}>
          <div className="input-container">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a science question..."
              rows="1"
              disabled={isLoading || !isConnected}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading || !isConnected}
              className="send-button"
            >
              <FaPaperPlane />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;