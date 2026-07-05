import { useState } from 'react';
import Landing from './components/Landing.jsx';
import TopBar from './components/TopBar.jsx';
import LeftPanel from './components/LeftPanel.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import PreviewPanel from './components/PreviewPanel.jsx';
import StatusModal from './components/StatusModal.jsx';
import LogoModal from './components/LogoModal.jsx';
import { streamGenerate, extractHTML, extractSVG, buildPagePrompt, buildLogoPrompt, deriveDesignDNA, injectAnimationToolkit } from './ai.js';

// ── helpers ──────────────────────────────────────────────────────
const KEY = 'aib_v3';
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } }
function save(d) { localStorage.setItem(KEY, JSON.stringify(d)); }

const DEFAULT_PAGES = [
  { id: 'home', name: 'Home' },
  { id: 'about', name: 'About' },
  { id: 'contact', name: 'Contact' },
];

function freshProject(name, desc) {
  const id = uid();
  return { id, projectName: name, description: desc, dna: deriveDesignDNA(id), messages: [], pagesHTML: {}, pageVersions: {}, pages: DEFAULT_PAGES, activePage: 'home', knowledge: '', logo: null, theme: 'light', createdAt: Date.now(), updatedAt: Date.now() };
}

// ── App ──────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('landing');
  const [allProjects, setAllProjects] = useState(() => load().projects || {});
  const [project, setProject] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState('preview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showStatus, setShowStatus] = useState(false);
  const [showLogo, setShowLogo] = useState(false);

  // derived
  const pageId = project?.activePage;
  const previewHTML = project?.pagesHTML?.[pageId] || null;
  const messages = (project?.messages || []).filter(m => !m.pageId || m.pageId === pageId);
  const versions = project?.pageVersions?.[pageId] || [];

  function persist(updated) {
    setProject(updated);
    setAllProjects(prev => {
      const next = { ...prev, [updated.id]: { ...updated, updatedAt: Date.now() } };
      save({ projects: next });
      return next;
    });
  }

  function patch(fn) {
    if (!project) return;
    persist({ ...project, ...(typeof fn === 'function' ? fn(project) : fn) });
  }

  // ── start from landing ──
  function handleStart(prompt) {
    const name = prompt.length > 45 ? prompt.slice(0, 45) + '…' : prompt;
    const proj = freshProject(name, prompt);
    persist(proj);
    setScreen('editor');
    generate(prompt, proj, proj.activePage);
  }

  function handleOpenProject(id) {
    const p = allProjects[id];
    if (!p) return;
    setProject(p);
    setScreen('editor');
  }

  function handleDeleteProject(id) {
    setAllProjects(prev => {
      const next = { ...prev };
      delete next[id];
      save({ projects: next });
      return next;
    });
    if (project?.id === id) { setProject(null); setScreen('landing'); }
  }

  // ── generate ──
  async function generate(userText, baseProj, pid) {
    const proj = baseProj || project;
    const page = proj.pages.find(p => p.id === pid) || proj.pages[0];
    const userMsg = { id: uid(), role: 'user', content: userText, pageId: pid };
    let working = { ...proj, messages: [...proj.messages, userMsg] };
    persist(working);
    setIsGenerating(true);
    setViewMode('preview');

    const aiId = uid();
    const aiMsg = { id: aiId, role: 'ai', content: '', streaming: true, hasCode: false, pageId: pid };
    working = { ...working, messages: [...working.messages, aiMsg] };
    persist(working);

    const existingHTML = proj.pagesHTML?.[pid] || null;
    const knowledgePrefix = proj.knowledge?.trim() ? `PROJECT CONTEXT:\n${proj.knowledge.trim()}\n\n` : '';
    const prompt = knowledgePrefix + buildPagePrompt({
      userPrompt: userText,
      pageName: page.name,
      siteContext: { id: proj.id, siteName: proj.projectName, description: proj.description, pages: proj.pages, dna: proj.dna },
      existingHTML,
      mode: existingHTML ? 'edit' : 'create',
    });

    let detectedHTML = null;
    let isBuild = null;

    await streamGenerate({
      prompt,
      onChunk: (_c, full, buildMode) => {
        if (isBuild === null && buildMode !== null) isBuild = buildMode;

        if (isBuild === false) {
          // Chat mode — just show the text response
          setProject(prev => prev ? {
            ...prev,
            messages: prev.messages.map(m => m.id === aiId ? { ...m, content: full, isChat: true } : m)
          } : prev);
          return;
        }

        // Build mode — extract and show HTML
        const html = extractHTML(full);
        if (html && html !== detectedHTML) {
          detectedHTML = html;
          const withMotion = injectAnimationToolkit(html);
          setProject(prev => prev ? { ...prev, pagesHTML: { ...prev.pagesHTML, [pid]: withMotion } } : prev);
        }
        const display = html ? `✓ ${page.name} page generated!` : (full.length > 200 ? full.slice(0, 200) + '…' : full);
        setProject(prev => prev ? { ...prev, messages: prev.messages.map(m => m.id === aiId ? { ...m, content: display } : m) } : prev);
      },
      onDone: (full, buildMode) => {
        const wasBuild = isBuild !== null ? isBuild : buildMode;

        if (wasBuild === false) {
          // Chat response — no HTML, just friendly text
          setProject(prev => prev ? {
            ...prev,
            messages: prev.messages.map(m => m.id === aiId ? {
              ...m, streaming: false, hasCode: false, isChat: true, content: full,
            } : m)
          } : prev);
          setIsGenerating(false);
          return;
        }

        // Build response — extract HTML
        const rawHTML = extractHTML(full) || detectedHTML;
        const html = rawHTML ? injectAnimationToolkit(rawHTML) : null;
        setProject(prev => {
          if (!prev) return prev;
          let next = { ...prev };
          if (html) {
            next.pagesHTML = { ...next.pagesHTML, [pid]: html };
            const ver = { id: uid(), prompt: userText, html, createdAt: Date.now() };
            next.pageVersions = { ...next.pageVersions, [pid]: [ver, ...(next.pageVersions?.[pid] || [])] };
          }
          next.messages = next.messages.map(m => m.id === aiId ? {
            ...m, streaming: false, hasCode: !!html,
            content: html
              ? `Your "${page.name}" page is ready! You can see it in the preview. Ask me to make changes anytime.`
              : (full || 'Something went wrong. Try again with a more specific description.'),
          } : m);
          save({ projects: { ...allProjects, [next.id]: next } });
          setAllProjects(ap => ({ ...ap, [next.id]: next }));
          return next;
        });
        setIsGenerating(false);
      },
      onError: (err) => {
        setProject(prev => prev ? {
          ...prev,
          messages: prev.messages.map(m => m.id === aiId ? { ...m, streaming: false, content: `Error: ${err}` } : m),
        } : prev);
        setIsGenerating(false);
      },
    });
  }

  function handleChatSend(text) { generate(text, project, project.activePage); }
  function handleReset() { patch(p => ({ messages: p.messages.filter(m => m.pageId !== p.activePage), pagesHTML: { ...p.pagesHTML, [p.activePage]: null } })); }
  function handleSelectPage(pid) { patch({ activePage: pid }); }
  function handleAddPage() { const name = prompt('Page name:'); if (!name?.trim()) return; const p = { id: uid(), name: name.trim() }; patch(prev => ({ pages: [...prev.pages, p], activePage: p.id })); }
  function handleRestoreVersion(ver) { patch(prev => ({ pagesHTML: { ...prev.pagesHTML, [prev.activePage]: ver.html } })); }

  function handleDownload() {
    if (!previewHTML) return;
    const name = (project.projectName || 'website').replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const pageName = project.pages.find(p => p.id === pageId)?.name || 'page';
    const blob = new Blob([previewHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${name}-${pageName.toLowerCase()}.html`; a.click();
    URL.revokeObjectURL(url);
  }

  function handleDownloadAll() {
    project.pages.filter(p => project.pagesHTML?.[p.id]).forEach((p, i) => {
      setTimeout(() => {
        const blob = new Blob([project.pagesHTML[p.id]], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${p.name.toLowerCase()}.html`; a.click();
        URL.revokeObjectURL(url);
      }, i * 300);
    });
  }

  function handleOpenInTab() {
    if (!previewHTML) return;
    const blob = new Blob([previewHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  async function handleGenerateLogo(businessName, style, description) {
    const prompt = buildLogoPrompt(businessName, style, description);
    let svg = null;
    await streamGenerate({ prompt, onChunk: (_c, full) => { const s = extractSVG(full); if (s) svg = s; }, onDone: (full) => { svg = extractSVG(full) || svg; }, onError: () => {} });
    if (svg) patch({ logo: svg });
    return svg;
  }

  // ── Landing ──
  if (screen === 'landing' || !project) {
    return (
      <>
        <Landing
          onStart={handleStart}
          projects={Object.values(allProjects).sort((a, b) => b.updatedAt - a.updatedAt)}
          onOpenProject={handleOpenProject}
          onDeleteProject={handleDeleteProject}
        />
        {showStatus && <StatusModal onClose={() => setShowStatus(false)} />}
      </>
    );
  }

  // ── Editor ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar
        projectName={project.projectName}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(s => !s)}
        onOpenSettings={() => setShowStatus(true)}
        onSave={() => persist(project)}
        onNewProject={() => { setProject(null); setScreen('landing'); }}
        isGenerating={isGenerating}
        logo={project.logo}
        onOpenLogoModal={() => setShowLogo(true)}
        paletteName={project.dna?.palette?.name}
        accentColor={project.dna?.palette?.accent}
      />
      <div className="editor">
        {sidebarOpen && (
          <LeftPanel
            pages={project.pages}
            activePage={project.activePage}
            onSelectPage={handleSelectPage}
            onAddPage={handleAddPage}
            knowledge={project.knowledge}
            onKnowledgeChange={val => patch({ knowledge: val })}
            versions={versions}
            activeVersionHTML={previewHTML}
            onRestoreVersion={handleRestoreVersion}
            pagesHTML={project.pagesHTML}
          />
        )}
        <ChatPanel
          messages={messages}
          isGenerating={isGenerating}
          onSend={handleChatSend}
          onReset={handleReset}
          activePageName={project.pages.find(p => p.id === pageId)?.name}
        />
        <PreviewPanel
          html={previewHTML}
          isGenerating={isGenerating}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onDownload={handleDownload}
          onDownloadAll={handleDownloadAll}
          onOpenInTab={handleOpenInTab}
          theme={project.theme}
          onToggleTheme={() => patch(p => ({ theme: p.theme === 'light' ? 'dark' : 'light' }))}
          multiPage={project.pages.length > 1}
        />
      </div>
      {showStatus && <StatusModal onClose={() => setShowStatus(false)} />}
      {showLogo && <LogoModal businessName={project.projectName} currentLogo={project.logo} onGenerate={handleGenerateLogo} onClose={() => setShowLogo(false)} />}
    </div>
  );
}
