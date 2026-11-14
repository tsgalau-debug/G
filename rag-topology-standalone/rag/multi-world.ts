/* eslint-disable */
import { HolographicMemoryField } from './holographic-memory';

/**
 * MultiWorld Holographic Kernel
 *
 * Konsep:
 * - Setiap "world" adalah HolographicMemoryField independen
 * - Superposition: query bisa men-scan satu world, atau weighted blend dari banyak world
 * - Interference: diff antar world menghasilkan residual field (kontradiksi pengetahuan/lore)
 * - Branching: fork world zero-copy-ish (pre-allocated slot copy)
 * - Collapse: merge world ke trunk, lalu recycle slot
 */
export class MultiWorldHologram {
  readonly maxWorlds: number;
  readonly dim: number;
  readonly numDocs: number;
  readonly historyDepth: number;

  readonly worlds: HolographicMemoryField[];
  readonly active: Uint8Array;
  readonly superposition: Float32Array;
  readonly worldNames: string[];

  readonly reconAcc: Float32Array;
  readonly diffAcc: Float32Array;
  readonly crossScores: Float32Array;

  readonly queryMask: Uint8Array;
  private queryCount: number;

  constructor(
    maxWorlds: number,
    dim: number,
    numDocs: number,
    historyDepth = 64,
    docVectors?: Float32Array
  ) {
    this.maxWorlds = maxWorlds;
    this.dim = dim;
    this.numDocs = numDocs;
    this.historyDepth = historyDepth;

    this.worlds = new Array(maxWorlds);
    this.active = new Uint8Array(maxWorlds);
    this.superposition = new Float32Array(maxWorlds);
    this.worldNames = new Array(maxWorlds);
    this.reconAcc = new Float32Array(dim);
    this.diffAcc = new Float32Array(dim);
    this.crossScores = new Float32Array(maxWorlds);
    this.queryMask = new Uint8Array(maxWorlds);
    this.queryCount = 0;

    for (let w = 0; w < maxWorlds; w++) {
      this.worlds[w] = new HolographicMemoryField(dim, numDocs, historyDepth, docVectors);
      this.active[w] = 0;
      this.superposition[w] = 0;
      this.worldNames[w] = '';
    }
  }

  initTrunk(docFHRR: Float32Array, docWeights: Float32Array, name = 'trunk'): void {
    this.active[0] = 1;
    this.superposition[0] = 1;
    this.worldNames[0] = name;
    this.worlds[0].encodeBatch(docFHRR, docWeights);
  }

  fork(sourceWorld: number, targetWorld: number, name: string): boolean {
    if (sourceWorld < 0 || sourceWorld >= this.maxWorlds) return false;
    if (targetWorld < 0 || targetWorld >= this.maxWorlds) return false;
    if (!this.active[sourceWorld] || this.active[targetWorld]) return false;

    const src = this.worlds[sourceWorld];
    const dst = this.worlds[targetWorld];

    dst.firstMoment.set(src.firstMoment);
    dst.secondMoment.set(src.secondMoment);
    dst.docWeights.set(src.docWeights);
    dst.totalWeight = src.totalWeight;
    dst.hrrComposite.set(src.hrrComposite);
    dst.salience.set(src.salience);
    for (let d = 0; d < this.numDocs; d++) {
      dst.rehearsed[d] = src.docWeights[d]! > 1e-10 ? src.rehearsed[d]! & 0x01 : 0;
    }

    dst.coherenceHistory.set(src.coherenceHistory);
    dst.entropyHistory.set(src.entropyHistory);
    dst.historyCursor = src.historyCursor;

    this.active[targetWorld] = 1;
    this.superposition[targetWorld] = this.superposition[sourceWorld] * 0.95;
    this.worldNames[targetWorld] = name;

    return true;
  }

  prune(world: number): boolean {
    if (world < 0 || world >= this.maxWorlds) return false;
    if (!this.active[world]) return false;

    const w = this.worlds[world];
    w.firstMoment.fill(0);
    w.secondMoment.fill(0);
    w.docWeights.fill(0);
    w.totalWeight = 0;
    w.hrrComposite.fill(0);
    w.rehearsed.fill(0);
    w.salience.fill(1);
    w.coherenceHistory.fill(0);
    w.entropyHistory.fill(0);
    w.historyCursor = 0;

    this.active[world] = 0;
    this.superposition[world] = 0;
    this.worldNames[world] = '';
    return true;
  }

  collapse(branchWorld: number, trunkWorld = 0): boolean {
    if (branchWorld < 0 || branchWorld >= this.maxWorlds) return false;
    if (!this.active[branchWorld]) return false;
    if (!this.active[trunkWorld]) return false;

    const branch = this.worlds[branchWorld];
    const trunk = this.worlds[trunkWorld];
    const weight = this.superposition[branchWorld];

    const n = this.numDocs;
    for (let d = 0; d < n; d++) {
      if (branch.docWeights[d] > 0) {
        const branchW = branch.docWeights[d] * weight;
        const trunkW = trunk.docWeights[d];
        trunk.docWeights[d] = trunkW + branchW;
      }
    }

    trunk.rebuildMoments();
    this.prune(branchWorld);
    return true;
  }

  setQueryMask(worlds: number[]): void {
    this.queryMask.fill(0);
    this.queryCount = 0;
    for (const w of worlds) {
      if (w >= 0 && w < this.maxWorlds && this.active[w]) {
        this.queryMask[w] = 1;
        this.queryCount++;
      }
    }
  }

  queryAll(): void {
    this.queryMask.fill(0);
    this.queryCount = 0;
    for (let w = 0; w < this.maxWorlds; w++) {
      if (this.active[w]) {
        this.queryMask[w] = 1;
        this.queryCount++;
      }
    }
  }

  reconstructSuperposed(query: Float32Array, out: Float32Array): number {
    this.reconAcc.fill(0);
    let totalWeight = 0;
    let minCoherence = 1;

    for (let w = 0; w < this.maxWorlds; w++) {
      if (!this.queryMask[w]) continue;

      const world = this.worlds[w];
      const wWeight = this.superposition[w];
      if (wWeight < 1e-10) continue;

      const coh = world.reconstruct(query, world.tempVec);
      this.crossScores[w] = coh;
      if (coh < minCoherence) minCoherence = coh;

      const tv = world.tempVec;
      let i = 0;
      for (; i <= this.dim - 4; i += 4) {
        this.reconAcc[i] += wWeight * tv[i];
        this.reconAcc[i + 1] += wWeight * tv[i + 1];
        this.reconAcc[i + 2] += wWeight * tv[i + 2];
        this.reconAcc[i + 3] += wWeight * tv[i + 3];
      }
      for (; i < this.dim; i++) this.reconAcc[i] += wWeight * tv[i];

      totalWeight += wWeight;
    }

    if (totalWeight < 1e-10) {
      out.fill(0);
      return 0;
    }

    const invW = 1 / totalWeight;
    let normSq = 0;
    for (let i = 0; i < this.dim; i++) {
      out[i] = (this.reconAcc[i] ?? 0) * invW;
      normSq += out[i] * out[i];
    }

    const invNorm = normSq > 1e-10 ? 1 / Math.sqrt(normSq) : 0;
    for (let i = 0; i < this.dim; i++) out[i] = out[i] * invNorm;

    let avgCoherence = 0;
    let count = 0;
    for (let w = 0; w < this.maxWorlds; w++) {
      if (this.queryMask[w]) {
        avgCoherence += this.crossScores[w];
        count++;
      }
    }
    avgCoherence = count > 0 ? avgCoherence / count : 0;

    return avgCoherence * minCoherence;
  }

  diff(worldA: number, worldB: number, query: Float32Array, out: Float32Array): number {
    if (!this.active[worldA] || !this.active[worldB]) {
      out.fill(0);
      return 0;
    }

    const wA = this.worlds[worldA];
    const wB = this.worlds[worldB];

    const cohA = wA.reconstruct(query, this.reconAcc);
    const cohB = wB.reconstruct(query, this.diffAcc);

    let normSq = 0;
    let dotM1 = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < this.dim; i++) {
      out[i] = (this.reconAcc[i] ?? 0) - (this.diffAcc[i] ?? 0);
      normSq += out[i] * out[i];
      const m1A = wA.firstMoment[i];
      const m1B = wB.firstMoment[i];
      dotM1 += m1A * m1B;
      normA += m1A * m1A;
      normB += m1B * m1B;
    }

    const invNorm = normSq > 1e-10 ? 1 / Math.sqrt(normSq) : 0;
    for (let i = 0; i < this.dim; i++) out[i] = out[i] * invNorm;

    let cosM1 = 1;
    if (normA > 1e-10 && normB > 1e-10) {
      cosM1 = dotM1 / Math.sqrt(normA * normB);
    } else if (normA > 1e-10 || normB > 1e-10) {
      cosM1 = -1;
    }
    return Math.abs(cohA - cohB) + (1 - cosM1);
  }

  validateCrossWorld(stateVec: Float32Array): {
    consistent: boolean;
    weakestWorld: number;
    weakestName: string;
    minCoherence: number;
    avgCoherence: number;
    action: 'allow' | 'warn' | 'retcon';
  } {
    let minCoh = 1;
    let minWorld = -1;
    let sumCoh = 0;
    let count = 0;

    for (let w = 0; w < this.maxWorlds; w++) {
      if (!this.active[w]) continue;

      let normalizedCoh = 1;
      if (this.worlds[w].totalWeight >= 1e-10) {
        const coh = this.worlds[w].reconstruct(stateVec, this.reconAcc);
        const expectedCoh = 1 / Math.sqrt(Math.max(1, this.worlds[w].totalWeight));
        normalizedCoh = coh / Math.max(0.001, expectedCoh);
      }
      sumCoh += normalizedCoh;
      count++;

      if (normalizedCoh < minCoh) {
        minCoh = normalizedCoh;
        minWorld = w;
      }
    }

    const avgCoh = count > 0 ? sumCoh / count : 0;
    let action: 'allow' | 'warn' | 'retcon';

    if (minCoh > 0.5 && avgCoh > 0.8) {
      action = 'allow';
    } else if (minCoh > 0.2) {
      action = 'warn';
    } else {
      action = 'retcon';
    }

    return {
      consistent: minCoh > 0.2,
      weakestWorld: minWorld,
      weakestName: minWorld >= 0 ? this.worldNames[minWorld] : '',
      minCoherence: minCoh,
      avgCoherence: avgCoh,
      action,
    };
  }

  epistemicQuery(
    query: Float32Array,
    outRecon: Float32Array
  ): {
    coherence: number;
    fractured: boolean;
    worldBreakdown: { world: number; name: string; coherence: number; weight: number }[];
    recommendation: string;
  } {
    const coh = this.reconstructSuperposed(query, outRecon);
    const breakdown: { world: number; name: string; coherence: number; weight: number }[] = [];

    let variance = 0;
    let count = 0;
    let avg = 0;

    for (let w = 0; w < this.maxWorlds; w++) {
      if (!this.queryMask[w]) continue;
      breakdown.push({
        world: w,
        name: this.worldNames[w],
        coherence: this.crossScores[w],
        weight: this.superposition[w],
      });
      avg += this.crossScores[w];
      count++;
    }

    avg = count > 0 ? avg / count : 0;
    for (const b of breakdown) variance += (b.coherence - avg) * (b.coherence - avg);
    variance = count > 0 ? variance / count : 0;

    let m1Contradiction = 0;
    if (count > 1) {
      let m1Pairs = 0;
      let totalM1Dist = 0;
      for (let w = 0; w < this.maxWorlds; w++) {
        if (!this.queryMask[w]) continue;
        for (let w2 = w + 1; w2 < this.maxWorlds; w2++) {
          if (!this.queryMask[w2]) continue;

          let dot = 0;
          let nA = 0;
          let nB = 0;
          for (let i = 0; i < this.dim; i++) {
            const a = this.worlds[w].firstMoment[i];
            const b = this.worlds[w2].firstMoment[i];
            dot += a * b;
            nA += a * a;
            nB += b * b;
          }
          let cos = 1;
          if (nA > 1e-10 && nB > 1e-10) {
            cos = dot / Math.sqrt(nA * nB);
          } else if (nA > 1e-10 || nB > 1e-10) {
            cos = -1;
          }
          totalM1Dist += 1 - cos;
          m1Pairs++;
        }
      }
      if (m1Pairs > 0) m1Contradiction = totalM1Dist / m1Pairs;
    }

    const fractured = variance > 0.05 || coh < 0.4 || m1Contradiction > 0.5;

    let recommendation: string;
    if (fractured) {
      recommendation = `Reality fracture detected across ${count} worlds (variance ${variance.toFixed(3)}). Arbitration required.`;
    } else if (coh < 0.5) {
      recommendation = `Low consensus coherence (${coh.toFixed(2)}). Query may be novel or contradictory to all active branches.`;
    } else {
      recommendation = `Strong consensus (${coh.toFixed(2)}). Kernel retrieval sufficient.`;
    }

    return { coherence: coh, fractured, worldBreakdown: breakdown, recommendation };
  }

  setTemporalFocus(presentWorld: number, pastWorld: number, pastStrength: number): void {
    for (let w = 0; w < this.maxWorlds; w++) {
      if (!this.active[w]) continue;
      if (w === presentWorld) {
        this.superposition[w] = 1;
      } else if (w === pastWorld) {
        this.superposition[w] = pastStrength;
      } else {
        this.superposition[w] = 0;
      }
    }
  }

  induceParadox(): void {
    let activeCount = 0;
    for (let w = 0; w < this.maxWorlds; w++) if (this.active[w]) activeCount++;
    const weightVal = activeCount > 0 ? 1 / activeCount : 0;
    for (let w = 0; w < this.maxWorlds; w++) {
      if (this.active[w]) this.superposition[w] = weightVal;
    }
  }

  getWorldStats(): {
    id: number;
    name: string;
    active: boolean;
    weight: number;
    docs: number;
    coherence: number;
  }[] {
    const out = [];
    for (let w = 0; w < this.maxWorlds; w++) {
      if (!this.active[w]) continue;
      const stats = this.worlds[w].getMemoryStats();
      out.push({
        id: w,
        name: this.worldNames[w],
        active: true,
        weight: this.superposition[w],
        docs: stats.activeDocs,
        coherence: stats.rollingCoherence,
      });
    }
    return out;
  }
}
