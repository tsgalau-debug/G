/* eslint-disable */
import { MultiWorldHologram } from './multi-world';
import { HolographicMemoryField } from './holographic-memory';

export type ConflictType =
  | 'direct_contradiction'
  | 'divergent_path'
  | 'detail_mismatch'
  | 'coherence_gap';

export interface LoreConflict {
  docId: number;
  type: ConflictType;
  severity: number;
  worldA: number;
  worldB: number;
  coherenceA: number;
  coherenceB: number;
  resolution: 'keep_a' | 'keep_b' | 'merge_weighted' | 'flag_for_llm';
  explanation: string;
}

export interface MergeResult {
  success: boolean;
  mergedWorld: number;
  conflicts: LoreConflict[];
  autoResolved: number;
  flaggedForLLM: number;
  finalCoherence: number;
  auditLog: string[];
}

export class WorldMergeResolver {
  readonly multiWorld: MultiWorldHologram;
  readonly dim: number;
  readonly numDocs: number;
  readonly docVectors: Float32Array;

  readonly reconA: Float32Array;
  readonly reconB: Float32Array;
  readonly diffVec: Float32Array;
  readonly mergedVec: Float32Array;
  readonly tempDocVec: Float32Array;
  readonly conflictBuffer: LoreConflict[];
  readonly auditBuffer: string[];

  constructor(
    multiWorld: MultiWorldHologram,
    dim: number,
    numDocs: number,
    docVectors: Float32Array
  ) {
    this.multiWorld = multiWorld;
    this.dim = dim;
    this.numDocs = numDocs;
    this.docVectors = docVectors;

    this.reconA = new Float32Array(dim);
    this.reconB = new Float32Array(dim);
    this.diffVec = new Float32Array(dim);
    this.mergedVec = new Float32Array(dim);
    this.tempDocVec = new Float32Array(dim);
    this.conflictBuffer = Array.from({ length: 256 });
    this.auditBuffer = Array.from({ length: 64 });
  }

  resolve(
    sourceWorld: number,
    targetWorld: number,
    autoThreshold = 0.15,
    trunkPriority = true
  ): MergeResult {
    const { multiWorld, dim, numDocs } = this;

    if (!multiWorld.active[sourceWorld] || !multiWorld.active[targetWorld]) {
      return {
        success: false,
        mergedWorld: targetWorld,
        conflicts: [],
        autoResolved: 0,
        flaggedForLLM: 0,
        finalCoherence: 0,
        auditLog: ['ERROR: Source or target world inactive'],
      };
    }

    const src = multiWorld.worlds[sourceWorld];
    const dst = multiWorld.worlds[targetWorld];

    let conflictCount = 0;
    let autoResolved = 0;
    let flagged = 0;
    let auditIdx = 0;

    this.auditBuffer[auditIdx++] = `MERGE START: ${multiWorld.worldNames[sourceWorld]} → ${multiWorld.worldNames[targetWorld]}`;

    for (let d = 0; d < numDocs; d++) {
      const wA = src!.docWeights[d]!;
      const wB = dst!.docWeights[d]!;

      if (wA <= 1e-10 && wB <= 1e-10) continue;

      if (wB <= 1e-10 && wA > 1e-10) {
        const vec = this._getDocVector(d);
        dst!.encode(d, vec, wA);
        this.auditBuffer[auditIdx++] = `COPY doc[${d}] from source (weight ${wA.toFixed(4)})`;
        continue;
      }

      if (wA > 1e-10 && wB > 1e-10) {
        const cohA = this._docCoherence(d, src!, this.reconA);
        const cohB = this._docCoherence(d, dst!, this.reconB);
        const diff = Math.abs(cohA - cohB);

        const contradiction = this._checkContradiction(this.reconA, this.reconB);

        let resolution: LoreConflict['resolution'];
        let severity = diff;
        let type: ConflictType;
        let explanation: string;

        if (contradiction > 0.7) {
          type = 'direct_contradiction';
          severity = 1;

          if (diff < autoThreshold) {
            resolution = 'flag_for_llm';
            flagged++;
            explanation = `Direct contradiction with similar coherence (${cohA.toFixed(2)} vs ${cohB.toFixed(2)})`;
          } else if (trunkPriority) {
            resolution = 'keep_b';
            autoResolved++;
            explanation = `Direct contradiction, trunk wins (trunkPriority=true)`;
          } else {
            resolution = cohA > cohB ? 'keep_a' : 'keep_b';
            autoResolved++;
            explanation = `Direct contradiction, higher coherence wins`;
          }
        } else if (diff < autoThreshold) {
          type = 'detail_mismatch';
          resolution = 'merge_weighted';
          autoResolved++;
          const totalW = wA + wB;
          const newW = totalW * 0.5;
          const vec = this._getDocVector(d);
          dst!.encode(d, vec, newW);
          explanation = `Minor mismatch, weighted merge (${cohA.toFixed(2)} vs ${cohB.toFixed(2)})`;
        } else {
          type = 'divergent_path';
          severity = diff;
          resolution = cohA > cohB ? 'keep_a' : 'keep_b';
          autoResolved++;
          explanation = `Divergent path, higher coherence wins (${cohA.toFixed(2)} vs ${cohB.toFixed(2)})`;
        }

        if (resolution === 'keep_a') {
          const vec = this._getDocVector(d);
          dst!.encode(d, vec, wA);
        }

        if (conflictCount < this.conflictBuffer.length) {
          this.conflictBuffer[conflictCount++] = {
            docId: d,
            type,
            severity,
            worldA: sourceWorld,
            worldB: targetWorld,
            coherenceA: cohA,
            coherenceB: cohB,
            resolution,
            explanation,
          };
        }

        this.auditBuffer[auditIdx++] = `[${type}] doc[${d}]: ${explanation} → ${resolution}`;
      }
    }

    multiWorld.superposition[targetWorld] = Math.min(
      1,
      (multiWorld.superposition[targetWorld] || 0) +
        (multiWorld.superposition[sourceWorld] || 0) * 0.5
    );

    const testVec = new Float32Array(dim);
    testVec[0] = 1;
    const finalCoh = dst!.reconstruct(testVec, this.mergedVec);

    multiWorld.prune(sourceWorld);

    this.auditBuffer[auditIdx++] = `MERGE END: ${autoResolved} auto, ${flagged} flagged, final coherence ${finalCoh.toFixed(3)}`;

    return {
      success: true,
      mergedWorld: targetWorld,
      conflicts: this.conflictBuffer.slice(0, conflictCount),
      autoResolved,
      flaggedForLLM: flagged,
      finalCoherence: finalCoh,
      auditLog: this.auditBuffer.slice(0, auditIdx),
    };
  }

  private _docCoherence(
    docId: number,
    world: HolographicMemoryField,
    out: Float32Array
  ): number {
    const vec = this._getDocVector(docId);
    return world.reconstruct(vec, out);
  }

  private _checkContradiction(a: Float32Array, b: Float32Array): number {
    let dot = 0;
    for (let i = 0; i < this.dim; i++) {
      dot += a[i]! * b[i]!;
    }
    return (1 - dot) * 0.5;
  }

  private _getDocVector(docId: number): Float32Array {
    const offset = docId * this.dim;
    return this.docVectors.slice(offset, offset + this.dim);
  }

  resolveAllToTrunk(trunkWorld = 0): MergeResult[] {
    const results: MergeResult[] = [];

    const branches: { id: number; coherence: number }[] = [];
    for (let w = 0; w < this.multiWorld.maxWorlds; w++) {
      if (w === trunkWorld) continue;
      if (!this.multiWorld.active[w]) continue;

      const testVec = new Float32Array(this.dim);
      testVec[0] = 1;
      const coh = this.multiWorld.worlds[w]!.reconstruct(testVec, this.diffVec);
      branches.push({ id: w, coherence: coh });
    }

    branches.sort((a, b) => b.coherence - a.coherence);

    for (const branch of branches) {
      const res = this.resolve(branch.id, trunkWorld);
      results.push(res);
    }

    return results;
  }
}
