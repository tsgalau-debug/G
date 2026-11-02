/* eslint-disable */
/// <reference lib="webworker" />

import { BaseIndexer } from "./base-indexer";
import { ChunkStore } from "./chunk-store";
import { EpistemicRetrievalKernel } from "./holographic-memory";
import { MultiWorldHologram } from "./multi-world";
import { WorldMergeResolver } from "./world-merge-resolver";
import { TimelineDAGManager } from "./timeline-dag";
import { HybridCSRMatrix, RetrievalPipeline } from "./hybrid-pipeline";
import { rebuildPipelineFromIndexer } from "./pipeline-bridge";
import { AgenticChunkOrchestrator, ChunkDecision, RetrievalStrategy } from "./agentic-chunk-orchestrator";
import { VSARLPolicyKernel } from "./vsarl-policy-kernel";
import { SYSTEM_RULES } from "../system-rules";
import {
  _canonicalTokens,
  _chunk,
  _hash,
  _hashTerm,
  _getEmbeddingProof
} from "./worker-tokenizer-embedder";
import { evaluateWhatIfScenario } from "./worker-whatif-simulator";
import { WasmMathProgramV9BatchScorer } from "./wasm-math-v9-scorer";

export type { EmbeddingProof } from "./worker-tokenizer-embedder";

// ---------------------------------------------------------------------------
// Internal Worker State
// ---------------------------------------------------------------------------

let indexer: BaseIndexer;
let store: ChunkStore;
let multiWorld: MultiWorldHologram;
// @ts-ignore
let epistemicKernel: EpistemicRetrievalKernel;
let mergeResolver: WorldMergeResolver;
let orchestrator: AgenticChunkOrchestrator;
let timelineDAG: TimelineDAGManager;
let wasmBatchScorer: WasmMathProgramV9BatchScorer | null = null;

const maxDocs = 4096;
const dim = 768;
let docFHRR: Float32Array;

let docIdMap = new Map<string, number>();
let docKeyMap = new Map<number, string>();
let docIdEvictQueue: string[] = [];
let nextDocId = 0;
let _evictNextId = 0;

// Content-addressed tracking for episodic stability
const indexedEpisodicHashes = new Set<string>();
const indexedLogHashes = new Set<string>();

// Decision receipts for RL consume-once verification
const activeDecisionReceipts = new Set<number>();

// Concurrency mutex queue for read-committed proof state
let executionQueue = Promise.resolve();

// @ts-ignore
let queryRecon: Float32Array;
let queryTermsBuf: Int32Array;
let queryIDFBuf: Float32Array;

// ---------------------------------------------------------------------------
// Weighted / Salience-Driven Eviction
// ---------------------------------------------------------------------------

function _getActiveWorldSlot(): number {
  return timelineDAG?.getActiveWorldSlot() ?? 0;
}

function _getActiveWorld() {
  const slot = _getActiveWorldSlot();
  return multiWorld?.worlds[slot] ?? multiWorld?.worlds[0];
}

function _syncActiveWorldPointers(): void {
  const activeWorld = _getActiveWorld();
  if (activeWorld) {
    orchestrator?.setActiveHologram(activeWorld);
    epistemicKernel?.setActiveHologram(activeWorld);
  }
  const activeSlot = _getActiveWorldSlot();
  if (multiWorld) {
    multiWorld.setQueryMask(activeSlot === 0 ? [0] : [activeSlot, 0]);
  }
}

function _evictOne(): void {
  let victimId = -1;
  let victimKey = '';
  let minScore = Infinity;

  const world = _getActiveWorld();

  for (const [vKey, vId] of docIdMap) {
    if (vKey.startsWith("static_")) continue;

    const w = world ? (world.docWeights[vId] || 0.5) : 0.5;
    const s = world ? (world.salience[vId] || 1.0) : 1.0;
    const score = w * s;

    if (score < minScore) {
      minScore = score;
      victimId = vId;
      victimKey = vKey;
    }
  }

  if (victimId === -1 && docIdMap.size > 0) {
    for (const [vKey, vId] of docIdMap) {
      victimId = vId;
      victimKey = vKey;
      break;
    }
  }

  if (victimKey && victimId !== -1) {
    docIdMap.delete(victimKey);
    docKeyMap.delete(victimId);
    const qIdx = docIdEvictQueue.indexOf(victimKey);
    if (qIdx !== -1) docIdEvictQueue.splice(qIdx, 1);

    const chunkIds = indexer.getDocumentChunkIds(victimKey);
    if (chunkIds && chunkIds.length > 0) {
      void store.deleteChunks(chunkIds).catch((err) => {
        console.warn('Failed to evict chunks in worker:', err);
      });
    }
    indexer.deleteDocument(victimKey);

    const dOff = victimId * dim;
    const oldVec = new Float32Array(dim);
    for (let i = 0; i < dim; i++) oldVec[i] = docFHRR[dOff + i];
    if (multiWorld) {
      for (let w = 0; w < multiWorld.maxWorlds; w++) {
        if (multiWorld.active[w] && multiWorld.worlds[w]) {
          multiWorld.worlds[w]!.encode(victimId, oldVec, 0);
        }
      }
    }

    _evictNextId = victimId;
  }
}

function _getOrAllocDocId(key: string): number {
  let numericId = docIdMap.get(key);
  if (numericId !== undefined) return numericId;

  if (nextDocId < maxDocs) {
    numericId = nextDocId++;
    docIdMap.set(key, numericId);
    docKeyMap.set(numericId, key);
    docIdEvictQueue.push(key);
    return numericId;
  }

  _evictOne();
  const freedId = _evictNextId;
  docIdMap.set(key, freedId);
  docKeyMap.set(freedId, key);
  docIdEvictQueue.push(key);
  return freedId;
}

// ---------------------------------------------------------------------------
// Indexing Operations
// ---------------------------------------------------------------------------

async function _indexEntry(
  key: string,
  content: string,
  tags: string[],
  baseWeight = 1,
  targetWorldSlot?: number
): Promise<void> {
  const chunks = _chunk(key, content);
  const meta: Record<string, string | number | boolean> = { timestamp: Date.now() };
  for (const t of tags) meta[`tag_${t}`] = 1;
  meta[`location_${key}`] = 1;
  meta[`entity_${key}`] = 1;

  await store.writeChunks(chunks);

  indexer.indexDocument({
    id: key, metadata: meta,
    chunkIds: chunks.map((c: any) => c.id),
    modifiedAt: Date.now(), accessCount: 0,
  }, chunks);

  const numericId = _getOrAllocDocId(key);
  if (numericId !== undefined) {
    const embedProof = await _getEmbeddingProof(content, dim);
    const dOff = numericId * dim;
    for (let i = 0; i < dim; i++) docFHRR[dOff + i] = embedProof.vector[i];

    const slot = targetWorldSlot ?? _getActiveWorldSlot();
    const targetWorld = multiWorld.worlds[slot] ?? multiWorld.worlds[0]!;
    targetWorld.encode(numericId, embedProof.vector, baseWeight);
    if (key.startsWith("ep_")) {
      targetWorld.setSalience(numericId, baseWeight > 1 ? 3 : 0.8);
    } else if (key.startsWith("kg_")) {
      targetWorld.setSalience(numericId, baseWeight);
    }
  }
}

async function syncKnowledgeGraph(kg: any, weights: any, targetWorldSlot?: number) {
  if (!kg || typeof kg !== 'object') return;
  const slot = targetWorldSlot ?? _getActiveWorldSlot();
  const targetWorld = multiWorld.worlds[slot] ?? multiWorld.worlds[0]!;
  const safeWeights = weights && typeof weights === 'object' ? weights : {};
  const activeKgKeys = new Set<string>();

  for (const [entity, facts] of Object.entries(kg)) {
    if (!Array.isArray(facts)) continue;
    for (const fact of facts) {
      const w = safeWeights[`${entity}::${fact}`] ?? 1;
      const key = `kg_${entity}_${_hash(String(fact))}`;
      activeKgKeys.add(key);

      const existingId = docIdMap.get(key);
      if (existingId !== undefined) {
        const dOff = existingId * dim;
        const vec = new Float32Array(dim);
        for (let i = 0; i < dim; i++) vec[i] = docFHRR[dOff + i];
        targetWorld.encode(existingId, vec, w);
        targetWorld.setSalience(existingId, w);
        continue;
      }

      await _indexEntry(key, `[${entity}] ${fact}`, ["knowledge_graph", entity], w, slot);
    }
  }

  // Algebraically unbind any kg_* document that was deleted/edited out of kg for this world slot
  for (const [docKey, docId] of docIdMap.entries()) {
    if (docKey.startsWith('kg_') && !activeKgKeys.has(docKey)) {
      if ((targetWorld.docWeights[docId] ?? 0) > 1e-10) {
        const dOff = docId * dim;
        const vec = new Float32Array(dim);
        for (let i = 0; i < dim; i++) vec[i] = docFHRR[dOff + i];
        targetWorld.encode(docId, vec, 0);
        targetWorld.setSalience(docId, 0);
      }
    }
  }
}

async function syncEpisodicMemory(episodes: any[], logs: any[], targetWorldSlot?: number) {
  const slot = targetWorldSlot ?? _getActiveWorldSlot();
  const targetWorld = multiWorld.worlds[slot] ?? multiWorld.worlds[0]!;

  if (Array.isArray(episodes)) {
    for (let i = 0; i < episodes.length; i++) {
      const ep = episodes[i];
      let fullNarrative = `[Episode ${i}]\n`;
      if (ep?.narrative) fullNarrative += (ep?.narrative ?? "") + "\n";
      if (ep?.narrative_blocks && (ep?.narrative_blocks || []).length > 0) {
        fullNarrative += (ep?.narrative_blocks || []).map((b: any) => {
          let blk = `[${b.name || "NPC"}]: `;
          if (b.narration) blk += `${b.narration} `;
          if (b.action) blk += `*(Action)* ${b.action} `;
          if (b.dialogue) blk += `*(Dialogue)* "${b.dialogue}"`;
          return blk.trim();
        }).join("\n") + "\n";
      }

      const narrativeText = fullNarrative.trim();
      if (narrativeText.length <= `[Episode ${i}]`.length) continue;

      const epHash = _hash(ep?.id ? `${ep.id}::${narrativeText}` : narrativeText);
      const key = `ep_${epHash}`;

      const existingId = docIdMap.get(key);
      if (existingId !== undefined) {
        if (targetWorld.docWeights[existingId] <= 1e-10) {
          const dOff = existingId * dim;
          const vec = new Float32Array(dim);
          for (let j = 0; j < dim; j++) vec[j] = docFHRR[dOff + j];
          targetWorld.encode(existingId, vec, 0.8);
          targetWorld.setSalience(existingId, 0.8);
        }
        indexedEpisodicHashes.add(epHash);
        continue;
      }

      const tags = ["episodic", "narrative", ep?.mc_state?.locationName || "unknown"];
      await _indexEntry(key, narrativeText, tags, 0.8, slot);
      indexedEpisodicHashes.add(epHash);
    }
  }

  if (Array.isArray(logs)) {
    for (let i = 0; i < logs.length; i++) {
      const log = String(logs[i] ?? "").trim();
      if (!log) continue;
      if (log.startsWith("[World Event]") || log.startsWith("[Combat]") || log.startsWith("[Quest]") || log.startsWith("[3-Way Merge]") || log.startsWith("[Timeline]")) {
        const logHash = _hash(log);
        const key = `log_${logHash}`;
        const existingId = docIdMap.get(key);
        if (existingId !== undefined) {
          if (targetWorld.docWeights[existingId] <= 1e-10) {
            const dOff = existingId * dim;
            const vec = new Float32Array(dim);
            for (let j = 0; j < dim; j++) vec[j] = docFHRR[dOff + j];
            targetWorld.encode(existingId, vec, 0.6);
          }
          indexedLogHashes.add(logHash);
          continue;
        }

        await _indexEntry(key, log, ["episodic", "world_event"], 0.6, slot);
        indexedLogHashes.add(logHash);
      }
    }
  }
}

async function _bootstrap() {
  const book = (SYSTEM_RULES as any)?.lorebook_database || {};
  for (const [k, v] of Object.entries(book)) {
    await _indexEntry(`static_${k}`, v as string, ["static", "lorebook"], 1.5, 0);
  }
}

function _rebuildCSR(): void {
  if (orchestrator && orchestrator.pipeline && indexer) {
    rebuildPipelineFromIndexer(
      indexer,
      orchestrator.pipeline,
      docIdMap,
      2048,
      maxDocs,
      _hashTerm,
      docFHRR
    );
  }
}

// ---------------------------------------------------------------------------
// Message Handler with Atomic Proof State Transition Queue
// ---------------------------------------------------------------------------

addEventListener('message', ({ data }) => {
  const { id, action, payload } = data;

  executionQueue = executionQueue.then(async () => {
    try {
      switch (action) {
        case 'init': {
          if (store) {
            try {
              store.purgeMemory();
              store.close();
            } catch (err) {
              console.warn("Error closing previous ChunkStore:", err);
            }
          }

          docIdMap.clear();
          docKeyMap.clear();
          docIdEvictQueue.length = 0;
          nextDocId = 0;
          _evictNextId = 0;
          indexedEpisodicHashes.clear();
          indexedLogHashes.clear();
          activeDecisionReceipts.clear();

          const rawStoryId = typeof payload?.storyId === 'string' && payload.storyId.trim().length > 0
            ? payload.storyId.trim()
            : 'default';
          const safeStoryId = rawStoryId.replace(/[^a-zA-Z0-9_-]/g, '_');
          store = new ChunkStore({
            dbName: `Guardian_Engine_${safeStoryId}`,
            storeName: "lore_chunks",
            maxMemoryChunks: 64,
            version: 1,
          });
          await store.init();
          if (payload?.clearStore === true) {
            await store.clearAll();
          }

          indexer = new BaseIndexer({ maxDocs, maxResults: 128 });
          indexer.registerSchema({ name: "location", type: "categorical", weight: 0.35 });
          indexer.registerSchema({ name: "entity", type: "categorical", weight: 0.4 });
          indexer.registerSchema({ name: "tag", type: "tag", weight: 0.2 });
          indexer.registerSchema({ name: "timestamp", type: "temporal", weight: 0.05 });

          docFHRR = new Float32Array(maxDocs * dim);
          multiWorld = new MultiWorldHologram(8, dim, maxDocs, 64, docFHRR);
          timelineDAG = new TimelineDAGManager(8);

          const docWeights = new Float32Array(maxDocs);
          multiWorld.initTrunk(docFHRR, docWeights, "trunk");

          queryRecon = new Float32Array(dim);
          queryTermsBuf = new Int32Array(64);
          queryIDFBuf = new Float32Array(64);

          const pipeline = new RetrievalPipeline(2048, maxDocs, dim, 1024, 32);
          const invLists = new HybridCSRMatrix(2048, maxDocs, 0);
          const termUB = new Float32Array(2048);
          const cooccur = new HybridCSRMatrix(2048, 2048, 0);
          pipeline.build(invLists, termUB, cooccur, docFHRR);

          if (!wasmBatchScorer) {
            wasmBatchScorer = await WasmMathProgramV9BatchScorer.createForBrowserWorker(
              maxDocs,
              dim
            );
          }
          pipeline.setWasmBatchScorer(wasmBatchScorer);

          epistemicKernel = new EpistemicRetrievalKernel(
            pipeline, multiWorld.worlds[0]!, dim, 10,
          );
          mergeResolver = new WorldMergeResolver(multiWorld, dim, maxDocs, docFHRR);

          const rlPolicy = new VSARLPolicyKernel(32, 6, 256);
          if (payload?.rlPolicySnapshot) {
            rlPolicy.restoreSnapshot(payload.rlPolicySnapshot);
          }
          orchestrator = new AgenticChunkOrchestrator(
            pipeline, multiWorld.worlds[0]!, multiWorld, rlPolicy,
            dim, maxDocs, 16, 32
          );
          if (payload?.rlPolicySnapshot) {
            const snap = payload.rlPolicySnapshot;
            if (Array.isArray(snap.successHistory) && snap.successHistory.length === orchestrator.successHistory.length) {
              orchestrator.successHistory.set(snap.successHistory);
            }
            if (typeof snap.totalQueries === 'number') orchestrator.totalQueries = snap.totalQueries;
            if (typeof snap.totalRequeries === 'number') orchestrator.totalRequeries = snap.totalRequeries;
            if (typeof snap.totalEscalations === 'number') orchestrator.totalEscalations = snap.totalEscalations;
            if (typeof snap.totalKernelAnswers === 'number') orchestrator.totalKernelAnswers = snap.totalKernelAnswers;
          }

          await _bootstrap();

          if (payload?.timelineDagState) {
            timelineDAG.restore(payload.timelineDagState);
            const snapshots = payload.timelineSnapshots || {};

            if (snapshots['trunk']) {
              await syncKnowledgeGraph(
                snapshots['trunk'].knowledgeGraph || {},
                snapshots['trunk'].knowledgeWeights || {},
                0
              );
              await syncEpisodicMemory(snapshots['trunk'].chronicle || [], snapshots['trunk'].logs || [], 0);
            }

            for (const node of timelineDAG.getNodes()) {
              if (node.id === 'trunk') continue;
              if (node.status === 'active' || node.status === 'simulating') {
                const parentNode = node.parentTimelineId ? timelineDAG.getNode(node.parentTimelineId) : undefined;
                const parentSlot = parentNode && multiWorld.active[parentNode.worldSlot] ? parentNode.worldSlot : 0;
                multiWorld.fork(parentSlot, node.worldSlot, node.name);

                const branchSnap = snapshots[node.id];
                if (branchSnap) {
                  await syncKnowledgeGraph(
                    branchSnap.knowledgeGraph || {},
                    branchSnap.knowledgeWeights || {},
                    node.worldSlot
                  );
                  await syncEpisodicMemory(branchSnap.chronicle || [], branchSnap.logs || [], node.worldSlot);
                }
              }
            }
          }

          _syncActiveWorldPointers();
          _rebuildCSR();

          postMessage({ id, result: { ready: true, dag: timelineDAG.getSnapshot() } });
          break;
        }

        case 'sync': {
          const { kg, weights, episodes, logs, worldSlot } = payload;
          const targetSlot = typeof worldSlot === 'number' ? worldSlot : _getActiveWorldSlot();
          await syncKnowledgeGraph(kg, weights, targetSlot);
          await syncEpisodicMemory(episodes, logs, targetSlot);

          _syncActiveWorldPointers();
          _rebuildCSR();

          const activeWorld = multiWorld?.worlds[targetSlot] ?? _getActiveWorld();
          if (activeWorld) {
            activeWorld.scheduleDecay(0.97, "lazy", 50);
          }
          postMessage({ id, result: true });
          break;
        }

        case 'getContextSnippet': {
          const { location, entities, tags, playerChoice, npc, personality } = payload;
          const start = performance.now();

          const choiceTerms = _canonicalTokens(playerChoice);
          const locTerms = _canonicalTokens(location);
          const entityTerms = _canonicalTokens(entities);
          const tagTerms = _canonicalTokens(tags);

          const queryStr = [...tagTerms, ...locTerms, ...entityTerms, ...choiceTerms].join(" ");
          const queryProof = await _getEmbeddingProof(queryStr, dim);

          const allTerms = [...tagTerms, ...locTerms, ...entityTerms, ...choiceTerms];
          const nq = Math.min(allTerms.length, 32);
          for (let i = 0; i < nq; i++) {
            const term = allTerms[i]!;
            queryTermsBuf[i] = _hashTerm(term) % 2048;
            queryIDFBuf[i] = indexer
              ? (indexer.hasTerm(term) ? indexer.getTermIDF(term) : 0.15)
              : 1.0;
          }

          _syncActiveWorldPointers();
          const activeWorld = _getActiveWorld()!;

          const decision = orchestrator.orchestrate(
            allTerms,
            queryTermsBuf,
            queryIDFBuf,
            queryProof.vector,
            nq,
            personality || npc
          );

          if (decision.decisionId !== undefined) {
            activeDecisionReceipts.add(decision.decisionId);
          }

          for (let i = 0; i < decision.result.count; i++) {
            activeWorld.markRehearsed(decision.result.indices[i]);
          }

          const docScores = new Map<number, { score: number; rank: number }>();
          const chunkIdsToFetch: string[] = [];

          for (let i = 0; i < decision.result.count; i++) {
            const numericId = decision.result.indices[i];
            const score = decision.result.scores[i];
            docScores.set(numericId, { score, rank: i + 1 });

            const docKey = docKeyMap.get(numericId);
            if (docKey) {
              const cids = indexer.getDocumentChunkIds(docKey);
              if (cids && cids.length > 0) {
                chunkIdsToFetch.push(...cids);
              }
            }
          }

          const chunks = await store.resolveChunks(chunkIdsToFetch.slice(0, 16));
          const elapsed = performance.now() - start;

          const retrieved = chunks.map((chunk) => {
            const numId = docIdMap.get(chunk.docId);
            const proof = numId !== undefined ? docScores.get(numId) : undefined;
            const score = proof?.score ?? 0.5;

            return {
              entry: { key: chunk.id, content: chunk.text },
              relevanceScore: score,
              reason: decision.action,
              degradedEmbedding: queryProof.degraded,
            };
          });

          let snippet = "";
          if (retrieved.length > 0) {
            snippet =
              `\n=== DYNAMIC LORE CONTEXT (Agentic RAG) ===\n` +
              `[Strategy: ${RetrievalStrategy[decision.strategy]}] ` +
              `[Action: ${decision.action}] ` +
              `[Confidence: ${decision.confidence.toFixed(2)}]` +
              (decision.npcId ? ` [Agent: ${decision.npcId} (${(decision.npcArchetype || '').toUpperCase()})]` : "") +
              (queryProof.degraded ? ` [Degraded: true]` : "") + `\n` +
              `${decision.reasoning}\n` +
              (decision.anomalyCount > 0
                ? `[Anomalies filtered: ${decision.anomalyCount} (retained in memory)]\n`
                : "") +
              `\n` +
              retrieved
                .map((r) => `[${r.reason.toUpperCase()}|${r.relevanceScore.toFixed(2)}] ${r.entry.content}`)
                .join("\n");
          }

          postMessage({
            id,
            result: {
              snippet,
              retrieved,
              elapsed,
              decision: {
                strategy: decision.strategy,
                action: decision.action,
                confidence: decision.confidence,
                reasoning: decision.reasoning,
                anomalyCount: decision.anomalyCount,
                decisionId: decision.decisionId,
                npcId: decision.npcId,
                npcArchetype: decision.npcArchetype,
                degraded: queryProof.degraded,
              },
            },
          });
          break;
        }

        case 'reportOutcome': {
          const { decision, userSatisfied, llmAccepted, latencyMs, npc, personality } = payload;
          const decId = decision?.decisionId;

          let rlSnapshot = null;
          if (decId !== undefined && activeDecisionReceipts.has(decId)) {
            activeDecisionReceipts.delete(decId);
            if (orchestrator) {
              orchestrator.learn({
                decision: decision as ChunkDecision,
                userSatisfied: userSatisfied ?? false,
                llmAccepted: llmAccepted ?? false,
                latencyMs: latencyMs ?? 0,
              }, personality || npc || decision?.npcId || decision?.npcArchetype);

              rlSnapshot = {
                ...orchestrator.rlPolicy.exportSnapshot(),
                successHistory: Array.from(orchestrator.successHistory),
                totalQueries: orchestrator.totalQueries,
                totalRequeries: orchestrator.totalRequeries,
                totalEscalations: orchestrator.totalEscalations,
                totalKernelAnswers: orchestrator.totalKernelAnswers,
              };
            }
          }
          postMessage({ id, result: { updated: rlSnapshot !== null, rlSnapshot } });
          break;
        }

        case 'registerNpcPersonality': {
          if (orchestrator && payload?.personality) {
            orchestrator.rlPolicy.registerNpc(payload.personality);
          }
          postMessage({ id, result: true });
          break;
        }

        case 'explainDecision': {
          const { location, entities, tags, playerChoice, npc, personality } = payload;
          const choiceTerms = _canonicalTokens(playerChoice);
          const locTerms = _canonicalTokens(location);
          const entityTerms = _canonicalTokens(entities);
          const tagTerms = _canonicalTokens(tags);
          const allTerms = [...tagTerms, ...locTerms, ...entityTerms, ...choiceTerms];
          const queryStr = allTerms.join(" ");
          const queryProof = await _getEmbeddingProof(queryStr, dim);

          const nq = Math.min(allTerms.length, 32);
          for (let i = 0; i < nq; i++) {
            const term = allTerms[i]!;
            queryTermsBuf[i] = _hashTerm(term) % 2048;
            queryIDFBuf[i] = indexer
              ? (indexer.hasTerm(term) ? indexer.getTermIDF(term) : 0.15)
              : 1.0;
          }

          const explanation = orchestrator.explainDecision(
            allTerms,
            queryProof.vector,
            personality || npc,
            queryTermsBuf,
            queryIDFBuf
          );
          postMessage({ id, result: explanation });
          break;
        }

        case 'getTimelineState': {
          if (!timelineDAG) {
            timelineDAG = new TimelineDAGManager(8);
          }
          postMessage({ id, result: timelineDAG.getSnapshot() });
          break;
        }

        case 'forkTimeline': {
          if (!timelineDAG) timelineDAG = new TimelineDAGManager(8);
          const { parentId, name, forkTurn, notes, switchImmediately = false } = payload;
          const parentNode = timelineDAG.getNodes().find(n => n.id === parentId) || timelineDAG.getActiveTimeline();
          const parentSlot = parentNode ? parentNode.worldSlot : 0;
          const targetSlot = timelineDAG.findAvailableWorldSlot(8);

          if (targetSlot === null) {
            throw new Error('Semua slot realitas (max 8) telah terisi! Harap prune atau merge cabang yang tidak aktif.');
          }

          if (!multiWorld.active[parentSlot]) {
            multiWorld.active[parentSlot] = 1;
            multiWorld.superposition[parentSlot] = 1;
          }

          const branchId = `branch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
          const branchName = name || `Garis Waktu ${branchId}`;
          const ok = multiWorld.fork(parentSlot, targetSlot, branchName);
          if (!ok) {
            throw new Error(`Gagal melakukan fork multi-world dari slot ${parentSlot} ke ${targetSlot}`);
          }

          const newNode = timelineDAG.addBranchNode(
            branchId,
            parentNode ? parentNode.id : 'trunk',
            targetSlot,
            branchName,
            forkTurn || 1,
            notes
          );

          if (switchImmediately) {
            timelineDAG.setActiveTimeline(branchId);
            _syncActiveWorldPointers();
          }

          postMessage({ id, result: { success: true, node: newNode, dag: timelineDAG.getSnapshot() } });
          break;
        }

        case 'simulateWhatIf': {
          if (!timelineDAG) timelineDAG = new TimelineDAGManager(8);
          const { prompt, parentId, currentTurn, createBranch = false } = payload;
          const simResult = await evaluateWhatIfScenario({
            prompt,
            parentId,
            currentTurn,
            createBranch,
            dim,
            timelineDAG,
            multiWorld,
            docIdMap,
            docFHRR,
            indexer,
            store,
            syncActiveWorldPointers: _syncActiveWorldPointers
          });
          postMessage({ id, result: simResult });
          break;
        }

        case 'mergeTimeline': {
          if (!timelineDAG) timelineDAG = new TimelineDAGManager(8);
          const { branchId, targetId = 'trunk', autoThreshold = 0.15, trunkPriority = true } = payload;

          const nodes = timelineDAG.getNodes();
          const branch = nodes.find(n => n.id === branchId);
          const target = nodes.find(n => n.id === targetId);

          if (!branch || !target) {
            throw new Error('Branch atau target timeline tidak ditemukan');
          }

          const result = mergeResolver.resolve(branch.worldSlot, target.worldSlot, autoThreshold, trunkPriority);
          timelineDAG.recordMerge(branchId, targetId, result);
          _syncActiveWorldPointers();

          postMessage({
            id,
            result: {
              success: result.success,
              mergeResult: result,
              dag: timelineDAG.getSnapshot()
            }
          });
          break;
        }

        case 'pruneTimeline': {
          if (!timelineDAG) timelineDAG = new TimelineDAGManager(8);
          const { timelineId } = payload;
          const node = timelineDAG.getNodes().find(n => n.id === timelineId);
          if (!node || node.id === 'trunk') {
            throw new Error('Tidak dapat menghapus timeline root (trunk) atau node tidak valid');
          }

          multiWorld.prune(node.worldSlot);
          timelineDAG.pruneNode(timelineId);
          _syncActiveWorldPointers();

          postMessage({ id, result: { success: true, dag: timelineDAG.getSnapshot() } });
          break;
        }

        case 'switchActiveTimeline': {
          if (!timelineDAG) timelineDAG = new TimelineDAGManager(8);
          const { timelineId } = payload;
          const node = timelineDAG.getNodes().find(n => n.id === timelineId);
          if (!node) {
            throw new Error(`Timeline ${timelineId} tidak ditemukan`);
          }

          timelineDAG.setActiveTimeline(timelineId);
          _syncActiveWorldPointers();

          postMessage({ id, result: { success: true, dag: timelineDAG.getSnapshot() } });
          break;
        }

        case 'getArchetypeStats': {
          const stats = orchestrator ? orchestrator.rlPolicy.getArchetypeStats(payload.archetype) : null;
          postMessage({ id, result: stats });
          break;
        }

        case 'getNpcPersonalities': {
          const list = orchestrator ? orchestrator.rlPolicy.listNpcs() : [];
          postMessage({ id, result: list });
          break;
        }

        case 'resolvePlayerChoice': {
          const { branchWorld } = payload;
          const result = mergeResolver.resolve(branchWorld, 0, 0.15, true);
          _syncActiveWorldPointers();

          let report = `=== LORE MERGE REPORT ===\n`;
          report += `Conflicts: ${result.conflicts.length}\n`;
          report += `Auto-resolved: ${result.autoResolved}\n`;
          report += `Flagged for judgment: ${result.flaggedForLLM}\n\n`;
          for (const c of result.conflicts) {
            report += `[${c.type}] ${c.explanation}\n→ ${c.resolution}\n\n`;
          }
          postMessage({ id, result: report });
          break;
        }

        case 'getStats': {
          const activeWorld = _getActiveWorld();
          const stats = {
            orchestrator: orchestrator?.getStats(),
            rlPolicy: orchestrator?.rlPolicy.getStats(),
            hologram: activeWorld?.getMemoryStats(),
            wasmBatchScorer: wasmBatchScorer?.getDiagnostics() ?? null,
            chunkStore: store?.getMemoryStats() ?? null,
            activeWorldSlot: _getActiveWorldSlot(),
            activeTimelineId: timelineDAG?.getActiveTimelineId() ?? 'trunk'
          };
          postMessage({ id, result: stats });
          break;
        }

        case 'destroy': {
          if (store) {
            store.close();
          }
          postMessage({ id, result: true });
          break;
        }

        default: {
          throw new Error(`Unknown action: ${action}`);
        }
      }
    } catch (error: any) {
      postMessage({ id, error: error.message });
    }
  });
});
