import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // FIXED: Use relative URLs for production
  const generateWithMyAI = async (userPrompt) => {
    try {
      const response = await fetch("/ai/generate", { // Removed localhost:5000
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: userPrompt })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "AI service unavailable");
      }
      
      return await response.json();
    } catch (error) {
      throw new Error(error.message || "AI service unavailable");
    }
  };

  // FIXED: Use relative URL for status
  const checkAIStatus = async () => {
    try {
      const response = await fetch("/ai/status"); // Removed localhost:5000
      if (!response.ok) throw new Error("Failed to fetch status");
      const data = await response.json();
      setAiStatus(data);
    } catch (error) {
      setAiStatus({ status: "Offline", error: error.message });
    }
  };

  const handleSend = async () => {
    if (!prompt.trim()) return;

    const userMessage = { 
      type: "user", 
      text: prompt,
      timestamp: new Date().toLocaleTimeString()
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setPrompt("");
    setLoading(true);

    try {
      const aiResponse = await generateWithMyAI(prompt);
      
      setMessages([...newMessages, { 
        type: "ai", 
        text: prompt,
        image: aiResponse.image,
        source: aiResponse.source,
        enhancedPrompt: aiResponse.enhanced_prompt,
        createdBy: aiResponse.created_by,
        timestamp: new Date().toLocaleTimeString(),
        aiName: aiResponse.ai_name
      }]);
      
    } catch (error) {
      setMessages([...newMessages, { 
        type: "error", 
        text: error.message,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  if (isInitialLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <img 
            src="/profile.png" 
            alt="AI Profile" 
            className="profile-image"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="profile-placeholder">AI</div>
          <h1 className="loading-title">Welcome to My AI</h1>
          <div className="loading-spinner"></div>
          <p className="loading-text">Initializing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="title">AI Image Generator</h1>
          <button onClick={checkAIStatus} className="status-button">
            System Status
          </button>
        </div>
      </header>

      {aiStatus && (
        <div className="status-card">
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">Name</span>
              <span className="status-value">{aiStatus.ai_name || 'N/A'}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Status</span>
              <span className="status-value">{aiStatus.status || 'Unknown'}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Version</span>
              <span className="status-value">{aiStatus.version || 'N/A'}</span>
            </div>
          </div>
          {aiStatus.capabilities && aiStatus.capabilities.length > 0 && (
            <div className="capabilities">
              <span className="status-label">Capabilities</span>
              <div className="caps-list">
                {aiStatus.capabilities.map((cap, idx) => (
                  <span key={idx} className="cap-badge">{cap}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="main-content">
        <div className="chat-container">
          {messages.length === 0 && (
            <div className="empty-state">
              <h2 className="empty-title">Start Creating</h2>
              <p className="empty-text">
                Describe the image you want to generate
              </p>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.type}-message`}>
              <div className="message-header">
                <span className="message-sender">
                  {msg.type === 'user' ? 'You' : msg.type === 'ai' ? 'AI' : 'System'}
                </span>
                <span className="message-time">{msg.timestamp}</span>
              </div>
              
              <div className="message-content">
                {msg.type === "user" && (
                  <p className="message-text">{msg.text}</p>
                )}
                
                {msg.type === "ai" && (
                  <>
                    <p className="message-text">{msg.text}</p>
                    {msg.enhancedPrompt && (
                      <div className="enhanced-prompt">
                        <span className="enhanced-label">Enhanced</span>
                        <span className="enhanced-text">{msg.enhancedPrompt}</span>
                      </div>
                    )}
                    <img src={msg.image} alt="Generated" className="generated-image" />
                    {msg.source && (
                      <div className="source-info">
                        {msg.source} • {msg.createdBy}
                      </div>
                    )}
                  </>
                )}
                
                {msg.type === "error" && (
                  <div className="error-message">{msg.text}</div>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="message ai-message">
              <div className="message-header">
                <span className="message-sender">AI</span>
              </div>
              <div className="message-content">
                <div className="loading-message">
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <p className="loading-message-text">Generating</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="input-section">
          {messages.length > 0 && (
            <button 
              onClick={clearChat} 
              className="clear-button"
              disabled={loading}
            >
              Clear
            </button>
          )}
          <div className="input-container">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe what you want to create..."
              disabled={loading}
              className="input"
            />
            <button 
              onClick={handleSend} 
              disabled={loading || !prompt.trim()}
              className="send-button"
            >
              {loading ? "Generating" : "Generate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;