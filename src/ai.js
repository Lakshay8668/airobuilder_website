// Talks to our own serverless proxy at /api/generate (Gemini-backed).
// No model selection needed — fixed server-side.

export async function checkConnection() {
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Reply with the single word: ok' }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.error || `Server returned ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function streamGenerate({ prompt, mode, onChunk, onDone, onError }) {
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, mode }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Server error: ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';
    let detectedBuildMode = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const j = JSON.parse(line);
          if (j.error) throw new Error(j.error);
          if (detectedBuildMode === null && j.buildMode !== undefined) detectedBuildMode = j.buildMode;
          if (j.response) { fullText += j.response; onChunk(j.response, fullText, detectedBuildMode); }
          if (j.done) { onDone(fullText, detectedBuildMode); return; }
        } catch (e) {
          if (e.message && !e.message.includes('JSON')) throw e;
        }
      }
    }
    onDone(fullText, detectedBuildMode);
  } catch (err) {
    onError(err.message);
  }
}

// ── HTML extraction (lenient — handles partial/streaming/wrapped HTML) ──
export function extractHTML(text) {
  if (!text) return null;
  const fullDoc = text.match(/<!DOCTYPE[\s\S]*?<\/html>/i) || text.match(/<html[\s\S]*?<\/html>/i);
  if (fullDoc) return fullDoc[0];

  const fenced = text.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fenced) { const inner = fenced[1].trim(); if (inner.length > 100) return inner; }

  const partial = text.match(/<(?:head|body)[\s\S]*/i);
  if (partial && partial[0].length > 200) return text;

  const hasStructure = text.includes('<div') || text.includes('<section') || text.includes('<header') || text.includes('<main');
  if (hasStructure && text.length > 300) return text;

  if (/^\s*<!DOCTYPE/i.test(text) && text.length > 200) return text;

  return null;
}

export function extractSVG(text) {
  const match = text.match(/<svg[\s\S]*?<\/svg>/i);
  return match ? match[0] : null;
}

// ════════════════════════════════════════════════════════════════
// DESIGN DNA — every project gets a unique visual identity
// ════════════════════════════════════════════════════════════════

const FONT_PAIRINGS = [
  { heading: "'Fraunces', serif", body: "'Inter', sans-serif", mood: 'editorial, literary, warm' },
  { heading: "'Space Grotesk', sans-serif", body: "'Inter', sans-serif", mood: 'technical, precise, modern' },
  { heading: "'Playfair Display', serif", body: "'Karla', sans-serif", mood: 'luxury, refined, high-contrast' },
  { heading: "'Bricolage Grotesque', sans-serif", body: "'Inter', sans-serif", mood: 'quirky, contemporary, expressive' },
  { heading: "'Instrument Serif', serif", body: "'Inter', sans-serif", mood: 'elegant, art-gallery, minimal' },
  { heading: "'Archivo Black', sans-serif", body: "'Archivo', sans-serif", mood: 'bold, brutalist, confident' },
  { heading: "'Cormorant Garamond', serif", body: "'Work Sans', sans-serif", mood: 'classic, sophisticated, calm' },
  { heading: "'Syne', sans-serif", body: "'Inter', sans-serif", mood: 'futuristic, sharp, startup' },
  { heading: "'DM Serif Display', serif", body: "'DM Sans', sans-serif", mood: 'friendly editorial, approachable' },
  { heading: "'Unbounded', sans-serif", body: "'Inter', sans-serif", mood: 'geometric, playful, energetic' },
];

const PALETTES = [
  { name: 'Midnight Forest', bg: '#0c1410', surface: '#162019', accent: '#7fff9e', accent2: '#d4f5c4', text: '#eef5ee' },
  { name: 'Warm Paper', bg: '#faf6f0', surface: '#ffffff', accent: '#c2410c', accent2: '#fed7aa', text: '#1c1410' },
  { name: 'Electric Violet', bg: '#0a0a18', surface: '#15152a', accent: '#a78bfa', accent2: '#f0abfc', text: '#f1f0fb' },
  { name: 'Clay & Cream', bg: '#f5f0e8', surface: '#fffdf9', accent: '#b5563c', accent2: '#8a9a5b', text: '#2b2420' },
  { name: 'Deep Ocean', bg: '#061a23', surface: '#0d2733', accent: '#4dd4e8', accent2: '#a6f0e0', text: '#e8f7fa' },
  { name: 'Sunset Coral', bg: '#1a0e0a', surface: '#291611', accent: '#ff6b4a', accent2: '#ffd166', text: '#fff5ed' },
  { name: 'Slate Mono', bg: '#fafafa', surface: '#ffffff', accent: '#18181b', accent2: '#71717a', text: '#18181b' },
  { name: 'Rose Quartz', bg: '#1c1117', surface: '#2a1822', accent: '#f472b6', accent2: '#fda4af', text: '#fdf2f8' },
  { name: 'Pine & Gold', bg: '#0f1a14', surface: '#18261d', accent: '#d4af37', accent2: '#8fbc8f', text: '#f0f4f0' },
  { name: 'Arctic Blue', bg: '#f0f7fb', surface: '#ffffff', accent: '#0369a1', accent2: '#7dd3fc', text: '#0c1e26' },
];

const LAYOUT_ARCHETYPES = [
  'Asymmetric split-screen hero with oversized typography bleeding off one edge, offset image grid',
  'Full-bleed editorial magazine layout with large pull quotes and a sticky side-nav',
  'Brutalist grid with visible borders, monospace accents, and stark black/white blocks broken by one accent color',
  'Layered card-stack hero where elements overlap with depth/shadow, scroll-driven parallax sections',
  'Minimal single-column narrative flow, generous whitespace, one bold statement per viewport',
  'Bento-grid layout — irregular sized boxes of varying sizes forming a mosaic, like a dashboard',
  'Diagonal/angled section dividers instead of straight horizontal lines, dynamic flow',
  'Centered spotlight hero with floating UI elements/badges orbiting around a central visual',
  'Horizontal scroll-snap sections for showcasing work/products like a gallery filmstrip',
  'Split-color background sections (color blocking) where each section has a distinct full-bleed background',
];

const MOTION_STYLES = [
  'Elements fade and slide up on scroll with staggered delays (50-100ms apart per item)',
  'Magnetic hover effect on buttons/cards — subtle scale + shadow lift on hover with spring easing',
  'Text reveals letter-by-letter or word-by-word on load for the hero headline',
  'Background gradient slowly animates/shifts hue over 10-20s for ambient motion',
  'Cards tilt slightly in 3D (perspective transform) on mouse proximity',
  'Numbers/stats count up from 0 when scrolled into view',
  'Underline or highlight draws itself across text on hover using clip-path animation',
  'Sections have a subtle parallax — background moves slower than foreground on scroll',
];

function seededIndex(seed, len) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash % len;
}

export function deriveDesignDNA(seed) {
  const s = seed || Math.random().toString(36);
  const font = FONT_PAIRINGS[seededIndex(s + 'font', FONT_PAIRINGS.length)];
  const palette = PALETTES[seededIndex(s + 'palette', PALETTES.length)];
  const layout = LAYOUT_ARCHETYPES[seededIndex(s + 'layout', LAYOUT_ARCHETYPES.length)];
  const motionA = MOTION_STYLES[seededIndex(s + 'motionA', MOTION_STYLES.length)];
  const motionB = MOTION_STYLES[seededIndex(s + 'motionB' + s, MOTION_STYLES.length)];
  return { font, palette, layout, motion: [motionA, motionB].filter((v, i, a) => a.indexOf(v) === i) };
}

const ANIMATION_TOOLKIT_CSS = `
<style id="__builder_motion_toolkit">
  *{scroll-behavior:smooth}
  .reveal{opacity:0;transform:translateY(28px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
  .reveal.is-visible{opacity:1;transform:translateY(0)}
  .reveal-delay-1{transition-delay:.08s} .reveal-delay-2{transition-delay:.16s}
  .reveal-delay-3{transition-delay:.24s} .reveal-delay-4{transition-delay:.32s} .reveal-delay-5{transition-delay:.4s}
  .hover-lift{transition:transform .35s cubic-bezier(.16,1,.3,1),box-shadow .35s ease}
  .hover-lift:hover{transform:translateY(-6px)}
  .hover-scale{transition:transform .3s cubic-bezier(.34,1.56,.64,1)}
  .hover-scale:hover{transform:scale(1.04)}
  .underline-draw{position:relative;text-decoration:none}
  .underline-draw::after{content:'';position:absolute;left:0;bottom:-2px;width:100%;height:2px;background:currentColor;transform:scaleX(0);transform-origin:left;transition:transform .4s cubic-bezier(.16,1,.3,1)}
  .underline-draw:hover::after{transform:scaleX(1)}
  @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
  .float{animation:floatY 5s ease-in-out infinite}
  @keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
  .gradient-animate{background-size:200% 200%;animation:gradientShift 12s ease infinite}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  .fade-in-load{animation:fadeIn 1s ease both}
</style>
<script>
  document.addEventListener('DOMContentLoaded',function(){
    var els=document.querySelectorAll('.reveal');
    if('IntersectionObserver' in window && els.length){
      var io=new IntersectionObserver(function(entries){
        entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target);} });
      },{threshold:0.15, rootMargin:'0px 0px -40px 0px'});
      els.forEach(function(el){ io.observe(el); });
    } else { els.forEach(function(el){ el.classList.add('is-visible'); }); }

    var counters=document.querySelectorAll('[data-count-to]');
    if(counters.length && 'IntersectionObserver' in window){
      var co=new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){
            var el=entry.target, target=parseFloat(el.getAttribute('data-count-to'))||0, dur=1200, start=null;
            function step(ts){ if(!start) start=ts; var p=Math.min((ts-start)/dur,1); el.textContent=Math.floor(p*target).toLocaleString(); if(p<1) requestAnimationFrame(step); else el.textContent=target.toLocaleString(); }
            requestAnimationFrame(step); co.unobserve(el);
          }
        });
      },{threshold:0.4});
      counters.forEach(function(el){ co.observe(el); });
    }
  });
</script>`;

export function injectAnimationToolkit(html) {
  if (!html) return html;
  if (html.includes('__builder_motion_toolkit')) return html;
  if (html.includes('</head>')) return html.replace('</head>', `${ANIMATION_TOOLKIT_CSS}</head>`);
  return ANIMATION_TOOLKIT_CSS + html;
}

function designBrief(dna) {
  return `DESIGN IDENTITY (follow exactly — this is what makes the site unique):

TYPOGRAPHY
- Heading font: ${dna.font.heading} (load from Google Fonts CDN)
- Body font: ${dna.font.body} (load from Google Fonts CDN)
- Mood: ${dna.font.mood}
- Hero headline should be large and confident: clamp(2.5rem, 6vw, 5rem)

COLOR PALETTE — "${dna.palette.name}"
- Background: ${dna.palette.bg} | Surface: ${dna.palette.surface}
- Primary accent: ${dna.palette.accent} | Secondary accent: ${dna.palette.accent2}
- Text: ${dna.palette.text}
- Use ONLY this palette plus white/black/transparent. Use accent sparingly and deliberately.

LAYOUT ARCHETYPE
${dna.layout}

MOTION (required)
- ${dna.motion[0]}
- ${dna.motion[1] || dna.motion[0]}
- Add class "reveal" (+ optionally "reveal-delay-1" to "reveal-delay-5") to sections/cards for scroll-in animation — toolkit already injected
- Add "hover-lift" or "hover-scale" to interactive cards/buttons
- Add "underline-draw" to inline text links
- For stat counters use <span data-count-to="1234">0</span>

ANTI-TEMPLATE RULES
- Do NOT build the generic "centered hero + 3 cards in a row + footer" layout. Commit to the layout archetype above.
- Vary section widths/alignment, use asymmetry somewhere
- Real specific content — never "Lorem ipsum", never "Feature One/Two/Three"`;
}

export function buildPagePrompt({ userPrompt, pageName, siteContext, existingHTML = null, mode = 'create' }) {
  const pagesList = siteContext?.pages?.map(p => p.name).join(', ') || pageName;
  const dnaSeed = siteContext?.id || siteContext?.siteName || userPrompt;
  const dna = siteContext?.dna || deriveDesignDNA(dnaSeed);

  const base = `You are a senior web developer. Your ONLY job is to output complete HTML code. NEVER explain, describe, ask questions, or write text outside HTML tags.

⚠️ CRITICAL: Your entire response must be a single complete HTML document starting with <!DOCTYPE html> and ending with </html>. No words before or after. No markdown. No code fences.

SITE: ${siteContext?.siteName || 'Untitled site'}
DESCRIPTION: ${siteContext?.description || userPrompt}
ALL PAGES: ${pagesList}
GENERATING NOW: "${pageName}" page (must share the same design identity as every other page)

${designBrief(dna)}

TECHNICAL REQUIREMENTS
- Navigation bar linking to all pages: ${pagesList}
- Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
- Google Fonts via CDN link in <head>
- Font Awesome via CDN
- Fully responsive, no placeholder text, no Lorem ipsum
- Start with <!DOCTYPE html>`;

  if (mode === 'edit' && existingHTML) {
    return `${base}

EXISTING "${pageName}" PAGE (preserve design identity unless asked to change it):
${existingHTML}

USER REQUEST: ${userPrompt}

Apply the change. Return the complete modified HTML document only.`;
  }

  return `${base}

USER REQUEST: ${userPrompt}

Generate the complete "${pageName}" page now. Output HTML only.`;
}

export function buildLogoPrompt(businessName, style, description) {
  return `You are an SVG logo designer. Output ONLY a single valid <svg>...</svg> element, nothing else — no markdown, no explanation.

Business: ${businessName}
Style: ${style}
Industry: ${description}

RULES:
- viewBox="0 0 200 200"
- 2-3 colors max, modern flat design
- Works as small icon AND large logo
- Abstract/geometric or initials monogram — NOT photorealistic
- No text longer than initials

Output the SVG now:`;
}
