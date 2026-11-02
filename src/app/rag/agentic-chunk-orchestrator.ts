/* eslint-disable */
/**
 * Agentic Chunk Orchestrator — Integrated Version
 * 
 * Layer 4: RL-driven retrieval strategy selection with closed-loop self-correction.
 * 
 * Integration points:
 * - Uses RetrievalPipeline (Layer 1) for actual retrieval
 * - Uses HolographicMemoryField (Layer 2) for coherence/verification
 * - Uses MultiWorldHologram (Layer 3) for cross-world validation
 * - Uses VSARLPolicyKernel (Layer 4) for strategy selection
 * 
 * Design principles (from Tensor-Driven Execution Rules):
 * - Zero-allocation hot path: all buffers pre-allocated in constructor
 * - SOA over AOS: chunk results as flat arrays, not object arrays
 * - Enum dispatch over string comparison: numeric strategy indices
 * - Circular buffer over array shift: O(1) history tracking
 * - Ghost state isolation: queryExpanded separate from queryVec
 */

import { RetrievalPipeline } from './hybrid-pipeline';
import { HolographicMemoryField } from './holographic-memory';
import { MultiWorldHologram } from './multi-world';
import { VSARLPolicyKernel, NpcPersonalityProfile, HierarchicalDecisionExplanation } from './vsarl-policy-kernel';

// === NUMERIC ENUM FOR BRANCHLESS DISPATCH ===
export enum RetrievalStrategy {
  Bm25Fast = 0,      // WAND pruning only, fastest
  SemanticFhrr = 1,  // SimHash dense similarity
  GraphDiffuse = 2,  // Graph convolution + diffusion
  Holographic = 3,   // Pattern completion dari memory field
  HybridFull = 4,    // Semua + fusion (default, paling lambat)
  SelfCorrect = 5,   // Re-query dengan expanded terms
}

export const STRATEGY_COUNT = 6;

// === SOA CHUNK RESULT (zero-allocation friendly) ===
export interface ChunkResult {
  indices: Int32Array;   // doc indices
  scores: Float32Array;  // relevance scores
  count: number;         // valid entries
}

export interface ChunkDecision {
  strategy: RetrievalStrategy;
  result: ChunkResult;
  confidence: number;
  action: 'return' | 'requery' | 'escalate_llm' | 'kernel_answer';
  reasoning: string;
  expansionTerms?: string[];
  anomalyCount: number;  // chunks filtered out (retained in memory, not LLM)
  decisionId?: number;
  npcId?: string;
  npcArchetype?: string;
}

export interface OrchestratorOutcome {
  decision: ChunkDecision;
  userSatisfied: boolean;
  llmAccepted: boolean;  // did LLM use the chunks?
  latencyMs: number;
}

export class AgenticChunkOrchestrator {
  readonly dim: number;
  readonly numDocs: number;
  readonly maxChunks: number;
  readonly stateDim: number;
  readonly stateWords: number;

  // Sub-systems
  readonly pipeline: RetrievalPipeline;
  hologram: HolographicMemoryField;
  readonly multiWorld: MultiWorldHologram;
  readonly rlPolicy: VSARLPolicyKernel;

  // === PRE-ALLOCATED BUFFERS (zero-allocation hot path) ===

  // Execution buffers (passed to pipeline.query)
  readonly execIndices: Int32Array;
  readonly execScores: Float32Array;

  // Query expansion (isolated ghost state)
  readonly queryExpanded: Float32Array;
  readonly gradBuf: Float32Array;

  // Strategy state (small: 32 dims, not 128)
  readonly stateBuf: Float32Array;
  readonly stateBinaryBuf: Uint32Array;

  // Anomaly tracking
  readonly anomalyIndices: Int32Array;
  readonly anomalyScores: Float32Array;

  // Chunk vector scratch
  readonly chunkVecScratch: Float32Array;
  readonly reconScratch: Float32Array;

  // === STRATEGY HISTORY (circular buffer, O(1)) ===
  readonly strategyHistory: Int8Array;
  readonly successHistory: Float32Array;
  private strategyHead: number;

  // === STATE SNAPSHOT RING ===
  readonly stateRing: Float32Array;
  readonly stateBinaryRing: Uint32Array;
  readonly actionRing: Uint8Array;
  readonly valueRing: Float32Array;
  readonly decisionIdRing: Uint32Array;
  readonly archetypeRing: Uint8Array;
  private nextDecisionId: number;

  // === CONFIG ===
  confidenceThreshold: number;
  requeryLimit: number;

  // === STATS ===
  totalQueries: number;
  totalRequeries: number;
  totalEscalations: number;
  totalKernelAnswers: number;

  constructor(
    pipeline: RetrievalPipeline,
    hologram: HolographicMemoryField,
    multiWorld: MultiWorldHologram,
    rlPolicy: VSARLPolicyKernel,
    dim: number,
    numDocs: number,
    maxChunks = 16,
    stateDim = 32
  ) {
    this.pipeline = pipeline;
    this.hologram = hologram;
    this.multiWorld = multiWorld;
    this.rlPolicy = rlPolicy;
    this.dim = dim;
    this.numDocs = numDocs;
    this.maxChunks = maxChunks;
    this.stateDim = stateDim;
    this.stateWords = Math.max(1, stateDim >> 5);

    // Pre-allocated execution buffers
    this.execIndices = new Int32Array(maxChunks);
    this.execScores = new Float32Array(maxChunks);

    // Ghost-state isolated expansion buffer
    this.queryExpanded = new Float32Array(dim);
    this.gradBuf = new Float32Array(dim);

    // Small state buffer for RL (32 dims, not 128)
    this.stateBuf = new Float32Array(stateDim);
    this.stateBinaryBuf = new Uint32Array(Math.max(1, this.stateWords));

    // Anomaly tracking
    this.anomalyIndices = new Int32Array(maxChunks);
    this.anomalyScores = new Float32Array(maxChunks);

    // Scratch space
    this.chunkVecScratch = new Float32Array(dim);
    this.reconScratch = new Float32Array(dim);

    // Circular history
    this.strategyHistory = new Int8Array(64);
    this.successHistory = new Float32Array(STRATEGY_COUNT);
    this.strategyHead = 0;

    // Ring buffer init
    this.stateRing = new Float32Array(256 * this.stateDim);
    this.stateBinaryRing = new Uint32Array(256 * this.stateWords);
    this.actionRing = new Uint8Array(256);
    this.valueRing = new Float32Array(256);
    this.decisionIdRing = new Uint32Array(256);
    this.archetypeRing = new Uint8Array(256);
    this.nextDecisionId = 1;

    this.confidenceThreshold = 0.65;
    this.requeryLimit = 2;

    this.totalQueries = 0;
    this.totalRequeries = 0;
    this.totalEscalations = 0;
    this.totalKernelAnswers = 0;
  }

  setActiveHologram(hologram: HolographicMemoryField): void {
    this.hologram = hologram;
  }

  // ==========================================================================
  // STEP 1: INSPECT — Analisis query, pilih strategi
  // ==========================================================================

  inspect(
    queryTerms: string[],
    queryFHRR: Float32Array,
    personality?: NpcPersonalityProfile | string,
    queryTermIds?: Int32Array,
    queryIDF?: Float32Array,
    requeryCount = 0
  ): RetrievalStrategy {
    // Cek coherence dengan holographic memory
    const rawCoherence = this.hologram.reconstruct(queryFHRR, this.reconScratch);
    const expectedCoh = 1 / Math.sqrt(Math.max(1, this.hologram.totalWeight));
    const coherence = rawCoherence / Math.max(0.001, expectedCoh);

    // Cek query complexity
    const termEntropy = this._computeTermEntropy(queryTerms);

    // Cek novelty (1 - coherence)
    const novelty = 1 - Math.abs(coherence);

    // Build centered 32-D bipolar decision state vector (AUD-05)
    this._buildStrategyState(
      coherence,
      termEntropy,
      novelty,
      queryTerms.length,
      queryTerms,
      queryTermIds,
      queryIDF,
      requeryCount
    );

    // RL Policy / Decision Router: select strategy conditioned on query telemetry & NPC personality
    const strategyIdx = this.rlPolicy.selectAction(this.stateBuf, 0.8, personality);

    // === P1 & AUD-05 FIX: pack centered bipolar state untuk snapshot ===
    this.rlPolicy.packState(this.stateBuf, this.stateBinaryBuf, 0);

    // Clamp to valid range
    return Math.max(0, Math.min(STRATEGY_COUNT - 1, strategyIdx));
  }

  // ==========================================================================
  // STEP 2: EXECUTE — Jalankan strategi yang dipilih
  // ==========================================================================

  execute(
    strategy: RetrievalStrategy,
    queryTermIds: Int32Array,
    queryIDF: Float32Array,
    queryFHRR: Float32Array,
    nq: number,
    _queryTerms?: string[]
  ): ChunkResult {
    // Reset output buffers
    this.execIndices.fill(-1);
    this.execScores.fill(-Infinity);

    switch (strategy) {
      case RetrievalStrategy.Bm25Fast: {
        this.pipeline.query(
          queryTermIds, queryIDF, queryFHRR, nq,
          this.execIndices, this.execScores,
          { expand: false, wBm25: 1, wSim: 0 }
        );
        break;
      }

      case RetrievalStrategy.SemanticFhrr: {
        this.pipeline.query(
          queryTermIds, queryIDF, queryFHRR, nq,
          this.execIndices, this.execScores,
          { expand: false, wBm25: 0.2, wSim: 0.8 }
        );
        break;
      }

      case RetrievalStrategy.GraphDiffuse: {
        this.pipeline.query(
          queryTermIds, queryIDF, queryFHRR, nq,
          this.execIndices, this.execScores,
          { expand: true, expandSteps: 3, wBm25: 0.7, wSim: 0.3 }
        );
        break;
      }

      case RetrievalStrategy.Holographic: {
        this._executeHolographic(queryFHRR);
        break;
      }

      case RetrievalStrategy.SelfCorrect: {
        this._executeSelfCorrect(queryTermIds, queryIDF, queryFHRR, nq);
        break;
      }

      case RetrievalStrategy.HybridFull:
      default: {
        this.pipeline.query(
          queryTermIds, queryIDF, queryFHRR, nq,
          this.execIndices, this.execScores,
          { expand: true, wBm25: 0.6, wSim: 0.4 }
        );
      }
    }

    // Count valid results
    let count = 0;
    for (let i = 0; i < this.maxChunks; i++) {
      if (this.execScores[i] <= -1e9) break;
      count++;
    }

    return {
      indices: this.execIndices,
      scores: this.execScores,
      count
    };
  }

  private _executeHolographic(queryFHRR: Float32Array): void {
    this.hologram.reconstruct(queryFHRR, this.reconScratch);

    if (!this.hologram.docVectors) return;

    this.pipeline.scoreHolographicCandidates(
      this.reconScratch,
      this.hologram.docVectors,
      this.hologram.docWeights,
      this.hologram.totalWeight,
      this.hologram.numDocs,
      this.maxChunks,
      this.execIndices,
      this.execScores
    );
  }

  private _executeSelfCorrect(
    queryTermIds: Int32Array,
    queryIDF: Float32Array,
    queryFHRR: Float32Array,
    nq: number
  ): void {
    this.hologram.expansionGradient(queryFHRR, this.gradBuf);

    for (let i = 0; i < this.dim; i++) {
      this.queryExpanded[i] = queryFHRR[i] + this.gradBuf[i] * 0.3;
    }

    this.pipeline.query(
      queryTermIds, queryIDF, this.queryExpanded, nq,
      this.execIndices, this.execScores,
      { expand: true, wBm25: 0.5, wSim: 0.5 }
    );
  }

  // ==========================================================================
  // STEP 3: VERIFY — Cek chunks consistent dengan world memory
  // ==========================================================================

  verify(
    result: ChunkResult,
    _queryFHRR: Float32Array
  ): { validResult: ChunkResult; coherence: number; anomalyCount: number } {
    let totalCoherence = 0;
    let validCount = 0;
    let anomalyCount = 0;

    const validIndices = new Int32Array(this.maxChunks);
    const validScores = new Float32Array(this.maxChunks);
    validIndices.fill(-1);
    validScores.fill(-Infinity);

    // Determine if another world branch is active so we isolate branch-exclusive docs
    let activeWorldCount = 0;
    for (let w = 0; w < this.multiWorld.maxWorlds; w++) {
      if (this.multiWorld.active[w]) activeWorldCount++;
    }

    for (let i = 0; i < result.count; i++) {
      const idx = result.indices[i];
      const score = result.scores[i];
      if (idx < 0) continue;

      // Multi-world slot isolation: if multiple worlds are active or a doc belongs exclusively
      // to a different timeline branch (weight === 0 in active hologram, > 0 in another world),
      // filter it out so unmerged branches never leak into the active timeline.
      if (this.hologram.totalWeight > 1e-10 && this.hologram.docWeights[idx] <= 1e-10) {
        let existsInOtherWorld = false;
        if (activeWorldCount > 1) {
          for (let w = 0; w < this.multiWorld.maxWorlds; w++) {
            if (this.multiWorld.active[w] && this.multiWorld.worlds[w] !== this.hologram) {
              if ((this.multiWorld.worlds[w]?.docWeights[idx] ?? 0) > 1e-10) {
                existsInOtherWorld = true;
                break;
              }
            }
          }
        }
        if (existsInOtherWorld) {
          this.anomalyIndices[anomalyCount] = idx;
          this.anomalyScores[anomalyCount] = score;
          anomalyCount++;
          continue;
        }
      }

      this._getChunkVector(idx, this.chunkVecScratch);

      let chunkCoherence = 0.5;
      let normalizedCoh = 1.0;

      if (this.hologram.totalWeight >= 1e-10) {
        chunkCoherence = this.hologram.reconstruct(this.chunkVecScratch, this.reconScratch);
        const expectedCoh = 1 / Math.sqrt(Math.max(1, this.hologram.totalWeight));
        normalizedCoh = Math.max(0, chunkCoherence / Math.max(0.001, expectedCoh));
      }

      const crossCheck = this.multiWorld.validateCrossWorld(this.chunkVecScratch);

      // Relax threshold to avoid filtering valid retrieved knowledge
      if (normalizedCoh >= 0.05 || crossCheck.action !== 'retcon' || result.count <= 2) {
        validIndices[validCount] = idx;
        validScores[validCount] = score;
        totalCoherence += normalizedCoh;
        validCount++;
      } else {
        this.anomalyIndices[anomalyCount] = idx;
        this.anomalyScores[anomalyCount] = score;
        anomalyCount++;
      }
    }

    // Fallback: If all candidates were marked as anomalies, retain top candidates
    // that are not strictly isolated to another parallel branch.
    if (validCount === 0 && result.count > 0) {
      for (let i = 0; i < result.count && validCount < 4; i++) {
        const idx = result.indices[i];
        if (idx < 0) continue;
        if (activeWorldCount > 1 && this.hologram.totalWeight > 1e-10 && this.hologram.docWeights[idx] <= 1e-10) {
          let inOther = false;
          for (let w = 0; w < this.multiWorld.maxWorlds; w++) {
            if (this.multiWorld.active[w] && this.multiWorld.worlds[w] !== this.hologram && (this.multiWorld.worlds[w]?.docWeights[idx] ?? 0) > 1e-10) {
              inOther = true;
              break;
            }
          }
          if (inOther) continue;
        }
        validIndices[validCount] = idx;
        validScores[validCount] = result.scores[i];
        validCount++;
      }
      totalCoherence = 0.4 * validCount;
    }

    // Write back into execIndices & execScores for zero-allocation stability
    this.execIndices.set(validIndices);
    this.execScores.set(validScores);

    const avgCoherence = validCount > 0 ? totalCoherence / validCount : 0.5;

    return {
      validResult: {
        indices: this.execIndices,
        scores: this.execScores,
        count: validCount
      },
      coherence: avgCoherence,
      anomalyCount
    };
  }

  // ==========================================================================
  // STEP 4: DECIDE — Apa yang dilakukan dengan hasil
  // ==========================================================================

  decide(
    strategy: RetrievalStrategy,
    result: ChunkResult,
    coherence: number, // In normalized scale! (expected ~ 1.0)
    queryEntropy: number,
    requeryCount: number
  ): ChunkDecision {
    const expectedCoherence = 1.0;
    const highBound = 0.85;
    const lowBound = 0.25;

    if (coherence > highBound && result.count >= 3) {
      this.totalKernelAnswers++;
      return {
        strategy,
        result,
        confidence: Math.min(1.0, coherence),
        action: 'kernel_answer',
        reasoning: `High coherence (${coherence.toFixed(2)} vs expected ${expectedCoherence.toFixed(2)}), ${result.count} chunks. Kernel can answer directly.`,
        anomalyCount: 0
      };
    }

    // Only return 'requery' if there are remaining retry attempts
    if (coherence < lowBound && requeryCount < this.requeryLimit - 1) {
      this.hologram.expansionGradient(this.queryExpanded, this.gradBuf);
      const expansionTerms = this._gradientToTerms(this.gradBuf);

      return {
        strategy: RetrievalStrategy.SelfCorrect,
        result,
        confidence: Math.max(0.1, coherence),
        action: 'requery',
        reasoning: `Low coherence (${coherence.toFixed(2)} vs expected ${expectedCoherence.toFixed(2)}), attempting query expansion (attempt ${requeryCount + 1}/${this.requeryLimit}).`,
        expansionTerms,
        anomalyCount: 0
      };
    }

    if (queryEntropy > 0.7 || result.count < 2 || coherence < lowBound) {
      this.totalEscalations++;
      return {
        strategy,
        result,
        confidence: Math.max(0.3, Math.min(1.0, coherence)),
        action: 'escalate_llm',
        reasoning: `Query entropy (${queryEntropy.toFixed(2)}) / coherence (${coherence.toFixed(2)}). Escalating to LLM with ${result.count} candidate chunks.`,
        anomalyCount: 0
      };
    }

    return {
      strategy,
      result,
      confidence: Math.min(1.0, coherence),
      action: 'return',
      reasoning: `Moderate coherence (${coherence.toFixed(2)}), returning ${result.count} retrieved chunks.`,
      anomalyCount: 0
    };
  }

  // ==========================================================================
  // STEP 5: LEARN — Update dari outcome
  // ==========================================================================

  learn(outcome: OrchestratorOutcome, personalityInput?: NpcPersonalityProfile | string): void {
    const { decision, userSatisfied, llmAccepted } = outcome;
    const strategyIdx = decision.strategy;

    // === P1 FIX: RETRIEVE SNAPSHOT (with graceful fallback for stubs/cross-boundary calls) ===
    let oldValue = 0;
    let archIdx = 3;

    const decisionId = (decision as any).decisionId as number | undefined;
    if (decisionId !== undefined) {
      const slot = decisionId & 255;
      if (this.decisionIdRing[slot] === decisionId) {
        // Restore state dari ring ke scratch buffer
        const sOff = slot * this.stateDim;
        for (let i = 0; i < this.stateDim; i++) {
          this.stateBuf[i] = this.stateRing[sOff + i]!;
        }
        const bOff = slot * this.stateWords;
        for (let i = 0; i < this.stateWords; i++) {
          this.stateBinaryBuf[i] = this.stateBinaryRing[bOff + i]!;
        }
        oldValue = this.valueRing[slot]!;
        archIdx = this.archetypeRing[slot] ?? 3;
      } else {
        // Snapshot overwritten in circular buffer; estimate with current state
        oldValue = this.rlPolicy.estimateValue(this.stateBuf);
      }
    } else {
      // Decision was created without an explicit snapshot ID (e.g. stub or worker message)
      oldValue = this.rlPolicy.estimateValue(this.stateBuf);
      this.rlPolicy.packState(this.stateBuf, this.stateBinaryBuf, 0);
    }

    const success = userSatisfied || 
      (decision.action === 'kernel_answer' && llmAccepted) ||
      (decision.action === 'return' && llmAccepted);

    let baseReward = 0;
    if (userSatisfied) baseReward += 1;
    if (llmAccepted) baseReward += 0.5;
    if (decision.action === 'escalate_llm' && !llmAccepted) baseReward -= 0.3;
    if (decision.action === 'kernel_answer' && !llmAccepted) baseReward -= 0.5;

    // Hierarchical personality-conditioned reward shaping
    const resolvedPersonality = this.rlPolicy?.resolvePersonality
      ? this.rlPolicy.resolvePersonality(
          personalityInput || decision.npcId || decision.npcArchetype
        )
      : null;
    const reward = this.rlPolicy?.shapeReward
      ? this.rlPolicy.shapeReward(
          baseReward,
          {
            coherence: decision.confidence,
            anomalyCount: decision.anomalyCount ?? 0,
            strategy: strategyIdx,
            latencyMs: outcome.latencyMs,
          },
          resolvedPersonality ?? undefined
        )
      : baseReward;

    // Single-step episodic: terminal state value = 0
    const nextValue = 0;

    const alpha = 0.1;
     
    this.successHistory[strategyIdx] = 
      (1 - alpha) * this.successHistory[strategyIdx]! + alpha * (success ? 1 : 0);

    this.rlPolicy.storeExperience(
      this.stateBinaryBuf, 
      strategyIdx, 
      reward, 
      oldValue, 
      nextValue,
      archIdx
    );

    this.rlPolicy.learn(1);

    this._trackStrategy(strategyIdx);
  }

  // ==========================================================================
  // MAIN ENTRY: Full Agentic Flow (CLOSED LOOP)
  // ==========================================================================

  orchestrate(
    queryTerms: string[],
    queryTermIds: Int32Array | Float32Array,
    queryIDF: Float32Array,
    queryFHRR?: Float32Array | number,
    nq?: number,
    personalityInput?: NpcPersonalityProfile | string
  ): ChunkDecision {
    this.totalQueries++;

    let actualTermIds: Int32Array;
    let actualIDF: Float32Array;
    let actualFHRR: Float32Array;
    let actualNq: number;
    let actualPersonality = personalityInput;

    if (queryTermIds instanceof Float32Array && queryIDF instanceof Float32Array) {
      // Caller called 4-arg or shifted form: orchestrate(terms, idf, fhrr, nq, personality)
      actualTermIds = new Int32Array(queryTerms.map((_, i) => i));
      actualIDF = queryTermIds;
      actualFHRR = queryIDF;
      actualNq = typeof queryFHRR === 'number' ? queryFHRR : queryTerms.length;
      if (typeof nq === 'string' || (typeof nq === 'object' && nq !== null)) {
        actualPersonality = nq as any;
      }
    } else {
      actualTermIds = (queryTermIds as Int32Array) ?? new Int32Array(queryTerms.map((_, i) => i));
      actualIDF = queryIDF;
      actualFHRR = (queryFHRR instanceof Float32Array) ? queryFHRR : new Float32Array(this.dim);
      actualNq = typeof nq === 'number' ? nq : queryTerms.length;
    }

    // Resolve personality from parameter or automatic query term detection
    let personality = this.rlPolicy?.resolvePersonality
      ? this.rlPolicy.resolvePersonality(actualPersonality)
      : null;
    if (!personality && this.rlPolicy?.getNpc) {
      for (const term of queryTerms) {
        const found = this.rlPolicy.getNpc(term);
        if (found) {
          personality = found;
          break;
        }
      }
    }

    if (actualFHRR && actualFHRR.length > 0) {
      this.queryExpanded.set(actualFHRR.subarray(0, Math.min(this.dim, actualFHRR.length)));
    }

    let decision: ChunkDecision;
    let requeryCount = 0;
    let finalAnomalyCount = 0;
    let currentDecisionId = 0;

    do {
      const strategy = this.inspect(
        queryTerms,
        actualFHRR,
        personality ?? undefined,
        actualTermIds,
        actualIDF,
        requeryCount
      );

      // === P1 FIX: SNAPSHOT STATE ===
      const decisionId = this.nextDecisionId++;
      const slot = decisionId & 255;
      const sOff = slot * this.stateDim;
      for (let i = 0; i < this.stateDim; i++) {
         
        this.stateRing[sOff + i] = this.stateBuf[i]!;
      }
      const bOff = slot * this.stateWords;
      for (let i = 0; i < this.stateWords; i++) {
         
        this.stateBinaryRing[bOff + i] = this.stateBinaryBuf[i]!;
      }
      this.actionRing[slot] = strategy;
      this.valueRing[slot] = personality 
        ? this.rlPolicy.estimateAgentValue(this.stateBuf, personality)
        : this.rlPolicy.estimateValue(this.stateBuf);
      this.archetypeRing[slot] = personality ? this.rlPolicy.getArchetypeIndex(personality.archetype) : 3;
      this.decisionIdRing[slot] = decisionId;
      currentDecisionId = decisionId;

      const activeQuery = requeryCount > 0 ? this.queryExpanded : actualFHRR;
      const result = this.execute(strategy, actualTermIds, actualIDF, activeQuery, actualNq, queryTerms);

      const { validResult, coherence, anomalyCount } = this.verify(result, activeQuery);
      finalAnomalyCount += anomalyCount;

      const queryEntropy = this._computeTermEntropy(queryTerms);
      decision = this.decide(strategy, validResult, coherence, queryEntropy, requeryCount);

      if (decision.action === 'requery') {
        this._applyExpansion();
        requeryCount++;
        this.totalRequeries++;
      }

    } while (decision.action === 'requery' && requeryCount < this.requeryLimit);

    // Guaranteed Terminal Invariant: orchestrate MUST NEVER return action === 'requery' to caller
    if (decision.action === 'requery') {
      decision.action = 'escalate_llm';
      decision.reasoning = `Requery limit reached (${this.requeryLimit}/${this.requeryLimit}). Escalating with candidate chunks.`;
    }

    decision.anomalyCount = finalAnomalyCount;
    decision.decisionId = currentDecisionId; // P1 FIX
    if (personality) {
      decision.npcId = personality.id;
      decision.npcArchetype = personality.archetype;
    }

    return decision;
  }

  explainDecision(
    queryTerms: string[],
    queryFHRR: Float32Array,
    personalityInput?: NpcPersonalityProfile | string,
    queryTermIds?: Int32Array,
    queryIDF?: Float32Array
  ): HierarchicalDecisionExplanation {
    const rawCoherence = this.hologram.reconstruct(queryFHRR, this.reconScratch);
    const expectedCoh = 1 / Math.sqrt(Math.max(1, this.hologram.totalWeight));
    const coherence = rawCoherence / Math.max(0.001, expectedCoh);
    const termEntropy = this._computeTermEntropy(queryTerms);
    const novelty = 1 - Math.abs(coherence);

    this._buildStrategyState(
      coherence,
      termEntropy,
      novelty,
      queryTerms.length,
      queryTerms,
      queryTermIds,
      queryIDF,
      0
    );
    return this.rlPolicy.explainAction(this.stateBuf, personalityInput);
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private _buildStrategyState(
    coherence: number,
    entropy: number,
    novelty: number,
    termCount: number,
    queryTerms?: string[],
    queryTermIds?: Int32Array,
    queryIDF?: Float32Array,
    requeryCount = 0
  ): void {
    const clamp = (v: number): number => Math.max(-1, Math.min(1, v));
    const state = this.stateBuf;
    const nTerms = Math.max(1, termCount);

    // 1. Core Telemetry Features (Centered in [-1, +1] around decision thresholds)
    const absCoh = Math.min(1, Math.abs(coherence));
    state[0] = clamp((absCoh - 0.45) * 2.2);          // + high holographic resonance, - weak resonance
    state[1] = clamp((entropy - 0.15) * 3.0);         // + repetitive terms, - diverse terms
    state[2] = clamp((novelty - 0.55) * 2.2);         // + novel/unseen topic, - familiar topic
    state[3] = clamp((termCount - 4.0) / 4.0);        // + long multi-term query, - short keyword lookup

    // 2. Centered Historical Strategy Success Rates (state[4..9])
    for (let i = 0; i < STRATEGY_COUNT && i + 4 < this.stateDim; i++) {
      const hist = this.successHistory[i] ?? 0.5;
      state[i + 4] = clamp((hist - 0.5) * 2.5);
    }

    // 3. Linguistic & System-to-System Routing Signals (state[10..15])
    let totalCharLen = 0;
    let uniqueTerms = nTerms;
    if (queryTerms && queryTerms.length > 0) {
      const uniq = new Set<string>();
      for (let i = 0; i < queryTerms.length; i++) {
        const t = queryTerms[i] || '';
        totalCharLen += t.length;
        uniq.add(t.toLowerCase());
      }
      uniqueTerms = Math.max(1, uniq.size);
    }
    const avgTokenLen = queryTerms && queryTerms.length > 0 ? totalCharLen / queryTerms.length : 5.0;

    let meanIDF = 0;
    let hasExplicitIDF = false;
    if (queryIDF && queryIDF.length > 0) {
      const lim = Math.min(nTerms, queryIDF.length);
      if (lim > 0) {
        let sumIdf = 0;
        for (let i = 0; i < lim; i++) sumIdf += queryIDF[i]!;
        meanIDF = sumIdf / lim;
        hasExplicitIDF = true;
      }
    }

    let oovCount = 0;
    if (queryTermIds && queryTermIds.length > 0) {
      const lim = Math.min(nTerms, queryTermIds.length);
      for (let i = 0; i < lim; i++) {
        if (queryTermIds[i]! < 0) oovCount++;
      }
    } else if (hasExplicitIDF) {
      const lim = Math.min(nTerms, queryIDF!.length);
      for (let i = 0; i < lim; i++) {
        if (queryIDF![i]! <= 0.25) oovCount++;
      }
    }
    const oovRatio = oovCount / nTerms;

    // Specificity signal: high IDF or rare/long proper-noun tokens with low OOV
    // Attenuated during requery recovery (requeryCount > 0) since initial lexical pass was insufficient
    const idfSignal = hasExplicitIDF
      ? (meanIDF - 1.35) / 1.35
      : (avgTokenLen - 5.5) / 3.5;
    const rawSpecificity = clamp(idfSignal * 0.7 + (0.5 - oovRatio) * 0.6 - state[3] * 0.3);
    const lexicalSpecificity = requeryCount > 0 ? rawSpecificity * 0.15 : rawSpecificity;

    // OOV / Synonym / Paraphrase signal: needs SemanticFHRR vector matching
    const oovOrSynonymSignal = clamp((oovRatio - 0.25) * 1.8 + state[2] * 0.5 - idfSignal * 0.3);

    // Relational multi-entity complexity: needs 3-hop GraphDiffuse expansion
    const relationalComplexity = clamp(((uniqueTerms - 4.5) / 3.5) * 0.8 + state[3] * 0.5 - state[1] * 0.3);

    // Holographic associative peak: strong memory field coherence
    const holographicResonancePeak = clamp((absCoh - 0.60) * 2.8 - state[2] * 0.4);

    // Balanced hybrid signal: moderate length (3..6 words) with both lexical & semantic cues
    const lengthBalance = 1 - Math.min(1, Math.abs(termCount - 4.5) / 3.5);
    const balancedHybridSignal = clamp((lengthBalance - 0.45) * 1.8 + (0.5 - Math.abs(absCoh - 0.5)) * 0.8);

    // Requery / Anomaly self-correction signal
    const requeryAnomalyRecovery = requeryCount > 0
      ? clamp(0.65 + 0.35 * requeryCount)
      : clamp((0.20 - absCoh) * 1.5 - 0.35);

    if (this.stateDim >= 32) {
      state[10] = lexicalSpecificity;
      state[11] = oovOrSynonymSignal;
      state[12] = relationalComplexity;
      state[13] = holographicResonancePeak;
      state[14] = balancedHybridSignal;
      state[15] = requeryAnomalyRecovery;

      // 4. Differential Mirror Channels (state[16..21] = -state[10..15])
      // Guarantees zero-sum symmetry and prevents 1-bit sign quantization collapse in packState()
      state[16] = -state[10];
      state[17] = -state[11];
      state[18] = -state[12];
      state[19] = -state[13];
      state[20] = -state[14];
      state[21] = -state[15];

      // 5. Cross-Feature Interaction Channels & Mirrors (state[22..31])
      state[22] = clamp(state[0] * state[10]);        // Coherence x Specificity
      state[23] = -state[22];
      state[24] = clamp(state[2] * state[11]);        // Novelty x OOV/Synonym
      state[25] = -state[24];
      state[26] = clamp(state[3] * state[12]);        // Length x Relational Complexity
      state[27] = -state[26];
      state[28] = clamp((state[0] - state[2]) * 0.7); // Coherence vs Novelty Margin
      state[29] = -state[28];
      state[30] = clamp((state[10] - state[3]) * 0.7);// Specificity vs Length Margin
      state[31] = -state[30];
    } else {
      for (let i = STRATEGY_COUNT + 4; i < this.stateDim; i++) {
        state[i] = 0;
      }
    }
  }

  private _computeTermEntropy(terms: string[]): number {
    if (terms.length <= 1) return 0;
    const unique = new Set(terms).size;
    return 1 - (unique / terms.length);
  }

  private _trackStrategy(strategyIdx: number): void {
    this.strategyHistory[this.strategyHead] = strategyIdx;
    this.strategyHead = (this.strategyHead + 1) & 63;
  }

  private _applyExpansion(): void {
    this.hologram.expansionGradient(this.queryExpanded, this.gradBuf);
    for (let i = 0; i < this.dim; i++) {
      this.queryExpanded[i] += this.gradBuf[i] * 0.3;
    }
    let norm = 0;
    for (let i = 0; i < this.dim; i++) {
      norm += this.queryExpanded[i] * this.queryExpanded[i];
    }
    const invNorm = norm > 1e-10 ? 1 / Math.sqrt(norm) : 0;
    for (let i = 0; i < this.dim; i++) {
      this.queryExpanded[i] *= invNorm;
    }
  }

  private _gradientToTerms(grad: Float32Array): string[] {
    let maxVal = 0;
    for (let i = 0; i < Math.min(grad.length, 10); i++) {
      if (Math.abs(grad[i]) > maxVal) {
        maxVal = Math.abs(grad[i]);
      }
    }
    return maxVal > 0.1 ? ['expanded_concept_1', 'expanded_concept_2'] : [];
  }

  private _getChunkVector(index: number, out: Float32Array): void {
    if (this.hologram.docVectors) {
      const off = index * this.dim;
      for (let i = 0; i < this.dim; i++) {
        out[i] = this.hologram.docVectors[off + i];
      }
    } else {
      out.fill(0);
    }
  }

  // ==========================================================================
  // STATS & DEBUG
  // ==========================================================================

  getStats(): {
    totalQueries: number;
    totalRequeries: number;
    totalEscalations: number;
    totalKernelAnswers: number;
    requeryRate: number;
    escalationRate: number;
    strategyDistribution: Float32Array;
  } {
    return {
      totalQueries: this.totalQueries,
      totalRequeries: this.totalRequeries,
      totalEscalations: this.totalEscalations,
      totalKernelAnswers: this.totalKernelAnswers,
      requeryRate: this.totalQueries > 0 ? this.totalRequeries / this.totalQueries : 0,
      escalationRate: this.totalQueries > 0 ? this.totalEscalations / this.totalQueries : 0,
      strategyDistribution: new Float32Array(this.successHistory)
    };
  }
}
