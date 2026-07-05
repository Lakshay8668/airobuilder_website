import { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw } from 'lucide-react';

function ElapsedTimer() {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return <span style={{ fontSize: 10, color: '#aaa', marginLeft: 4 }}>{secs}s</span>;
}

export default function ChatPanel({ messages, isGenerating, onSend, onReset, activePageName }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  function send() {
    const t = input.trim();
    if (!t || isGenerating) return;
    setInput('');
    if (textRef.current) textRef.current.style.height = 'auto';
    onSend(t);
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <span>Chat{activePageName ? ` · ${activePageName}` : ''}</span>
        {messages.length > 0 && (
          <button onClick={onReset} className="btn" style={{ padding: '3px 8px', fontSize: 11 }}>
            <RotateCcw size={10} /> New
          </button>
        )}
      </div>

      <div className="chat-msgs">
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 40, color: '#ccc', fontSize: 12 }}>
            Describe what you want to build and Gemini will generate it.
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className="fade-up">
            {m.role === 'user' ? (
              <div className="msg-user">
                <div className="bubble-user">{m.content}</div>
              </div>
            ) : (
              <div className="msg-ai">
                <div className="ai-av">AI</div>
                <div className="bubble-ai">
                  {m.streaming
                    ? <><span style={{ color: '#888' }}>{m.content || 'Generating'}</span> <span className="dot" /><span className="dot" /><span className="dot" /></>
                    : m.content}
                  {m.hasCode && !m.streaming && (
                    <div><span className="gen-badge">✓ Page generated</span></div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {isGenerating && messages[messages.length - 1]?.role !== 'ai' && (
          <div className="msg-ai fade-up">
            <div className="ai-av">AI</div>
            <div className="bubble-ai" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="dot" /><span className="dot" /><span className="dot" />
              <ElapsedTimer />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        <div className="chat-input-wrap">
          <textarea
            ref={textRef}
            className="chat-textarea"
            placeholder={`Ask AI to build or edit ${activePageName || 'this page'}...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
            }}
          />
          <button className="chat-send" onClick={send} disabled={!input.trim() || isGenerating}>
            {isGenerating
              ? <div className="spinner" style={{ width: 12, height: 12, borderTopColor: '#fff' }} />
              : <Send size={13} color="#fff" />}
          </button>
        </div>
        <div className="chat-hint">
          {isGenerating ? '⏳ Gemini is building your page — usually 15–30s' : 'Shift+Enter for new line'}
        </div>
      </div>
    </div>
  );
}
