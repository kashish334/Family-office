import { useState, useRef, useEffect } from 'react';
import Navbar from '../components/ui/Navbar';
import { api } from '../services/api';
import { Send, Bot, User } from 'lucide-react';

interface Message { role: 'user' | 'assistant'; content: string; }

export default function AIAdvisor() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I\'m your AI financial advisor. I can help you analyze your spending, create budgets, and achieve your financial goals. What would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await api.ai.chat(userMsg.content, history);
      setMessages(m => [...m, { role: 'assistant', content: res.reply }]);
    } catch (e: any) {
      setMessages(m => [...m, { role: 'assistant', content: `Sorry, I encountered an error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'How is my spending this month?',
    'What can I do to save more?',
    'Analyze my budget usage',
    'Tips to reduce expenses',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navbar title="AI Advisor" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, overflow: 'hidden' }}>
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 500 }}>AI Financial Advisor</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Personalized insights powered by your real financial data</p>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, background: 'var(--warm-white)', borderRadius: 12, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: msg.role === 'user' ? 'var(--sage)' : 'var(--charcoal)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {msg.role === 'user' ? <User size={16} color="white" /> : <Bot size={16} color="white" />}
              </div>
              <div style={{ maxWidth: '75%', background: msg.role === 'user' ? 'var(--sage)' : 'white', color: msg.role === 'user' ? 'white' : 'var(--text-primary)', padding: '12px 16px', borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px', fontSize: 14, lineHeight: 1.6, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--charcoal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={16} color="white" />
              </div>
              <div style={{ background: 'white', padding: '12px 16px', borderRadius: '12px 12px 12px 4px', display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {suggestions.map(s => (
              <button key={s} onClick={() => setInput(s)}
                style={{ padding: '6px 14px', background: 'var(--warm-white)', border: '1px solid var(--border)', borderRadius: 20, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            style={{ flex: 1, padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 12, fontSize: 14, outline: 'none', background: 'white' }}
            placeholder="Ask about your finances…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
          />
          <button onClick={send} disabled={loading || !input.trim()}
            style={{ width: 48, height: 48, borderRadius: 12, background: loading || !input.trim() ? '#9ab89d' : 'var(--sage)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer' }}>
            <Send size={18} color="white" />
          </button>
        </div>
      </div>
    </div>
  );
}