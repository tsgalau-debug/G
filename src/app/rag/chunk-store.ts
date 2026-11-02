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
}

export class ChunkStore {
  private db: IDBDatabase | null = null;
  private readonly memoryCache = new Map<string, IndexedChunk>();
  private readonly config: ChunkStoreConfig;

  constructor(config: ChunkStoreConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions
    if (typeof globalThis.indexedDB === 'undefined' || !globalThis.indexedDB) {
      console.warn("IndexedDB not available, fallback to memory cache only.");
      return;
    }
    return new Promise((resolve, reject) => {
      const req = globalThis.indexedDB.open(this.config.dbName, this.config.version);
      req.onerror = () => { reject(req.error ?? new Error("IDB Open error")); };
      req.onblocked = () => { reject(new Error("IDB Open blocked")); };
      req.onsuccess = () => {
        this.db = req.result;
        resolve();
      };
      req.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.config.storeName)) {
          db.createObjectStore(this.config.storeName, {keyPath: 'id'});
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
      tx.oncomplete = () => { resolve(); };
      // eslint-disable-next-line unicorn/prefer-add-event-listener
      tx.onerror = () => { reject(tx.error ?? new Error("IDB clear error")); };
      // eslint-disable-next-line unicorn/prefer-add-event-listener
      tx.onabort = () => { reject(new Error("IDB clear aborted")); };
    });
  }

  async writeChunks(chunks: IndexedChunk[]): Promise<void> {
    // Populate memory cache first
    for (const chunk of chunks) {
        this._insertToCache(chunk);
    }

    if (!this.db) return;
    
    // Process IndexedDB transaction
    const tx = this.db.transaction(this.config.storeName, 'readwrite');
    const store = tx.objectStore(this.config.storeName);
    
    for (const chunk of chunks) {
      const serializable: SerializableChunk = {
        ...chunk,
        termFreq: Object.fromEntries(chunk.termFreq)
      };
      store.put(serializable);
    }
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { resolve(); };
      // eslint-disable-next-line unicorn/prefer-add-event-listener
      tx.onerror = () => { reject(tx.error ?? new Error("IDB transaction error")); };
      // eslint-disable-next-line unicorn/prefer-add-event-listener
      tx.onabort = () => { reject(new Error("IDB transaction aborted")); };
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
      tx.oncomplete = () => { resolve(); };
      // eslint-disable-next-line unicorn/prefer-add-event-listener
      tx.onerror = () => { reject(tx.error ?? new Error("IDB deletion error")); };
      // eslint-disable-next-line unicorn/prefer-add-event-listener
      tx.onabort = () => { reject(new Error("IDB transaction aborted")); };
    });
  }

  async resolveChunks(chunkIds: string[]): Promise<IndexedChunk[]> {
    const result: IndexedChunk[] = [];
    const toFetch: string[] = [];

    // Layer 1: Memory LRU
    for (const id of chunkIds) {
      const cached = this.memoryCache.get(id);
      if (cached) {
        this._touch(id);
        result.push(cached);
      } else {
        toFetch.push(id);
      }
    }

    // Layer 2: IndexedDB (async stream)
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
    
    const promises = ids.map(id => 
      new Promise<IndexedChunk | undefined>((resolve) => {
        const req = store.get(id);
        req.onsuccess = () => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const res = req.result;
          // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
          if (res) {
            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unsafe-member-access
            if (res.termFreq && !(res.termFreq instanceof Map)) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
              res.termFreq = new Map<string, number>(Object.entries(res.termFreq));
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            resolve(res);
          } else {
            // eslint-disable-next-line unicorn/no-useless-undefined
            resolve(undefined);
          }
        };
        // eslint-disable-next-line unicorn/prefer-add-event-listener, unicorn/no-useless-undefined
        req.onerror = () => { resolve(undefined); };
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

  getMemoryStats() {
    return {
      cached: this.memoryCache.size
    };
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
