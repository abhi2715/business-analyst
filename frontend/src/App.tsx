import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Trash2, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import Cursor from './components/Cursor';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import { initDuckDB, loadCSVIntoDuckDB, executeSQL } from './duckdb';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  isError?: boolean;
}

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'dashboard' | 'chat'>('home');
  const [dashboardData, setDashboardData] = useState<any>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'bot', content: 'Hello! I am your AI Data Analyst. I have analyzed your data. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [db, setDb] = useState<any>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initDuckDB().then(database => {
      setDb(database);
      console.log("DuckDB Initialized locally");
    }).catch(e => console.error(e));
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (overrideInput?: string) => {
    const messageText = overrideInput || input;
    if ((!messageText.trim() && !selectedFile) || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText || `Uploaded file: ${selectedFile?.name}`
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const botMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: botMsgId, role: 'bot', content: '' }]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          history: messages.map(m => ({ role: m.role === 'bot' ? 'assistant' : m.role, content: m.content }))
        }),
        signal: abortController.signal
      });

      if (!response.ok) throw new Error('Network response was not ok');
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          
          // Basic SSE Parsing (assuming backend sends data: chunk)
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const text = line.slice(6);
              if (text === '[DONE]') break;
              try {
                const parsed = JSON.parse(text);
                fullContent += parsed.content || '';
                setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: fullContent } : m));
              } catch (e) {
                // Ignore partial JSON chunks
              }
            }
          }
        }
      }

      // After streaming is done, check for SQL
      let sqlMatch = fullContent.match(/```sql\n([\s\S]*?)\n```/);
      if (sqlMatch && db) {
        try {
          const sql = sqlMatch[1];
          const result = await executeSQL(db, sql);
          const resultMsg: Message = {
            id: (Date.now() + 2).toString(),
            role: 'bot',
            content: `**Query Executed Locally:**\n\`\`\`json\n${JSON.stringify(result.slice(0, 5), null, 2)}\n\`\`\`\n*(Showing top 5 rows)*`
          };
          setMessages(prev => [...prev, resultMsg]);
        } catch (e: any) {
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'bot', content: `❌ **SQL Execution Failed:**\n\`\`\`text\n${e.message}\n\`\`\`` }]);
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream stopped by user');
      } else {
        console.error(error);
        setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: m.content + '\n\n*Error: Connection lost.*', isError: true } : m));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const clearChat = () => {
    setMessages([{ id: '1', role: 'bot', content: 'Chat history cleared. How can I assist you now?' }]);
  };

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setSelectedFile(file);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/chat/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (db) {
        await loadCSVIntoDuckDB(db, file, 'dataset');
        console.log("CSV loaded into local DuckDB engine as 'dataset'");
      }

      setDashboardData(response.data);
      
      // Inject context into the chat history for the AI
      const systemContext = `The user has uploaded a file named ${file.name}. Here are the KPIs calculated by the system:
- Total Rows: ${response.data.rowCount}
- Columns: ${response.data.columns.join(', ')}
${response.data.totalSales ? `- Total Sales: $${response.data.totalSales}` : ''}
${response.data.totalProfit ? `- Total Profit: $${response.data.totalProfit}` : ''}
- Column Averages: ${JSON.stringify(response.data.columnStats)}`;
      
      setMessages([
        { id: '0', role: 'user', content: systemContext }, // Hidden context message
        { id: '1', role: 'bot', content: `I've analyzed ${file.name}. Let's look at the Dashboard, or ask me any questions about the data!` }
      ]);
      
      // Generate suggested questions based on columns
      const cols = response.data.columns;
      const suggestions = [
        `What is the total ${response.data.totalSales ? 'sales' : 'count'}?`,
        `Show me the average ${cols.find((c:string) => c.toLowerCase().includes('profit') || c.toLowerCase().includes('amount') || c.toLowerCase().includes('price')) || cols[0]}`,
        `Group the data by ${response.data.categoricalColumns ? Object.keys(response.data.categoricalColumns)[0] || cols[1] : cols[1]}`
      ].filter(Boolean);
      setSuggestedQuestions(suggestions);

      setView('dashboard');
    } catch (error) {
      console.error(error);
      alert('Failed to analyze the file. Please check the backend.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Cursor />
      
      {/* Background Orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      
      <div className="app-container">
        {view === 'home' && (
          <Home onFileSelect={handleFileUpload} isLoading={isLoading} />
        )}
        
        {view === 'dashboard' && dashboardData && (
          <Dashboard data={dashboardData} onStartChat={() => setView('chat')} />
        )}

        {view === 'chat' && (
          <>
            <aside className="sidebar glass">
              <div className="chat-header">
                <h1>Data Analytics Bot</h1>
              </div>
              
              <div className="sidebar-content" style={{ flex: 1, display: 'block', overflowY: 'auto', paddingBottom: '80px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                  Ask questions about your uploaded data. The AI has context about your KPIs and metrics.
                </p>
                
                <button 
                  onClick={() => setView('dashboard')}
                  style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    color: 'var(--accent-primary)',
                    padding: '12px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '24px',
                    width: '100%',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                    cursor: 'pointer'
                  }}
                >
                  <ArrowLeft size={16} /> Back to Dashboard
                </button>

                <button 
                  onClick={clearChat}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    padding: '12px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    position: 'absolute',
                    bottom: '24px',
                    left: '24px',
                    right: '24px',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={16} /> Clear Conversation
                </button>
              </div>
            </aside>

            <main className="main-chat glass">
              <div className="messages-container">
                {messages.filter(m => m.id !== '0').map((msg) => ( // Don't show hidden context
                  <div key={msg.id} className={`message-bubble ${msg.role}`}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: msg.role === 'bot' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        boxShadow: msg.role === 'bot' ? '0 0 15px rgba(99, 102, 241, 0.4)' : 'none'
                      }}>
                        {msg.role === 'bot' ? <Bot size={18} /> : <User size={18} />}
                      </div>
                      <div className="markdown-body" style={{ color: msg.isError ? '#ef4444' : 'inherit', width: '100%' }}>
                        <ReactMarkdown rehypePlugins={[rehypeRaw]}>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="message-bubble bot">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: 'var(--accent-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Bot size={18} />
                      </div>
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {suggestedQuestions.length > 0 && messages.length < 5 && (
                <div style={{ padding: '0 24px 12px 24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {suggestedQuestions.map((q, i) => (
                    <button key={i} onClick={() => handleSend(q)} style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', color: '#a5b4fc', padding: '6px 12px', borderRadius: '16px', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <div className="input-container glass" style={{ padding: '8px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', position: 'relative' }}>
                {isLoading && (
                  <button onClick={stopGeneration} style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 16px', borderRadius: '16px', fontSize: '12px', cursor: 'pointer', zIndex: 10 }}>
                    Stop Generation
                  </button>
                )}
                <input 
                  className="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me about your data..."
                  disabled={isLoading}
                />
                <button className="send-btn" onClick={() => handleSend()} disabled={isLoading || !input.trim()}>
                  <Send size={18} style={{ transform: 'translateX(-1px)' }} />
                </button>
              </div>
            </main>
          </>
        )}
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default App;
