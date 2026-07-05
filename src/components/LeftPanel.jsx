import { useState } from 'react';
import { Plus, Check, Clock, RotateCcw } from 'lucide-react';

export default function LeftPanel({ pages, activePage, onSelectPage, onAddPage, knowledge, onKnowledgeChange, versions, activeVersionHTML, onRestoreVersion, pagesHTML }) {
  const [tab, setTab] = useState('pages');

  return (
    <div className="left-panel">
      <div className="lp-tabs">
        {['pages','knowledge','history'].map(t => (
          <div key={t} className={`lp-tab ${tab===t?'active':''}`} onClick={() => setTab(t)}>
            {t[0].toUpperCase()+t.slice(1)}
          </div>
        ))}
      </div>

      {tab === 'pages' && (
        <div className="lp-body">
          <div className="lp-label" style={{marginBottom:8}}>Pages</div>
          {pages.map(p => (
            <div key={p.id} className={`page-item ${activePage===p.id?'active':''}`} onClick={() => onSelectPage(p.id)}>
              <div className="page-icon">
                {p.name==='Home'?'🏠':p.name==='About'?'👤':p.name==='Contact'?'✉️':'📄'}
              </div>
              <span style={{flex:1}}>{p.name}</span>
              {pagesHTML?.[p.id] && <Check size={11} color="#16a34a" />}
            </div>
          ))}
          <button className="add-page-btn" onClick={onAddPage}>
            <Plus size={13}/> Add page
          </button>
          <p style={{fontSize:11,color:'#ccc',padding:'10px 6px 0',lineHeight:1.6}}>
            Each page is generated separately and shares your site's branding.
          </p>
          <div style={{marginTop:20,borderTop:'1px solid #f0f0f0',paddingTop:14}}>
            <div className="lp-label" style={{marginBottom:8}}>Files</div>
            {pages.map(p => (
              <div key={p.id} className="page-item">
                <div className="page-icon" style={{fontSize:9}}>📄</div>
                <span style={{fontFamily:'monospace',fontSize:11}}>{p.name.toLowerCase().replace(/\s+/g,'-')}.html</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'knowledge' && (
        <div className="lp-body">
          <div className="lp-label" style={{marginBottom:8}}>Custom Knowledge</div>
          <p style={{fontSize:12,color:'#888',marginBottom:12,lineHeight:1.6}}>
            Add context about your project. AI remembers this across every page and edit.
          </p>
          <textarea
            className="knowledge-area"
            rows={10}
            placeholder="Business name, brand colors, target audience, tone of voice, special requirements..."
            value={knowledge}
            onChange={e => onKnowledgeChange(e.target.value)}
          />
          <p style={{fontSize:10,color:'#ccc',marginTop:8}}>Included in every AI request automatically.</p>
        </div>
      )}

      {tab === 'history' && (
        <div className="lp-body">
          <div className="lp-label" style={{marginBottom:10}}>Version History</div>
          {versions.length === 0
            ? <p style={{fontSize:12,color:'#ccc',textAlign:'center',marginTop:20}}>Versions appear after each generation</p>
            : versions.map((v,i) => (
              <div key={v.id} className={`ver-item ${v.html===activeVersionHTML?'active':''}`} onClick={() => onRestoreVersion(v)}>
                <div style={{display:'flex',alignItems:'flex-start',gap:8}}>
                  <div style={{width:20,height:20,borderRadius:'50%',flexShrink:0,background:i===0?'#111':'#f0f0f0',color:i===0?'#fff':'#888',fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {versions.length-i}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,fontWeight:500,color:'#111',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v.prompt}</div>
                    <div style={{fontSize:10,color:'#aaa',display:'flex',alignItems:'center',gap:5,marginTop:2}}>
                      <Clock size={9}/>{new Date(v.createdAt).toLocaleTimeString()}
                      {v.html===activeVersionHTML && <span style={{color:'#111',fontWeight:500}}>· Current</span>}
                    </div>
                  </div>
                  {v.html!==activeVersionHTML && <RotateCcw size={11} color="#aaa"/>}
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
