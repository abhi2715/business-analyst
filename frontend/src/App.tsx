import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Trash2, ArrowLeft, Database as DbIcon, Upload } from 'lucide-react';
import axios from 'axios';
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
  resultTable?: { columns: string[]; rows: Record<string, any>[]; rowCount: number; sql: string } | null;
}

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'dashboard' | 'chat'>('home');
  const [dashboardData, setDashboardData] = useState<any>(null);

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'bot', content: 'Hello! I\'m your AI Data Analyst. Upload a dataset and I\'ll help you explore it.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [db, setDb] = useState<any>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);

  useEffect(() => {
    initDuckDB().then(database => {
      setDb(database);
      console.log("DuckDB initialized");
    }).catch(e => console.error(e));
  }, []);

  const scrollToBottom = (force = false) => {
    if (!force && userScrolledUpRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Track whether the user has manually scrolled up
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // If user is within 120px of the bottom, consider them "at bottom"
      userScrolledUpRef.current = scrollHeight - scrollTop - clientHeight > 120;
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [view]); // re-attach when view changes

  const handleReset = () => {
    setView('home');
    setSelectedFile(null);
    setDashboardData(null);
    userScrolledUpRef.current = false;
    setMessages([
      { id: '1', role: 'bot', content: 'Hello! I\'m your AI Data Analyst. Upload a dataset and I\'ll help you explore it.' }
    ]);
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = async (overrideInput?: string) => {
    const messageText = overrideInput || input;
    if ((!messageText.trim() && !selectedFile) || isLoading) return;

    // User just sent a message, so reset scroll lock so we auto-scroll to their message
    userScrolledUpRef.current = false;

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
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const text = line.slice(6);
              if (text === '[DONE]') break;
              try {
                const parsed = JSON.parse(text);
                fullContent += parsed.content || '';
                setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: fullContent } : m));
              } catch (_e) {
                // Ignore partial JSON
              }
            }
          }
        }
      }

      // After streaming: extract SQL and execute locally
      const sqlMatches = [...fullContent.matchAll(/```(?:sql)?\n([\s\S]*?)\n```/g)];
      const validSqls = sqlMatches.map(m => m[1].trim()).filter(sql => sql.length > 5);

      if (validSqls.length > 0 && db) {
        const sql = validSqls[validSqls.length - 1];
        try {
          const result = await executeSQL(db, sql);
          const columns = result.length > 0 ? Object.keys(result[0]) : [];
          const displayRows = result.slice(0, 20);

          // Add result as a separate message with table data
          const resultMsg: Message = {
            id: (Date.now() + 2).toString(),
            role: 'bot',
            content: '',
            resultTable: { columns, rows: displayRows, rowCount: result.length, sql }
          };
          setMessages(prev => [...prev, resultMsg]);
        } catch (e: any) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'bot',
            content: `**SQL Execution Error**\n\n\`${e.message}\``,
            isError: true
          }]);
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream stopped');
      } else {
        console.error(error);
        setMessages(prev => prev.map(m => m.id === botMsgId
          ? { ...m, content: m.content + '\n\n*Connection lost.*', isError: true }
          : m
        ));
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
    const contextMsg = messages.find(m => m.id === '0');
    const base: Message = { id: '1', role: 'bot', content: 'Chat cleared. How can I help you?' };
    setMessages(contextMsg ? [contextMsg, base] : [base]);
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
        console.log("CSV loaded into DuckDB as 'dataset'");
      }

      setDashboardData(response.data);

      const systemContext = `The user has uploaded "${file.name}". Schema info:
- Total Rows: ${response.data.rowCount}
- Columns: ${response.data.columns.join(', ')}
${response.data.totalSales ? `- Total Sales/Revenue: ${response.data.totalSales}` : ''}
${response.data.totalProfit ? `- Total Profit: ${response.data.totalProfit}` : ''}
- Column Stats: ${JSON.stringify(response.data.columnStats)}`;

      setMessages([
        { id: '0', role: 'user', content: systemContext },
        { id: '1', role: 'bot', content: `I've analyzed **${file.name}**. Head to the Dashboard for visuals, or ask me anything about your data!` }
      ]);

      const cols = response.data.columns;
      const suggestions = [
        `What is the total ${response.data.totalSales ? 'revenue' : 'count'}?`,
        `Show me the average ${cols.find((c: string) => c.toLowerCase().includes('profit') || c.toLowerCase().includes('amount') || c.toLowerCase().includes('cost') || c.toLowerCase().includes('revenue')) || cols[0]}`,
        `Group the data by ${response.data.categoricalColumns ? Object.keys(response.data.categoricalColumns)[0] || cols[1] : cols[1]}`
      ].filter(Boolean);
      setSuggestedQuestions(suggestions);

      setView('dashboard');
    } catch (error) {
      console.error(error);
      alert('Failed to analyze file. Check if the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clean <think> tags from display
  const cleanContent = (text: string) => text.replace(/<think>[\s\S]*?(<\/think>|$)/g, '').trim();

  // Render a result table
  const ResultTable = ({ data }: { data: NonNullable<Message['resultTable']> }) => (
    <div style={{ animation: 'fadeInUp 0.3s ease both' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px',
        fontSize: '12px', fontWeight: '600', color: 'var(--accent-tertiary)',
        textTransform: 'uppercase', letterSpacing: '0.5px'
      }}>
        <DbIcon size={14} /> Query Result
      </div>
      <div className="result-table-wrapper">
        <div style={{ overflowX: 'auto' }}>
          <table className="result-table">
            <thead>
              <tr>
                {data.columns.map(col => <th key={col}>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, i) => (
                <tr key={i}>
                  {data.columns.map(col => (
                    <td key={col}>
                      {row[col] !== null && row[col] !== undefined ? String(row[col]) : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="result-summary">
          {data.rowCount <= 20
            ? `${data.rowCount} row${data.rowCount !== 1 ? 's' : ''} returned`
            : `Showing 20 of ${data.rowCount} rows`
          }
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Background Orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>

      <div className="app-container">
        {view === 'home' && (
          <Home onFileSelect={handleFileUpload} isLoading={isLoading} />
        )}

        {view === 'dashboard' && dashboardData && (
          <Dashboard data={dashboardData} onStartChat={() => setView('chat')} onBackToUpload={handleReset} />
        )}

        {view === 'chat' && (
          <>
            {/* Sidebar */}
            <aside className="sidebar glass">
              <div className="chat-header">
                <h1>Data Analyst</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                  AI-powered data exploration
                </p>
              </div>

              <div style={{ flex: 1 }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button className="sidebar-btn" onClick={() => setView('dashboard')}>
                  <ArrowLeft size={15} /> Back to Dashboard
                </button>
                <button className="sidebar-btn" onClick={handleReset}>
                  <Upload size={15} /> Upload New File
                </button>
                <button className="sidebar-btn danger" onClick={clearChat}>
                  <Trash2 size={15} /> Clear Chat
                </button>
              </div>
            </aside>

            {/* Main Chat Area */}
            <main className="main-chat glass">
              <div className="messages-container" ref={messagesContainerRef}>
                {messages.filter(m => m.id !== '0').map((msg) => (
                  <div key={msg.id} className={`message-bubble ${msg.role}`}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                        background: msg.role === 'bot'
                          ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                          : 'rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {msg.role === 'bot' ? <Bot size={15} /> : <User size={15} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {msg.content && (
                          <div className="markdown-body" style={{
                            color: msg.isError ? 'var(--danger)' : 'inherit', width: '100%'
                          }}>
                            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                              {cleanContent(msg.content)}
                            </ReactMarkdown>
                          </div>
                        )}
                        {msg.resultTable && <ResultTable data={msg.resultTable} />}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="message-bubble bot">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Bot size={15} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--accent-tertiary)' }} />
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Questions */}
              {suggestedQuestions.length > 0 && messages.length < 5 && (
                <div style={{ padding: '0 24px 8px 24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {suggestedQuestions.map((q, i) => (
                    <button key={i} className="suggestion-chip" onClick={() => handleSend(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Bar */}
              <div className="input-container glass" style={{ position: 'relative' }}>
                {isLoading && (
                  <button className="stop-btn" onClick={stopGeneration}>
                    Stop generating
                  </button>
                )}
                <input
                  className="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about your data..."
                  disabled={isLoading}
                />
                <button
                  className="send-btn"
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                >
                  <Send size={16} />
                </button>
              </div>
            </main>
          </>
        )}
      </div>
    </>
  );
};

export default App;
