import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
// eslint-disable-next-line import/no-unresolved
} from '@angular/ssr/node';
import express from 'express';
// eslint-disable-next-line unicorn/import-style
import {join} from 'node:path';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine({
  allowedHosts: ['localhost', '127.0.0.1', '*'],
});

// Parse JSON request body
app.use(express.json());

// Initialize GoogleGenAI safely with httpOptions for telemetry
const envKey = process.env['GEMINI_API_KEY'];
const globalKey = (globalThis as Record<string, unknown>)['GEMINI_API_KEY'];
const apiKey = typeof envKey === 'string' && envKey !== '' ? envKey : (typeof globalKey === 'string' && globalKey !== '' ? globalKey : '');
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

interface EmbedRequestBody {
  text?: unknown;
  texts?: unknown;
}

interface SDKEmbedding {
  values?: number[];
}

interface SDKEmbedResponse {
  embedding?: SDKEmbedding;
  embeddings?: SDKEmbedding[];
}

// Helper function to produce deterministic semantic projection vectors when API key is missing or quota is on cooldown
function textToVector(text: string, dim = 768): number[] {
  const vec = new Float32Array(dim);
  const normalized = (text || '').toLowerCase();
  const tokens = normalized.match(/\b[a-z0-9_]{2,}\b/g) ?? [];

  const projectFeature = (feature: string, weight: number) => {
    let h1 = 0x81_1C_9D_C5;
    let h2 = 0x01_00_01_93;
    for (let i = 0; i < feature.length; i++) {
      const ch = feature.codePointAt(i) ?? 0;
      h1 = Math.imul(h1 ^ ch, 0x01_00_01_93);
      h2 = Math.imul(h2 ^ (ch + i * 31), 0x5B_D1_E9_95);
    }
    for (let p = 0; p < 6; p++) {
      const mixed = Math.imul(h1 ^ (h2 + p * 0x9E_37_79_B9), 0x85_EB_CA_6B) >>> 0;
      const idx = mixed % dim;
      const sign = (mixed & 0x1_00_00) === 0 ? 1 : -1;
      vec[idx] += sign * weight;
    }
  };

  if (tokens.length === 0) {
    projectFeature(normalized || '_empty_', 1);
  } else {
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i] ?? '';
      projectFeature(`tok:${tok}`, 1);
      if (tok.length >= 4) {
        for (let g = 0; g <= tok.length - 3; g++) {
          projectFeature(`tri:${tok.slice(g, g + 3)}`, 0.35);
        }
      }
      if (i + 1 < tokens.length) {
        projectFeature(`bi:${tok}_${tokens[i + 1] ?? ''}`, 0.45);
      }
    }
  }

  let norm = 0;
  for (let i = 0; i < dim; i++) norm += vec[i] * vec[i];
  if (norm > 0) {
    norm = 1 / Math.sqrt(norm);
    for (let i = 0; i < dim; i++) vec[i] *= norm;
  }
  return [...vec];
}

// Server-side LRU cache and Quota Circuit Breaker for /api/embed
const EMBED_CACHE_MAX = 512;
const embedCache = new Map<string, number[]>();
let embedQuotaCooldownUntil = 0;

function getCachedEmbedding(text: string): number[] | undefined {
  const hit = embedCache.get(text);
  if (hit) {
    embedCache.delete(text);
    embedCache.set(text, hit);
  }
  return hit;
}

function setCachedEmbedding(text: string, values: number[]): void {
  if (embedCache.size >= EMBED_CACHE_MAX) {
    const oldestKey = embedCache.keys().next().value;
    if (typeof oldestKey === 'string') {
      embedCache.delete(oldestKey);
    }
  }
  embedCache.set(text, values);
}

function parseQuotaCooldownMs(errMsg: string): number {
  const retryMatch = /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/i.exec(errMsg) ?? /retry in (\d+)h(\d+)m/i.exec(errMsg);
  if (retryMatch) {
    if (retryMatch[2] !== undefined) {
      const hours = Number.parseInt(retryMatch[1] ?? '0', 10);
      const mins = Number.parseInt(retryMatch[2] ?? '0', 10);
      return Math.min(12 * 3600 * 1000, Math.max(60_000, (hours * 3600 + mins * 60) * 1000));
    }
    const seconds = Number.parseFloat(retryMatch[1] ?? '300');
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.min(12 * 3600 * 1000, Math.max(60_000, Math.round(seconds * 1000)));
    }
  }
  if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota exceeded')) {
    return 15 * 60 * 1000; // 15 minutes cooldown on quota exhaustion
  }
  return 60 * 1000; // 1 minute cooldown on transient failure
}

// Proxy API endpoint to safely fetch embeddings using gemini-embedding-2-preview
app.post('/api/embed', (req, res) => {
  const body = req.body as EmbedRequestBody;
  const text = typeof body.text === 'string' && body.text !== '' ? body.text : undefined;
  const texts = Array.isArray(body.texts) ? body.texts.map(String) : undefined;

  const isKeyPlaceholder = !apiKey || apiKey === '' || apiKey.includes('YOUR_GEMINI_API_KEY') || apiKey.includes('MY_GEMINI_API_KEY');
  const isQuotaOnCooldown = Date.now() < embedQuotaCooldownUntil;

  if (isKeyPlaceholder || isQuotaOnCooldown) {
    if (Array.isArray(texts)) {
      const result = texts.map((t) => getCachedEmbedding(t) ?? textToVector(t));
      res.json({ embeddings: result, degraded: true, quotaCooldownUntil: embedQuotaCooldownUntil });
      return;
    } else if (typeof text === 'string') {
      const values = getCachedEmbedding(text) ?? textToVector(text);
      res.json({ embedding: values, degraded: true, quotaCooldownUntil: embedQuotaCooldownUntil });
      return;
    } else {
      res.status(400).json({ error: 'Missing parameter "text" or "texts"' });
      return;
    }
  }

  void (async () => {
    try {
      if (Array.isArray(texts)) {
        const missingTexts = texts.filter((t) => !getCachedEmbedding(t));
        if (missingTexts.length > 0) {
          const response = (await ai.models.embedContent({
            model: 'gemini-embedding-2-preview',
            contents: missingTexts,
          })) as unknown as SDKEmbedResponse;
          const embeddings = response.embeddings;
          if (Array.isArray(embeddings)) {
            for (let i = 0; i < missingTexts.length; i++) {
              const vals = embeddings[i]?.values;
              if (typeof vals === 'object' && vals.length > 0) {
                setCachedEmbedding(missingTexts[i] ?? '', [...vals]);
              }
            }
          }
        }
        const result = texts.map((t) => getCachedEmbedding(t) ?? textToVector(t));
        res.json({ embeddings: result, degraded: false });
      } else if (typeof text === 'string') {
        const cached = getCachedEmbedding(text);
        if (cached) {
          res.json({ embedding: cached, degraded: false, cached: true });
          return;
        }
        const response = (await ai.models.embedContent({
          model: 'gemini-embedding-2-preview',
          contents: text,
        })) as unknown as SDKEmbedResponse;
        let values: number[] = [];
        const singleEmbedding = response.embedding;
        const batchEmbeddings = response.embeddings;
        if (typeof singleEmbedding?.values === 'object') {
          values = [...singleEmbedding.values];
        } else if (Array.isArray(batchEmbeddings) && batchEmbeddings.length > 0 && typeof batchEmbeddings[0]?.values === 'object') {
          values = [...batchEmbeddings[0].values];
        }
        if (values.length > 0) {
          setCachedEmbedding(text, values);
        } else {
          values = textToVector(text);
        }
        res.json({ embedding: values, degraded: false });
      } else {
        res.status(400).json({ error: 'Missing parameter "text" or "texts"' });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      embedQuotaCooldownUntil = Date.now() + parseQuotaCooldownMs(message);

      // Serve deterministic local semantic vector projection silently without console.warn error spam
      if (Array.isArray(texts)) {
        const result = texts.map((t) => getCachedEmbedding(t) ?? textToVector(t));
        res.json({ embeddings: result, degraded: true, quotaCooldownUntil: embedQuotaCooldownUntil });
      } else if (typeof text === 'string') {
        const values = getCachedEmbedding(text) ?? textToVector(text);
        res.json({ embedding: values, degraded: true, quotaCooldownUntil: embedQuotaCooldownUntil });
      } else {
        res.json({ embedding: [], degraded: true, quotaCooldownUntil: embedQuotaCooldownUntil });
      }
    }
  })();
});

interface TurnRequestBody {
  prompt?: unknown;
  model?: unknown;
  systemInstruction?: unknown;
  temperature?: unknown;
}

const DEFAULT_TURN_SYSTEM_INSTRUCTION =
  'Anda adalah Guardian Engine OS v2.0. Jalankan alur kerja 6-Langkah secara ketat. Output pertama adalah internal_guardian_monologue wajib teks ringkas, diikuti dengan block JSON lengkap. Gunakan "graph_updates" (bind/unbind/reweight) untuk menyimpan fakta persisten / mengubah memory. HATI-HATI: Gunakan "unbind" HANYA untuk membuang memori yang sudah tidak relevan/selesai, JANGAN hapus history alur penting!';

const TURN_SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

function generateFallbackTurn(fullPrompt: string): string {
  const choiceMatch = /Player Choice:\s*"([^"]+)"/i.exec(fullPrompt);
  const nameMatch = /-\s*Nama:\s*([^\n(]+)/i.exec(fullPrompt);
  const locMatch = /-\s*Lokasi:\s*([^\n(]+)/i.exec(fullPrompt);
  const weaponMatch = /-\s*Senjata Utama:\s*([^\n]+)/i.exec(fullPrompt);

  const rawHint = choiceMatch?.[1] || fullPrompt.slice(-100);
  const safeHint = rawHint.replaceAll(/["\\]/g, ' ').trim() || 'Melanjutkan petualangan';
  const mcName = (nameMatch?.[1]?.trim() || 'Protagonis').replaceAll(/["\\]/g, '');
  const locName = (locMatch?.[1]?.trim() || 'Wilayah Petualangan').replaceAll(/["\\]/g, '');
  const weaponName = (weaponMatch?.[1]?.trim() || 'perlengkapan utama').replaceAll(/["\\]/g, '');

  return `Internal Guardian Monologue:
[CHRONOS: Normal Flow] [CONTEXTUS: Baseline Simulation] [ANIMA: Steady] [LOGICA: Deterministic Continuity]
Sistem mengeksekusi giliran secara deterministik untuk tindakan pemain: "${safeHint}".

\`\`\`json
{
  "new_full_chronicle_entry": {
    "narrative": "${mcName} mencermati situasi sekelilingnya dengan waspada setelah mengambil tindakan. Suasana di ${locName} bergerak dinamis seiring langkah yang diambil.",
    "narrative_blocks": [
      {
        "name": "${mcName}",
        "narration": "${mcName} memperhatikan setiap sudut di ${locName} dan memastikan ${weaponName} miliknya tetap siap.",
        "dialogue": "...",
        "action": "Mengamati keadaan sekitar"
      }
    ],
    "choices": [
      {
        "id": "C-1",
        "text": "Menyelidiki jalur utama menuju pusat ${locName}",
        "weight": 0.85
      },
      {
        "id": "C-2",
        "text": "Mendekati keramaian terdekat untuk mencari informasi",
        "weight": 0.75
      },
      {
        "id": "C-3",
        "text": "Beristirahat sejenak sambil memeriksa ${weaponName}",
        "weight": 0.65
      }
    ]
  }
}
\`\`\``;
}

const modelCooldownUntil = new Map<string, number>();

// Proxy API endpoint to safely execute game turns via Gemini on the server
app.post('/api/turn', (req, res) => {
  const body = req.body as TurnRequestBody;
  const prompt = typeof body.prompt === 'string' ? body.prompt : '';
  const systemInstruction = typeof body.systemInstruction === 'string' && body.systemInstruction !== ''
    ? body.systemInstruction
    : DEFAULT_TURN_SYSTEM_INSTRUCTION;
  const temperature = typeof body.temperature === 'number' ? body.temperature : 0.5;

  if (!prompt) {
    res.status(400).json({ error: 'Missing parameter "prompt"' });
    return;
  }

  const isKeyPlaceholder = !apiKey || apiKey === '' || apiKey.includes('YOUR_GEMINI_API_KEY') || apiKey.includes('MY_GEMINI_API_KEY');

  if (isKeyPlaceholder) {
    res.json({ text: generateFallbackTurn(prompt) });
    return;
  }

  void (async () => {
    const requestedModel = typeof body.model === 'string' && body.model !== '' ? body.model : 'gemini-3.5-flash-lite';
    const allCandidates = [
      requestedModel,
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
      'gemini-flash-latest'
    ].filter((m, i, arr) => arr.indexOf(m) === i);

    const now = Date.now();
    const activeCandidates = allCandidates.filter((m) => (modelCooldownUntil.get(m) ?? 0) <= now);
    const candidateModels = activeCandidates.length > 0 ? activeCandidates : allCandidates;

    let generatedText: string | null = null;

    for (const candModel of candidateModels) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: candModel,
            contents: prompt,
            config: {
              systemInstruction,
              temperature,
              safetySettings: TURN_SAFETY_SETTINGS,
            },
          });
          const text = typeof response.text === 'string' ? response.text : '';
          if (text.length > 0) {
            generatedText = text;
            modelCooldownUntil.delete(candModel);
            break;
          }
        } catch (error: unknown) {
          const errMsg = error instanceof Error ? error.message : String(error);
          if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota exceeded')) {
            modelCooldownUntil.set(candModel, Date.now() + parseQuotaCooldownMs(errMsg));
            break;
          }
          const isTransient = errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand') || errMsg.includes('fetch failed');
          if (isTransient && attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 250));
            continue;
          }
          modelCooldownUntil.set(candModel, Date.now() + 30_000);
          break;
        }
      }

      if (generatedText !== null) {
        break;
      }
    }

    if (generatedText === null) {
      res.json({ text: generateFallbackTurn(prompt) });
    } else {
      res.json({ text: generatedText });
    }
  })();
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve Burn WASM runtime artifacts (/wasm/burn_research.js & /wasm/burn_research_bg.wasm)
 * directly from `/math compesor` without duplicating the 7 MB binary in `public/`.
 */
app.use(
  '/wasm',
  express.static(join(process.cwd(), 'math compesor'), {
    maxAge: '1h',
    index: false,
    redirect: false,
  }),
);

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-nullish-coalescing
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    // eslint-disable-next-line no-console, @typescript-eslint/restrict-template-expressions
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
