import { useState } from 'react';
import { X, Sparkles, Download, RefreshCw } from 'lucide-react';

const STYLES = ['Minimal','Modern','Playful','Elegant','Bold','Geometric'];

export default function LogoModal({ businessName, currentLogo, onGenerate, onClose }) {
  const [name, setName] = useState(businessName || '');
  const [style, setStyle] = useState('Minimal');
  const [desc, setDesc] = useState('');
  const [logo, setLogo] = useState(currentLogo || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function generate() {
    if (!name.trim()) return;
    setLoading(true); setError(false);
    const svg = await onGenerate(name.trim(), style, desc.trim() || name.trim());
    if (svg) setLogo(svg); else setError(true);
    setLoading(false);
  }

  function download() {
    if (!logo) return;
    const blob = new Blob([logo], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${name.replace(/[^a-z0-9]/gi,'-').toLowerCase()}-logo.svg`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <div style={{fontSize:16,fontWeight:600,display:'flex',alignItems:'center',gap:8}}><Sparkles size={16}/>Make a Logo</div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#aaa',padding:4}}><X size={18}/></button>
        </div>

        {/* Preview */}
        <div style={{width:'100%',height:150,borderRadius:12,border:'1px solid #e5e5e5',background:'#f9f9f9',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16,overflow:'hidden'}}>
          {loading
            ? <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}><div className="spinner" style={{width:24,height:24}}/><span style={{fontSize:12,color:'#aaa'}}>Designing...</span></div>
            : logo
            ? <div style={{width:90,height:90}} dangerouslySetInnerHTML={{__html:logo}}/>
            : <span style={{fontSize:12,color:'#ccc'}}>{error?'Generation failed — try again':'Your logo will appear here'}</span>
          }
        </div>

        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:600,color:'#aaa',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>Business Name</div>
          <input type="text" value={name} onChange={e=>setName(e.target.value)}
            placeholder="e.g. Bloom & Co"
            style={{width:'100%',padding:'9px 12px',border:'1px solid #e5e5e5',borderRadius:8,fontSize:13,fontFamily:'Inter,sans-serif',outline:'none',color:'#111',background:'#f9f9f9'}}/>
        </div>

        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:600,color:'#aaa',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>Style</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {STYLES.map(s=>(
              <button key={s} onClick={()=>setStyle(s)} className="chip"
                style={s===style?{background:'#111',color:'#fff',borderColor:'#111'}:{}}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:600,color:'#aaa',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>Industry <span style={{textTransform:'none',fontWeight:400}}>(optional)</span></div>
          <input type="text" value={desc} onChange={e=>setDesc(e.target.value)}
            placeholder="e.g. restaurant, tech startup, law firm"
            style={{width:'100%',padding:'9px 12px',border:'1px solid #e5e5e5',borderRadius:8,fontSize:13,fontFamily:'Inter,sans-serif',outline:'none',color:'#111',background:'#f9f9f9'}}/>
        </div>

        <div style={{display:'flex',gap:8}}>
          <button onClick={onClose} className="btn" style={{flex:1,justifyContent:'center',padding:'9px'}}>Close</button>
          {logo && <button onClick={download} className="btn" style={{flex:1,justifyContent:'center',padding:'9px'}}><Download size={13}/>Download</button>}
          <button onClick={generate} disabled={!name.trim()||loading} className="btn btn-dark" style={{flex:1,justifyContent:'center',padding:'9px'}}>
            {loading?<div className="spinner" style={{width:13,height:13,borderTopColor:'#fff'}}/>:<RefreshCw size={13}/>}
            {logo?'Regenerate':'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
}
