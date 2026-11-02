/* eslint-disable import/no-cycle */
import type { HolographicMemoryField } from './holographic-memory';

export interface RetrievalDecision {
  chunks: { index: number; score: number; text?: string }[];
  confidence: number;
  useLLM: boolean;
  reason: string;
  expansionVector?: Float32Array;
}

export type EpistemicKernelResult = RetrievalDecision;

export class EpistemicRetrievalKernel {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly pipeline: any;
  hologram: HolographicMemoryField;
  readonly dim: number;

  readonly outIndices: Int32Array;
  readonly outScores: Float32Array;
  readonly qTerms: Int32Array;
  readonly qIDF: Float32Array;
  readonly qFHRR: Float32Array;

  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pipeline: any,
    hologram: HolographicMemoryField,
    dim: number,
    kFinal = 10,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.pipeline = pipeline;
    this.hologram = hologram;
    this.dim = dim;
    this.outIndices = new Int32Array(kFinal);
    this.outScores = new Float32Array(kFinal);
    this.qTerms = new Int32Array(64);
    this.qIDF = new Float32Array(64);
    this.qFHRR = new Float32Array(dim);
  }

  setActiveHologram(hologram: HolographicMemoryField): void {
    this.hologram = hologram;
  }

  retrieve(
    qTerms: Int32Array,
    qIDF: Float32Array,
    queryFHRR: Float32Array,
    nq = 32,
  ): RetrievalDecision {
    nq = Math.min(nq, qTerms.length, qIDF.length);
    for (let i = 0; i < nq; i++) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.qTerms[i] = qTerms[i]!;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.qIDF[i] = qIDF[i]!;
    }
    this.qFHRR.set(queryFHRR);

    const preCoherence = this.hologram.reconstruct(
      queryFHRR,
      this.hologram.tempVec,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    this.pipeline.query(
      this.qTerms.subarray(0, nq),
      this.qIDF.subarray(0, nq),
      this.qFHRR,
      nq,
      this.outIndices,
      this.outScores,
      { expand: preCoherence < 0.4, wBm25: 0.6, wSim: 0.4 },
    );

    let validCount = 0;
    while (validCount < this.outIndices.length && this.outScores[validCount] !== -Infinity) {
      validCount++;
    }

    const uncertainty = this.hologram.measureUncertainty(
      this.outScores.subarray(0, validCount),
      validCount,
    );

    const chunks: RetrievalDecision["chunks"] = [];
    for (let i = 0; i < this.outIndices.length; i++) {
      if (this.outScores[i] === -Infinity) break;
      chunks.push({ index: this.outIndices[i], score: this.outScores[i] });
    }

    let decision: RetrievalDecision;

    if (uncertainty.confident && preCoherence > 0.3) {
      decision = {
        chunks,
        confidence: uncertainty.coherence,
        useLLM: false,
        reason: `High coherence (${uncertainty.coherence.toFixed(2)}), low entropy (${uncertainty.entropy.toFixed(2)}). Kernel retrieval sufficient.`,
      };
    } else if (uncertainty.confident && preCoherence <= 0.3) {
      decision = {
        chunks,
        confidence: uncertainty.coherence * 0.7,
        useLLM: true,
        reason: `Retrieval confident but query is novel/anomalous (coherence ${preCoherence.toFixed(2)}). LLM needed for creative interpolation.`,
      };
    } else {
      const grad = new Float32Array(this.dim);
      this.hologram.expansionGradient(queryFHRR, grad);

      decision = {
        chunks,
        confidence: uncertainty.coherence,
        useLLM: true,
        reason: `High entropy (${uncertainty.entropy.toFixed(2)}) — retrieval ambiguous. Suggest query expansion or LLM reasoning.`,
        expansionVector: grad,
      };
    }

    return decision;
  }

  validateNPCState(npcStateVector: Float32Array): {
    valid: boolean;
    coherence: number;
    action: "allow" | "warn" | "block" | "retcon";
    suggestion: string;
  } {
    const anomaly = this.hologram.checkAnomaly(npcStateVector);

    if (!anomaly.isAnomaly) {
      return {
        valid: true,
        coherence: anomaly.coherence,
        action: "allow",
        suggestion: anomaly.suggestion,
      };
    }

    const rolling = this.hologram.getRollingCoherence();
    const action =
      anomaly.severity === "critical" && rolling < 0.4
        ? "retcon"
        : (anomaly.severity === "critical"
          ? "block"
          : "warn");

    return {
      valid: false,
      coherence: anomaly.coherence,
      action,
      suggestion: anomaly.suggestion,
    };
  }
}
