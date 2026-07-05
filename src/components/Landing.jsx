import { useState, useRef } from 'react';
import { Trash2, Clock } from 'lucide-react';

const CHIPS = [
  'Web Agency Website', 'Restaurant', 'Portfolio',
  'SaaS Landing Page', 'Product Launch', 'Boutique Store',
  'Local Food Truck', 'Photography Studio', 'Law Firm',
];

const COLORS = ['#2563eb','#7c3aed','#db2777','#ea580c','#16a34a','#0891b2','#d97706','#dc2626'];

function timeAgo(ts) {
  const d = Date.now() - ts, m = Math.floor(d / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const day = Math.floor(h / 24);
  return day < 7 ? `${day}d ago` : new Date(ts).toLocaleDateString();
}

export default function Landing({ onStart, projects = [], onOpenProject, onDeleteProject }) {
  const [input, setInput] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const textRef = useRef(null);

  function submit() {
    const t = input.trim();
    if (!t) return;
    onStart(t);
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  }

  function useChip(c) {
    setInput(c);
    setTimeout(() => textRef.current?.focus(), 0);
  }

  function handleDel(e, id) {
    e.stopPropagation();
    if (confirmDel === id) { onDeleteProject(id); setConfirmDel(null); }
    else { setConfirmDel(id); setTimeout(() => setConfirmDel(null), 2500); }
  }

  return (
    <div className="landing">
      {/* Logo */}
      <div className="landing-logo">
        <div className="landing-logo-mark">A</div>
        <span className="landing-logo-name">AI Builder</span>
      </div>

      <h1 className="landing-headline">What do you want to build?</h1>
      <p className="landing-sub">
        Describe your website — powered by Gemini AI.<br />
        Live for everyone, no setup required.
      </p>

      {/* Input box */}
      <div className="landing-box">
        <textarea
          ref={textRef}
          className="landing-textarea"
          placeholder="e.g. A modern restaurant website with menu, about, and contact pages..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          autoFocus
          onInput={e => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
          }}
        />
        <div className="landing-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#aaa' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s ease-in-out infinite' }} />
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
            Gemini 2.5 Flash
          </div>
          <button
            className="build-btn"
            onClick={submit}
            disabled={!input.trim()}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            Build it
          </button>
        </div>
      </div>

      {/* Chips */}
      <div className="chips">
        {CHIPS.map(c => (
          <button key={c} className="chip" onClick={() => useChip(c)}>{c}</button>
        ))}
      </div>

      <p style={{ marginTop: 28, fontSize: 11, color: '#bbb', textAlign: 'center' }}>
        Press Enter or click Build it · Shift+Enter for new line
      </p>

      {/* Projects */}
      {projects.length > 0 && (
        <div style={{ width: '100%', maxWidth: 880, marginTop: 52 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 14 }}>
            Your Projects ({projects.length})
          </div>
          <div className="projects-grid">
            {projects.map((p, i) => (
              <div key={p.id} className="project-card" onClick={() => onOpenProject(p.id)}>
                <div className="project-thumb" style={{ background: `${COLORS[i % COLORS.length]}18` }}>
                  {p.logo
                    ? <div style={{ width: 44, height: 44 }} dangerouslySetInnerHTML={{ __html: p.logo }} />
                    : <div style={{ width: 36, height: 36, borderRadius: 9, background: COLORS[i % COLORS.length], color: '#fff', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {(p.projectName || 'W')[0].toUpperCase()}
                      </div>
                  }
                  <button
                    className="project-del"
                    onClick={e => handleDel(e, p.id)}
                    style={{ color: confirmDel === p.id ? '#dc2626' : '#999', background: confirmDel === p.id ? '#fee2e2' : 'rgba(255,255,255,.9)' }}
                    title={confirmDel === p.id ? 'Click again to delete' : 'Delete'}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="project-info">
                  <div className="project-name">{p.projectName || 'Untitled'}</div>
                  <div className="project-meta" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={9} /> {timeAgo(p.updatedAt)}
                    {Object.values(p.pagesHTML || {}).filter(Boolean).length > 0 &&
                      <span style={{ marginLeft: 4 }}>· {Object.values(p.pagesHTML).filter(Boolean).length} page(s)</span>
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
