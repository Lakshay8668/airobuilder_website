import { useState, useEffect } from 'react';
import { X, RefreshCw, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { checkConnection } from '../ai.js';

export default function StatusModal({ onClose }) {
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState('');

  async function check() {
    setStatus('checking'); setError('');
    const r = await checkConnection();
    if (r.ok) setStatus('ok');
    else { setStatus('error'); setError(r.error || 'Unknown error'); }
  }

  useEffect(() => { check(); }, []);

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ fontSize:16, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
            <Sparkles size={16}/> AI Status
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#aaa', padding:4 }}><X size={18}/></button>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:10, border:`1px solid ${status==='ok'?'#bbf7d0':status==='error'?'#fecaca':'#e5e5e5'}`, background:status==='ok'?'#f0fdf4':status==='error'?'#fef2f2':'#f9f9f9', marginBottom:14 }}>
          {status==='ok' ? <CheckCircle size={16} color="#16a34a"/>
            : status==='error' ? <AlertCircle size={16} color="#dc2626"/>
            : <div className="spinner" style={{width:16,height:16}}/>}
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:500,color:'#111'}}>
              {status==='ok'?'Connected — Gemini is ready':status==='error'?'Connection failed':'Checking...'}
            </div>
            <div style={{fontSize:11,color:'#aaa'}}>via /api/generate → Gemini 2.5 Flash</div>
          </div>
          <button onClick={check} disabled={status==='checking'} className="btn" style={{padding:'4px 8px'}}>
            <RefreshCw size={11}/> Retry
          </button>
        </div>

        {status==='error' && (
          <div style={{padding:'12px 14px',background:'#f9f9f9',border:'1px solid #e5e5e5',borderRadius:8,fontSize:12,color:'#555',lineHeight:1.7,marginBottom:14}}>
            <strong>Error:</strong> {error}<br/><br/>
            If you're the site owner: make sure <code style={{background:'#f0f0f0',padding:'1px 6px',borderRadius:4,fontFamily:'monospace',fontSize:11}}>GEMINI_API_KEY</code> is set in Vercel Environment Variables and redeploy.
          </div>
        )}

        {status==='ok' && (
          <div style={{padding:'12px 14px',background:'#f9f9f9',border:'1px solid #e5e5e5',borderRadius:8,fontSize:12,color:'#888',lineHeight:1.6,marginBottom:14}}>
            Powered by Google Gemini 2.5 Flash. No setup needed — just start describing your website.
          </div>
        )}

        <div style={{display:'flex',justifyContent:'flex-end'}}>
          <button onClick={onClose} className="btn btn-dark" style={{padding:'8px 20px'}}>Close</button>
        </div>
      </div>
    </div>
  );
}
