/**
 * Holographic Associative Memory Field — Real Domain & Continuous HRR
 *
 * Menggabungkan:
 * 1. Gaussian Moment Field (First & Second Moments):
 *    - First moment  = mean vector (global "vibe" dunia)
 *    - Second moment = covariance (relational structure antar konsep)
 * 2. Continuous HRR (Holographic Reduced Representations):
 *    - Re-exported dari ./continuous-hrr
 * 3. EpistemicRetrievalKernel:
 *    - Re-exported dari ./epistemic-retrieval-kernel
 *
 * Zero-allocation query path. SOA flat.
 */

/* eslint-disable import/no-cycle, unicorn/prefer-export-from */
import { ContinuousHRR, type HRRMatchResult, type HRRExtractionResult } from './continuous-hrr';
export { ContinuousHRR, type HRRMatchResult, type HRRExtractionResult };
export { EpistemicRetrievalKernel, type RetrievalDecision, type EpistemicKernelResult } from './epistemic-retrieval-kernel';

export class HolographicMemoryField {
  readonly dim: number;
  readonly numDocs: number;
  readonly historyDepth: number;

  // === MEMORY MOMENTS ===
  readonly firstMoment: Float32Array;
  readonly secondMoment: Float32Array;
  readonly docWeights: Float32Array;
  totalWeight: number;

  // === CONTINUOUS HRR COMPOSITE FIELD ===
  readonly hrrComposite: Float32Array;
  readonly hrrTempScratch: Float32Array;

  // === EPISTEMIC TRACKING ===
  readonly coherenceHistory: Float32Array;
  readonly entropyHistory: Float32Array;
  historyCursor: number;

  // === PRE-ALLOCATED WORKSPACE ===
  readonly recon: Float32Array;
  readonly grad: Float32Array;
  readonly tempScores: Float32Array;
  readonly tempVec: Float32Array;

  // === EPISODIC TRACKING ===
  readonly docVectors: Float32Array | null = null;
  readonly rehearsed: Uint8Array;
  readonly salience: Float32Array;
  readonly decayTemp: Float32Array;
  private _lazyTickCounter = 0;

  // === THRESHOLDS (tuneable) ===
  coherenceThreshold: number;
  entropyThreshold: number;
  noveltyBoost: number;

  constructor(
    dim: number,
    numDocs: number,
    historyDepth = 64,
    docVectors?: Float32Array,
  ) {
    this.dim = dim;
    this.numDocs = numDocs;
    this.historyDepth = historyDepth;

    if (docVectors) {
      if (docVectors.length !== numDocs * dim) {
        throw new Error("docVectors length mismatch");
      }
      this.docVectors = docVectors;
    }

    this.firstMoment = new Float32Array(dim);
    this.secondMoment = new Float32Array(dim * dim);
    this.docWeights = new Float32Array(numDocs);
    this.totalWeight = 0;

    this.hrrComposite = new Float32Array(dim);
    this.hrrTempScratch = new Float32Array(dim);

    this.coherenceHistory = new Float32Array(historyDepth);
    this.entropyHistory = new Float32Array(historyDepth);
    this.historyCursor = 0;

    this.recon = new Float32Array(dim);
    this.grad = new Float32Array(dim);
    this.tempScores = new Float32Array(numDocs);
    this.tempVec = new Float32Array(dim);
    this.decayTemp = new Float32Array(dim);

    this.rehearsed = new Uint8Array(numDocs);
    this.salience = new Float32Array(numDocs);
    this.salience.fill(1);

    this.coherenceThreshold = 0.35;
    this.entropyThreshold = 0.75;
    this.noveltyBoost = 1;
  }

  encode(docId: number, vec: Float32Array, weight: number): void {
    const idx = docId | 0;
    if (idx !== docId || idx < 0 || idx >= this.numDocs) return;
    if (!Number.isFinite(weight) || vec.length < this.dim) return;

    const { dim, firstMoment, secondMoment, hrrComposite } = this;
    for (let k = 0; k < dim; k++) {
      if (!Number.isFinite(vec[k])) return;
    }

    const clampedWeight = weight > 0 ? weight : 0;
    const oldW = this.docWeights[idx]!;
    const delta = clampedWeight - oldW;
    if (Math.abs(delta) < 1e-10) {
      if (clampedWeight <= 1e-10) {
        this.rehearsed[idx] = 0;
      }
      return;
    }

    let i = 0;
    for (; i <= dim - 4; i += 4) {
      firstMoment[i] += delta * vec[i]!;
      firstMoment[i + 1] += delta * vec[i + 1]!;
      firstMoment[i + 2] += delta * vec[i + 2]!;
      firstMoment[i + 3] += delta * vec[i + 3]!;

      hrrComposite[i] += delta * vec[i]!;
      hrrComposite[i + 1] += delta * vec[i + 1]!;
      hrrComposite[i + 2] += delta * vec[i + 2]!;
      hrrComposite[i + 3] += delta * vec[i + 3]!;
    }
    for (; i < dim; i++) {
      firstMoment[i] += delta * vec[i]!;
      hrrComposite[i] += delta * vec[i]!;
    }

    const BLOCK = 32;
    for (let ii = 0; ii < dim; ii += BLOCK) {
      const iMax = Math.min(ii + BLOCK, dim);
      for (let jj = 0; jj < dim; jj += BLOCK) {
        const jMax = Math.min(jj + BLOCK, dim);
        for (let r = ii; r < iMax; r++) {
          const vr = vec[r]! * delta;
          const rowOff = r * dim;
          for (let c = jj; c < jMax; c++) {
            secondMoment[rowOff + c] += vr * vec[c]!;
          }
        }
      }
    }

    this.docWeights[idx] = clampedWeight;
    if (clampedWeight <= 1e-10) {
      this.rehearsed[idx] = 0;
    }
    this.totalWeight = Math.max(0, this.totalWeight + delta);
  }

  encodeBatch(docs: Float32Array, weights: Float32Array): void {
    const maxDocs = Math.min(
      this.numDocs,
      Math.floor(docs.length / this.dim),
      weights.length,
    );
    for (let d = 0; d < maxDocs; d++) {
      this.encode(
        d,
        docs.subarray(d * this.dim, (d + 1) * this.dim),
        weights[d]!,
      );
    }
  }

  bindAndSuperpose(role: Float32Array, filler: Float32Array, weight = 1): void {
    ContinuousHRR.bind(role, filler, this.hrrTempScratch);
    const { dim, hrrComposite } = this;
    for (let i = 0; i < dim; i++) {
      hrrComposite[i] += weight * this.hrrTempScratch[i];
    }
  }

  queryHRR(role: Float32Array, out?: Float32Array): Float32Array {
    return ContinuousHRR.unbind(role, this.hrrComposite, out);
  }

  hrrRelationalLookup(
    role: Float32Array,
    codebook: Map<string, Float32Array> | { name: string; vector: Float32Array }[],
  ): HRRMatchResult {
    const unbound = this.queryHRR(role, this.tempVec);
    return ContinuousHRR.cleanUp(unbound, codebook);
  }

  reconstruct(query: Float32Array, out: Float32Array): number {
    const { dim, secondMoment, totalWeight } = this;

    if (totalWeight < 1e-10) {
      out.fill(0);
      return 0;
    }

    const invW = 1 / totalWeight;

    const BLOCK = 32;
    for (let ii = 0; ii < dim; ii += BLOCK) {
      const iMax = Math.min(ii + BLOCK, dim);
      for (let i = ii; i < iMax; i++) {
        let sum = 0;
        const rowOff = i * dim;
        let j = 0;
        for (; j <= dim - 4; j += 4) {
          sum += secondMoment[rowOff + j] * query[j];
          sum += secondMoment[rowOff + j + 1] * query[j + 1];
          sum += secondMoment[rowOff + j + 2] * query[j + 2];
          sum += secondMoment[rowOff + j + 3] * query[j + 3];
        }
        for (; j < dim; j++) sum += secondMoment[rowOff + j] * query[j];
        out[i] = sum * invW;
      }
    }

    let normSq = 0;
    let dot = 0;
    let i = 0;
    for (; i <= dim - 4; i += 4) {
      normSq +=
        out[i] * out[i] +
        out[i + 1] * out[i + 1] +
        out[i + 2] * out[i + 2] +
        out[i + 3] * out[i + 3];
      dot +=
        out[i] * query[i] +
        out[i + 1] * query[i + 1] +
        out[i + 2] * query[i + 2] +
        out[i + 3] * query[i + 3];
    }
    for (; i < dim; i++) {
      normSq += out[i] * out[i];
      dot += out[i] * query[i];
    }

    const invNorm = normSq > 1e-10 ? 1 / Math.sqrt(normSq) : 0;
    for (let j = 0; j < dim; j++) out[j] *= invNorm;

    return dot * invNorm;
  }

  measureUncertainty(
    scores: Float32Array,
    count: number,
  ): { entropy: number; gini: number; coherence: number; confident: boolean } {
    if (count <= 1) {
      return { entropy: 1, gini: 1, coherence: 0, confident: false };
    }

    let sum = 0;
    for (let i = 0; i < count; i++) sum += scores[i];
    const invSum = sum > 1e-10 ? 1 / sum : 0;

    let entropy = 0;
    for (let i = 0; i < count; i++) {
      const p = scores[i] * invSum;
      if (p > 1e-10) entropy -= p * Math.log(p);
    }
    const logK = Math.log(count);
    const normEntropy = logK > 1e-10 ? entropy / logK : 0;

    let giniNum = 0;
    let sortedScores: Float32Array;
    // eslint-disable-next-line unicorn/prefer-ternary
    if (count <= this.numDocs) {
      sortedScores = this.tempScores.subarray(0, count);
    } else {
      sortedScores = new Float32Array(count);
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    for (let i = 0; i < count; i++) sortedScores[i] = scores[i]!;
    sortedScores.sort();
    for (let i = 0; i < count; i++) {
      giniNum += (2 * i - count + 1) * sortedScores[i];
    }
    const gini = sum > 1e-10 ? giniNum / (count * sum) : 0;

    const coherence = 1 - normEntropy;

    const h = this.historyCursor % this.historyDepth;
    this.coherenceHistory[h] = coherence;
    this.entropyHistory[h] = normEntropy;
    this.historyCursor++;

    const confident =
      normEntropy < this.entropyThreshold &&
      coherence > this.coherenceThreshold;

    return { entropy: normEntropy, gini, coherence, confident };
  }

  expansionGradient(query: Float32Array, out: Float32Array): number {
    const coherence = this.reconstruct(query, this.recon);

    for (let i = 0; i < this.dim; i++) {
      out[i] = this.recon[i] - query[i];
    }

    let norm = 0;
    for (let i = 0; i < this.dim; i++) norm += out[i] * out[i];
    const invNorm = norm > 1e-10 ? 1 / Math.sqrt(norm) : 0;
    for (let i = 0; i < this.dim; i++) out[i] *= invNorm;

    return coherence;
  }

  checkAnomaly(stateVector: Float32Array): {
    isAnomaly: boolean;
    coherence: number;
    severity: "none" | "mild" | "critical";
    suggestion: string;
  } {
    let normState = 0;
    for (let i = 0; i < this.dim; i++) {
      normState += stateVector[i] * stateVector[i];
    }
    if (normState < 1e-10) {
      return {
        isAnomaly: false,
        coherence: 1,
        severity: "none",
        suggestion: "Empty state vector, processing skipped",
      };
    }

    const coherence = this.reconstruct(stateVector, this.recon);

    let dotM1 = 0;
    let normM1 = 0;
    for (let i = 0; i < this.dim; i++) {
      dotM1 += stateVector[i] * this.firstMoment[i];
      normM1 += this.firstMoment[i] * this.firstMoment[i];
    }
    const cosM1 = (normM1 > 1e-10 && normState > 1e-10) ? dotM1 / Math.sqrt(normM1 * normState) : 1;

    const penalty = Math.max(0, Math.min(1, (-cosM1 - 0.1) / 0.4));
    const adjustedCoherence = coherence * (1 - 0.9 * penalty);

    if (adjustedCoherence > 0.65) {
      return {
        isAnomaly: false,
        coherence: adjustedCoherence,
        severity: "none",
        suggestion: "Coherent with world memory",
      };
    } else if (adjustedCoherence > 0.35) {
      return {
        isAnomaly: false,
        coherence: adjustedCoherence,
        severity: "mild",
        suggestion: "Novel state, monitor for divergence",
      };
    } else {
      this.expansionGradient(stateVector, this.grad);

      return {
        isAnomaly: true,
        coherence: adjustedCoherence,
        severity: "critical",
        suggestion:
          "State anomalous: contradicts holographic memory field. Consider lore correction or retcon.",
      };
    }
  }

  getRollingCoherence(): number {
    const n = Math.min(this.historyCursor, this.historyDepth);
    if (n === 0) return 0;
    let sum = 0;
    for (let i = 0; i < n; i++) sum += this.coherenceHistory[i];
    return sum / n;
  }

  getRollingEntropy(): number {
    const n = Math.min(this.historyCursor, this.historyDepth);
    if (n === 0) return 1;
    let sum = 0;
    for (let i = 0; i < n; i++) sum += this.entropyHistory[i];
    return sum / n;
  }

  markRehearsed(docId: number): void {
    const idx = docId | 0;
    if (idx === docId && idx >= 0 && idx < this.numDocs) {
      this.rehearsed[idx] = 1;
    }
  }

  /**
   * Sanitizes the `rehearsed` Uint8Array buffer by stripping any dirty upper
   * padding bits (bits 1..7, mask 0xFE) and clearing flags on inactive/evicted
   * document slots (`docWeights[i] <= 1e-10`).
   * Returns the number of corrupted/stale byte slots that were repaired.
   */
  sanitizeRehearsedPaddingBits(): number {
    let repairedCount = 0;
    const { numDocs, rehearsed, docWeights } = this;
    for (let i = 0; i < numDocs; i++) {
      const rawByte = rehearsed[i]!;
      const active = docWeights[i]! > 1e-10;
      const canonicalBit = active ? (rawByte & 0x01) : 0;
      if (rawByte !== canonicalBit) {
        rehearsed[i] = canonicalBit;
        repairedCount++;
      }
    }
    return repairedCount;
  }

  setSalience(docId: number, value: number): void {
    const idx = docId | 0;
    if (idx === docId && idx >= 0 && idx < this.numDocs && Number.isFinite(value)) {
      this.salience[idx] = Math.max(0.1, value);
    }
  }

  setSalienceBatch(docIds: Int32Array, values: Float32Array): void {
    const n = Math.min(docIds.length, values.length);
    for (let i = 0; i < n; i++) {
      const d = docIds[i]!;
      const val = values[i]!;
      if (d >= 0 && d < this.numDocs && Number.isFinite(val)) {
        this.salience[d] = Math.max(0.1, val);
      }
    }
  }

  scheduleDecay(
    baseDecay: number,
    mode: "incremental" | "lazy" = "lazy",
    lazyRebuildInterval = 10,
  ): void {
    if (!Number.isFinite(baseDecay) || baseDecay <= 0 || baseDecay >= 1) return;

    const { numDocs, salience, rehearsed, docWeights } = this;
    const oldTotalWeight = this.totalWeight;

    let newTotalWeight = 0;
    for (let d = 0; d < numDocs; d++) {
      const oldW = docWeights[d]!;
      if (!Number.isFinite(oldW) || oldW <= 1e-10) {
        docWeights[d] = 0;
        continue;
      }

      const rawSalience = salience[d]!;
      const s = Number.isFinite(rawSalience) && rawSalience >= 0.1 ? rawSalience : 1;
      // Strictly evaluate only LSB bit 0 (0x01); ignore upper 7 byte-padding bits (0xFE)
      const r = (rehearsed[d]! & 0x01) === 1 ? 1.05 : 1;
      const factor = Math.pow(baseDecay, 1 / s) * r;
      const newW = oldW * factor;

      if (Number.isFinite(newW) && newW > 1e-6) {
        docWeights[d] = newW;
        newTotalWeight += newW;
      } else {
        docWeights[d] = 0;
      }
    }
    this.totalWeight = newTotalWeight;

    rehearsed.fill(0);

    if (newTotalWeight <= 1e-10) {
      this.totalWeight = 0;
      this.firstMoment.fill(0);
      this.secondMoment.fill(0);
    } else if (oldTotalWeight > 1e-10) {
      const scale = newTotalWeight / oldTotalWeight;
      for (let i = 0; i < this.dim; i++) {
        this.firstMoment[i] *= scale;
      }
      const n = this.dim * this.dim;
      for (let i = 0; i < n; i++) {
        this.secondMoment[i] *= scale;
      }
    }

    if (mode === "incremental") {
      if (!this.docVectors) {
        throw new Error("docVectors required for incremental decay");
      }
      this._incrementalRebuild();
    } else {
      const safeInterval = Math.max(1, lazyRebuildInterval | 0);
      this._lazyTickCounter = (this._lazyTickCounter + 1) % safeInterval;
      if (this._lazyTickCounter === 0) {
        const fadedRatio = 1 - (newTotalWeight > 0 ? newTotalWeight / oldTotalWeight : 0);
        if (fadedRatio > 0.3) {
          this.rebuildMoments();
        }
      }
    }
  }

  private _incrementalRebuild(): void {
    this.rebuildMoments();
  }

  rebuildMoments(): void {
    if (!this.docVectors) return;

    const { dim, numDocs, docVectors, docWeights } = this;
    this.firstMoment.fill(0);
    this.secondMoment.fill(0);
    this.totalWeight = 0;

    for (let d = 0; d < numDocs; d++) {
      const w = docWeights[d];
      if (w <= 1e-10) continue;

      const dOff = d * dim;

      for (let j = 0; j < dim; j++) {
        this.firstMoment[j] += w * docVectors[dOff + j];
      }

      const BLOCK = 32;
      for (let ii = 0; ii < dim; ii += BLOCK) {
        const iMax = Math.min(ii + BLOCK, dim);
        for (let jj = 0; jj < dim; jj += BLOCK) {
          const jMax = Math.min(jj + BLOCK, dim);
          for (let r = ii; r < iMax; r++) {
            const vr = docVectors[dOff + r] * w;
            const rowOff = r * dim;
            for (let c = jj; c < jMax; c++) {
              this.secondMoment[rowOff + c] += vr * docVectors[dOff + c];
            }
          }
        }
      }

      this.totalWeight += w;
    }
  }

  getEpisodicStats(): {
    activeDocs: number;
    totalWeight: number;
    rehearsedLastTick: number;
    meanSalience: number;
    fadedCount: number;
  } {
    let active = 0;
    let faded = 0;
    let wSum = 0;
    let sSum = 0;
    for (let i = 0; i < this.numDocs; i++) {
      if (this.docWeights[i] > 1e-10) {
        active++;
        wSum += this.docWeights[i];
        sSum += this.salience[i];
      } else {
        faded++;
      }
    }
    let rehearsedCount = 0;
    for (let i = 0; i < this.numDocs; i++) {
      if (this.docWeights[i] > 1e-10 && (this.rehearsed[i]! & 0x01) === 1) {
        rehearsedCount++;
      }
    }

    return {
      activeDocs: active,
      totalWeight: wSum,
      rehearsedLastTick: rehearsedCount,
      meanSalience: active > 0 ? sSum / active : 0,
      fadedCount: faded,
    };
  }

  getMemoryStats(): {
    totalWeight: number;
    meanWeight: number;
    activeDocs: number;
    rollingCoherence: number;
    rollingEntropy: number;
  } {
    let active = 0;
    let wSum = 0;
    for (let i = 0; i < this.numDocs; i++) {
      if (this.docWeights[i] > 1e-10) active++;
      wSum += this.docWeights[i];
    }
    return {
      totalWeight: this.totalWeight,
      meanWeight: active > 0 ? wSum / active : 0,
      activeDocs: active,
      rollingCoherence: this.getRollingCoherence(),
      rollingEntropy: this.getRollingEntropy(),
    };
  }
}
