import { describe, test, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';
import { ChunkStore } from '../../app/rag/chunk-store';
import { IndexedChunk } from '../../app/rag/base-indexer';
import "fake-indexeddb/auto";

beforeAll(() => {
  (globalThis as any).window = {};
});

afterAll(() => {
  delete (globalThis as any).window;
});

function makeChunk(id: string): IndexedChunk {
  return {
    id, docId: 'd1', text: 'hello world',
    termFreq: new Map([['hello', 1], ['world', 1]]),
    tokenCount: 2, modifiedAt: Date.now(),
  };
}

describe('ChunkStore', () => {
  let store: ChunkStore;

  beforeEach(() => {
    store = new ChunkStore({
      dbName: 'test_db_' + Math.random().toString(36).slice(2),
      storeName: 'chunks',
      maxMemoryChunks: 3,
      version: 1,
    });
  });

  test('init resolves without IndexedDB in Node', async () => {
    const s = new ChunkStore({
      dbName: 'test', storeName: 'test', maxMemoryChunks: 10, version: 1,
    });
    await expect(s.init()).resolves.toBeUndefined();
  });

  test('writeChunks populates memory cache', async () => {
    await store.init();
    const c = makeChunk('c1');
    
    await store.writeChunks([c]);
    
    const stats = store.getMemoryStats();
    expect(stats.cached).toBe(1);
  });

  test('memory cache LRU eviction', async () => {
    await store.init();
    
    await store.writeChunks([makeChunk('c1')]);
    await store.writeChunks([makeChunk('c2')]);
    await store.writeChunks([makeChunk('c3')]);
    await store.writeChunks([makeChunk('c4')]); // Should evict c1
    
    const stats = store.getMemoryStats();
    expect(stats.cached).toBe(3);
    
    // c1 should be evicted, c2-c4 present
    const resolved = await store.resolveChunks(['c1', 'c2', 'c3', 'c4']);
    expect(resolved.length).toBe(4); // c1 missing from cache but IDB brings it back
    expect(store.getMemoryStats().cached).toBe(3); // Wait, maxMemoryChunks is 3, so one got evicted again!
  });

  test('resolveChunks returns cached chunks without IDB lookup', async () => {
    await store.init();
    const c = makeChunk('c1');
    await store.writeChunks([c]);
    
    // Mock IDB to verify it's not called for cache hit
    const fetchSpy = vi.spyOn(store as any, '_fetchFromDb');
    
    const result = await store.resolveChunks(['c1']);
    
    expect(result.length).toBe(1);
    expect(result[0]!.id).toBe('c1');
    expect(fetchSpy).not.toHaveBeenCalled();
    
    fetchSpy.mockRestore();
  });

  test('resolveChunks fetches missing chunks from IDB', async () => {
    await store.init();
    const c = makeChunk('c1');
    await store.writeChunks([c]);
    
    // Clear memory cache
    store.purgeMemory();
    expect(store.getMemoryStats().cached).toBe(0);
    
    const result = await store.resolveChunks(['c1']);
    expect(result.length).toBe(1);
    expect(result[0]!.id).toBe('c1');
    expect(store.getMemoryStats().cached).toBe(1); // Re-populated
  });

  test('termFreq is restored as Map from IDB', async () => {
    await store.init();
    const c = makeChunk('c1');
    await store.writeChunks([c]);
    
    store.purgeMemory();
    const [result] = await store.resolveChunks(['c1']);
    
    expect(result!.termFreq).toBeInstanceOf(Map);
    expect(result!.termFreq.get('hello')).toBe(1);
  });

  test('writeChunks with IDB failure aborts transaction', async () => {
    await store.init();
    
    // Force error by writing invalid data
    const badChunk = { ...makeChunk('c1'), termFreq: null as any };
    
    await expect(store.writeChunks([badChunk])).rejects.toThrow();
  });
});
