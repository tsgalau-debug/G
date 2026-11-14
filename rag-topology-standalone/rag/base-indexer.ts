/* eslint-disable */
export type Vector = Float32Array;
export type FieldValue = string | number | boolean;

export interface IndexedChunk {
  id: string;
  docId: string;
  text: string;
  termFreq: Map<string, number>;
  modifiedAt: number;
  tokenCount?: number;
}

export interface DocumentHeader {
  id: string;
  metadata: Record<string, FieldValue>;
  chunkIds: string[];
  modifiedAt: number;
  accessCount: number;
  vectorHash?: Uint8Array;
}

export interface FieldSchema {
  name: string;
  type: 'categorical' | 'continuous' | 'temporal' | 'tag';
  weight: number;
}

export interface BaseQuery {
  terms: string[];
  filters: Record<string, FieldValue>;
  fieldBoost: Record<string, number>;
  maxResults: number;
  minScore: number;
}

export interface ScoredChunk {
  chunk: IndexedChunk;
  score: number;
  fieldBreakdown: Record<string, number>;
}

export class InvertedIndex {
  private readonly termPostings = new Map<string, { docId: string; tf: number }[]>();
  private readonly docFreq = new Map<string, number>();
  private totalDocs = 0;
  private readonly scoreAcc: Float64Array;
  private readonly accSize: number;
  private readonly docIdToIdx = new Map<string, number>();
  private readonly idxToDocId: string[] = [];
  private readonly docLengths: Int32Array;
  private readonly freeIndices: number[] = [];

  constructor(maxDocs = 8192) {
    this.accSize = maxDocs;
    this.scoreAcc = new Float64Array(maxDocs);
    this.docLengths = new Int32Array(maxDocs);
  }

  indexChunk(chunk: IndexedChunk): void {
    let idx = this.docIdToIdx.get(chunk.id);
    if (idx !== undefined) return;

    idx = this.freeIndices.length > 0 ? this.freeIndices.pop()! : this.idxToDocId.length;

    if (idx >= this.accSize) {
      throw new Error('InvertedIndex capacity exceeded');
    }
    this.docIdToIdx.set(chunk.id, idx);
    if (idx === this.idxToDocId.length) {
      this.idxToDocId.push(chunk.id);
    } else {
      this.idxToDocId[idx] = chunk.id;
    }
    this.totalDocs++;

    let chunkLength = 0;
    for (const [term, tf] of chunk.termFreq) {
      let postings = this.termPostings.get(term);
      if (!postings) {
        postings = [];
        this.termPostings.set(term, postings);
        this.docFreq.set(term, 0);
      }
      postings.push({ docId: chunk.id, tf });

      this.docFreq.set(term, (this.docFreq.get(term) || 0) + 1);
      chunkLength += tf;
    }

    this.docLengths[idx] = chunk.tokenCount ?? chunkLength;
  }

  deleteChunks(chunkIds: string[]): void {
    const idsToRemove = new Set(chunkIds);

    for (const chunkId of chunkIds) {
      const idx = this.docIdToIdx.get(chunkId);
      if (idx !== undefined) {
        this.docIdToIdx.delete(chunkId);
        this.docLengths[idx] = 0;
        this.idxToDocId[idx] = '';
        this.freeIndices.push(idx);
        this.totalDocs--;
      }
    }

    for (const [term, postings] of this.termPostings.entries()) {
      const filtered = postings.filter((p) => !idsToRemove.has(p.docId));
      if (filtered.length !== postings.length) {
        this.termPostings.set(term, filtered);
        this.docFreq.set(term, filtered.length);

        if (filtered.length === 0) {
          this.termPostings.delete(term);
          this.docFreq.delete(term);
        }
      }
    }
  }

  queryTerms(terms: string[], k1 = 1.2, b = 0.75): Float64Array {
    this.scoreAcc.fill(0);
    const avgDl = this._avgDocLength();
    for (const term of terms) {
      const postings = this.termPostings.get(term);
      if (!postings) continue;

      const df = this.docFreq.get(term) || 1;
      const idf = Math.log(1 + (this.totalDocs - df + 0.5) / (df + 0.5));
      for (const post of postings) {
        const idx = this.docIdToIdx.get(post.docId);
        if (idx === undefined) continue;
        const tf = post.tf;

        const denom = tf + k1 * (1 - b + b * (this.docLengths[idx]! / avgDl));
        const score = (idf * (tf * (k1 + 1))) / (denom + 1e-6);

        this.scoreAcc[idx]! += score;
      }
    }
    return this.scoreAcc;
  }

  private _avgDocLength(): number {
    if (this.totalDocs === 0) return 1;
    let totalLen = 0;
    for (let i = 0; i < this.idxToDocId.length; i++) {
      totalLen += this.docLengths[i]!;
    }
    return totalLen / this.totalDocs;
  }

  getDocIds(): string[] {
    return this.idxToDocId;
  }

  getTermIDF(term: string): number {
    const normalized = term.toLowerCase();
    const df = this.docFreq.get(normalized) || 0;
    if (this.totalDocs <= 0 || df <= 0) {
      return 1.0;
    }
    return Math.max(0.1, Math.log(1 + (this.totalDocs - df + 0.5) / (df + 0.5)));
  }

  hasTerm(term: string): boolean {
    return (this.docFreq.get(term.toLowerCase()) || 0) > 0;
  }
}

export class FieldIndex {
  private readonly categorical = new Map<string, Map<string, Set<string>>>();
  private readonly continuous = new Map<string, Map<string, number>>();
  private readonly temporal = new Map<string, number>();

  register(docId: string, metadata: Record<string, FieldValue>): void {
    for (const [key, val] of Object.entries(metadata)) {
      if (typeof val === 'boolean' || typeof val === 'string') {
        if (!this.categorical.has(key)) this.categorical.set(key, new Map());

        const valMap = this.categorical.get(key)!;
        if (!valMap.has(String(val))) valMap.set(String(val), new Set());

        valMap.get(String(val))!.add(docId);
      } else if (typeof val === 'number') {
        if (key === 'modifiedAt' || key.endsWith('At') || key === 'timestamp') {
          this.temporal.set(docId, val);
        } else {
          if (!this.continuous.has(key)) this.continuous.set(key, new Map());

          this.continuous.get(key)!.set(docId, val);
        }
      }
    }
  }

  unregister(docId: string): void {
    for (const valMap of this.categorical.values()) {
      for (const docs of valMap.values()) {
        docs.delete(docId);
      }
    }
    for (const contMap of this.continuous.values()) {
      contMap.delete(docId);
    }
    this.temporal.delete(docId);
  }

  convolve(filters: Record<string, FieldValue>, boost: Record<string, number>): Map<string, number> {
    const scores = new Map<string, number>();
    const epsilon = 1e-6;

    for (const [field, value] of Object.entries(filters)) {
      const weight = boost[field] ?? 1;
      const strVal = String(value);

      const catMap = this.categorical.get(field);
      if (catMap) {
        const matches = catMap.get(strVal);
        if (matches) {
          for (const docId of matches) scores.set(docId, (scores.get(docId) || 0) + weight);
        }
      }

      const contMap = this.continuous.get(field);
      if (contMap && typeof value === 'number') {
        for (const [docId, docVal] of contMap) {
          const diff = Math.abs(docVal - value);
          const affinity = Math.exp((-diff * diff) / (2 * weight * weight + epsilon));

          scores.set(docId, (scores.get(docId) || 0) + affinity * weight);
        }
      }
    }

    const now = Date.now();
    const lambda = 0.0001;
    for (const [docId, ts] of this.temporal) {
      const age = now - ts;
      const decay = Math.exp(-lambda * age);

      const existing = scores.get(docId) || 0;
      if (existing > 0) scores.set(docId, existing * (1 + decay));
    }

    return scores;
  }
}

export class BaseIndexer {
  readonly inverted: InvertedIndex;
  readonly fields: FieldIndex;
  private readonly schemas = new Map<string, FieldSchema>();
  private readonly headers = new Map<string, DocumentHeader>();
  private readonly chunkToDoc = new Map<string, string>();
  private resultPool: ScoredChunk[] = [];
  private readonly maxResults: number;

  constructor(options: { maxDocs?: number; maxResults?: number } = {}) {
    this.inverted = new InvertedIndex(options.maxDocs || 8192);
    this.fields = new FieldIndex();
    this.maxResults = options.maxResults || 256;
    this.resultPool = new Array(this.maxResults);
  }

  registerSchema(schema: FieldSchema): void {
    this.schemas.set(schema.name, schema);
  }

  indexDocument(header: DocumentHeader, chunks: IndexedChunk[]): void {
    this.headers.set(header.id, header);
    this.fields.register(header.id, header.metadata);
    for (const chunk of chunks) {
      this.chunkToDoc.set(chunk.id, header.id);
      this.inverted.indexChunk(chunk);
    }
  }

  getDocumentChunkIds(docId: string): string[] | undefined {
    return this.headers.get(docId)?.chunkIds;
  }

  getTermIDF(term: string): number {
    return this.inverted.getTermIDF(term);
  }

  hasTerm(term: string): boolean {
    return this.inverted.hasTerm(term);
  }

  deleteDocument(docId: string): void {
    const header = this.headers.get(docId);
    if (!header) return;

    this.fields.unregister(docId);
    this.inverted.deleteChunks(header.chunkIds);
    for (const chunkId of header.chunkIds) {
      this.chunkToDoc.delete(chunkId);
    }
    this.headers.delete(docId);
  }

  async retrieve(
    query: BaseQuery,
    chunkResolver: (ids: string[]) => Promise<IndexedChunk[]>
  ): Promise<ScoredChunk[]> {
    const fieldScores = this.fields.convolve(query.filters, this._copyBoostMap(query.fieldBoost));
    const bm25Scores = this.inverted.queryTerms(query.terms);
    const candidateIds = this._selectCandidates(fieldScores, bm25Scores, query.maxResults * 2);
    const chunks = await chunkResolver(candidateIds);
    let count = 0;
    for (const chunk of chunks) {
      const docId = this.chunkToDoc.get(chunk.id);
      if (!docId) continue;
      const idx = (this.inverted as any).docIdToIdx.get(chunk.id);
      const textScore = idx === undefined ? 0 : bm25Scores[idx];
      const metaScore = fieldScores.get(docId) || 0;
      const total = (textScore ?? 0) * 0.6 + metaScore * 0.4;
      if (total < query.minScore) continue;
      this.resultPool[count++] = {
        chunk,
        score: total,
        fieldBreakdown: { bm25: textScore ?? 0, meta: metaScore },
      };
      if (count >= this.maxResults) break;
    }
    const res = this.resultPool.slice(0, count);
    res.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return res;
  }

  private _copyBoostMap(boost: Record<string, number>): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(boost)) out[k] = v;
    return out;
  }

  private _selectCandidates(
    fieldScores: Map<string, number>,
    bm25Scores: Float64Array,
    limit: number
  ): string[] {
    const set = new Set<string>();
    const sortedFields = [...fieldScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
    for (const [docId] of sortedFields) {
      const header = this.headers.get(docId);
      if (header) {
        for (const cid of header.chunkIds) set.add(cid);
      }
    }
    const chunkIds = this.inverted.getDocIds();
    const bm25WithId = chunkIds
      .map((id, i) => ({ id, score: bm25Scores[i] }))
      .filter((x) => x.id !== '' && (x.score ?? 0) > 0)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, limit);
    for (const { id } of bm25WithId) set.add(id);
    return [...set].slice(0, limit);
  }
}
