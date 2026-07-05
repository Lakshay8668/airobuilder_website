import { PanelLeftClose, PanelLeftOpen, Settings, Save, Sparkles } from 'lucide-react';

export default function TopBar({ projectName, sidebarOpen, onToggleSidebar, onOpenSettings, onSave, onNewProject, isGenerating, logo, onOpenLogoModal, paletteName, accentColor }) {
  return (
    <div className="topbar">
      <div className="topbar-logo">
        <div className="topbar-logo-mark">A</div>
        <span className="topbar-logo-name">AI Builder</span>
      </div>

      <button onClick={onToggleSidebar} className="btn btn-icon" title="Toggle sidebar">
        {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
      </button>

      {logo && (
        <div onClick={onOpenLogoModal} title="Edit logo" style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #e5e5e5', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fff' }}
          dangerouslySetInnerHTML={{ __html: logo }} />
      )}

      {projectName && <>
        <span className="topbar-sep">›</span>
        <span className="topbar-project">{projectName}</span>
      </>}

      {paletteName && (
        <div className="palette-badge">
          <div className="palette-dot" style={{ background: accentColor || '#888' }} />
          {paletteName}
        </div>
      )}

      {isGenerating && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#888', marginLeft: 4 }}>
          <div className="spinner" style={{ width: 12, height: 12 }} /> Generating...
        </div>
      )}

      <div className="topbar-right">
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#888', background: '#f5f5f5', border: '1px solid #e5e5e5', borderRadius: 20, padding: '4px 10px' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
          Gemini
        </div>
        <button className="btn" onClick={onOpenLogoModal}><Sparkles size={13} />{logo ? 'Edit Logo' : 'Make Logo'}</button>
        {projectName && <button className="btn" onClick={onSave}><Save size={13} />Save</button>}
        <button className="btn btn-dark" onClick={onNewProject}>+ New</button>
        <button className="btn btn-icon" onClick={onOpenSettings} title="Settings"><Settings size={14} /></button>
      </div>
    </div>
  );
}
