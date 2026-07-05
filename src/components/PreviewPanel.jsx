import { useState, useRef, useEffect } from 'react';
import { Monitor, Tablet, Smartphone, RefreshCw, ExternalLink, Download, ZoomIn, ZoomOut, Sun, Moon, FolderDown } from 'lucide-react';

function injectDark(html) {
  if (!html) return html;
  const s = `<style id="__dark">html{filter:invert(.92) hue-rotate(180deg)}img,video,svg{filter:invert(1) hue-rotate(180deg)}</style>`;
  return html.includes('</head>') ? html.replace('</head>', s + '</head>') : s + html;
}

function SkeletonPreview() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#f9f9f9', overflow: 'hidden', position: 'relative' }}>
      <style>{`@keyframes shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}.sk{background:linear-gradient(90deg,#ebebeb 25%,#f5f5f5 50%,#ebebeb 75%);background-size:600px 100%;animation:shimmer 1.6s ease-in-out infinite;border-radius:6px}`}</style>
      {/* Nav */}
      <div style={{ height: 56, background: '#fff', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16 }}>
        <div className="sk" style={{ width: 100, height: 18 }} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          {[60,50,60,70].map((w,i) => <div key={i} className="sk" style={{ width: w, height: 13 }} />)}
        </div>
      </div>
      {/* Hero */}
      <div style={{ padding: '40px 32px 32px', background: '#fff' }}>
        <div className="sk" style={{ width: '60%', height: 52, marginBottom: 16 }} />
        <div className="sk" style={{ width: '42%', height: 52, marginBottom: 24 }} />
        <div className="sk" style={{ width: '50%', height: 16, marginBottom: 10 }} />
        <div className="sk" style={{ width: '38%', height: 16, marginBottom: 28 }} />
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="sk" style={{ width: 140, height: 44, borderRadius: 22 }} />
          <div className="sk" style={{ width: 120, height: 44, borderRadius: 22 }} />
        </div>
      </div>
      {/* Cards */}
      <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, background: '#f5f5f5' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ background: '#fff', borderRadius: 10, padding: 20 }}>
            <div className="sk" style={{ width: 40, height: 40, borderRadius: 10, marginBottom: 14 }} />
            <div className="sk" style={{ width: '70%', height: 14, marginBottom: 10 }} />
            <div className="sk" style={{ width: '90%', height: 11, marginBottom: 6 }} />
            <div className="sk" style={{ width: '75%', height: 11 }} />
          </div>
        ))}
      </div>
      {/* Status */}
      <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: '#fff', border: '1px solid #e5e5e5', borderRadius: 20, padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 12px rgba(0,0,0,.08)', whiteSpace: 'nowrap' }}>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <span style={{ fontSize: 12, color: '#555' }}>Gemini is building your page...</span>
      </div>
    </div>
  );
}

export default function PreviewPanel({ html, isGenerating, viewMode, onViewModeChange, onDownload, onDownloadAll, onOpenInTab, theme, onToggleTheme, multiPage }) {
  const [device, setDevice] = useState('desktop');
  const [zoom, setZoom] = useState(100);
  const iframeRef = useRef(null);
  const rendered = theme === 'dark' ? injectDark(html) : html;

  useEffect(() => {
    if (iframeRef.current && rendered) iframeRef.current.srcdoc = rendered;
  }, [rendered]);

  function refresh() {
    if (!iframeRef.current || !rendered) return;
    iframeRef.current.srcdoc = '';
    setTimeout(() => { iframeRef.current.srcdoc = rendered; }, 50);
  }

  const deviceW = { desktop: '100%', tablet: '768px', mobile: '390px' };

  return (
    <div className="preview-panel">
      <div className="preview-toolbar">
        <div className="view-tabs">
          <div className={`vt ${viewMode==='preview'?'active':''}`} onClick={() => onViewModeChange('preview')}>Preview</div>
          <div className={`vt ${viewMode==='code'?'active':''}`} onClick={() => onViewModeChange('code')}>Code</div>
        </div>

        <div className="dev-tabs" style={{ marginLeft: 8 }}>
          {[['desktop',Monitor],['tablet',Tablet],['mobile',Smartphone]].map(([id,Icon]) => (
            <div key={id} className={`dt ${device===id?'active':''}`} onClick={() => setDevice(id)} title={id}>
              <Icon size={14}/>
            </div>
          ))}
        </div>

        <div className="dev-tabs" style={{ marginLeft: 4 }}>
          <div className={`dt ${theme==='light'?'active':''}`} onClick={() => theme!=='light' && onToggleTheme()} title="Light"><Sun size={13}/></div>
          <div className={`dt ${theme==='dark'?'active':''}`} onClick={() => theme!=='dark' && onToggleTheme()} title="Dark"><Moon size={13}/></div>
        </div>

        {viewMode === 'preview' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 4 }}>
            <button className="dt" onClick={() => setZoom(z => Math.max(40, z-10))}><ZoomOut size={13}/></button>
            <span style={{ fontSize: 11, color: '#aaa', width: 34, textAlign: 'center' }}>{zoom}%</span>
            <button className="dt" onClick={() => setZoom(z => Math.min(150, z+10))}><ZoomIn size={13}/></button>
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {html && <>
            <button className="btn btn-icon" onClick={refresh} title="Refresh"><RefreshCw size={12}/></button>
            <button className="btn btn-icon" onClick={onOpenInTab} title="Open in new tab"><ExternalLink size={12}/></button>
            {multiPage && <button className="btn" onClick={onDownloadAll}><FolderDown size={12}/>All Pages</button>}
            <button className="btn btn-green" onClick={onDownload}><Download size={12}/>Export</button>
          </>}
        </div>
      </div>

      {viewMode === 'preview' && (
        <div className="preview-area">
          {!html && !isGenerating && (
            <div className="preview-empty">
              <div style={{ fontSize: 40, opacity: .2 }}>⬡</div>
              <p style={{ fontSize: 13, color: '#bbb' }}>Preview will appear here</p>
              <p style={{ fontSize: 11, color: '#ccc' }}>Start chatting to generate this page</p>
            </div>
          )}
          {isGenerating && !html && <SkeletonPreview />}
          {html && (
            <div style={{
              width: deviceW[device], height: device==='desktop'?'100%':'auto',
              minHeight: device!=='desktop'?700:undefined,
              margin: device!=='desktop'?'20px auto':0,
              borderRadius: device==='mobile'?20:device==='tablet'?10:0,
              overflow:'hidden',
              boxShadow: device!=='desktop'?'0 8px 40px rgba(0,0,0,.15)':'none',
              transform:`scale(${zoom/100})`, transformOrigin:'top center',
              transition:'all .3s ease', flexShrink:0,
            }}>
              <iframe ref={iframeRef} title="Preview" sandbox="allow-scripts allow-same-origin allow-forms"
                style={{ width:'100%', height:'100%', border:'none', minHeight:700 }} />
            </div>
          )}
        </div>
      )}

      {viewMode === 'code' && (
        <div className="code-view" style={{ flex:1 }}>
          {html ? <pre>{html}</pre> : <p style={{ color:'#666', fontSize:12 }}>No code yet.</p>}
        </div>
      )}

      {html && (
        <div className="preview-statusbar">
          <div className="status-green"/>
          <span>Ready</span><span>·</span>
          <span>{(html.length/1024).toFixed(1)} KB</span><span>·</span>
          <span style={{textTransform:'capitalize'}}>{device}</span>
          {zoom!==100&&<><span>·</span><span>{zoom}%</span></>}
          <span>·</span><span style={{textTransform:'capitalize'}}>{theme}</span>
        </div>
      )}
    </div>
  );
}
