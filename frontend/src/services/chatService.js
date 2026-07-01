// In App.js, replace the handleSend function with this:

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
    // Remove the placeholder if it exists
    setMessages(prev => prev.filter(msg => msg.id !== assistantId));
    setIsLoading(false);
  } finally {
    inputRef.current?.focus();
  }
}, [input, isLoading, conversationId, settings]);