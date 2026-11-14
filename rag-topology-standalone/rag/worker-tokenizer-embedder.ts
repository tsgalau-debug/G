import { IndexedChunk } from './base-indexer';
import { encodeSemanticFallbackVector } from './pipeline-bridge';

export interface EmbeddingProof {
  vector: Float32Array;
  degraded: boolean;
}

export type CustomVectorEncoder = (text: string, dim: number) => Promise<Float32Array> | Float32Array;

let customEncoder: CustomVectorEncoder | null = null;
const embeddingCache = new Map<string, EmbeddingProof>();

/**
 * Opsional: daftarkan fungsi encoder kustom jika ingin membandingkan
 * performa Random Indexing tanpa model embedding vs model eksternal.
 */
export function setCustomVectorEncoder(encoder: CustomVectorEncoder | null): void {
  customEncoder = encoder;
  embeddingCache.clear();
}

export function clearEmbeddingCache(): void {
  embeddingCache.clear();
}

export function _hash(str: string): string {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

export function _hashTerm(term: string): number {
  let h = 2166136261;
  for (let i = 0; i < term.length; i++) {
    h ^= term.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function _canonicalTokens(input: string | string[] | undefined): string[] {
  if (!input) return [];
  const raw = Array.isArray(input) ? input.join(' ') : String(input);
  const tokens = raw
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter((t) => t.length >= 2);
  return Array.from(new Set(tokens)).sort();
}

export function _chunk(docId: string, text: string): IndexedChunk[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: IndexedChunk[] = [];
  let current = '';
  let idx = 0;

  const flush = (txt: string) => {
    const tf = new Map<string, number>();
    const rawTokens = txt
      .toLowerCase()
      .split(/[^a-z0-9_]+/)
      .filter((t) => t.length >= 2);
    for (const w of rawTokens) {
      tf.set(w, (tf.get(w) || 0) + 1);
    }

    const chunkObj: IndexedChunk = {
      id: `${docId}_c${idx++}`,
      docId,
      text: txt.trim(),
      termFreq: tf,
      modifiedAt: Date.now(),
      tokenCount: Math.max(1, rawTokens.length),
    };
    chunks.push(chunkObj);
  };

  for (const s of sentences) {
    if ((current + s).length > 350 && current.length > 0) {
      flush(current);
      current = '';
    }
    current += s + ' ';
  }
  if (current.trim().length > 0) flush(current);
  return chunks;
}

/**
 * Menghasilkan vektor representasi secara 100% lokal (embedding-free) menggunakan
 * Random Indexing + Bigram + Character 3-Gram Superposition (`encodeSemanticFallbackVector`),
 * atau melalui `customEncoder` jika peneliti menyetelnya.
 */
export async function _getEmbeddingProof(text: string, dim = 768): Promise<EmbeddingProof> {
  const trimmed = (text || '').trim();
  const cacheKey = `${dim}::${_hash(trimmed)}::${trimmed.length}`;

  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey)!;
  }

  let proof: EmbeddingProof;

  if (customEncoder) {
    try {
      const vec = await customEncoder(trimmed, dim);
      proof = { vector: vec, degraded: false };
    } catch {
      proof = { vector: encodeSemanticFallbackVector(trimmed, dim), degraded: true };
    }
  } else {
    proof = {
      vector: encodeSemanticFallbackVector(trimmed, dim),
      degraded: false,
    };
  }

  if (embeddingCache.size > 1000) {
    const firstKey = embeddingCache.keys().next().value;
    if (firstKey !== undefined) embeddingCache.delete(firstKey);
  }
  embeddingCache.set(cacheKey, proof);
  return proof;
}
