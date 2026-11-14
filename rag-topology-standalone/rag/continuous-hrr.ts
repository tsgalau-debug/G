/**
 * Continuous HRR (Holographic Reduced Representations) Engine
 *
 * Vector Symbolic Architecture (VSA) di continuous real space R^d:
 * - Circular Convolution (algebraic binding: a ⊛ b)
 * - Circular Correlation / Involution (algebraic unbinding: a† ⊛ c ≈ b)
 * - Continuous Fractional Power Scaling (a^α)
 * - Associative Clean-Up Memory & Multi-hop Predicate Bundling
 */

export interface HRRMatchResult {
  bestMatch: string;
  similarity: number;
  secondBest?: string | undefined;
  margin: number;
}

export interface HRRExtractionResult {
  unboundVec: Float32Array;
  cleanMatch?: HRRMatchResult | undefined;
}

export class ContinuousHRR {
  static generateUnitVector(dim: number, seedStr?: string): Float32Array {
    const v = new Float32Array(dim);
    if (seedStr !== undefined && seedStr.length > 0) {
      let h = 2_166_136_261;
      for (let i = 0; i < seedStr.length; i++) {
        h = Math.imul(h ^ (seedStr.codePointAt(i) ?? 0), 16_777_619);
      }
      for (let i = 0; i < dim; i++) {
        h = Math.imul(h ^ (i + 1), 16_777_619);
        let t = (h += 1_831_565_813);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        const rand = ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
        v[i] = rand * 2 - 1;
      }
    } else {
      for (let i = 0; i < dim; i++) {
        v[i] = Math.random() * 2 - 1;
      }
    }

    return this.normalize(v);
  }

  static normalize(v: Float32Array, out?: Float32Array): Float32Array {
    const target = out ?? v;
    let sumSq = 0;
    const len = v.length;
    for (let i = 0; i < len; i++) {
      sumSq += v[i] * v[i];
    }
    const invNorm = sumSq > 1e-12 ? 1 / Math.sqrt(sumSq) : 0;
    for (let i = 0; i < len; i++) {
      target[i] = v[i] * invNorm;
    }
    return target;
  }

  static similarity(a: Float32Array, b: Float32Array): number {
    const len = Math.min(a.length, b.length);
    if (len === 0) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;

    let i = 0;
    for (; i <= len - 4; i += 4) {
      dot += a[i] * b[i] + a[i + 1] * b[i + 1] + a[i + 2] * b[i + 2] + a[i + 3] * b[i + 3];
      normA += a[i] * a[i] + a[i + 1] * a[i + 1] + a[i + 2] * a[i + 2] + a[i + 3] * a[i + 3];
      normB += b[i] * b[i] + b[i + 1] * b[i + 1] + b[i + 2] * b[i + 2] + b[i + 3] * b[i + 3];
    }
    for (; i < len; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denom = Math.sqrt(normA * normB);
    return denom > 1e-12 ? dot / denom : 0;
  }

  static bind(a: Float32Array, b: Float32Array, out?: Float32Array): Float32Array {
    const d = a.length;
    if (b.length !== d) {
      throw new Error(`ContinuousHRR.bind: dimension mismatch ${String(d)} vs ${String(b.length)}`);
    }
    const res = out ?? new Float32Array(d);
    if (out) res.fill(0);

    const BLOCK = 32;
    for (let ii = 0; ii < d; ii += BLOCK) {
      const iMax = Math.min(ii + BLOCK, d);
      for (let j = 0; j < d; j++) {
        const aj = a[j];
        if (Math.abs(aj) < 1e-12) continue;
        for (let i = ii; i < iMax; i++) {
          let bIdx = (i - j) % d;
          if (bIdx < 0) bIdx += d;
          res[i] += aj * b[bIdx];
        }
      }
    }

    return this.normalize(res);
  }

  static involute(a: Float32Array, out?: Float32Array): Float32Array {
    const d = a.length;
    const res = out ?? new Float32Array(d);
    res[0] = a[0];
    for (let i = 1; i < d; i++) {
      res[i] = a[d - i];
    }
    return res;
  }

  static unbind(roleOrKey: Float32Array, boundVector: Float32Array, out?: Float32Array): Float32Array {
    const d = roleOrKey.length;
    if (boundVector.length !== d) {
      throw new Error(`ContinuousHRR.unbind: dimension mismatch ${String(d)} vs ${String(boundVector.length)}`);
    }
    const res = out ?? new Float32Array(d);
    if (out) res.fill(0);

    const BLOCK = 32;
    for (let ii = 0; ii < d; ii += BLOCK) {
      const iMax = Math.min(ii + BLOCK, d);
      for (let j = 0; j < d; j++) {
        const aj = roleOrKey[j];
        if (Math.abs(aj) < 1e-12) continue;
        for (let i = ii; i < iMax; i++) {
          let cIdx = (j + i) % d;
          if (cIdx < 0) cIdx += d;
          res[i] += aj * boundVector[cIdx];
        }
      }
    }

    return this.normalize(res);
  }

  static superpose(
    vectors: Float32Array[],
    weights?: number[] | Float32Array,
    out?: Float32Array
  ): Float32Array {
    if (vectors.length === 0) return out ?? new Float32Array(0);
    const d = vectors[0].length;
    const res = out ?? new Float32Array(d);
    if (out) res.fill(0);

    let k = 0;
    for (const v of vectors) {
      const w = weights === undefined ? 1 : (weights[k] ?? 1);
      k++;
      if (Math.abs(w) < 1e-12) continue;
      for (let i = 0; i < d; i++) {
        res[i] += w * v[i];
      }
    }

    return this.normalize(res);
  }

  static fractionalPower(baseVector: Float32Array, alpha: number, out?: Float32Array): Float32Array {
    const d = baseVector.length;
    const res = out ?? new Float32Array(d);
    if (out) res.fill(0);

    if (Math.abs(alpha) < 1e-8) {
      for (let i = 0; i < d; i++) res[i] = baseVector[i];
      return this.normalize(res);
    }

    const shift = ((alpha % d) + d) % d;
    const shiftInt = Math.floor(shift);
    const frac = shift - shiftInt;

    for (let i = 0; i < d; i++) {
      const idx1 = (i - shiftInt + d) % d;
      const idx2 = (i - (shiftInt + 1) + d) % d;
      res[i] = (1 - frac) * baseVector[idx1] + frac * baseVector[idx2];
    }

    return this.normalize(res);
  }

  static cleanUp(
    noisyVec: Float32Array,
    codebook: Map<string, Float32Array> | { name: string; vector: Float32Array }[],
    threshold = 0.05
  ): HRRMatchResult {
    let bestName = '';
    let bestSim = -1;
    let secondName = '';
    let secondSim = -1;

    const entries: Iterable<[string, Float32Array]> =
      codebook instanceof Map
        ? codebook.entries()
        : codebook.map((e) => [e.name, e.vector]);

    for (const [name, vec] of entries) {
      const sim = this.similarity(noisyVec, vec);
      if (sim > bestSim) {
        secondSim = bestSim;
        secondName = bestName;
        bestSim = sim;
        bestName = name;
      } else if (sim > secondSim) {
        secondSim = sim;
        secondName = name;
      }
    }

    const margin = bestSim - (secondSim > -1 ? secondSim : 0);
    return {
      bestMatch: bestSim >= threshold ? bestName : '',
      similarity: bestSim > -1 ? bestSim : 0,
      secondBest: secondName.length > 0 ? secondName : undefined,
      margin,
    };
  }

  static encodeRelation(
    roleFillerPairs: { role: Float32Array; filler: Float32Array; weight?: number }[],
    out?: Float32Array
  ): Float32Array {
    if (roleFillerPairs.length === 0) return out ?? new Float32Array(0);
    const d = roleFillerPairs[0].role.length;
    const res = out ?? new Float32Array(d);
    if (out) res.fill(0);

    const tempBound = new Float32Array(d);
    for (const pair of roleFillerPairs) {
      const w = pair.weight ?? 1;
      this.bind(pair.role, pair.filler, tempBound);
      for (let i = 0; i < d; i++) {
        res[i] += w * tempBound[i];
      }
    }

    return this.normalize(res);
  }

  static extractFiller(
    relationVec: Float32Array,
    roleVec: Float32Array,
    codebook?: Map<string, Float32Array> | { name: string; vector: Float32Array }[]
  ): HRRExtractionResult {
    const unbound = this.unbind(roleVec, relationVec);
    const cleanMatch = codebook === undefined ? undefined : this.cleanUp(unbound, codebook);
    return {
      unboundVec: unbound,
      cleanMatch,
    };
  }
}
