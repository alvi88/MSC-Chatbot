import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaRobot, FaUser, FaPaperPlane, FaTrash, FaAtom } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './App.css';
import { webSearch, getHealth, clearConversation } from './services/chatService';
import logo from './logo.png';

// Message component with watermark and search results
const Message = React.memo(({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`message ${isUser ? 'user-message' : 'assistant-message'}`}>
      <div className="message-avatar">
        {isUser ? <FaUser /> : <FaRobot />}
      </div>
      <div className="message-content">
        {!isUser && (
          <div className="ai-watermark">
            <img src={logo} alt="MagnifiScience" className="watermark-logo" />
            <span className="watermark-text">MagnifiScience AI</span>
          </div>
        )}
        
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <div className="web-search-results">
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
            
            {message.results && message.results.length > 0 && (
              <div className="search-sources">
                <h4>📚 Sources:</h4>
                <ul>
                  {message.results.map((result, index) => (
                    <li key={index}>
                      <a href={result.url} target="_blank" rel="noopener noreferrer">
                        {result.title || result.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        <div className="message-footer">
          {message.usage && (
            <div className="message-usage">
              <small>⚡ {message.usage.prompt_tokens || 0} tokens</small>
            </div>
          )}
          
          {!isUser && message.results && message.results.length > 0 && (
            <div className="message-usage search-stats">
              <small>🔍 Found {message.results.length} results</small>
            </div>
          )}
        </div>
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
  // 🔥 FOCUS INPUT HELPER
  // ============================================
  const focusInput = useCallback(() => {
    // Small delay to ensure the DOM is updated
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 50);
  }, []);

  // ============================================
  // 🔥 HANDLE SEND - Web Search
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
    
    try {
      console.log('🔍 Calling web search for:', userMessage);
      const response = await webSearch(userMessage, 5);
      
      console.log('📥 Web search response:', response);
      
      if (response.success && response.results) {
        const formattedResults = formatSearchResults(response.results);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: formattedResults,
          results: response.results
        }]);
      } else {
        setError(response.error || 'Failed to get search results');
      }
    } catch (err) {
      console.error('❌ Search error:', err);
      setError(err.error || err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
      // ✅ Focus input after response is displayed
      focusInput();
    }
  }, [input, isLoading, focusInput]);

  // ============================================
  // 🔥 Format Search Results
  // ============================================
  const formatSearchResults = (results) => {
    if (!results || results.length === 0) {
      return 'No results found. Please try a different query.';
    }
    
    let formatted = `🔍 **Search Results for your query:**\n\n`;
    
    results.forEach((result, index) => {
      const title = result.title || 'Untitled';
      const content = result.content || 'No description available';
      
      formatted += `### ${index + 1}. ${title}\n`;
      formatted += `📝 ${content}\n\n`;
    });
    
    return formatted;
  };

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
    // ✅ Focus input after clearing
    focusInput();
  }, [conversationId, messages.length, focusInput]);

  const setSuggestion = (text) => {
    setInput(text);
    // ✅ Focus input after setting suggestion
    focusInput();
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
          
          {isLoading && (
            <div className="thinking-container">
              <div className="thinking-bubble">
                <div className="thinking-avatar">
                  <FaRobot />
                </div>
                <div className="thinking-content">
                  <div className="thinking-text">
                    <span>🔍 Searching the web...</span>
                  </div>
                  <div className="thinking-subtext">
                    <span className="sparkle">✨</span>
                    <span>Finding the best results for you...</span>
                  </div>
                  <div className="thinking-progress">
                    <div className="progress-bar">
                      <div className="progress-fill"></div>
                    </div>
                  </div>
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