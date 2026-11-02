import { ContinuousHRR } from '../../app/rag/holographic-memory';
import {
  WasmMathProgramV9BatchScorer,
  type BurnMathV9Runtime,
} from '../../app/rag/wasm-math-v9-scorer';
import type { AgentVerificationSuiteSpec } from './perspective-verification-harness';

export interface WasmBatchScorerAuditInput {
  dim: number;
  maxCandidates: number;
  numCandidates: number;
  candidateSpecs: Array<{
    seed: string;
    scale: number; // 0.0 -> zero-norm vector!
    corruptIndexWithNaN?: number;
    corruptIndexWithInf?: number;
  }>;
  truncatePackedCandsToLength?: number;
  querySpec: {
    seed: string;
    scale: number; // 0.0 -> zero-norm query vector!
    corruptIndexWithNaN?: number;
    truncateToLength?: number;
  };
  sBm25: number[];
  sSim: number[];
  wBm25: number;
  wSim: number;
  docWeights: number[];
  totalWeight: number;
}

export interface WasmBatchScorerAuditOutput {
  fusionScores: number[];
  dotScores: number[];
  cosineScores: number[];
  denseHybridScores: number[];
  activeDocIds: number[];
  activeDocScores: number[];
  allFinite: boolean;
  wasmThrewException: boolean;
}

function buildInputBuffers(input: WasmBatchScorerAuditInput): {
  packedCands: Float32Array;
  queryVec: Float32Array;
  sBm25Buf: Float32Array;
  sSimBuf: Float32Array;
  docWeightsBuf: Float32Array;
} {
  const fullCandFloats = input.candidateSpecs.length * input.dim;
  const fullCands = new Float32Array(fullCandFloats);

  for (let b = 0; b < input.candidateSpecs.length; b++) {
    const spec = input.candidateSpecs[b]!;
    const base = ContinuousHRR.generateUnitVector(input.dim, spec.seed);
    const off = b * input.dim;
    for (let i = 0; i < input.dim; i++) {
      fullCands[off + i] = base[i]! * spec.scale;
    }
    if (spec.corruptIndexWithNaN !== undefined && spec.corruptIndexWithNaN < input.dim) {
      fullCands[off + spec.corruptIndexWithNaN] = Number.NaN;
    }
    if (spec.corruptIndexWithInf !== undefined && spec.corruptIndexWithInf < input.dim) {
      fullCands[off + spec.corruptIndexWithInf] = Number.POSITIVE_INFINITY;
    }
  }

  const packedCands =
    input.truncatePackedCandsToLength !== undefined
      ? fullCands.subarray(0, Math.max(0, input.truncatePackedCandsToLength))
      : fullCands;

  const baseQ = ContinuousHRR.generateUnitVector(input.dim, input.querySpec.seed);
  const fullQ = new Float32Array(input.dim);
  for (let i = 0; i < input.dim; i++) {
    fullQ[i] = baseQ[i]! * input.querySpec.scale;
  }
  if (
    input.querySpec.corruptIndexWithNaN !== undefined &&
    input.querySpec.corruptIndexWithNaN < input.dim
  ) {
    fullQ[input.querySpec.corruptIndexWithNaN] = Number.NaN;
  }
  const queryVec =
    input.querySpec.truncateToLength !== undefined
      ? fullQ.subarray(0, Math.max(0, input.querySpec.truncateToLength))
      : fullQ;

  return {
    packedCands,
    queryVec,
    sBm25Buf: new Float32Array(input.sBm25),
    sSimBuf: new Float32Array(input.sSim),
    docWeightsBuf: new Float32Array(input.docWeights),
  };
}

export function createWasmMathV9BatchScorerVerificationSuite(
  rt: BurnMathV9Runtime,
): AgentVerificationSuiteSpec<WasmBatchScorerAuditInput, WasmBatchScorerAuditOutput> {
  const executeSubject = (input: WasmBatchScorerAuditInput): WasmBatchScorerAuditOutput => {
    const scorer = new WasmMathProgramV9BatchScorer(rt, input.maxCandidates, input.dim);
    try {
      const { packedCands, queryVec, sBm25Buf, sSimBuf, docWeightsBuf } =
        buildInputBuffers(input);

      const effectiveB = Number.isFinite(input.numCandidates)
        ? Math.max(0, Math.min(input.maxCandidates, Math.trunc(input.numCandidates)))
        : 0;

      const outFusion = new Float32Array(effectiveB);
      const outDot = new Float32Array(effectiveB);
      const outCosine = new Float32Array(effectiveB);
      const outDenseHybrid = new Float32Array(effectiveB);
      const outActiveIds = new Int32Array(effectiveB);
      const outActiveScores = new Float32Array(effectiveB);

      scorer.fuseHybridBatch(
        input.numCandidates,
        sBm25Buf,
        sSimBuf,
        input.wBm25,
        input.wSim,
        outFusion,
      );
      scorer.scoreDenseDotBatch(input.numCandidates, packedCands, queryVec, outDot);
      scorer.scoreDenseCandidatesBatch(input.numCandidates, packedCands, queryVec, outCosine);
      scorer.scoreDenseHybridBatch(
        input.numCandidates,
        packedCands,
        queryVec,
        sBm25Buf,
        input.wBm25,
        input.wSim,
        outDenseHybrid,
      );

      const activeCount = scorer.scoreActiveHolographicDocs(
        queryVec,
        packedCands,
        docWeightsBuf,
        input.totalWeight,
        input.numCandidates,
        outActiveIds,
        outActiveScores,
      );

      const fusionScores = Array.from(outFusion);
      const dotScores = Array.from(outDot);
      const cosineScores = Array.from(outCosine);
      const denseHybridScores = Array.from(outDenseHybrid);
      const activeDocIds = Array.from(outActiveIds.subarray(0, activeCount));
      const activeDocScores = Array.from(outActiveScores.subarray(0, activeCount));

      const allFinite =
        fusionScores.every(Number.isFinite) &&
        dotScores.every(Number.isFinite) &&
        cosineScores.every(Number.isFinite) &&
        denseHybridScores.every(Number.isFinite) &&
        activeDocScores.every(Number.isFinite);

      return {
        fusionScores,
        dotScores,
        cosineScores,
        denseHybridScores,
        activeDocIds,
        activeDocScores,
        allFinite,
        wasmThrewException: false,
      };
    } finally {
      scorer.dispose();
    }
  };

  // Pure Float64 Mathematical Reference Oracle
  const referenceOracle = (input: WasmBatchScorerAuditInput): WasmBatchScorerAuditOutput => {
    const { packedCands, queryVec, sBm25Buf, sSimBuf, docWeightsBuf } =
      buildInputBuffers(input);

    const B = Number.isFinite(input.numCandidates)
      ? Math.max(0, Math.min(input.maxCandidates, Math.trunc(input.numCandidates)))
      : 0;
    const D = input.dim;

    const safeWBm25 = Number.isFinite(input.wBm25) ? Math.fround(input.wBm25) : 0;
    const safeWSim = Number.isFinite(input.wSim) ? Math.fround(input.wSim) : 0;

    // Sanitized & zero-padded query vector in Float64
    const q = new Float64Array(D);
    let qNormSq = 0;
    for (let i = 0; i < D; i++) {
      const raw = i < queryVec.length ? queryVec[i]! : 0;
      const val = Number.isFinite(raw) ? raw : 0;
      q[i] = val;
      qNormSq += val * val;
    }
    const qNorm = Math.sqrt(qNormSq);

    const fusionScores: number[] = [];
    const dotScores: number[] = [];
    const cosineScores: number[] = [];
    const denseHybridScores: number[] = [];

    for (let b = 0; b < B; b++) {
      const rawBm25 = b < sBm25Buf.length ? sBm25Buf[b]! : 0;
      const bm25 = Number.isFinite(rawBm25) ? rawBm25 : 0;

      const rawSim = b < sSimBuf.length ? sSimBuf[b]! : 0;
      const sim = Number.isFinite(rawSim) ? rawSim : 0;

      fusionScores.push(Math.fround(safeWBm25 * bm25 + safeWSim * sim));

      let dot = 0;
      let cNormSq = 0;
      const off = b * D;
      for (let i = 0; i < D; i++) {
        const rawC = off + i < packedCands.length ? packedCands[off + i]! : 0;
        const cVal = Number.isFinite(rawC) ? rawC : 0;
        dot += cVal * q[i]!;
        cNormSq += cVal * cVal;
      }
      const cNorm = Math.sqrt(cNormSq);
      const denom = Math.max(cNorm * qNorm, 1e-8);
      const cos = dot / denom;

      dotScores.push(Math.fround(dot));
      cosineScores.push(Math.fround(cos));
      denseHybridScores.push(Math.fround(safeWBm25 * bm25 + safeWSim * cos));
    }

    const activeDocIds: number[] = [];
    const activeDocScores: number[] = [];
    const limit = Math.min(B, docWeightsBuf.length);
    for (let d = 0; d < limit; d++) {
      const w = docWeightsBuf[d]!;
      if (input.totalWeight > 1e-10 && (!Number.isFinite(w) || w <= 1e-10)) continue;
      activeDocIds.push(d);
      activeDocScores.push(dotScores[d]!);
    }

    return {
      fusionScores,
      dotScores,
      cosineScores,
      denseHybridScores,
      activeDocIds,
      activeDocScores,
      allFinite: true,
      wasmThrewException: false,
    };
  };

  const closeArray = (a: number[], b: number[], tol = 1e-5): boolean => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!Number.isFinite(a[i]!) || !Number.isFinite(b[i]!)) return false;
      if (Math.abs(a[i]! - b[i]!) > tol) return false;
    }
    return true;
  };

  const comparator = (
    actual: WasmBatchScorerAuditOutput,
    expected: WasmBatchScorerAuditOutput,
  ): boolean => {
    if (actual.allFinite !== expected.allFinite) return false;
    if (actual.wasmThrewException !== expected.wasmThrewException) return false;
    if (actual.activeDocIds.length !== expected.activeDocIds.length) return false;
    for (let i = 0; i < actual.activeDocIds.length; i++) {
      if (actual.activeDocIds[i] !== expected.activeDocIds[i]) return false;
    }
    return (
      closeArray(actual.fusionScores, expected.fusionScores, 1e-5) &&
      closeArray(actual.dotScores, expected.dotScores, 1e-5) &&
      closeArray(actual.cosineScores, expected.cosineScores, 1e-5) &&
      closeArray(actual.denseHybridScores, expected.denseHybridScores, 1e-5) &&
      closeArray(actual.activeDocScores, expected.activeDocScores, 1e-5)
    );
  };

  const primary1: WasmBatchScorerAuditInput = {
    dim: 32,
    maxCandidates: 16,
    numCandidates: 4,
    candidateSpecs: [
      { seed: 'cand_0', scale: 1.0 },
      { seed: 'cand_1', scale: 1.0 },
      { seed: 'cand_2', scale: 1.0 },
      { seed: 'cand_3', scale: 1.0 },
    ],
    querySpec: { seed: 'cand_1', scale: 1.0 },
    sBm25: [0.9, 0.75, 0.4, 0.1],
    sSim: [0.2, 1.0, 0.35, -0.15],
    wBm25: 0.6,
    wSim: 0.4,
    docWeights: [1.0, 0.0, 0.85, 0.5],
    totalWeight: 2.35,
  };

  const primary2: WasmBatchScorerAuditInput = {
    dim: 32,
    maxCandidates: 16,
    numCandidates: 4,
    candidateSpecs: [
      { seed: 'scale_a', scale: 3.5 },
      { seed: 'scale_b', scale: 0.25 },
      { seed: 'scale_a', scale: -2.0 }, // antiparallel to scale_a
      { seed: 'scale_c', scale: 1.0 },
    ],
    querySpec: { seed: 'scale_a', scale: 2.0 },
    sBm25: [0.5, 0.5, 0.5, 0.5],
    sSim: [1.0, 0.1, -1.0, 0.0],
    wBm25: 0.3,
    wSim: 0.7,
    docWeights: [0.9, 0.9, 0.9, 0.9],
    totalWeight: 3.6,
  };

  const regZeroNormAndMisalignedInput: WasmBatchScorerAuditInput = {
    dim: 16,
    maxCandidates: 16,
    numCandidates: 4,
    candidateSpecs: [
      { seed: 'zero_cand', scale: 0.0 }, // Zero-norm vector!
      { seed: 'valid_cand', scale: 1.0 },
      { seed: 'truncated_cand_1', scale: 1.0 },
      { seed: 'truncated_cand_2', scale: 1.0 },
    ],
    truncatePackedCandsToLength: 32, // Only 2 full candidates (32 floats) provided for B=4 (64 floats)!
    querySpec: { seed: 'valid_cand', scale: 1.0 },
    sBm25: [0.8, 0.6], // Only 2 scalars provided for B=4!
    sSim: [0.5, 0.9],
    wBm25: 0.5,
    wSim: 0.5,
    docWeights: [1.0, 1.0, 1.0, 1.0],
    totalWeight: 4.0,
  };

  return {
    name: 'WasmMathProgramV9BatchScorer::BatchedTensorEquivalenceAndPoison',
    domain: 'low-level',
    subject: executeSubject,
    comparator,
    primaryCases: [
      {
        name: 'Unit-norm candidate batch matches Float64 Reference Oracle across run2, run4, run5, and active holographic filter',
        input: primary1,
        expected: referenceOracle(primary1),
      },
      {
        name: 'Scaled & antiparallel vectors preserve cosine scale-invariance and linear dot scaling',
        input: primary2,
        expected: referenceOracle(primary2),
      },
    ],
    poisonInputs: [
      {
        name: 'Poison 1: Zero-Norm Vectors (||cand|| = 0.0 and ||query|| = 0.0) in Cosine Similarity & Dense Hybrid (run2/run5)',
        input: {
          dim: 16,
          maxCandidates: 16,
          numCandidates: 3,
          candidateSpecs: [
            { seed: 'z0', scale: 0.0 }, // Zero-norm candidate
            { seed: 'z1', scale: 1.0 },
            { seed: 'z2', scale: 0.0 }, // Zero-norm candidate
          ],
          querySpec: { seed: 'zq', scale: 0.0 }, // Zero-norm query!
          sBm25: [1.0, 0.5, 0.25],
          sSim: [0.0, 0.0, 0.0],
          wBm25: 0.6,
          wSim: 0.4,
          docWeights: [1.0, 1.0, 1.0],
          totalWeight: 3.0,
        },
        invariantCheck: (actual) =>
          actual.allFinite &&
          !actual.wasmThrewException &&
          actual.cosineScores.every((c) => Math.abs(c) < 1e-7) &&
          actual.dotScores.every((d) => Math.abs(d) < 1e-7) &&
          Math.abs(actual.denseHybridScores[0]! - 0.6) < 1e-5 &&
          Math.abs(actual.denseHybridScores[1]! - 0.3) < 1e-5,
        failureHint: 'Zero-norm vector caused division-by-zero NaN in WASM cosine similarity',
      },
      {
        name: 'Poison 2: Misaligned / Undersized Tensor Buffers (packedCandVectors.length < B*D & queryVector.length < D)',
        input: {
          dim: 16,
          maxCandidates: 16,
          numCandidates: 4,
          candidateSpecs: [
            { seed: 'm0', scale: 1.0 },
            { seed: 'm1', scale: 1.0 },
            { seed: 'm2', scale: 1.0 },
            { seed: 'm3', scale: 1.0 },
          ],
          truncatePackedCandsToLength: 21, // Misaligned (not a multiple of D=16, shorter than 4*16=64)
          querySpec: {
            seed: 'm0',
            scale: 1.0,
            truncateToLength: 9, // Undersized query (< 16)
          },
          sBm25: [1.0], // Undersized scalar buffer (< 4)
          sSim: [0.5],
          wBm25: 0.5,
          wSim: 0.5,
          docWeights: [1.0, 1.0],
          totalWeight: 2.0,
        },
        invariantCheck: (actual, inp) =>
          actual.allFinite &&
          !actual.wasmThrewException &&
          comparator(actual, referenceOracle(inp)),
        failureHint:
          'Misaligned/undersized TypedArray caused WASM WasmTensor shape trap or out-of-bounds read',
      },
      {
        name: 'Poison 3: NaN / Infinity in Candidate Vectors, Query Vector, Weights, and docWeights',
        input: {
          dim: 16,
          maxCandidates: 16,
          numCandidates: 3,
          candidateSpecs: [
            { seed: 'p0', scale: 1.0, corruptIndexWithNaN: 3 },
            { seed: 'p1', scale: 1.0, corruptIndexWithInf: 7 },
            { seed: 'p2', scale: 1.0 },
          ],
          querySpec: { seed: 'p2', scale: 1.0, corruptIndexWithNaN: 0 },
          sBm25: [Number.NaN, Number.POSITIVE_INFINITY, 0.8],
          sSim: [0.5, Number.NaN, 0.4],
          wBm25: 0.5,
          wSim: 0.5,
          docWeights: [Number.NaN, 0.0, 1.0],
          totalWeight: 1.0,
        },
        invariantCheck: (actual) =>
          actual.allFinite &&
          !actual.wasmThrewException &&
          actual.activeDocIds.length === 1 &&
          actual.activeDocIds[0] === 2,
        failureHint: 'NaN/Infinity elements leaked into output scores or bypassed active docWeights guard',
      },
    ],
    referenceOracle,
    generatedSamples: [
      {
        dim: 16,
        maxCandidates: 16,
        numCandidates: 5,
        candidateSpecs: [
          { seed: 'g1_0', scale: 1.0 },
          { seed: 'g1_1', scale: 0.0 }, // Zero-norm
          { seed: 'g1_2', scale: 2.2 },
          { seed: 'g1_3', scale: -0.8 },
          { seed: 'g1_4', scale: 0.5 },
        ],
        querySpec: { seed: 'g1_2', scale: 1.3 },
        sBm25: [0.2, 0.9, 1.4, 0.0, 0.6],
        sSim: [0.1, 0.0, 0.95, -0.4, 0.3],
        wBm25: 0.45,
        wSim: 0.55,
        docWeights: [0.5, 0.0, 1.2, 0.8, 0.0],
        totalWeight: 2.5,
      },
      {
        dim: 64,
        maxCandidates: 16,
        numCandidates: 6,
        candidateSpecs: [
          { seed: 'g2_0', scale: 1.0 },
          { seed: 'g2_1', scale: 1.0 },
          { seed: 'g2_2', scale: 1.0 },
          { seed: 'g2_3', scale: 1.0 },
          { seed: 'g2_4', scale: 1.0 },
          { seed: 'g2_5', scale: 1.0 },
        ],
        querySpec: { seed: 'g2_q', scale: 1.0 },
        sBm25: [1.1, 0.85, 0.62, 0.44, 0.19, 0.05],
        sSim: [0.72, 0.68, 0.51, 0.39, 0.12, -0.08],
        wBm25: 0.65,
        wSim: 0.35,
        docWeights: [1.0, 1.0, 1.0, 0.0, 1.0, 0.0],
        totalWeight: 4.0,
      },
    ],
    regressionSuite: [
      {
        id: 'REG-20261028-017-ZERO-NORM-AND-MISALIGNED-TENSOR',
        input: regZeroNormAndMisalignedInput,
        expected: referenceOracle(regZeroNormAndMisalignedInput),
      },
    ],
  };
}
