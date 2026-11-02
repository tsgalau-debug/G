/* eslint-disable */
import { BaseIndexer } from './base-indexer';
import { HybridCSRMatrix, RetrievalPipeline } from './hybrid-pipeline';

/**
 * Rebuild pipeline CSR matrices from BaseIndexer state.
 * Call this after every batch indexing (sync) to keep WAND + SimHash alive.
 */
export function rebuildPipelineFromIndexer(
  indexer: BaseIndexer,
  pipeline: RetrievalPipeline,
  keyToNumericId: Map<string, number>,
  numTerms: number,
  numDocs: number,
  hashTerm: (t: string) => number,
  docFHRR?: Float32Array
): void {
  // -------------------------------------------------------------------------
  // Access internal indexer maps (worker tsconfig is permissive)
  // -------------------------------------------------------------------------
  const termPostings = (indexer as any).inverted?.termPostings as Map<string, { docId: string; tf: number }[]> | undefined;
  const chunkToDoc   = (indexer as any).chunkToDoc as Map<string, string> | undefined;

  if (!termPostings || !chunkToDoc) {
    console.warn('[PipelineBridge] Indexer internals missing');
    return;
  }

  // -------------------------------------------------------------------------
  // PHASE 1: Group postings by hashed termId and numeric docId
  // Handles:
  // - Multiple chunks within the same document (tf summed)
  // - Multiple string terms hashing to the same termId (tf summed)
  // - Out-of-bounds termId and docId filtering
  // -------------------------------------------------------------------------
  const termDocMap = new Map<number, Map<number, number>>();
  const docTerms: Set<number>[] = new Array(numDocs);
  for (let i = 0; i < numDocs; i++) {
    docTerms[i] = new Set<number>();
  }

  for (const [term, postings] of termPostings) {
    const termId = Math.abs(hashTerm(term)) % numTerms;
    if (termId < 0 || termId >= numTerms) continue;

    let docTf = termDocMap.get(termId);
    if (!docTf) {
      docTf = new Map<number, number>();
      termDocMap.set(termId, docTf);
    }

    for (const post of postings) {
      const key = chunkToDoc.get(post.docId);
      if (!key) continue;
      const did = keyToNumericId.get(key);
      if (did === undefined || did < 0 || did >= numDocs) continue;

      docTf.set(did, (docTf.get(did) || 0) + post.tf);
      docTerms[did].add(termId);
    }
  }

  // -------------------------------------------------------------------------
  // PHASE 2: Build Inverted List CSR (WAND requirement: strictly sorted by did)
  // -------------------------------------------------------------------------
  const rowCounts = new Int32Array(numTerms);
  for (const [termId, docTf] of termDocMap) {
    rowCounts[termId] = docTf.size;
  }

  const rowPtr = new Int32Array(numTerms + 1);
  rowPtr[0] = 0;
  for (let i = 0; i < numTerms; i++) {
    rowPtr[i + 1] = rowPtr[i] + rowCounts[i];
  }
  const totalPostings = rowPtr[numTerms];

  const invColIdx = new Int32Array(totalPostings);
  const invValues = new Float32Array(totalPostings);
  const termUB    = new Float32Array(numTerms);

  for (let termId = 0; termId < numTerms; termId++) {
    const docTf = termDocMap.get(termId);
    if (!docTf || docTf.size === 0) continue;

    // Sort strictly ascending by numeric did for WAND correctness
    const entries = Array.from(docTf.entries()).sort((a, b) => a[0] - b[0]);
    const offset = rowPtr[termId];
    let maxTf = 0;

    for (let i = 0; i < entries.length; i++) {
      const [did, tf] = entries[i]!;
      invColIdx[offset + i] = did;
      invValues[offset + i] = tf;
      if (tf > maxTf) maxTf = tf;
    }
    termUB[termId] = maxTf;
  }

  const invLists = new HybridCSRMatrix(numTerms, numDocs, totalPostings);
  invLists.rowPtr.set(rowPtr);
  invLists.colIdx.set(invColIdx);
  invLists.values.set(invValues);

  // -------------------------------------------------------------------------
  // PHASE 3: Build Co-occurrence CSR (directed, key-level overlap)
  // -------------------------------------------------------------------------
  const cooccur = buildCooccurCSRFromDocTerms(docTerms, numTerms);

  // -------------------------------------------------------------------------
  // PHASE 4: Commit to pipeline
  // -------------------------------------------------------------------------
  if (docFHRR && docFHRR.length >= numDocs * pipeline.dim) {
    pipeline.build(invLists, termUB, cooccur, docFHRR, pipeline.projection);
  } else {
    pipeline.invLists = invLists;
    pipeline.termUB.fill(0);
    pipeline.termUB.set(termUB.subarray(0, numTerms));
    pipeline.cooccur = cooccur;
  }
}

/**
 * Builds the directed term co-occurrence CSR matrix from deduplicated docTerms.
 */
export function buildCooccurCSRFromDocTerms(
  docTerms: Set<number>[],
  numTerms: number
): HybridCSRMatrix {
  const numDocs = docTerms.length;
  // Undirected pairs (t1, t2) with t1 < t2
  const pairMap = new Map<number, number>();

  for (let d = 0; d < numDocs; d++) {
    const termsSet = docTerms[d];
    if (!termsSet || termsSet.size < 2) continue;

    const terms = Array.from(termsSet);
    terms.sort((a, b) => a - b);

    for (let i = 0; i < terms.length; i++) {
      const ti = terms[i]!;
      for (let j = i + 1; j < terms.length; j++) {
        const tj = terms[j]!;
        if (ti === tj) continue; // safety guard
        const code = ti * numTerms + tj;
        pairMap.set(code, (pairMap.get(code) || 0) + 1);
      }
    }
  }

  // Convert to symmetric CSR: (ti -> tj) and (tj -> ti)
  const rows: Array<Array<{ dst: number; count: number }>> = new Array(numTerms);
  for (let i = 0; i < numTerms; i++) {
    rows[i] = [];
  }

  for (const [code, count] of pairMap) {
    const src = Math.floor(code / numTerms);
    const dst = code % numTerms;
    if (src < 0 || src >= numTerms || dst < 0 || dst >= numTerms) continue;
    rows[src]!.push({ dst, count });
    rows[dst]!.push({ dst: src, count });
  }

  // Ensure deterministic column ordering within each CSR row
  for (let i = 0; i < numTerms; i++) {
    rows[i]!.sort((a, b) => a.dst - b.dst);
  }

  const rowPtr = new Int32Array(numTerms + 1);
  rowPtr[0] = 0;
  for (let i = 0; i < numTerms; i++) {
    rowPtr[i + 1] = rowPtr[i]! + rows[i]!.length;
  }
  const totalPairs = rowPtr[numTerms]!;

  const colIdx = new Int32Array(totalPairs);
  const values = new Float32Array(totalPairs);

  for (let src = 0; src < numTerms; src++) {
    const r = rows[src]!;
    const offset = rowPtr[src]!;
    for (let k = 0; k < r.length; k++) {
      colIdx[offset + k] = r[k]!.dst;
      values[offset + k] = r[k]!.count;
    }
  }

  const cooccur = new HybridCSRMatrix(numTerms, numTerms, totalPairs);
  cooccur.rowPtr.set(rowPtr);
  cooccur.colIdx.set(colIdx);
  cooccur.values.set(values);
  return cooccur;
}

/**
 * Direct entrypoint for building cooccur CSR from indexer state.
 */
export function buildCooccurCSR(
  indexer: BaseIndexer,
  keyToNumericId: Map<string, number>,
  numTerms: number,
  numDocs: number,
  hashTerm: (t: string) => number,
  _dedupFlag?: Int32Array
): HybridCSRMatrix {
  const termPostings = (indexer as any).inverted?.termPostings as Map<string, { docId: string; tf: number }[]> | undefined;
  const chunkToDoc   = (indexer as any).chunkToDoc as Map<string, string> | undefined;

  if (!termPostings || !chunkToDoc) {
    return new HybridCSRMatrix(numTerms, numTerms, 0);
  }

  const docTerms: Set<number>[] = new Array(numDocs);
  for (let i = 0; i < numDocs; i++) {
    docTerms[i] = new Set<number>();
  }

  for (const [term, postings] of termPostings) {
    const termId = Math.abs(hashTerm(term)) % numTerms;
    if (termId < 0 || termId >= numTerms) continue;

    for (const post of postings) {
      const key = chunkToDoc.get(post.docId);
      if (!key) continue;
      const did = keyToNumericId.get(key);
      if (did === undefined || did < 0 || did >= numDocs) continue;

      docTerms[did].add(termId);
    }
  }

  return buildCooccurCSRFromDocTerms(docTerms, numTerms);
}

// ---------------------------------------------------------------------------
// Deterministic Semantic Fallback Vector Encoder (Token + Bigram + Char 3-Gram)
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  'yang', 'dan', 'di', 'ke', 'dari', 'ini', 'itu', 'dengan', 'untuk', 'pada',
  'adalah', 'dalam', 'atau', 'oleh', 'sebagai', 'akan', 'telah', 'sudah', 'bisa',
  'ada', 'tidak', 'таk', 'nya', 'mereka', 'kita', 'kami', 'ia', 'dia', 'saat',
  'ketika', 'jika', 'bila', 'karena', 'namun', 'tetapi', 'juga', 'masih',
  'the', 'and', 'of', 'to', 'in', 'is', 'for', 'on', 'with', 'as', 'at', 'by', 'an'
]);

function _mix32(h: number): number {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

function _hashFeature(feature: string, seed = 0x9e3779b9): number {
  let h = seed >>> 0;
  for (let i = 0; i < feature.length; i++) {
    h ^= feature.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return _mix32(h);
}

function _projectFeature(vec: Float32Array, dim: number, feature: string, weight: number, probes: number): void {
  const baseHash = _hashFeature(feature, 0x811c9dc5);
  for (let p = 0; p < probes; p++) {
    const mixed = _mix32(baseHash + Math.imul(p + 1, 0x9e3779b9));
    const idx = mixed % dim;
    const sign = (mixed & 0x80000000) !== 0 ? -1 : 1;
    vec[idx] += sign * weight;
  }
}

/**
 * Generates a unit-normalized semantic vector in R^dim using Random Indexing
 * over canonical word tokens, adjacent word bigrams, and character 3-grams.
 * Preserves high cosine similarity across paraphrased/reordered sentences and
 * morphological variants even when remote embedding APIs are offline.
 */
export function encodeSemanticFallbackVector(text: string, dim = 768): Float32Array {
  const vec = new Float32Array(dim);
  const rawTokens = String(text || '').toLowerCase().match(/\b[a-z0-9_]{2,}\b/g) || [];
  const filteredTokens = rawTokens.filter(t => !STOP_WORDS.has(t));
  const activeTokens = filteredTokens.length > 0 ? filteredTokens : rawTokens;

  if (activeTokens.length === 0) {
    // Fallback for single-char or symbol-only strings
    const str = String(text || '');
    for (let i = 0; i < str.length; i++) {
      const h = _mix32(str.charCodeAt(i) + Math.imul(i + 1, 0x9e3779b9));
      vec[h % dim] += (h & 1) ? 1 : -1;
    }
  } else {
    // 1. Unigram Token Projections (sublinear TF + token specificity weighting)
    const tfMap = new Map<string, number>();
    for (const token of activeTokens) {
      tfMap.set(token, (tfMap.get(token) || 0) + 1);
    }

    for (const [token, tf] of tfMap.entries()) {
      const tfWeight = 1 + Math.log(tf);
      const lenWeight = Math.min(1.8, 0.75 + token.length * 0.08);
      const tokenWeight = tfWeight * lenWeight;
      _projectFeature(vec, dim, `tok:${token}`, tokenWeight, 12);

      // 2. Character 3-grams for morphological resilience (e.g., menyerang / penyerangan / serang)
      if (token.length >= 4) {
        const padded = `^${token}$`;
        const ngramWeight = (0.28 * tfWeight) / Math.sqrt(padded.length - 2);
        for (let i = 0; i <= padded.length - 3; i++) {
          const trigram = padded.slice(i, i + 3);
          _projectFeature(vec, dim, `ng3:${trigram}`, ngramWeight, 4);
        }
      }
    }

    // 3. Adjacent Token Bigrams for local phrase-order sensitivity
    for (let i = 0; i < activeTokens.length - 1; i++) {
      const bigram = `${activeTokens[i]}_${activeTokens[i + 1]}`;
      _projectFeature(vec, dim, `bg:${bigram}`, 0.42, 6);
    }
  }

  let norm = 0;
  for (let i = 0; i < dim; i++) {
    norm += vec[i]! * vec[i]!;
  }
  if (norm > 1e-12) {
    const invNorm = 1 / Math.sqrt(norm);
    for (let i = 0; i < dim; i++) {
      vec[i] *= invNorm;
    }
  }
  return vec;
}

