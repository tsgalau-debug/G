/* eslint-disable */
import { BaseIndexer } from './base-indexer';
import { ChunkStore } from './chunk-store';
import { EpistemicRetrievalKernel } from './holographic-memory';
import { MultiWorldHologram } from './multi-world';
import { WorldMergeResolver, MergeResult } from './world-merge-resolver';
import { TimelineDAGManager, TimelineDAGState, TimelineNode } from './timeline-dag';
import { HybridCSRMatrix, RetrievalPipeline } from './hybrid-pipeline';
import { rebuildPipelineFromIndexer } from './pipeline-bridge';
import {
  AgenticChunkOrchestrator,
  ChunkDecision,
  RetrievalStrategy,
} from './agentic-chunk-orchestrator';
import {
  VSARLPolicyKernel,
  AgentPersonalityProfile,
  VSARLPolicySnapshot,
} from './vsarl-policy-kernel';
import {
  _canonicalTokens,
  _chunk,
  _hash,
  _hashTerm,
  _getEmbeddingProof,
} from './worker-tokenizer-embedder';
import { evaluateWhatIfScenario } from './worker-whatif-simulator';
import { WasmMathProgramV9BatchScorer } from './wasm-math-v9-scorer';

export interface RagEngineConfig {
  sessionId?: string;
  dbPrefix?: string;
  memoryOnly?: boolean;
  maxDocs?: number;
  dim?: number;
  maxWorlds?: number;
  numTerms?: number;
  simhashBits?: number;
  maxQueryTerms?: number;
  staticCorpus?: Record<string, string>;
  rlPolicySnapshot?: Partial<VSARLPolicySnapshot>;
  wasmBatchScorer?: WasmMathProgramV9BatchScorer | null;
}

export interface RagQueryInput {
  query?: string;
  location?: string;
  entities?: string[];
  tags?: string[];
  agent?: string | Partial<AgentPersonalityProfile>;
  topK?: number;
}

export interface RagRetrievedChunk {
  entry: { key: string; docId: string; content: string };
  relevanceScore: number;
  reason: ChunkDecision['action'];
  degradedEmbedding: boolean;
}

export interface RagQueryResponse {
  snippet: string;
  retrieved: RagRetrievedChunk[];
  elapsedMs: number;
  decision: {
    strategy: RetrievalStrategy;
    action: ChunkDecision['action'];
    confidence: number;
    reasoning: string;
    anomalyCount: number;
    decisionId: number;
    agentId?: string;
    agentArchetype?: string;
    degraded: boolean;
  };
}

/**
 * EmbeddingFreeRagEngine — Framework-Agnostic Standalone RAG Orchestrator
 *
 * Menggabungkan:
 * 1. Random Indexing + N-Gram Superposition (`encodeSemanticFallbackVector`) — 100% tanpa model embedding eksternal
 * 2. WAND BM25 + SimHash 1024-bit LSH + Random Walk Query Expansion (`RetrievalPipeline`)
 * 3. First & Second Moment Holographic Associative Memory (`HolographicMemoryField` + `ContinuousHRR`)
 * 4. Multi-World Branching, Interference Detection & 3-Way Merge (`MultiWorldHologram` + `WorldMergeResolver`)
 * 5. VSA-RL Contextual Bandit (`VSARLPolicyKernel` + `AgenticChunkOrchestrator`)
 */
export class EmbeddingFreeRagEngine {
  readonly maxDocs: number;
  readonly dim: number;
  readonly maxWorlds: number;
  readonly numTerms: number;
  readonly simhashBits: number;
  readonly maxQueryTerms: number;

  indexer!: BaseIndexer;
  store!: ChunkStore;
  multiWorld!: MultiWorldHologram;
  epistemicKernel!: EpistemicRetrievalKernel;
  mergeResolver!: WorldMergeResolver;
  orchestrator!: AgenticChunkOrchestrator;
  timelineDAG!: TimelineDAGManager;
  wasmBatchScorer: WasmMathProgramV9BatchScorer | null = null;

  docFHRR!: Float32Array;
  readonly docIdMap = new Map<string, number>();
  readonly docKeyMap = new Map<number, string>();
  private readonly docIdEvictQueue: string[] = [];
  private nextDocId = 0;
  private _evictNextId = 0;

  private readonly activeDecisionReceipts = new Set<number>();
  private queryTermsBuf!: Int32Array;
  private queryIDFBuf!: Float32Array;

  constructor(private readonly config: RagEngineConfig = {}) {
    this.maxDocs = config.maxDocs ?? 4096;
    this.dim = config.dim ?? 768;
    this.maxWorlds = config.maxWorlds ?? 8;
    this.numTerms = config.numTerms ?? 2048;
    this.simhashBits = config.simhashBits ?? 1024;
    this.maxQueryTerms = config.maxQueryTerms ?? 32;
    this.wasmBatchScorer = config.wasmBatchScorer ?? null;
  }

  async init(options?: { clearStore?: boolean; staticCorpus?: Record<string, string> }): Promise<{
    ready: boolean;
    dag: TimelineDAGState;
  }> {
    if (this.store) {
      this.store.purgeMemory();
      this.store.close();
    }

    this.docIdMap.clear();
    this.docKeyMap.clear();
    this.docIdEvictQueue.length = 0;
    this.nextDocId = 0;
    this._evictNextId = 0;
    this.activeDecisionReceipts.clear();

    const safeSession = (this.config.sessionId ?? 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
    const prefix = this.config.dbPrefix ?? 'RAG_Research';

    this.store = new ChunkStore({
      dbName: `${prefix}_${safeSession}`,
      storeName: 'chunks',
      maxMemoryChunks: 256,
      version: 1,
      memoryOnly: this.config.memoryOnly ?? false,
    });
    await this.store.init();
    if (options?.clearStore) {
      await this.store.clearAll();
    }

    this.indexer = new BaseIndexer({ maxDocs: this.maxDocs, maxResults: 128 });
    this.indexer.registerSchema({ name: 'location', type: 'categorical', weight: 0.35 });
    this.indexer.registerSchema({ name: 'entity', type: 'categorical', weight: 0.4 });
    this.indexer.registerSchema({ name: 'tag', type: 'tag', weight: 0.2 });
    this.indexer.registerSchema({ name: 'timestamp', type: 'temporal', weight: 0.05 });

    this.docFHRR = new Float32Array(this.maxDocs * this.dim);
    this.multiWorld = new MultiWorldHologram(
      this.maxWorlds,
      this.dim,
      this.maxDocs,
      64,
      this.docFHRR
    );
    this.timelineDAG = new TimelineDAGManager(this.maxWorlds);

    const docWeights = new Float32Array(this.maxDocs);
    this.multiWorld.initTrunk(this.docFHRR, docWeights, 'trunk');

    this.queryTermsBuf = new Int32Array(64);
    this.queryIDFBuf = new Float32Array(64);

    const pipeline = new RetrievalPipeline(
      this.numTerms,
      this.maxDocs,
      this.dim,
      this.simhashBits,
      this.maxQueryTerms
    );
    const invLists = new HybridCSRMatrix(this.numTerms, this.maxDocs, 0);
    const termUB = new Float32Array(this.numTerms);
    const cooccur = new HybridCSRMatrix(this.numTerms, this.numTerms, 0);
    pipeline.build(invLists, termUB, cooccur, this.docFHRR);
    pipeline.setWasmBatchScorer(this.wasmBatchScorer);

    this.epistemicKernel = new EpistemicRetrievalKernel(
      pipeline,
      this.multiWorld.worlds[0]!,
      this.dim,
      10
    );
    this.mergeResolver = new WorldMergeResolver(
      this.multiWorld,
      this.dim,
      this.maxDocs,
      this.docFHRR
    );

    const rlPolicy = new VSARLPolicyKernel(32, 6, 256);
    if (this.config.rlPolicySnapshot) {
      rlPolicy.restoreSnapshot(this.config.rlPolicySnapshot);
    }
    this.orchestrator = new AgenticChunkOrchestrator(
      pipeline,
      this.multiWorld.worlds[0]!,
      this.multiWorld,
      rlPolicy,
      this.dim,
      this.maxDocs,
      16,
      this.maxQueryTerms
    );

    const corpus = options?.staticCorpus ?? this.config.staticCorpus ?? {};
    const corpusEntries = Object.entries(corpus);
    await Promise.all(
      corpusEntries.map(([k, v]) =>
        this.indexDocument(`static_${k}`, v, ['static'], 1.5, 0, false)
      )
    );

    this._syncActiveWorldPointers();
    this.rebuildCSR();

    return { ready: true, dag: this.timelineDAG.getSnapshot() };
  }

  getActiveWorldSlot(): number {
    return this.timelineDAG?.getActiveWorldSlot() ?? 0;
  }

  getActiveWorld() {
    const slot = this.getActiveWorldSlot();
    return this.multiWorld?.worlds[slot] ?? this.multiWorld?.worlds[0];
  }

  private _syncActiveWorldPointers(): void {
    const activeWorld = this.getActiveWorld();
    if (activeWorld) {
      this.orchestrator?.setActiveHologram(activeWorld);
      this.epistemicKernel?.setActiveHologram(activeWorld);
    }
    const activeSlot = this.getActiveWorldSlot();
    if (this.multiWorld) {
      this.multiWorld.setQueryMask(activeSlot === 0 ? [0] : [activeSlot, 0]);
    }
  }

  private _evictOne(): void {
    let victimId = -1;
    let victimKey = '';
    let minScore = Infinity;
    const world = this.getActiveWorld();

    for (const [vKey, vId] of this.docIdMap) {
      if (vKey.startsWith('static_')) continue;
      const w = world ? world.docWeights[vId] || 0.5 : 0.5;
      const s = world ? world.salience[vId] || 1.0 : 1.0;
      const score = w * s;
      if (score < minScore) {
        minScore = score;
        victimId = vId;
        victimKey = vKey;
      }
    }

    if (victimId === -1 && this.docIdMap.size > 0) {
      for (const [vKey, vId] of this.docIdMap) {
        victimId = vId;
        victimKey = vKey;
        break;
      }
    }

    if (victimKey && victimId !== -1) {
      this.docIdMap.delete(victimKey);
      this.docKeyMap.delete(victimId);
      const qIdx = this.docIdEvictQueue.indexOf(victimKey);
      if (qIdx !== -1) this.docIdEvictQueue.splice(qIdx, 1);

      const chunkIds = this.indexer.getDocumentChunkIds(victimKey);
      if (chunkIds && chunkIds.length > 0) {
        void this.store.deleteChunks(chunkIds);
      }
      this.indexer.deleteDocument(victimKey);

      const dOff = victimId * this.dim;
      const oldVec = new Float32Array(this.dim);
      for (let i = 0; i < this.dim; i++) oldVec[i] = this.docFHRR[dOff + i];
      for (let w = 0; w < this.multiWorld.maxWorlds; w++) {
        if (this.multiWorld.active[w] && this.multiWorld.worlds[w]) {
          this.multiWorld.worlds[w]!.encode(victimId, oldVec, 0);
        }
      }
      this._evictNextId = victimId;
    }
  }

  private _getOrAllocDocId(key: string): number {
    let numericId = this.docIdMap.get(key);
    if (numericId !== undefined) return numericId;

    if (this.nextDocId < this.maxDocs) {
      numericId = this.nextDocId++;
      this.docIdMap.set(key, numericId);
      this.docKeyMap.set(numericId, key);
      this.docIdEvictQueue.push(key);
      return numericId;
    }

    this._evictOne();
    const freedId = this._evictNextId;
    this.docIdMap.set(key, freedId);
    this.docKeyMap.set(freedId, key);
    this.docIdEvictQueue.push(key);
    return freedId;
  }

  async indexDocument(
    key: string,
    content: string,
    tags: string[] = [],
    baseWeight = 1.0,
    targetWorldSlot?: number,
    rebuildPipeline = true
  ): Promise<number> {
    const chunks = _chunk(key, content);
    const meta: Record<string, string | number | boolean> = { timestamp: Date.now() };
    for (const t of tags) meta[`tag_${t}`] = 1;
    meta[`location_${key}`] = 1;
    meta[`entity_${key}`] = 1;

    await this.store.writeChunks(chunks);

    this.indexer.indexDocument(
      {
        id: key,
        metadata: meta,
        chunkIds: chunks.map((c) => c.id),
        modifiedAt: Date.now(),
        accessCount: 0,
      },
      chunks
    );

    const numericId = this._getOrAllocDocId(key);
    const embedProof = await _getEmbeddingProof(content, this.dim);
    const dOff = numericId * this.dim;
    for (let i = 0; i < this.dim; i++) this.docFHRR[dOff + i] = embedProof.vector[i];

    const slot = targetWorldSlot ?? this.getActiveWorldSlot();
    const targetWorld = this.multiWorld.worlds[slot] ?? this.multiWorld.worlds[0]!;
    targetWorld.encode(numericId, embedProof.vector, baseWeight);
    targetWorld.setSalience(numericId, Math.max(0.1, baseWeight));

    if (rebuildPipeline) {
      this._syncActiveWorldPointers();
      this.rebuildCSR();
    }

    return numericId;
  }

  async syncKnowledgeGraph(
    kg: Record<string, string[]>,
    weights: Record<string, number> = {},
    targetWorldSlot?: number
  ): Promise<void> {
    const slot = targetWorldSlot ?? this.getActiveWorldSlot();
    const targetWorld = this.multiWorld.worlds[slot] ?? this.multiWorld.worlds[0]!;
    const activeKgKeys = new Set<string>();

    const pendingToIndex: { key: string; content: string; entity: string; w: number }[] = [];

    for (const [entity, facts] of Object.entries(kg || {})) {
      if (!Array.isArray(facts)) continue;
      for (const fact of facts) {
        const w = weights[`${entity}::${fact}`] ?? 1.0;
        const key = `kg_${entity}_${_hash(String(fact))}`;
        activeKgKeys.add(key);

        const existingId = this.docIdMap.get(key);
        if (existingId !== undefined) {
          const dOff = existingId * this.dim;
          const vec = new Float32Array(this.dim);
          for (let i = 0; i < this.dim; i++) vec[i] = this.docFHRR[dOff + i];
          targetWorld.encode(existingId, vec, w);
          targetWorld.setSalience(existingId, w);
          continue;
        }

        pendingToIndex.push({
          key,
          content: `[${entity}] ${fact}`,
          entity,
          w,
        });
      }
    }

    if (pendingToIndex.length > 0) {
      await Promise.all(
        pendingToIndex.map((item) =>
          this.indexDocument(
            item.key,
            item.content,
            ['knowledge_graph', item.entity],
            item.w,
            slot,
            false
          )
        )
      );
    }

    for (const [docKey, docId] of this.docIdMap.entries()) {
      if (docKey.startsWith('kg_') && !activeKgKeys.has(docKey)) {
        if ((targetWorld.docWeights[docId] ?? 0) > 1e-10) {
          const dOff = docId * this.dim;
          const vec = new Float32Array(this.dim);
          for (let i = 0; i < this.dim; i++) vec[i] = this.docFHRR[dOff + i];
          targetWorld.encode(docId, vec, 0);
          targetWorld.setSalience(docId, 0);
        }
      }
    }

    this._syncActiveWorldPointers();
    this.rebuildCSR();
  }

  rebuildCSR(): void {
    if (this.orchestrator && this.orchestrator.pipeline && this.indexer) {
      rebuildPipelineFromIndexer(
        this.indexer,
        this.orchestrator.pipeline,
        this.docIdMap,
        this.numTerms,
        this.maxDocs,
        _hashTerm,
        this.docFHRR
      );
    }
  }

  async retrieve(input: RagQueryInput): Promise<RagQueryResponse> {
    const start = performance.now();
    const queryTerms = _canonicalTokens(input.query);
    const locTerms = _canonicalTokens(input.location);
    const entityTerms = _canonicalTokens(input.entities);
    const tagTerms = _canonicalTokens(input.tags);

    const allTerms = [...tagTerms, ...locTerms, ...entityTerms, ...queryTerms];
    const queryStr = allTerms.join(' ');
    const queryProof = await _getEmbeddingProof(queryStr, this.dim);

    const nq = Math.min(allTerms.length, this.maxQueryTerms);
    for (let i = 0; i < nq; i++) {
      const term = allTerms[i]!;
      this.queryTermsBuf[i] = _hashTerm(term) % this.numTerms;
      this.queryIDFBuf[i] = this.indexer.hasTerm(term)
        ? this.indexer.getTermIDF(term)
        : 0.15;
    }

    this._syncActiveWorldPointers();
    const activeWorld = this.getActiveWorld()!;

    const decision = this.orchestrator.orchestrate(
      allTerms,
      this.queryTermsBuf,
      this.queryIDFBuf,
      queryProof.vector,
      nq,
      input.agent
    );

    if (decision.decisionId !== undefined) {
      this.activeDecisionReceipts.add(decision.decisionId);
    }

    for (let i = 0; i < decision.result.count; i++) {
      activeWorld.markRehearsed(decision.result.indices[i]!);
    }

    const docScores = new Map<number, { score: number; rank: number }>();
    const chunkIdsToFetch: string[] = [];

    for (let i = 0; i < decision.result.count; i++) {
      const numericId = decision.result.indices[i]!;
      const score = decision.result.scores[i]!;
      docScores.set(numericId, { score, rank: i + 1 });

      const docKey = this.docKeyMap.get(numericId);
      if (docKey) {
        const cids = this.indexer.getDocumentChunkIds(docKey);
        if (cids && cids.length > 0) {
          chunkIdsToFetch.push(...cids);
        }
      }
    }

    const limit = input.topK ?? 16;
    const chunks = await this.store.resolveChunks(chunkIdsToFetch.slice(0, limit));
    const elapsedMs = performance.now() - start;

    const retrieved: RagRetrievedChunk[] = chunks.map((chunk) => {
      const numId = this.docIdMap.get(chunk.docId);
      const proof = numId !== undefined ? docScores.get(numId) : undefined;
      return {
        entry: { key: chunk.id, docId: chunk.docId, content: chunk.text },
        relevanceScore: proof?.score ?? 0.5,
        reason: decision.action,
        degradedEmbedding: queryProof.degraded,
      };
    });

    let snippet = '';
    if (retrieved.length > 0) {
      snippet =
        `=== RAG CONTEXT (Embedding-Free Holographic Kernel) ===\n` +
        `[Strategy: ${RetrievalStrategy[decision.strategy]}] [Action: ${decision.action}] [Confidence: ${decision.confidence.toFixed(2)}]\n` +
        `${decision.reasoning}\n\n` +
        retrieved
          .map((r) => `[${r.reason.toUpperCase()}|${r.relevanceScore.toFixed(2)}] ${r.entry.content}`)
          .join('\n');
    }

    return {
      snippet,
      retrieved,
      elapsedMs,
      decision: {
        strategy: decision.strategy,
        action: decision.action,
        confidence: decision.confidence,
        reasoning: decision.reasoning,
        anomalyCount: decision.anomalyCount,
        decisionId: decision.decisionId,
        agentId: decision.npcId,
        agentArchetype: decision.npcArchetype,
        degraded: queryProof.degraded,
      },
    };
  }

  reportOutcome(params: {
    decision: Pick<ChunkDecision, 'decisionId' | 'strategy' | 'action' | 'npcId' | 'npcArchetype'>;
    userSatisfied: boolean;
    llmAccepted?: boolean;
    latencyMs?: number;
    agent?: string | Partial<AgentPersonalityProfile>;
  }): { updated: boolean; rlSnapshot: VSARLPolicySnapshot | null } {
    const decId = params.decision?.decisionId;
    if (decId === undefined || !this.activeDecisionReceipts.has(decId)) {
      return { updated: false, rlSnapshot: null };
    }

    this.activeDecisionReceipts.delete(decId);
    this.orchestrator.learn(
      {
        decision: params.decision as ChunkDecision,
        userSatisfied: params.userSatisfied,
        llmAccepted: params.llmAccepted ?? params.userSatisfied,
        latencyMs: params.latencyMs ?? 0,
      },
      params.agent ?? params.decision.npcId ?? params.decision.npcArchetype
    );

    return {
      updated: true,
      rlSnapshot: this.orchestrator.rlPolicy.exportSnapshot(),
    };
  }

  forkTimeline(options: {
    parentId?: string;
    name?: string;
    forkTurn?: number;
    notes?: string;
    switchImmediately?: boolean;
  }): { success: boolean; node: TimelineNode; dag: TimelineDAGState } {
    const parentNode =
      this.timelineDAG.getNodes().find((n) => n.id === options.parentId) ||
      this.timelineDAG.getActiveTimeline();
    const parentSlot = parentNode ? parentNode.worldSlot : 0;
    const targetSlot = this.timelineDAG.findAvailableWorldSlot(this.maxWorlds);

    if (targetSlot === null) {
      throw new Error(`All world slots (max ${this.maxWorlds}) are occupied.`);
    }

    if (!this.multiWorld.active[parentSlot]) {
      this.multiWorld.active[parentSlot] = 1;
      this.multiWorld.superposition[parentSlot] = 1;
    }

    const branchId = `branch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
    const branchName = options.name || `Branch ${branchId}`;
    const ok = this.multiWorld.fork(parentSlot, targetSlot, branchName);
    if (!ok) {
      throw new Error(`Failed to fork multi-world from slot ${parentSlot} to ${targetSlot}`);
    }

    const newNode = this.timelineDAG.addBranchNode(
      branchId,
      parentNode ? parentNode.id : 'trunk',
      targetSlot,
      branchName,
      options.forkTurn ?? 1,
      options.notes
    );

    if (options.switchImmediately) {
      this.timelineDAG.setActiveTimeline(branchId);
      this._syncActiveWorldPointers();
    }

    return { success: true, node: newNode, dag: this.timelineDAG.getSnapshot() };
  }

  mergeTimeline(options: {
    branchId: string;
    targetId?: string;
    autoThreshold?: number;
    trunkPriority?: boolean;
  }): { success: boolean; mergeResult: MergeResult; dag: TimelineDAGState } {
    const targetId = options.targetId ?? 'trunk';
    const branch = this.timelineDAG.getNode(options.branchId);
    const target = this.timelineDAG.getNode(targetId);

    if (!branch || !target) {
      throw new Error('Source branch or target timeline node not found');
    }

    const result = this.mergeResolver.resolve(
      branch.worldSlot,
      target.worldSlot,
      options.autoThreshold ?? 0.15,
      options.trunkPriority ?? true
    );
    this.timelineDAG.recordMerge(options.branchId, targetId, result);
    this._syncActiveWorldPointers();

    return {
      success: result.success,
      mergeResult: result,
      dag: this.timelineDAG.getSnapshot(),
    };
  }

  switchActiveTimeline(timelineId: string): TimelineDAGState {
    if (!this.timelineDAG.setActiveTimeline(timelineId)) {
      throw new Error(`Timeline ${timelineId} not found or already pruned`);
    }
    this._syncActiveWorldPointers();
    return this.timelineDAG.getSnapshot();
  }

  async simulateWhatIf(options: {
    prompt: string;
    parentId?: string;
    currentTurn?: number;
    createBranch?: boolean;
  }) {
    return evaluateWhatIfScenario({
      prompt: options.prompt,
      parentId: options.parentId,
      currentTurn: options.currentTurn,
      createBranch: options.createBranch,
      dim: this.dim,
      timelineDAG: this.timelineDAG,
      multiWorld: this.multiWorld,
      docIdMap: this.docIdMap,
      docFHRR: this.docFHRR,
      indexer: this.indexer,
      store: this.store,
      syncActiveWorldPointers: () => this._syncActiveWorldPointers(),
    });
  }

  getStats() {
    const activeWorld = this.getActiveWorld();
    return {
      orchestrator: this.orchestrator?.getStats(),
      rlPolicy: this.orchestrator?.rlPolicy.getStats(),
      hologram: activeWorld?.getMemoryStats(),
      wasmBatchScorer: this.wasmBatchScorer?.getDiagnostics() ?? null,
      chunkStore: this.store?.getMemoryStats() ?? null,
      activeWorldSlot: this.getActiveWorldSlot(),
      activeTimelineId: this.timelineDAG?.getActiveTimelineId() ?? 'trunk',
    };
  }

  destroy(): void {
    this.store?.close();
  }
}
