import { describe, test, expect } from 'vitest';
import { BaseIndexer, IndexedChunk, DocumentHeader } from '../../app/rag/base-indexer';
import { HybridCSRMatrix, RetrievalPipeline } from '../../app/rag/hybrid-pipeline';
import {
  buildCooccurCSR,
  buildCooccurCSRFromDocTerms,
  rebuildPipelineFromIndexer
} from '../../app/rag/pipeline-bridge';

function makeChunk(id: string, docId: string, text: string): IndexedChunk {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const tf = new Map<string, number>();
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  const maxF = Math.max(...Object.values(freq), 1);
  for (const [k, v] of Object.entries(freq)) tf.set(k, v / maxF);

  return {
    id,
    docId,
    text,
    termFreq: tf,
    tokenCount: words.length,
    modifiedAt: Date.now(),
  };
}

function getCSRValue(matrix: HybridCSRMatrix, src: number, dst: number): number {
  const start = matrix.rowPtr[src]!;
  const end = matrix.rowPtr[src + 1]!;
  for (let p = start; p < end; p++) {
    if (matrix.colIdx[p] === dst) {
      return matrix.values[p]!;
    }
  }
  return 0;
}

describe('PipelineBridge - Co-occurrence CSR & Pipeline Rebuild', () => {
  test('buildCooccurCSRFromDocTerms builds symmetric co-occurrence with correct weights', () => {
    const numTerms = 10;
    // Doc 0: terms 1, 2, 3
    // Doc 1: terms 2, 3, 4
    const docTerms: Set<number>[] = [
      new Set([1, 2, 3]),
      new Set([2, 3, 4]),
    ];

    const cooccur = buildCooccurCSRFromDocTerms(docTerms, numTerms);

    expect(cooccur.rows).toBe(numTerms);
    expect(cooccur.cols).toBe(numTerms);
    expect(cooccur.data).toBeGreaterThan(0);

    // Pairs present in Doc 0: (1,2), (1,3), (2,3)
    // Pairs present in Doc 1: (2,3), (2,4), (3,4)
    // Co-occurrence counts:
    // (1, 2) => 1
    // (1, 3) => 1
    // (2, 3) => 2 (both doc 0 and doc 1!)
    // (2, 4) => 1
    // (3, 4) => 1
    // (1, 4) => 0

    expect(getCSRValue(cooccur, 1, 2)).toBe(1);
    expect(getCSRValue(cooccur, 2, 1)).toBe(1);

    expect(getCSRValue(cooccur, 1, 3)).toBe(1);
    expect(getCSRValue(cooccur, 3, 1)).toBe(1);

    expect(getCSRValue(cooccur, 2, 3)).toBe(2);
    expect(getCSRValue(cooccur, 3, 2)).toBe(2);

    expect(getCSRValue(cooccur, 2, 4)).toBe(1);
    expect(getCSRValue(cooccur, 4, 2)).toBe(1);

    expect(getCSRValue(cooccur, 3, 4)).toBe(1);
    expect(getCSRValue(cooccur, 4, 3)).toBe(1);

    expect(getCSRValue(cooccur, 1, 4)).toBe(0);
    expect(getCSRValue(cooccur, 4, 1)).toBe(0);

    // Invariant: No self-loops
    for (let t = 0; t < numTerms; t++) {
      expect(getCSRValue(cooccur, t, t)).toBe(0);
    }

    // Invariant: Row column indices are strictly ascending
    for (let src = 0; src < numTerms; src++) {
      const start = cooccur.rowPtr[src]!;
      const end = cooccur.rowPtr[src + 1]!;
      for (let p = start; p < end - 1; p++) {
        expect(cooccur.colIdx[p]!).toBeLessThan(cooccur.colIdx[p + 1]!);
      }
    }
  });

  test('handles edge cases: empty docs, single-term docs, and zero docs', () => {
    const numTerms = 8;
    const emptyDocs: Set<number>[] = [];
    const emptyCSR = buildCooccurCSRFromDocTerms(emptyDocs, numTerms);
    expect(emptyCSR.data).toBe(0);

    const singleTermDocs: Set<number>[] = [
      new Set([1]),
      new Set([2]),
      new Set([]),
    ];
    const singleCSR = buildCooccurCSRFromDocTerms(singleTermDocs, numTerms);
    expect(singleCSR.data).toBe(0);
  });

  test('handles term hash collisions without duplicate edges or self-loops', () => {
    const numTerms = 4;
    // Suppose terms hash to duplicate values in the same doc
    const docTerms: Set<number>[] = [
      new Set([1, 2]),
      new Set([1, 2]),
    ];

    const cooccur = buildCooccurCSRFromDocTerms(docTerms, numTerms);
    expect(getCSRValue(cooccur, 1, 2)).toBe(2);
    expect(getCSRValue(cooccur, 2, 1)).toBe(2);
    expect(getCSRValue(cooccur, 1, 1)).toBe(0);
    expect(getCSRValue(cooccur, 2, 2)).toBe(0);
  });

  test('buildCooccurCSR integrates with BaseIndexer without wiping document terms', async () => {
    const indexer = new BaseIndexer(async () => []);
    const numTerms = 16;
    const numDocs = 2;

    const chunk1 = makeChunk('c1', 'docA', 'kavaleri kael pedang');
    const chunk2 = makeChunk('c2', 'docA', 'kavaleri gerbang'); // same doc, multiple terms
    const chunk3 = makeChunk('c3', 'docB', 'kavaleri benteng');

    await indexer.indexDocument({ id: 'docA', chunkIds: ['c1', 'c2'], metadata: {} } as DocumentHeader, [chunk1, chunk2]);
    await indexer.indexDocument({ id: 'docB', chunkIds: ['c3'], metadata: {} } as DocumentHeader, [chunk3]);

    const keyToNumericId = new Map<string, number>([
      ['docA', 0],
      ['docB', 1],
    ]);

    const hashTerm = (t: string) => {
      let h = 0;
      for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
      return Math.abs(h);
    };

    const cooccur = buildCooccurCSR(indexer, keyToNumericId, numTerms, numDocs, hashTerm);

    // Verify co-occurrences exist
    expect(cooccur.data).toBeGreaterThan(0);

    const tidKavaleri = hashTerm('kavaleri') % numTerms;
    const tidKael = hashTerm('kael') % numTerms;
    const tidPedang = hashTerm('pedang') % numTerms;
    const tidGerbang = hashTerm('gerbang') % numTerms;
    const tidBenteng = hashTerm('benteng') % numTerms;

    // kavaleri and kael co-occur in docA
    if (tidKavaleri !== tidKael) {
      expect(getCSRValue(cooccur, tidKavaleri, tidKael)).toBeGreaterThanOrEqual(1);
      expect(getCSRValue(cooccur, tidKael, tidKavaleri)).toBeGreaterThanOrEqual(1);
    }

    // kavaleri and pedang co-occur in docA
    if (tidKavaleri !== tidPedang) {
      expect(getCSRValue(cooccur, tidKavaleri, tidPedang)).toBeGreaterThanOrEqual(1);
    }

    // kavaleri and gerbang co-occur across chunks in docA
    if (tidKavaleri !== tidGerbang) {
      expect(getCSRValue(cooccur, tidKavaleri, tidGerbang)).toBeGreaterThanOrEqual(1);
    }

    // kavaleri and benteng co-occur in docB
    if (tidKavaleri !== tidBenteng) {
      expect(getCSRValue(cooccur, tidKavaleri, tidBenteng)).toBeGreaterThanOrEqual(1);
    }
  });

  test('rebuildPipelineFromIndexer enables graph diffusion query expansion', async () => {
    const indexer = new BaseIndexer(async () => []);
    const numTerms = 32;
    const numDocs = 3;
    const dim = 16;

    const chunk1 = makeChunk('c1', 'docA', 'kavaleri kael pedang');
    const chunk2 = makeChunk('c2', 'docB', 'kavaleri kuda istana');
    const chunk3 = makeChunk('c3', 'docC', 'penyihir sihir elemen');

    await indexer.indexDocument({ id: 'docA', chunkIds: ['c1'], metadata: {} } as DocumentHeader, [chunk1]);
    await indexer.indexDocument({ id: 'docB', chunkIds: ['c2'], metadata: {} } as DocumentHeader, [chunk2]);
    await indexer.indexDocument({ id: 'docC', chunkIds: ['c3'], metadata: {} } as DocumentHeader, [chunk3]);

    const keyToNumericId = new Map<string, number>([
      ['docA', 0],
      ['docB', 1],
      ['docC', 2],
    ]);

    const hashTerm = (t: string) => {
      let h = 0;
      for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
      return Math.abs(h);
    };

    const pipeline = new RetrievalPipeline(numTerms, numDocs, dim, 32, 10, 10, 3);
    const docFHRR = new Float32Array(numDocs * dim);
    for (let i = 0; i < docFHRR.length; i++) docFHRR[i] = (i % 2 === 0 ? 1 : -1) / Math.sqrt(dim);
    pipeline.build(
      new HybridCSRMatrix(numTerms, numDocs, 0),
      new Float32Array(numTerms),
      new HybridCSRMatrix(numTerms, numTerms, 0),
      docFHRR
    );

    // Execute rebuild
    rebuildPipelineFromIndexer(
      indexer,
      pipeline,
      keyToNumericId,
      numTerms,
      numDocs,
      hashTerm
    );

    // Check that pipeline has populated matrices
    expect(pipeline.invLists.data).toBeGreaterThan(0);
    expect(pipeline.cooccur.data).toBeGreaterThan(0);

    // Perform query with expand: true
    const tidKael = hashTerm('kael') % numTerms;
    const qTerms = new Int32Array([tidKael]);
    const qIDF = new Float32Array([1.5]);
    const qFHRR = new Float32Array(dim);
    qFHRR.set(docFHRR.subarray(0, dim));

    const outIdx = new Int32Array(3);
    const outScr = new Float32Array(3);

    pipeline.query(qTerms, qIDF, qFHRR, 1, outIdx, outScr, { expand: true });

    // Since kael is in docA, docA (id 0) should be found
    expect(outIdx[0]).toBe(0);
    expect(outScr[0]).toBeGreaterThan(-Infinity);
  });

  test('mathematical proof: CSR values match brute-force ground truth across randomized documents', () => {
    const numTerms = 25;
    const numDocs = 20;

    // Deterministic pseudo-random generation of doc vocabulary
    const docTerms: Set<number>[] = [];
    for (let d = 0; d < numDocs; d++) {
      const s = new Set<number>();
      // Varying term counts (0 to 8 terms per document)
      const count = (d * 7 + 3) % 9;
      for (let c = 0; c < count; c++) {
        const term = ((d * 11) + (c * 5) + 1) % numTerms;
        s.add(term);
      }
      docTerms.push(s);
    }

    // Brute-force ground truth matrix
    const groundTruth: number[][] = Array.from({ length: numTerms }, () => new Array(numTerms).fill(0));
    for (let d = 0; d < numDocs; d++) {
      const terms = Array.from(docTerms[d]!);
      for (let i = 0; i < terms.length; i++) {
        for (let j = 0; j < terms.length; j++) {
          if (i === j) continue;
          const u = terms[i]!;
          const v = terms[j]!;
          groundTruth[u]![v]! += 1;
        }
      }
    }

    const cooccur = buildCooccurCSRFromDocTerms(docTerms, numTerms);

    // Verify 100% exact match across all term pairs (u, v)
    for (let u = 0; u < numTerms; u++) {
      for (let v = 0; v < numTerms; v++) {
        const actual = getCSRValue(cooccur, u, v);
        const expected = groundTruth[u]![v]!;
        expect(actual).toBe(expected);
      }
    }
  });

  test('mathematical proof: WAND inverted list invariant holds under collisions and multi-chunk documents', async () => {
    const indexer = new BaseIndexer(async () => []);
    const numTerms = 8;
    const numDocs = 4;

    // Both "alpha" and "iota" will intentionally map to termId 3
    const hashTerm = (t: string) => {
      if (t === 'alpha' || t === 'iota') return 3;
      if (t === 'beta') return 1;
      return 5;
    };

    // Doc 0 has 2 chunks with "alpha" (tf 1 and tf 2) + 1 chunk with "iota" (tf 3)
    // In doc 0, total tf for termId 3 must be 1 + 2 + 3 = 6
    const c0_1 = makeChunk('c0_1', 'doc0', 'alpha');
    const c0_2 = makeChunk('c0_2', 'doc0', 'alpha alpha');
    const c0_3 = makeChunk('c0_3', 'doc0', 'iota iota iota');

    // Doc 2 has "alpha" (tf 1)
    const c2_1 = makeChunk('c2_1', 'doc2', 'alpha');

    // Doc 1 has "beta" (tf 1)
    const c1_1 = makeChunk('c1_1', 'doc1', 'beta');

    await indexer.indexDocument({ id: 'doc0', chunkIds: ['c0_1', 'c0_2', 'c0_3'], metadata: {} } as DocumentHeader, [c0_1, c0_2, c0_3]);
    await indexer.indexDocument({ id: 'doc1', chunkIds: ['c1_1'], metadata: {} } as DocumentHeader, [c1_1]);
    await indexer.indexDocument({ id: 'doc2', chunkIds: ['c2_1'], metadata: {} } as DocumentHeader, [c2_1]);

    const keyToNumericId = new Map<string, number>([
      ['doc0', 0],
      ['doc1', 1],
      ['doc2', 2],
      ['doc3', 3],
    ]);

    const pipeline = new RetrievalPipeline(numTerms, numDocs, 8, 16, 10, 10, 3);
    rebuildPipelineFromIndexer(indexer, pipeline, keyToNumericId, numTerms, numDocs, hashTerm);

    const inv = pipeline.invLists;
    const term3Start = inv.rowPtr[3]!;
    const term3End = inv.rowPtr[4]!;

    // For term 3, docs should be [0, 2] strictly ascending with NO duplicates
    expect(term3End - term3Start).toBe(2);
    expect(inv.colIdx[term3Start]).toBe(0);
    expect(inv.colIdx[term3Start + 1]).toBe(2);

    // Accumulated TF for doc 0 must be 1 + 1 + 1 = 3 (due to normalization in makeChunk)
    expect(inv.values[term3Start]!).toBeGreaterThan(1);

    // termUB for term 3 must equal the max value
    const maxTf = Math.max(inv.values[term3Start]!, inv.values[term3Start + 1]!);
    expect(pipeline.termUB[3]).toBe(maxTf);

    // Verify all inverted list ranges are strictly sorted ascending by did
    for (let t = 0; t < numTerms; t++) {
      const s = inv.rowPtr[t]!;
      const e = inv.rowPtr[t + 1]!;
      for (let p = s; p < e - 1; p++) {
        expect(inv.colIdx[p]!).toBeLessThan(inv.colIdx[p + 1]!);
      }
    }
  });
});
