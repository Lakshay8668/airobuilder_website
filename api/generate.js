// /api/generate.js — Vercel Edge Function
// Proxies prompts to Gemini API. Key stays server-side, never in the browser.

export const config = { runtime: 'edge' };

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// Detect if user is chatting vs asking to build a website
function isBuildRequest(prompt) {
  const p = prompt.toLowerCase().trim();

  // Very short or obvious greetings → NOT a build request
  const greetings = ['hello','hi','hey','hii','helo','sup','yo','greetings','howdy','what\'s up','whats up','good morning','good evening','good afternoon','namaste'];
  if (greetings.some(g => p === g || p === g + '!' || p === g + '?')) return false;

  // Questions about the tool itself → NOT a build request
  const metaQuestions = ['what can you do','what do you do','how does this work','how do you work','who are you','what are you','help','how to use','what is this','tell me about yourself'];
  if (metaQuestions.some(q => p.includes(q))) return false;

  // Very short input with no website-related words → probably NOT a build request
  const websiteKeywords = ['website','site','page','landing','portfolio','restaurant','store','shop','blog','agency','company','business','app','saas','product','service','about','contact','home','make','build','create','design','generate'];
  if (p.split(' ').length <= 3 && !websiteKeywords.some(k => p.includes(k))) return false;

  return true;
}

// System instruction for chat mode (conversational, helpful)
const CHAT_SYSTEM = `You are a friendly AI website builder assistant. You help users create websites.

When users greet you or ask general questions:
- Respond warmly and briefly (2-3 sentences max)
- Tell them you can build websites for them
- Ask what kind of website they'd like to build
- Give 2-3 quick examples like: restaurant, portfolio, agency, store, blog

Never generate HTML in chat mode. Keep responses short and friendly.`;

// System instruction for build mode (HTML only)
const BUILD_SYSTEM = `You are a web developer. Output ONLY complete HTML code. Never explain, never ask questions, never use markdown code fences. Your entire response must be a single HTML document starting with <!DOCTYPE html> and ending with </html>. Do not write any text before <!DOCTYPE html> or after </html>.`;

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json({ error: 'Server missing GEMINI_API_KEY — set it in Vercel env vars.' }, 500);

  let body;
  try { body = await req.json(); }
  catch { return json({ error: 'Invalid JSON body' }, 400); }

  const { prompt, mode } = body;
  if (!prompt || typeof prompt !== 'string') return json({ error: 'Missing prompt' }, 400);
  if (prompt.length > 60000) return json({ error: 'Prompt too long' }, 413);

  // Determine mode: explicit override from client, or auto-detect
  const buildMode = mode === 'build' ? true : mode === 'chat' ? false : isBuildRequest(prompt);

  const geminiReq = {
    system_instruction: {
      parts: [{ text: buildMode ? BUILD_SYSTEM : CHAT_SYSTEM }]
    },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: buildMode ? 0.85 : 0.7,
      maxOutputTokens: buildMode ? 8192 : 300,
    },
  };

  let upstream;
  try {
    upstream = await fetch(`${GEMINI_URL}&key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiReq),
    });
  } catch (err) {
    return json({ error: `Failed to reach Gemini: ${err.message}` }, 502);
  }

  if (!upstream.ok || !upstream.body) {
    const t = await upstream.text().catch(() => '');
    return json({ error: `Gemini ${upstream.status}: ${t.slice(0, 300)}` }, upstream.status);
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body.getReader();
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const jsonStr = trimmed.slice(5).trim();
            if (!jsonStr || jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
              if (text) controller.enqueue(encoder.encode(JSON.stringify({ response: text, done: false, buildMode }) + '\n'));
            } catch { /* skip malformed chunk */ }
          }
        }
        controller.enqueue(encoder.encode(JSON.stringify({ response: '', done: true, buildMode }) + '\n'));
        controller.close();
      } catch (err) {
        controller.enqueue(encoder.encode(JSON.stringify({ error: err.message, done: true }) + '\n'));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { ...CORS, 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

