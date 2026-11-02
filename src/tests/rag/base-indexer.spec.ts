import { describe, test, expect, vi } from 'vitest';
import { InvertedIndex, FieldIndex, BaseIndexer, IndexedChunk, DocumentHeader, BaseQuery } from '../../app/rag/base-indexer';

// === FIXTURES ===
function makeChunk(id: string, docId: string, text: string, tokenCount?: number): IndexedChunk {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const tf = new Map<string, number>();
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  const maxF = Math.max(...Object.values(freq), 1);
  for (const [k, v] of Object.entries(freq)) tf.set(k, v / maxF);
  
  return {
    id, docId, text, termFreq: tf,
    tokenCount: tokenCount ?? words.length,
    modifiedAt: Date.now(),
  };
}

// === INVERTED INDEX TESTS ===
describe('InvertedIndex', () => {
  test('indexChunk assigns sequential indices', () => {
    const idx = new InvertedIndex(100);
    const c1 = makeChunk('c1', 'd1', 'hello world');
    const c2 = makeChunk('c2', 'd1', 'hello again');
    
    idx.indexChunk(c1);
    idx.indexChunk(c2);
    
    expect(idx.getDocIds()).toEqual(['c1', 'c2']);
  });

  test('indexChunk prevents double indexing', () => {
    const idx = new InvertedIndex(100);
    const c1 = makeChunk('c1', 'd1', 'hello world');
    
    idx.indexChunk(c1);
    idx.indexChunk(c1); // duplicate
    
    expect(idx.getDocIds()).toEqual(['c1']);
    expect(idx['totalDocs']).toBe(1);
  });

  test('indexChunk throws on capacity exceeded', () => {
    const idx = new InvertedIndex(2);
    idx.indexChunk(makeChunk('c1', 'd1', 'a'));
    idx.indexChunk(makeChunk('c2', 'd1', 'b'));
    
    expect(() => idx.indexChunk(makeChunk('c3', 'd1', 'c'))).toThrow('capacity exceeded');
  });

  test('docLengths uses tokenCount over termFreq.size', () => {
    const idx = new InvertedIndex(100);
    // text "a a a a" → tokenCount=4, termFreq.size=1
    const c = makeChunk('c1', 'd1', 'a a a a', 4);
    
    idx.indexChunk(c);
    
    expect(idx['docLengths'][0]).toBe(4);
  });

  test('queryTerms returns zero scores for non-matching terms', () => {
    const idx = new InvertedIndex(100);
    idx.indexChunk(makeChunk('c1', 'd1', 'hello world'));
    
    const scores = idx.queryTerms(['nonexistent']);
    
    expect(scores[0]).toBe(0);
  });

  test('queryTerms scores higher for rare terms (IDF)', () => {
    const idx = new InvertedIndex(100);
    // 4 docs, "common" in 3, "rare" in 1
    idx.indexChunk(makeChunk('c1', 'd1', 'common rare'));
    idx.indexChunk(makeChunk('c2', 'd2', 'common word'));
    idx.indexChunk(makeChunk('c3', 'd3', 'common other'));
    idx.indexChunk(makeChunk('c4', 'd4', 'common stuff'));
    
    const scores = idx.queryTerms(['common', 'rare']);
    
    // c1 should have higher score because "rare" is rare
    expect(scores[0]).toBeGreaterThan(scores[1]!);
    expect(scores[0]).toBeGreaterThan(0);
  });

  test('queryTerms BM25 penalizes long documents', () => {
    const idx = new InvertedIndex(100);
    // Same term frequency (1 occurrence), different lengths
    idx.indexChunk(makeChunk('c1', 'd1', 'hello', 1));           // 1 token
    idx.indexChunk(makeChunk('c2', 'd2', 'hello world foo bar', 4)); // 4 tokens
    
    const scores = idx.queryTerms(['hello']);
    
    // Short doc should score higher (same TF, shorter length)
    expect(scores[0]).toBeGreaterThan(scores[1]!);
  });

  test('_avgDocLength is cached per query, not per term', () => {
    const idx = new InvertedIndex(100);
    idx.indexChunk(makeChunk('c1', 'd1', 'a b c'));
    idx.indexChunk(makeChunk('c2', 'd2', 'd e f g h'));
    
    const spy = vi.spyOn(idx as any, '_avgDocLength');
    
    idx.queryTerms(['a', 'b', 'c', 'd', 'e']);
    
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});

// === FIELD INDEX TESTS ===
describe('FieldIndex', () => {
  test('register categorizes boolean values', () => {
    const fi = new FieldIndex();
    fi.register('doc1', { location_tavern: true, active: false });
    
    const scores = fi.convolve({ location_tavern: true }, {});
    expect(scores.get('doc1')).toBe(1);
  });

  test('register categorizes string values', () => {
    const fi = new FieldIndex();
    fi.register('doc1', { entity_goblin: 'goblin' });
    
    const scores = fi.convolve({ entity_goblin: 'goblin' }, {});
    expect(scores.get('doc1')).toBe(1);
  });

  test('number values go to continuous (not categorical)', () => {
    const fi = new FieldIndex();
    fi.register('doc1', { danger_level: 5 });
    
    // Exact match should NOT work for continuous
    const exact = fi.convolve({ danger_level: 5 }, {});
    expect(exact.get('doc1')).toBeGreaterThan(0); // Gaussian affinity
    
    // Non-exact should still give some score
    const near = fi.convolve({ danger_level: 5.1 }, {});
    expect(near.get('doc1')).toBeGreaterThan(0);
    expect(near.get('doc1')).toBeLessThan(exact.get('doc1')!);
  });

  test('timestamp fields go to temporal, not continuous', () => {
    const fi = new FieldIndex();
    const now = Date.now();
    fi.register('doc1', { createdAt: now, modifiedAt: now, other: true });
    
    // Temporal only boosts existing scores, doesn't create them
    const noBase = fi.convolve({ createdAt: now }, {});
    expect(noBase.get('doc1')).toBeUndefined(); // temporal needs existing score
    
    const withBase = fi.convolve({ createdAt: now, other: true }, { other: 1 });
    expect(withBase.get('doc1')).toBeGreaterThan(1); // boosted by temporal
  });

  test('fieldBoost multiplies score', () => {
    const fi = new FieldIndex();
    fi.register('doc1', { tag_combat: true });
    
    const noBoost = fi.convolve({ tag_combat: true }, {});
    const withBoost = fi.convolve({ tag_combat: true }, { tag_combat: 2.5 });
    
    expect(withBoost.get('doc1')).toBe(noBoost.get('doc1')! * 2.5);
  });

  test('convolve returns empty map for no matches', () => {
    const fi = new FieldIndex();
    fi.register('doc1', { a: true });
    
    const scores = fi.convolve({ b: true }, {});
    expect(scores.size).toBe(0);
  });
});

// === BASE INDEXER INTEGRATION TESTS ===
describe('BaseIndexer', () => {
  async function mockResolver(ids: string[]): Promise<IndexedChunk[]> {
    return ids.map(id => makeChunk(id, 'd_' + id, 'content ' + id));
  }

  test('retrieve combines BM25 and field scores', async () => {
    const indexer = new BaseIndexer({ maxDocs: 100, maxResults: 10 });
    
    const header: DocumentHeader = {
      id: 'doc1', metadata: { location_tavern: true, entity_goblin: true },
      chunkIds: ['c1'], modifiedAt: Date.now(), accessCount: 0,
    };
    const chunk = makeChunk('c1', 'doc1', 'goblin attacks in tavern');
    
    indexer.indexDocument(header, [chunk]);
    
    const query: BaseQuery = {
      terms: ['goblin', 'tavern'],
      filters: { location_tavern: true },
      fieldBoost: { location_tavern: 1 },
      maxResults: 10, minScore: 0,
    };
    
    const results = await indexer.retrieve(query, mockResolver);
    
    expect(results.length).toBe(1);
    expect(results[0]!.score).toBeGreaterThan(0);
    expect(results[0]!.fieldBreakdown.bm25).toBeGreaterThan(0);
    expect(results[0]!.fieldBreakdown.meta).toBe(1); // exact match
  });

  test('retrieve filters by minScore', async () => {
    const indexer = new BaseIndexer({ maxDocs: 100, maxResults: 10 });
    
    indexer.indexDocument(
      { id: 'doc1', metadata: {}, chunkIds: ['c1'], modifiedAt: Date.now(), accessCount: 0 },
      [makeChunk('c1', 'doc1', 'irrelevant text here')]
    );
    
    const query: BaseQuery = {
      terms: ['goblin'], filters: {}, fieldBoost: {},
      maxResults: 10, minScore: 0.5,
    };
    
    const results = await indexer.retrieve(query, mockResolver);
    expect(results.length).toBe(0);
  });

  test('retrieve sorts by score descending', async () => {
    const indexer = new BaseIndexer({ maxDocs: 100, maxResults: 10 });
    
    // Doc with "dragon dragon" (higher TF) vs "dragon" (lower TF)
    indexer.indexDocument(
      { id: 'd1', metadata: {}, chunkIds: ['c1'], modifiedAt: Date.now(), accessCount: 0 },
      [makeChunk('c1', 'd1', 'dragon dragon fire')]
    );
    indexer.indexDocument(
      { id: 'd2', metadata: {}, chunkIds: ['c2'], modifiedAt: Date.now(), accessCount: 0 },
      [makeChunk('c2', 'd2', 'dragon small small small small small')]
    );
    
    const query: BaseQuery = {
      terms: ['dragon'], filters: {}, fieldBoost: {},
      maxResults: 10, minScore: 0,
    };
    
    const results = await indexer.retrieve(query, mockResolver);
    
    expect(results[0]!.chunk.id).toBe('c1'); // higher TF
    expect(results[1]!.chunk.id).toBe('c2');
    expect(results[0]!.score).toBeGreaterThanOrEqual(results[1]!.score);
  });

  test('retrieve respects maxResults limit', async () => {
    const indexer = new BaseIndexer({ maxDocs: 100, maxResults: 2 });
    
    for (let i = 0; i < 5; i++) {
      indexer.indexDocument(
        { id: `d${i}`, metadata: {}, chunkIds: [`c${i}`], modifiedAt: Date.now(), accessCount: 0 },
        [makeChunk(`c${i}`, `d${i}`, `common word ${i}`)]
      );
    }
    
    const query: BaseQuery = {
      terms: ['common'], filters: {}, fieldBoost: {},
      maxResults: 2, minScore: 0,
    };
    
    const results = await indexer.retrieve(query, mockResolver);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  test('_selectCandidates includes both field and BM25 matches', () => {
    const indexer = new BaseIndexer({ maxDocs: 100, maxResults: 10 });
    
    indexer.indexDocument(
      { id: 'd1', metadata: { loc: true }, chunkIds: ['c1'], modifiedAt: Date.now(), accessCount: 0 },
      [makeChunk('c1', 'd1', 'alpha beta')]
    );
    indexer.indexDocument(
      { id: 'd2', metadata: {}, chunkIds: ['c2'], modifiedAt: Date.now(), accessCount: 0 },
      [makeChunk('c2', 'd2', 'alpha gamma')] // BM25 match only
    );
    
    const fieldScores = new Map([['d1', 1]]);
    const bm25Scores = new Float64Array(2);
    bm25Scores[1] = 0.5; // c2 has BM25 score
    
    const candidates = (indexer as any)._selectCandidates(fieldScores, bm25Scores, 10);
    
    expect(candidates).toContain('c1');
    expect(candidates).toContain('c2');
  });
});
