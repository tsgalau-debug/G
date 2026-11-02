import { HolographicMemoryField, ContinuousHRR } from '../../app/rag/holographic-memory';
import { MultiWorldHologram } from '../../app/rag/multi-world';
import type { AgentVerificationSuiteSpec } from './perspective-verification-harness';

// ============================================================================
// CONCRETE SUITE 1: HolographicMemoryField (Byte-Padding, Decay, & Poison Gate)
// ============================================================================

export interface HolographicAuditInput {
  dim: number;
  numDocs: number;
  ops: Array<{
    docId: number;
    seed: string;
    weight: number;
    rawRehearsedByte?: number;
    salience?: number;
    evictAfter?: boolean;
    corruptVecWithNaN?: boolean;
  }>;
  baseDecay: number;
  decayMode?: 'lazy' | 'incremental';
  runSanitizerBeforeDecay?: boolean;
}

export interface HolographicAuditOutput {
  docWeights: number[];
  totalWeight: number;
  rehearsedBeforeDecay: number;
  rehearsedAfterDecaySum: number;
  firstMomentNorm: number;
  secondMomentTrace: number;
  allFinite: boolean;
}

function makeDeterministicVec(dim: number, seed: string, corruptNaN = false): Float32Array {
  const vec = ContinuousHRR.generateUnitVector(dim, seed);
  if (corruptNaN && vec.length > 0) {
    vec[0] = Number.NaN;
  }
  return vec;
}

export function createHolographicMemoryVerificationSuite(): AgentVerificationSuiteSpec<
  HolographicAuditInput,
  HolographicAuditOutput
> {
  const executeSubject = (input: HolographicAuditInput): HolographicAuditOutput => {
    const docVectors = new Float32Array(input.numDocs * input.dim);
    for (let d = 0; d < input.numDocs; d++) {
      const v = makeDeterministicVec(input.dim, `base_doc_${d}`);
      docVectors.set(v, d * input.dim);
    }

    const hf = new HolographicMemoryField(input.dim, input.numDocs, 16, docVectors);

    for (const op of input.ops) {
      const vec = makeDeterministicVec(input.dim, op.seed, op.corruptVecWithNaN);
      if (
        Number.isInteger(op.docId) &&
        op.docId >= 0 &&
        op.docId < input.numDocs &&
        !op.corruptVecWithNaN
      ) {
        docVectors.set(vec, op.docId * input.dim);
      }
      hf.encode(op.docId, vec, op.weight);

      if (op.salience !== undefined) {
        hf.setSalience(op.docId, op.salience);
      }
      if (op.rawRehearsedByte !== undefined) {
        if (Number.isInteger(op.docId) && op.docId >= 0 && op.docId < input.numDocs) {
          hf.rehearsed[op.docId] = op.rawRehearsedByte & 0xff;
        } else {
          hf.markRehearsed(op.docId);
        }
      }
      if (op.evictAfter) {
        hf.encode(op.docId, vec, 0);
      }
    }

    if (input.runSanitizerBeforeDecay) {
      hf.sanitizeRehearsedPaddingBits();
    }

    const rehearsedBeforeDecay = hf.getEpisodicStats().rehearsedLastTick;
    hf.scheduleDecay(input.baseDecay, input.decayMode ?? 'lazy', 1);

    let rehearsedAfterDecaySum = 0;
    for (let i = 0; i < hf.numDocs; i++) {
      rehearsedAfterDecaySum += hf.rehearsed[i]!;
    }

    let firstMomentNormSq = 0;
    let allFinite = Number.isFinite(hf.totalWeight);
    for (let i = 0; i < hf.dim; i++) {
      const m1 = hf.firstMoment[i]!;
      if (!Number.isFinite(m1) || !Number.isFinite(hf.hrrComposite[i]!)) {
        allFinite = false;
      }
      firstMomentNormSq += m1 * m1;
    }

    let secondMomentTrace = 0;
    for (let i = 0; i < hf.dim; i++) {
      const diag = hf.secondMoment[i * hf.dim + i]!;
      if (!Number.isFinite(diag)) {
        allFinite = false;
      }
      secondMomentTrace += diag;
    }
    for (let i = 0; i < hf.numDocs; i++) {
      if (!Number.isFinite(hf.docWeights[i]!) || !Number.isFinite(hf.salience[i]!)) {
        allFinite = false;
      }
    }

    return {
      docWeights: Array.from(hf.docWeights),
      totalWeight: hf.totalWeight,
      rehearsedBeforeDecay,
      rehearsedAfterDecaySum,
      firstMomentNorm: Math.sqrt(firstMomentNormSq),
      secondMomentTrace,
      allFinite,
    };
  };

  // Pure Float64 Reference Oracle
  const referenceOracle = (input: HolographicAuditInput): HolographicAuditOutput => {
    const weights = new Float64Array(input.numDocs);
    const salience = new Float64Array(input.numDocs).fill(1.0);
    const rehearsed = new Uint8Array(input.numDocs);
    const vectors: Float32Array[] = Array.from({ length: input.numDocs }, (_, d) =>
      makeDeterministicVec(input.dim, `base_doc_${d}`),
    );

    for (const op of input.ops) {
      if (!Number.isInteger(op.docId) || op.docId < 0 || op.docId >= input.numDocs) continue;
      if (op.corruptVecWithNaN || !Number.isFinite(op.weight)) continue;

      const vec = makeDeterministicVec(input.dim, op.seed, false);
      vectors[op.docId] = vec;
      const clampedW = op.weight > 0 ? op.weight : 0;
      weights[op.docId] = clampedW;
      if (clampedW <= 1e-10) {
        rehearsed[op.docId] = 0;
      }

      if (op.salience !== undefined && Number.isFinite(op.salience)) {
        salience[op.docId] = Math.max(0.1, op.salience);
      }
      if (op.rawRehearsedByte !== undefined) {
        rehearsed[op.docId] = op.rawRehearsedByte & 0xff;
      }
      if (op.evictAfter) {
        weights[op.docId] = 0;
        rehearsed[op.docId] = 0;
      }
    }

    let oldTotalWeight = 0;
    const preDecayM1 = new Float64Array(input.dim);
    let preDecayTrace = 0;
    for (let d = 0; d < input.numDocs; d++) {
      const w = Math.fround(weights[d]!);
      if (w <= 1e-10) continue;
      oldTotalWeight += w;
      const v = vectors[d]!;
      for (let i = 0; i < input.dim; i++) {
        preDecayM1[i] += w * v[i]!;
        preDecayTrace += w * v[i]! * v[i]!;
      }
    }

    let rehearsedBeforeDecay = 0;
    for (let d = 0; d < input.numDocs; d++) {
      if (weights[d]! > 1e-10 && (rehearsed[d]! & 0x01) === 1) {
        rehearsedBeforeDecay++;
      }
    }

    const validDecay =
      Number.isFinite(input.baseDecay) && input.baseDecay > 0 && input.baseDecay < 1;
    if (validDecay) {
      for (let d = 0; d < input.numDocs; d++) {
        const oldW = Math.fround(weights[d]!);
        if (oldW <= 1e-10) continue;
        const s = Math.fround(salience[d]!);
        const r = (rehearsed[d]! & 0x01) === 1 ? 1.05 : 1.0;
        const newW = oldW * Math.pow(input.baseDecay, 1 / s) * r;
        weights[d] = newW > 1e-6 ? Math.fround(newW) : 0;
      }
      rehearsed.fill(0);
    }

    let totalWeight = 0;
    for (let d = 0; d < input.numDocs; d++) {
      const w = Math.fround(weights[d]!);
      weights[d] = w;
      if (w > 1e-10) totalWeight += w;
    }

    const mode = input.decayMode ?? 'lazy';
    const fadedRatio =
      oldTotalWeight > 1e-10 ? 1 - (totalWeight > 0 ? totalWeight / oldTotalWeight : 0) : 0;
    const shouldRebuildMoments = !validDecay || mode === 'incremental' || fadedRatio > 0.3;

    const m1 = new Float64Array(input.dim);
    let trace = 0;
    if (shouldRebuildMoments) {
      for (let d = 0; d < input.numDocs; d++) {
        const w = weights[d]!;
        if (w <= 1e-10) continue;
        const v = vectors[d]!;
        for (let i = 0; i < input.dim; i++) {
          m1[i] += w * v[i]!;
          trace += w * v[i]! * v[i]!;
        }
      }
    } else if (totalWeight > 1e-10 && oldTotalWeight > 1e-10) {
      const scale = totalWeight / oldTotalWeight;
      for (let i = 0; i < input.dim; i++) {
        m1[i] = preDecayM1[i]! * scale;
      }
      trace = preDecayTrace * scale;
    }

    let m1NormSq = 0;
    for (let i = 0; i < input.dim; i++) {
      m1NormSq += m1[i]! * m1[i]!;
    }

    return {
      docWeights: Array.from(weights),
      totalWeight,
      rehearsedBeforeDecay,
      rehearsedAfterDecaySum: 0,
      firstMomentNorm: Math.sqrt(m1NormSq),
      secondMomentTrace: trace,
      allFinite: true,
    };
  };

  const comparator = (a: HolographicAuditOutput, b: HolographicAuditOutput): boolean => {
    if (a.allFinite !== b.allFinite) return false;
    if (a.rehearsedBeforeDecay !== b.rehearsedBeforeDecay) return false;
    if (a.rehearsedAfterDecaySum !== b.rehearsedAfterDecaySum) return false;
    if (a.docWeights.length !== b.docWeights.length) return false;
    for (let i = 0; i < a.docWeights.length; i++) {
      if (Math.abs(a.docWeights[i]! - b.docWeights[i]!) > 1e-5) return false;
    }
    if (Math.abs(a.totalWeight - b.totalWeight) > 1e-4) return false;
    if (Math.abs(a.firstMomentNorm - b.firstMomentNorm) > 1e-4) return false;
    if (Math.abs(a.secondMomentTrace - b.secondMomentTrace) > 1e-3) return false;
    return true;
  };

  const primaryInput1: HolographicAuditInput = {
    dim: 16,
    numDocs: 4,
    ops: [
      { docId: 0, seed: 'doc_a', weight: 1.0, rawRehearsedByte: 0xfe },
      { docId: 1, seed: 'doc_b', weight: 1.0, rawRehearsedByte: 0xff },
      { docId: 2, seed: 'doc_c', weight: 1.0, rawRehearsedByte: 0x00 },
    ],
    baseDecay: 0.9,
    decayMode: 'incremental',
  };

  const primaryInput2: HolographicAuditInput = {
    dim: 16,
    numDocs: 4,
    ops: [
      { docId: 0, seed: 'doc_evict', weight: 1.0, rawRehearsedByte: 0x01, evictAfter: true },
      { docId: 1, seed: 'doc_keep', weight: 0.8, rawRehearsedByte: 0x01 },
    ],
    baseDecay: 0.85,
    decayMode: 'incremental',
  };

  return {
    name: 'HolographicMemoryField::RehearsalBytePaddingAndMoments',
    domain: 'low-level',
    subject: executeSubject,
    comparator,
    options: {
      enforceImmutability: true,
      requireAllPerspectives: true,
      determinismRuns: 2,
      maxDurationMs: 50,
    },
    primaryCases: [
      {
        name: 'LSB bit-0 masking ignores 0xFE byte-padding noise while preserving 0xFF rehearsal boost',
        input: primaryInput1,
        expected: referenceOracle(primaryInput1),
      },
      {
        name: 'Eviction (weight=0) immediately zeroes rehearsed flag and prevents ghost rehearsal count',
        input: primaryInput2,
        expected: referenceOracle(primaryInput2),
      },
    ],
    poisonInputs: [
      {
        name: 'Poison: NaN & fractional docId injection + NaN/Infinity/negative weight injection',
        input: {
          dim: 16,
          numDocs: 4,
          ops: [
            { docId: 0, seed: 'valid_doc', weight: 1.0, rawRehearsedByte: 1 },
            { docId: Number.NaN, seed: 'nan_doc_id', weight: 1.0 },
            { docId: 1.75, seed: 'float_doc_id', weight: 1.0 },
            { docId: -5, seed: 'neg_doc_id', weight: 1.0 },
            { docId: 999, seed: 'oob_doc_id', weight: 1.0 },
            { docId: 1, seed: 'nan_weight', weight: Number.NaN },
            { docId: 1, seed: 'inf_weight', weight: Number.POSITIVE_INFINITY },
            { docId: 2, seed: 'neg_weight', weight: -42.0 },
          ],
          baseDecay: 0.9,
          decayMode: 'incremental',
        },
        invariantCheck: (actual) =>
          actual.allFinite &&
          actual.docWeights[0]! > 0.9 &&
          actual.docWeights[1] === 0 &&
          actual.docWeights[2] === 0 &&
          actual.rehearsedAfterDecaySum === 0,
        failureHint:
          'Non-integer docId or non-finite weight polluted moments/weights with NaN or Infinity',
      },
      {
        name: 'Poison: NaN vector payload & NaN salience / NaN baseDecay injection',
        input: {
          dim: 16,
          numDocs: 4,
          ops: [
            {
              docId: 0,
              seed: 'clean_doc',
              weight: 1.0,
              salience: Number.NaN,
              rawRehearsedByte: 0xfe,
            },
            { docId: 1, seed: 'poison_vec', weight: 1.0, corruptVecWithNaN: true },
          ],
          baseDecay: Number.NaN,
          decayMode: 'lazy',
        },
        invariantCheck: (actual) =>
          actual.allFinite &&
          Math.abs(actual.docWeights[0]! - 1.0) < 1e-6 &&
          actual.docWeights[1] === 0 &&
          actual.rehearsedBeforeDecay === 0,
        failureHint: 'NaN vector or NaN salience/baseDecay corrupted active holographic state',
      },
    ],
    referenceOracle,
    generatedSamples: [
      {
        dim: 16,
        numDocs: 6,
        ops: [
          { docId: 0, seed: 's0', weight: 0.75, rawRehearsedByte: 0x02, salience: 1.5 },
          { docId: 1, seed: 's1', weight: 1.25, rawRehearsedByte: 0x03, salience: 2.0 },
          { docId: 2, seed: 's2', weight: 0.5, rawRehearsedByte: 0x80, salience: 0.5 },
          { docId: 3, seed: 's3', weight: 0.9, rawRehearsedByte: 0x01, evictAfter: true },
        ],
        baseDecay: 0.88,
        decayMode: 'incremental',
      },
      {
        dim: 32,
        numDocs: 5,
        ops: [
          { docId: 0, seed: 't0', weight: 0.4, rawRehearsedByte: 0xaa, salience: 1.0 },
          { docId: 1, seed: 't1', weight: 0.6, rawRehearsedByte: 0xab, salience: 1.2 },
          { docId: 4, seed: 't4', weight: 1.1, rawRehearsedByte: 0xfe, salience: 0.8 },
        ],
        baseDecay: 0.92,
        decayMode: 'incremental',
        runSanitizerBeforeDecay: true,
      },
    ],
    regressionSuite: [
      {
        id: 'REG-20261028-015-LSB-PADDING-ISOLATION',
        input: {
          dim: 16,
          numDocs: 3,
          ops: [
            { docId: 0, seed: 'r0', weight: 1.0, rawRehearsedByte: 0b1111_1110 },
            { docId: 1, seed: 'r1', weight: 1.0, rawRehearsedByte: 0b1111_1111 },
            { docId: 2, seed: 'r2', weight: 1.0, rawRehearsedByte: 0b0000_0000 },
          ],
          baseDecay: 0.9,
          decayMode: 'lazy',
        },
        expected: referenceOracle({
          dim: 16,
          numDocs: 3,
          ops: [
            { docId: 0, seed: 'r0', weight: 1.0, rawRehearsedByte: 0b1111_1110 },
            { docId: 1, seed: 'r1', weight: 1.0, rawRehearsedByte: 0b1111_1111 },
            { docId: 2, seed: 'r2', weight: 1.0, rawRehearsedByte: 0b0000_0000 },
          ],
          baseDecay: 0.9,
          decayMode: 'lazy',
        }),
      },
    ],
  };
}

// ============================================================================
// CONCRETE SUITE 2: MultiWorldHologram (Fork/Prune Byte Isolation & Boundary)
// ============================================================================

export interface MultiWorldAuditInput {
  trunkRehearsedByteDoc0: number;
  trunkWeightDoc0: number;
  forkTargetWorld: number;
  pruneAndRefork: boolean;
}

export interface MultiWorldAuditOutput {
  forkSucceeded: boolean;
  targetRehearsedByte: number;
  targetSalienceDoc0: number;
  targetActiveFlag: number;
}

export function createMultiWorldVerificationSuite(): AgentVerificationSuiteSpec<
  MultiWorldAuditInput,
  MultiWorldAuditOutput
> {
  const DIM = 16;
  const NUM_DOCS = 4;

  const subject = (input: MultiWorldAuditInput): MultiWorldAuditOutput => {
    const docs = new Float32Array(NUM_DOCS * DIM);
    for (let d = 0; d < NUM_DOCS; d++) {
      docs.set(ContinuousHRR.generateUnitVector(DIM, `mw_doc_${d}`), d * DIM);
    }
    const weights = new Float32Array(NUM_DOCS);
    weights[0] = input.trunkWeightDoc0;

    const mw = new MultiWorldHologram(4, DIM, NUM_DOCS, 8, docs);
    mw.initTrunk(docs, weights, 'trunk');
    mw.worlds[0]!.rehearsed[0] = input.trunkRehearsedByteDoc0 & 0xff;
    mw.worlds[0]!.setSalience(0, 2.5);

    const firstFork = mw.fork(0, input.forkTargetWorld, 'branch_a');
    if (!firstFork) {
      return {
        forkSucceeded: false,
        targetRehearsedByte: -1,
        targetSalienceDoc0: -1,
        targetActiveFlag: 0,
      };
    }

    if (input.pruneAndRefork) {
      const w = mw.worlds[input.forkTargetWorld]!;
      w.rehearsed[0] = 0xff;
      w.setSalience(0, 9.0);
      mw.prune(input.forkTargetWorld);
      mw.worlds[0]!.rehearsed[0] = 0;
      mw.worlds[0]!.setSalience(0, 1.0);
      mw.fork(0, input.forkTargetWorld, 'branch_reborn');
    }

    const targetWorld = mw.worlds[input.forkTargetWorld]!;
    return {
      forkSucceeded: true,
      targetRehearsedByte: targetWorld.rehearsed[0]!,
      targetSalienceDoc0: targetWorld.salience[0]!,
      targetActiveFlag: mw.active[input.forkTargetWorld]!,
    };
  };

  const comparator = (a: MultiWorldAuditOutput, b: MultiWorldAuditOutput): boolean =>
    a.forkSucceeded === b.forkSucceeded &&
    a.targetRehearsedByte === b.targetRehearsedByte &&
    Math.abs(a.targetSalienceDoc0 - b.targetSalienceDoc0) < 1e-5 &&
    a.targetActiveFlag === b.targetActiveFlag;

  return {
    name: 'MultiWorldHologram::ForkPruneRehearsalIsolation',
    domain: 'boundary',
    subject,
    comparator,
    options: {
      enforceImmutability: true,
      requireAllPerspectives: true,
      determinismRuns: 2,
      maxDurationMs: 50,
    },
    primaryCases: [
      {
        name: 'Fork strips dirty upper padding bits (0xFE -> 0, 0xFF -> 1) on active doc',
        input: {
          trunkRehearsedByteDoc0: 0xff,
          trunkWeightDoc0: 1.0,
          forkTargetWorld: 1,
          pruneAndRefork: false,
        },
        expected: {
          forkSucceeded: true,
          targetRehearsedByte: 1,
          targetSalienceDoc0: 2.5,
          targetActiveFlag: 1,
        },
      },
      {
        name: 'Prune followed by re-fork resets stale rehearsed and salience buffers cleanly',
        input: {
          trunkRehearsedByteDoc0: 0xff,
          trunkWeightDoc0: 1.0,
          forkTargetWorld: 2,
          pruneAndRefork: true,
        },
        expected: {
          forkSucceeded: true,
          targetRehearsedByte: 0,
          targetSalienceDoc0: 1.0,
          targetActiveFlag: 1,
        },
      },
    ],
    poisonInputs: [
      {
        name: 'Out-of-bounds targetWorld (-1 or >= maxWorlds) or self-fork onto active trunk (0)',
        input: {
          trunkRehearsedByteDoc0: 0xff,
          trunkWeightDoc0: 1.0,
          forkTargetWorld: -1,
          pruneAndRefork: false,
        },
        invariantCheck: (actual) =>
          !actual.forkSucceeded && actual.targetActiveFlag === 0,
        failureHint:
          'Out-of-bounds forkTargetWorld must fail gracefully without throwing or mutating state',
      },
      {
        name: 'Inactive trunk document (weight=0) with dirty 0xFF rehearsal byte must fork as 0',
        input: {
          trunkRehearsedByteDoc0: 0xff,
          trunkWeightDoc0: 0,
          forkTargetWorld: 1,
          pruneAndRefork: false,
        },
        invariantCheck: (actual) =>
          actual.forkSucceeded && actual.targetRehearsedByte === 0,
        failureHint: 'Inactive document slot leaked dirty rehearsal bit across MultiWorld fork()',
      },
    ],
    regressionSuite: [
      {
        id: 'REG-20261028-015-MULTIWORLD-EVEN-BYTE-PADDING',
        input: {
          trunkRehearsedByteDoc0: 0xfe,
          trunkWeightDoc0: 1.0,
          forkTargetWorld: 1,
          pruneAndRefork: false,
        },
        expected: {
          forkSucceeded: true,
          targetRehearsedByte: 0,
          targetSalienceDoc0: 2.5,
          targetActiveFlag: 1,
        },
      },
    ],
  };
}
