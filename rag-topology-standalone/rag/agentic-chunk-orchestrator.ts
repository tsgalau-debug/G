/* eslint-disable */
import { HolographicMemoryField } from './holographic-memory';
import { MultiWorldHologram } from './multi-world';
import { RetrievalPipeline, topkInsert, topkReset } from './hybrid-pipeline';
import {
  VSARLPolicyKernel,
  AgentPersonalityProfile,
  AgentArchetype,
} from './vsarl-policy-kernel';

export enum RetrievalStrategy {
  FAST_BM25 = 0,
  DEEP_EXPAND = 1,
  HOLOGRAPHIC_RECON = 2,
  MULTI_WORLD_SUPER = 3,
  ANOMALY_HUNT = 4,
  CONSERVATIVE = 5,
}

export interface ChunkResult {
  indices: Int32Array;
  scores: Float32Array;
  count: number;
}

export interface ChunkDecision {
  decisionId: number;
  strategy: RetrievalStrategy;
  action:
    | 'direct_answer'
    | 'augment_llm'
    | 'requery_expand'
    | 'escalate_full_llm'
    | 'empty_abstain';
  result: ChunkResult;
  confidence: number;
  reasoning: string;
  anomalyCount: number;
  npcId?: string | undefined;
  npcArchetype?: AgentArchetype | undefined;
}

export interface FeedbackOutcome {
  decision: ChunkDecision;
  userSatisfied: boolean;
  llmAccepted: boolean;
  latencyMs: number;
}

export class AgenticChunkOrchestrator {
  readonly pipeline: RetrievalPipeline;
  hologram: HolographicMemoryField;
  readonly multiWorld: MultiWorldHologram;
  readonly rlPolicy: VSARLPolicyKernel;

  readonly dim: number;
  readonly maxDocs: number;
  readonly maxChunks: number;
  readonly maxQueryTerms: number;

  readonly outIndices: Int32Array;
  readonly outScores: Float32Array;
  readonly filteredIndices: Int32Array;
  readonly filteredScores: Float32Array;
  readonly reconVec: Float32Array;
  readonly successHistory: Float32Array;
  successCursor = 0;

  totalQueries = 0;
  totalRequeries = 0;
  totalEscalations = 0;
  totalKernelAnswers = 0;
  private nextDecisionId = 1;

  constructor(
    pipeline: RetrievalPipeline,
    hologram: HolographicMemoryField,
    multiWorld: MultiWorldHologram,
    rlPolicy: VSARLPolicyKernel,
    dim = 768,
    maxDocs = 4096,
    maxChunks = 16,
    maxQueryTerms = 32
  ) {
    this.pipeline = pipeline;
    this.hologram = hologram;
    this.multiWorld = multiWorld;
    this.rlPolicy = rlPolicy;
    this.dim = dim;
    this.maxDocs = maxDocs;
    this.maxChunks = maxChunks;
    this.maxQueryTerms = maxQueryTerms;

    this.outIndices = new Int32Array(maxChunks);
    this.outScores = new Float32Array(maxChunks);
    this.filteredIndices = new Int32Array(maxChunks);
    this.filteredScores = new Float32Array(maxChunks);
    this.reconVec = new Float32Array(dim);
    this.successHistory = new Float32Array(64);
    this.successHistory.fill(0.75);
  }

  setActiveHologram(hologram: HolographicMemoryField): void {
    this.hologram = hologram;
  }

  private _getRecentSuccessRate(): number {
    let sum = 0;
    for (let i = 0; i < this.successHistory.length; i++) {
      sum += this.successHistory[i]!;
    }
    return sum / this.successHistory.length;
  }

  orchestrate(
    rawTerms: string[],
    qTerms: Int32Array,
    qIDF: Float32Array,
    queryVector: Float32Array,
    nq: number,
    npcOrPersonality?: string | Partial<AgentPersonalityProfile> | any
  ): ChunkDecision {
    this.totalQueries++;
    const decisionId = this.nextDecisionId++;
    const npc = this.rlPolicy.resolvePersonality(npcOrPersonality);

    const preCoh = this.hologram.reconstruct(queryVector, this.reconVec);
    const rollingEntropy = this.hologram.getRollingEntropy();
    const activeWorlds = this.multiWorld.getWorldStats().length;

    const stateVec = this.rlPolicy.encodeState(
      preCoh,
      rollingEntropy,
      0.5,
      Math.min(1, nq / this.maxQueryTerms),
      Math.min(1, activeWorlds / this.multiWorld.maxWorlds),
      0,
      this._getRecentSuccessRate(),
      preCoh,
      npc
    );

    const rlChoice = this.rlPolicy.selectAction(stateVec, true, npc);
    let strategy: RetrievalStrategy = rlChoice.strategy as RetrievalStrategy;

    if (activeWorlds > 1 && strategy === RetrievalStrategy.HOLOGRAPHIC_RECON && npc?.curiosity && npc.curiosity > 0.7) {
      strategy = RetrievalStrategy.MULTI_WORLD_SUPER;
    }

    this._executeStrategy(strategy, qTerms, qIDF, queryVector, nq);

    let rawCount = 0;
    for (let i = 0; i < this.maxChunks; i++) {
      if (this.outScores[i] === -Infinity || this.outIndices[i]! < 0) break;
      rawCount++;
    }

    if (rawCount === 0 && nq > 0) {
      this.totalRequeries++;
      this._executeStrategy(RetrievalStrategy.DEEP_EXPAND, qTerms, qIDF, queryVector, nq);
      for (let i = 0; i < this.maxChunks; i++) {
        if (this.outScores[i] === -Infinity || this.outIndices[i]! < 0) break;
        rawCount++;
      }
    }

    let validCount = 0;
    let anomalyCount = 0;
    const docVectors = this.hologram.docVectors;

    for (let i = 0; i < rawCount; i++) {
      const docId = this.outIndices[i]!;
      const score = this.outScores[i]!;

      if (this.hologram.totalWeight > 1e-10 && this.hologram.docWeights[docId]! <= 1e-10) {
        continue;
      }

      if (docVectors && strategy !== RetrievalStrategy.ANOMALY_HUNT) {
        const dOff = docId * this.dim;
        const docSlice = docVectors.subarray(dOff, dOff + this.dim);
        const check = this.hologram.checkAnomaly(docSlice);
        if (check.isAnomaly && check.severity === 'critical') {
          anomalyCount++;
          continue;
        }
      }

      this.filteredIndices[validCount] = docId;
      this.filteredScores[validCount] = score;
      validCount++;
    }

    const uncertainty = this.hologram.measureUncertainty(
      this.filteredScores.subarray(0, validCount),
      validCount
    );

    const actions: ChunkDecision['action'][] = [
      'direct_answer',
      'augment_llm',
      'requery_expand',
      'escalate_full_llm',
    ];
    let action: ChunkDecision['action'] = actions[rlChoice.action] ?? 'augment_llm';

    if (validCount === 0) {
      action = 'empty_abstain';
      this.totalEscalations++;
    } else if (action === 'direct_answer') {
      this.totalKernelAnswers++;
    } else if (action === 'escalate_full_llm') {
      this.totalEscalations++;
    } else if (action === 'requery_expand') {
      this.totalRequeries++;
    }

    const confidence =
      validCount === 0
        ? 0
        : Math.max(
            0.1,
            Math.min(0.99, uncertainty.coherence * 0.6 + rlChoice.confidence * 0.4)
          );

    const npcDesc = npc
      ? `Agent=${npc.name}(${npc.archetype})`
      : 'Agent=default';
    const reasoning =
      validCount === 0
        ? `[${npcDesc}] Index empty or no matching chunks found (0 chunks). Abstaining from retrieval context.`
        : `[${npcDesc}] Strategy=${RetrievalStrategy[strategy]} selected (RL conf=${rlChoice.confidence.toFixed(2)}, coherence=${uncertainty.coherence.toFixed(2)}, entropy=${uncertainty.entropy.toFixed(2)}, chunks=${validCount}).`;

    return {
      decisionId,
      strategy,
      action,
      result: {
        indices: this.filteredIndices.slice(0, validCount),
        scores: this.filteredScores.slice(0, validCount),
        count: validCount,
      },
      confidence,
      reasoning,
      anomalyCount,
      npcId: npc?.id,
      npcArchetype: npc?.archetype,
    };
  }

  private _executeStrategy(
    strategy: RetrievalStrategy,
    qTerms: Int32Array,
    qIDF: Float32Array,
    queryVector: Float32Array,
    nq: number
  ): void {
    this.outIndices.fill(-1);
    this.outScores.fill(-Infinity);

    switch (strategy) {
      case RetrievalStrategy.FAST_BM25: {
        this.pipeline.query(
          qTerms,
          qIDF,
          queryVector,
          nq,
          this.outIndices,
          this.outScores,
          { expand: false, wBm25: 0.75, wSim: 0.25 }
        );
        break;
      }
      case RetrievalStrategy.DEEP_EXPAND: {
        this.pipeline.query(
          qTerms,
          qIDF,
          queryVector,
          nq,
          this.outIndices,
          this.outScores,
          { expand: true, expandSteps: 3, expandAlpha: 0.25, wBm25: 0.5, wSim: 0.5 }
        );
        break;
      }
      case RetrievalStrategy.HOLOGRAPHIC_RECON: {
        this.hologram.reconstruct(queryVector, this.reconVec);
        for (let i = 0; i < this.dim; i++) {
          this.reconVec[i] = 0.55 * queryVector[i]! + 0.45 * this.reconVec[i]!;
        }
        this.pipeline.query(
          qTerms,
          qIDF,
          this.reconVec,
          nq,
          this.outIndices,
          this.outScores,
          { expand: true, expandSteps: 2, wBm25: 0.4, wSim: 0.6 }
        );
        if (this.outScores[0] === -Infinity && this.hologram.docVectors) {
          this.pipeline.scoreHolographicCandidates(
            this.reconVec,
            this.hologram.docVectors,
            this.hologram.docWeights,
            this.hologram.totalWeight,
            this.hologram.numDocs,
            this.maxChunks,
            this.outIndices,
            this.outScores
          );
        }
        break;
      }
      case RetrievalStrategy.MULTI_WORLD_SUPER: {
        this.multiWorld.reconstructSuperposed(queryVector, this.reconVec);
        for (let i = 0; i < this.dim; i++) {
          this.reconVec[i] = 0.5 * queryVector[i]! + 0.5 * this.reconVec[i]!;
        }
        this.pipeline.query(
          qTerms,
          qIDF,
          this.reconVec,
          nq,
          this.outIndices,
          this.outScores,
          { expand: true, expandSteps: 2, wBm25: 0.45, wSim: 0.55 }
        );
        break;
      }
      case RetrievalStrategy.ANOMALY_HUNT: {
        this.hologram.expansionGradient(queryVector, this.reconVec);
        this.pipeline.query(
          qTerms,
          qIDF,
          this.reconVec,
          nq,
          this.outIndices,
          this.outScores,
          { expand: true, expandSteps: 3, wBm25: 0.35, wSim: 0.65 }
        );
        break;
      }
      case RetrievalStrategy.CONSERVATIVE:
      default: {
        this.pipeline.query(
          qTerms,
          qIDF,
          queryVector,
          nq,
          this.outIndices,
          this.outScores,
          { expand: false, wBm25: 0.65, wSim: 0.35 }
        );
        break;
      }
    }
  }

  learn(
    outcome: FeedbackOutcome,
    npcOrPersonality?: string | Partial<AgentPersonalityProfile> | any
  ): void {
    const npc =
      this.rlPolicy.resolvePersonality(npcOrPersonality) ||
      this.rlPolicy.getNpc(outcome.decision.npcId);

    const actionIdxMap: Record<ChunkDecision['action'], number> = {
      direct_answer: 0,
      augment_llm: 1,
      requery_expand: 2,
      escalate_full_llm: 3,
      empty_abstain: 3,
    };

    const actionIdx = actionIdxMap[outcome.decision.action] ?? 1;

    let reward = 0;
    if (outcome.userSatisfied) reward += 0.6;
    if (outcome.llmAccepted) reward += 0.4;
    if (!outcome.userSatisfied && !outcome.llmAccepted) reward -= 0.4;

    const latencyPenalty = Math.min(0.25, outcome.latencyMs / 2000);
    reward -= latencyPenalty;

    this.successHistory[this.successCursor % this.successHistory.length] =
      outcome.userSatisfied || outcome.llmAccepted ? 1 : 0;
    this.successCursor++;

    this.rlPolicy.update(
      this.rlPolicy.stateVec,
      outcome.decision.strategy,
      actionIdx,
      reward,
      npc
    );
  }

  explainDecision(
    rawTerms: string[],
    queryVector: Float32Array,
    npcOrPersonality?: string | Partial<AgentPersonalityProfile> | any,
    qTerms?: Int32Array,
    qIDF?: Float32Array
  ): string {
    const npc = this.rlPolicy.resolvePersonality(npcOrPersonality);
    const preCoh = this.hologram.reconstruct(queryVector, this.reconVec);
    const rollingEnt = this.hologram.getRollingEntropy();

    const stateVec = this.rlPolicy.encodeState(
      preCoh,
      rollingEnt,
      0.5,
      Math.min(1, rawTerms.length / this.maxQueryTerms),
      Math.min(1, this.multiWorld.getWorldStats().length / this.multiWorld.maxWorlds),
      0,
      this._getRecentSuccessRate(),
      preCoh,
      npc
    );

    const sel = this.rlPolicy.selectAction(stateVec, false, npc);
    let report = `=== VSA-RL DECISION EXPLANATION ===\n`;
    if (npc) {
      report += `Agent Profile: ${npc.name} [Archetype: ${npc.archetype.toUpperCase()}]\n`;
      report += `Traits: curiosity=${npc.curiosity.toFixed(2)}, caution=${npc.caution.toFixed(2)}, urgency=${npc.urgency.toFixed(2)}, mysticism=${npc.mysticism.toFixed(2)}\n`;
    } else {
      report += `Agent Profile: Default (Neutral)\n`;
    }
    report += `Holographic Pre-Coherence: ${preCoh.toFixed(3)} | Rolling Entropy: ${rollingEnt.toFixed(3)}\n`;
    report += `Selected Strategy: ${RetrievalStrategy[sel.strategy]} (Confidence: ${sel.confidence.toFixed(3)})\n`;
    report += `Strategy Probabilities:\n`;
    for (let s = 0; s < this.rlPolicy.numStrategies; s++) {
      report += `  - ${RetrievalStrategy[s]}: ${(this.rlPolicy.probsBuf[s]! * 100).toFixed(1)}%\n`;
    }
    return report;
  }

  getStats() {
    return {
      totalQueries: this.totalQueries,
      totalRequeries: this.totalRequeries,
      totalEscalations: this.totalEscalations,
      totalKernelAnswers: this.totalKernelAnswers,
      recentSuccessRate: this._getRecentSuccessRate(),
      rlStats: this.rlPolicy.getStats(),
    };
  }
}
