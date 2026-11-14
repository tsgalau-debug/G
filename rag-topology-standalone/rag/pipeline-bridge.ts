import { BaseIndexer } from './base-indexer';
import { HybridCSRMatrix, RetrievalPipeline } from './hybrid-pipeline';

const DEFAULT_STOP_WORDS = new Set([
  'dan', 'yang', 'di', 'ke', 'dari', 'ini', 'itu', 'dengan', 'untuk', 'pada',
  'adalah', 'sebagai', 'dalam', 'tidak', 'akan', 'atau', 'juga', 'sudah',
  'saya', 'aku', 'kamu', 'dia', 'mereka', 'kita', 'kami', 'ada', 'bisa',
  'the', 'and', 'to', 'of', 'in', 'is', 'for', 'on', 'with', 'as', 'at', 'by',
]);

/**
 * Embedding-Free Semantic Vectorizer (Random Indexing + Character/Bigram N-Gram Superposition).
 *
 * Menghasilkan vektor unit L2 di R^dim secara 100% deterministik tanpa model embedding eksternal:
 * 1. Unigram Random Projection (bobot 1.0, atau 1.35 untuk kata kunci >= 6 karakter)
 * 2. Contextual Word Bigram Binding (bobot 0.65) untuk mempertahankan urutan frasa
 * 3. Character 3-Gram Subword Projection (bobot 0.25) agar tahan terhadap variasi morfologi & typo
 */
export function encodeSemanticFallbackVector(
  text: string,
  dim = 768,
  stopWords: ReadonlySet<string> = DEFAULT_STOP_WORDS
): Float32Array {
  const vec = new Float32Array(dim);
  const rawTokens = (text || '')
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter((t) => t.length >= 2 && !stopWords.has(t));

  if (rawTokens.length === 0) {
    vec[0] = 1;
    return vec;
  }

  const projectFeature = (feature: string, weight: number) => {
    let h1 = 2166136261;
    let h2 = 16777619;
    for (let i = 0; i < feature.length; i++) {
      const c = feature.charCodeAt(i);
      h1 ^= c;
      h1 = Math.imul(h1, 16777619);
      h2 ^= c + i * 31;
      h2 = Math.imul(h2, 1099511628211 & 0xffffffff);
    }

    const SPARSITY = 24;
    for (let s = 0; s < SPARSITY; s++) {
      h1 = Math.imul(h1 ^ (s + 1), 2654435761);
      h2 = Math.imul(h2 ^ (s * 17 + 3), 2246822519);
      const idx = (h1 >>> 0) % dim;
      const sign = (h2 & 1) === 0 ? 1 : -1;
      vec[idx] += sign * weight;
    }
  };

  for (let i = 0; i < rawTokens.length; i++) {
    const tok = rawTokens[i]!;
    const tokWeight = tok.length >= 6 ? 1.35 : 1.0;
    projectFeature(`tok:${tok}`, tokWeight);

    if (i + 1 < rawTokens.length) {
      projectFeature(`bg:${tok}_${rawTokens[i + 1]}`, 0.65);
    }

    if (tok.length >= 4) {
      const padded = `<${tok}>`;
      for (let c = 0; c <= padded.length - 3; c++) {
        projectFeature(`cg:${padded.slice(c, c + 3)}`, 0.25);
      }
    }
  }

  let norm = 0;
  for (let i = 0; i < dim; i++) norm += vec[i] * vec[i];
  const inv = norm > 1e-10 ? 1 / Math.sqrt(norm) : 0;
  if (inv > 0) {
    for (let i = 0; i < dim; i++) vec[i] *= inv;
  } else {
    vec[0] = 1;
  }

  return vec;
}

/**
 * Rebuilds the CSR inverted lists, BM25 upper bounds, and term co-occurrence graph
 * inside `RetrievalPipeline` directly from `BaseIndexer`.
 */
export function rebuildPipelineFromIndexer(
  indexer: BaseIndexer,
  pipeline: RetrievalPipeline,
  docIdMap: Map<string, number>,
  numTerms: number,
  maxDocs: number,
  hashTermFn: (term: string) => number,
  docFHRR: Float32Array
): void {
  const inverted = indexer.inverted as any;
  const termPostings: Map<string, { docId: string; tf: number }[]> = inverted.termPostings;
  const docFreq: Map<string, number> = inverted.docFreq;
  const docIdToIdx: Map<string, number> = inverted.docIdToIdx;
  const docLengths: Int32Array = inverted.docLengths;
  const totalDocs: number = Math.max(1, inverted.totalDocs || 1);

  let totalLen = 0;
  let activeChunks = 0;
  for (const [, idx] of docIdToIdx.entries()) {
    totalLen += docLengths[idx] || 0;
    activeChunks++;
  }
  const avgDl = activeChunks > 0 ? Math.max(1, totalLen / activeChunks) : 1;

  const bucketMaps = Array.from({ length: numTerms }, () => new Map<number, number>());
  const termUB = new Float32Array(numTerms);
  const docTermSets = new Map<number, Set<number>>();

  const k1 = 1.2;
  const b = 0.75;
  const chunkToDoc: Map<string, string> = (indexer as any).chunkToDoc;

  for (const [term, postings] of termPostings.entries()) {
    const tBucket = hashTermFn(term) % numTerms;
    const df = docFreq.get(term) || 1;
    const idf = Math.max(0.05, Math.log(1 + (totalDocs - df + 0.5) / (df + 0.5)));

    const bMap = bucketMaps[tBucket]!;
    for (const post of postings) {
      const parentDocKey = chunkToDoc.get(post.docId) ?? post.docId;
      const numericDocId = docIdMap.get(parentDocKey);
      if (numericDocId === undefined || numericDocId < 0 || numericDocId >= maxDocs) continue;

      const chunkIdx = docIdToIdx.get(post.docId);
      const dl = chunkIdx === undefined ? avgDl : docLengths[chunkIdx] || avgDl;
      const tf = post.tf;
      const normTf = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (dl / avgDl)) + 1e-6);
      const score = idf * normTf;

      const prev = bMap.get(numericDocId) || 0;
      const updated = prev + score;
      bMap.set(numericDocId, updated);
      if (updated > termUB[tBucket]!) {
        termUB[tBucket] = updated;
      }

      let tSet = docTermSets.get(numericDocId);
      if (!tSet) {
        tSet = new Set<number>();
        docTermSets.set(numericDocId, tSet);
      }
      tSet.add(tBucket);
    }
  }

  let totalInvEntries = 0;
  for (let t = 0; t < numTerms; t++) {
    totalInvEntries += bucketMaps[t]!.size;
  }

  const invLists = new HybridCSRMatrix(numTerms, maxDocs, totalInvEntries);
  let invCursor = 0;
  for (let t = 0; t < numTerms; t++) {
    invLists.rowPtr[t] = invCursor;
    const sortedEntries = [...bucketMaps[t]!.entries()].sort((a, b) => a[0] - b[0]);
    for (const [docId, val] of sortedEntries) {
      invLists.colIdx[invCursor] = docId;
      invLists.values[invCursor] = val;
      invCursor++;
    }
  }
  invLists.rowPtr[numTerms] = invCursor;

  const cooccurMaps = Array.from({ length: numTerms }, () => new Map<number, number>());
  for (const [, tSet] of docTermSets.entries()) {
    const termsArr = [...tSet].slice(0, 48);
    const len = termsArr.length;
    for (let i = 0; i < len; i++) {
      const ti = termsArr[i]!;
      const cMapI = cooccurMaps[ti]!;
      for (let j = i + 1; j < len; j++) {
        const tj = termsArr[j]!;
        cMapI.set(tj, (cMapI.get(tj) || 0) + 1);
        const cMapJ = cooccurMaps[tj]!;
        cMapJ.set(ti, (cMapJ.get(ti) || 0) + 1);
      }
    }
  }

  let totalCooccurEntries = 0;
  for (let t = 0; t < numTerms; t++) {
    totalCooccurEntries += Math.min(16, cooccurMaps[t]!.size);
  }

  const cooccur = new HybridCSRMatrix(numTerms, numTerms, totalCooccurEntries);
  let coCursor = 0;
  for (let t = 0; t < numTerms; t++) {
    cooccur.rowPtr[t] = coCursor;
    const topNb = [...cooccurMaps[t]!.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 16)
      .sort((a, b) => a[0] - b[0]);

    let rowSum = 0;
    for (const [, w] of topNb) rowSum += w;
    const invRow = rowSum > 0 ? 1 / rowSum : 0;

    for (const [nb, w] of topNb) {
      cooccur.colIdx[coCursor] = nb;
      cooccur.values[coCursor] = w * invRow;
      coCursor++;
    }
  }
  cooccur.rowPtr[numTerms] = coCursor;

  pipeline.build(invLists, termUB, cooccur, docFHRR, pipeline.projection);
}
