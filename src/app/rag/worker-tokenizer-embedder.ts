/* eslint-disable */
import { encodeSemanticFallbackVector } from "./pipeline-bridge";

export interface EmbeddingProof {
  vector: Float32Array;
  source: "remote" | "fallback";
  degraded: boolean;
  latencyMs: number;
}

const WORKER_EMBED_CACHE_MAX = 512;
const _workerEmbedCache = new Map<
  string,
  { vector: Float32Array; source: "remote" | "fallback"; degraded: boolean }
>();
let _remoteQuotaCooldownUntil = 0;

function _getCachedProof(
  cacheKey: string,
  start: number
): EmbeddingProof | undefined {
  const cached = _workerEmbedCache.get(cacheKey);
  if (!cached) return undefined;
  _workerEmbedCache.delete(cacheKey);
  _workerEmbedCache.set(cacheKey, cached);
  return {
    vector: cached.vector,
    source: cached.source,
    degraded: cached.degraded,
    latencyMs: performance.now() - start,
  };
}

function _setCachedProof(
  cacheKey: string,
  vector: Float32Array,
  source: "remote" | "fallback",
  degraded: boolean
): void {
  if (_workerEmbedCache.size >= WORKER_EMBED_CACHE_MAX) {
    const oldest = _workerEmbedCache.keys().next().value;
    if (typeof oldest === "string") {
      _workerEmbedCache.delete(oldest);
    }
  }
  _workerEmbedCache.set(cacheKey, { vector, source, degraded });
}

export function _resetWorkerEmbeddingCircuitBreaker(): void {
  _remoteQuotaCooldownUntil = 0;
  _workerEmbedCache.clear();
}

export function _canonicalTokens(input: string | string[]): string[] {
  const str = Array.isArray(input) ? input.join(" ") : String(input);
  return str.toLowerCase().match(/\b[a-z0-9_]{2,}\b/g) || [];
}

export function _tf(text: string): Map<string, number> {
  const f = new Map<string, number>();
  const words = _canonicalTokens(text);
  for (const w of words) f.set(w, (f.get(w) || 0) + 1);
  return f;
}

export function _chunk(docId: string, text: string): any[] {
  const tokens = _canonicalTokens(text).length;
  if (text.length <= 512) {
    return [
      {
        id: `${docId}_c0`,
        docId,
        text,
        termFreq: _tf(text),
        tokenCount: tokens,
        modifiedAt: Date.now(),
      },
    ];
  }
  const out = [];
  const size = 450,
    overlap = 50;
  for (let pos = 0, idx = 0; pos < text.length; pos += size - overlap, idx++) {
    const t = text.slice(pos, Math.min(pos + size, text.length));
    out.push({
      id: `${docId}_c${idx}`,
      docId,
      text: t,
      termFreq: _tf(t),
      tokenCount: _canonicalTokens(t).length,
      modifiedAt: Date.now(),
    });
  }
  return out;
}

export function _hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h = Math.trunc(h);
  }
  return Math.abs(h).toString(36);
}

export function _hashTerm(term: string): number {
  let h = 0;
  for (let i = 0; i < term.length; i++) {
    h = (h << 5) - h + term.charCodeAt(i);
    h = Math.trunc(h);
  }
  return Math.abs(h);
}

export function _textToVector(text: string, dim = 768): Float32Array {
  return encodeSemanticFallbackVector(text, dim);
}

/**
 * Computes a 768-D semantic embedding proof.
 * By default (`useRemoteApi = false`), uses the zero-latency, zero-quota in-worker
 * Semantic Token + Character N-Gram + Bigram Random Indexing (`encodeSemanticFallbackVector`)
 * so that indexing static lore, knowledge graph facts, episodes, and logs never burns
 * Gemini API quota or suffers from vector-space mismatch.
 * When `useRemoteApi = true`, probes `/api/embed` with a Quota Circuit Breaker and LRU cache.
 */
export async function _getEmbeddingProof(
  text: string,
  dim = 768,
  useRemoteApi = false
): Promise<EmbeddingProof> {
  const start = performance.now();
  const cacheKey = `${useRemoteApi ? "rem" : "loc"}:${dim}:${text}`;
  const cached = _getCachedProof(cacheKey, start);
  if (cached) {
    return cached;
  }

  if (!useRemoteApi) {
    const localVec = _textToVector(text, dim);
    _setCachedProof(cacheKey, localVec, "fallback", false);
    return {
      vector: localVec,
      source: "fallback",
      degraded: false,
      latencyMs: performance.now() - start,
    };
  }

  const origin =
    typeof self !== "undefined" && self.location ? self.location.origin : "";
  if (
    !origin ||
    origin === "null" ||
    origin.startsWith("null") ||
    Date.now() < _remoteQuotaCooldownUntil
  ) {
    const fallbackVec = _textToVector(text, dim);
    _setCachedProof(cacheKey, fallbackVec, "fallback", true);
    return {
      vector: fallbackVec,
      source: "fallback",
      degraded: true,
      latencyMs: performance.now() - start,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(`${origin}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      _remoteQuotaCooldownUntil = Date.now() + 60_000;
      throw new Error(`Embedding request failed with status ${response.status}`);
    }
    const data = await response.json();
    if (data?.degraded === true) {
      const serverCooldown =
        typeof data.quotaCooldownUntil === "number" &&
        data.quotaCooldownUntil > Date.now()
          ? data.quotaCooldownUntil
          : Date.now() + 5 * 60_000;
      _remoteQuotaCooldownUntil = serverCooldown;
      const fallbackVec = _textToVector(text, dim);
      _setCachedProof(cacheKey, fallbackVec, "fallback", true);
      return {
        vector: fallbackVec,
        source: "fallback",
        degraded: true,
        latencyMs: performance.now() - start,
      };
    }
    if (
      data?.embedding &&
      Array.isArray(data.embedding) &&
      data.embedding.length === dim
    ) {
      const remoteVec = new Float32Array(data.embedding);
      _setCachedProof(cacheKey, remoteVec, "remote", false);
      return {
        vector: remoteVec,
        source: "remote",
        degraded: false,
        latencyMs: performance.now() - start,
      };
    }
    throw new Error("Invalid embedding response format");
  } catch {
    clearTimeout(timeoutId);
    if (_remoteQuotaCooldownUntil <= Date.now()) {
      _remoteQuotaCooldownUntil = Date.now() + 60_000;
    }
    const fallbackVec = _textToVector(text, dim);
    _setCachedProof(cacheKey, fallbackVec, "fallback", true);
    return {
      vector: fallbackVec,
      source: "fallback",
      degraded: true,
      latencyMs: performance.now() - start,
    };
  }
}
