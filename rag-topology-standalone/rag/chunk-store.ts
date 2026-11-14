import { IndexedChunk } from './base-indexer';

export interface SerializableChunk {
  id: string;
  docId: string;
  text: string;
  termFreq: Record<string, number>;
  modifiedAt: number;
}

export interface ChunkStoreConfig {
  dbName: string;
  storeName: string;
  maxMemoryChunks: number;
  version: number;
  memoryOnly?: boolean;
}

export class ChunkStore {
  private db: IDBDatabase | null = null;
  private readonly memoryCache = new Map<string, IndexedChunk>();
  private readonly config: ChunkStoreConfig;

  constructor(config: Partial<ChunkStoreConfig> = {}) {
    this.config = {
      dbName: config.dbName ?? 'rag_research_store',
      storeName: config.storeName ?? 'chunks',
      maxMemoryChunks: config.maxMemoryChunks ?? 512,
      version: config.version ?? 1,
      memoryOnly: config.memoryOnly ?? false,
    };
  }

  async init(): Promise<void> {
    if (
      this.config.memoryOnly ||
      typeof globalThis.indexedDB === 'undefined' ||
      !globalThis.indexedDB
    ) {
      return;
    }
    return new Promise((resolve, reject) => {
      const req = globalThis.indexedDB.open(this.config.dbName, this.config.version);
      req.onerror = () => {
        reject(req.error ?? new Error('IDB Open error'));
      };
      req.onblocked = () => {
        reject(new Error('IDB Open blocked'));
      };
      req.onsuccess = () => {
        this.db = req.result;
        resolve();
      };
      req.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.config.storeName)) {
          db.createObjectStore(this.config.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async clearAll(): Promise<void> {
    this.memoryCache.clear();
    if (!this.db) return;
    const tx = this.db.transaction(this.config.storeName, 'readwrite');
    const store = tx.objectStore(this.config.storeName);
    store.clear();
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = () => {
        reject(tx.error ?? new Error('IDB clear error'));
      };
      tx.onabort = () => {
        reject(new Error('IDB clear aborted'));
      };
    });
  }

  async writeChunks(chunks: IndexedChunk[]): Promise<void> {
    for (const chunk of chunks) {
      this._insertToCache(chunk);
    }

    if (!this.db) return;

    const tx = this.db.transaction(this.config.storeName, 'readwrite');
    const store = tx.objectStore(this.config.storeName);

    for (const chunk of chunks) {
      const serializable: SerializableChunk = {
        ...chunk,
        termFreq: Object.fromEntries(chunk.termFreq),
      };
      store.put(serializable);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = () => {
        reject(tx.error ?? new Error('IDB transaction error'));
      };
      tx.onabort = () => {
        reject(new Error('IDB transaction aborted'));
      };
    });
  }

  async deleteChunks(chunkIds: string[]): Promise<void> {
    for (const chunkId of chunkIds) {
      this.memoryCache.delete(chunkId);
    }

    if (!this.db) return;

    const tx = this.db.transaction(this.config.storeName, 'readwrite');
    const store = tx.objectStore(this.config.storeName);

    for (const chunkId of chunkIds) {
      store.delete(chunkId);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = () => {
        reject(tx.error ?? new Error('IDB deletion error'));
      };
      tx.onabort = () => {
        reject(new Error('IDB transaction aborted'));
      };
    });
  }

  async resolveChunks(chunkIds: string[]): Promise<IndexedChunk[]> {
    const result: IndexedChunk[] = [];
    const toFetch: string[] = [];

    for (const id of chunkIds) {
      const cached = this.memoryCache.get(id);
      if (cached) {
        this._touch(id);
        result.push(cached);
      } else {
        toFetch.push(id);
      }
    }

    if (toFetch.length > 0 && this.db) {
      const fetched = await this._fetchFromDb(toFetch);
      for (const chunk of fetched) {
        this._insertToCache(chunk);
        result.push(chunk);
      }
    }

    return result;
  }

  private async _fetchFromDb(ids: string[]): Promise<IndexedChunk[]> {
    if (!this.db) return [];
    const tx = this.db.transaction(this.config.storeName, 'readonly');
    const store = tx.objectStore(this.config.storeName);

    const promises = ids.map(
      (id) =>
        new Promise<IndexedChunk | undefined>((resolve) => {
          const req = store.get(id);
          req.onsuccess = () => {
            const res = req.result;
            if (res) {
              if (res.termFreq && !(res.termFreq instanceof Map)) {
                res.termFreq = new Map<string, number>(Object.entries(res.termFreq));
              }
              resolve(res as IndexedChunk);
            } else {
              resolve(undefined);
            }
          };
          req.onerror = () => {
            resolve(undefined);
          };
        })
    );

    const results = await Promise.all(promises);
    return results.filter((c): c is IndexedChunk => c !== undefined);
  }

  private _insertToCache(chunk: IndexedChunk): void {
    if (this.memoryCache.has(chunk.id)) {
      this.memoryCache.delete(chunk.id);
    } else {
      const maxLimit = Math.max(1, this.config.maxMemoryChunks || 100);
      while (this.memoryCache.size >= maxLimit) {
        const firstKey = this.memoryCache.keys().next().value;
        if (firstKey !== undefined) {
          this.memoryCache.delete(firstKey);
        } else {
          break;
        }
      }
    }
    this.memoryCache.set(chunk.id, chunk);
  }

  private _touch(id: string): void {
    const chunk = this.memoryCache.get(id);
    if (chunk) {
      this.memoryCache.delete(id);
      this.memoryCache.set(id, chunk);
    }
  }

  purgeMemory(): void {
    this.memoryCache.clear();
  }

  getMemoryStats(): { cached: number } {
    return {
      cached: this.memoryCache.size,
    };
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
