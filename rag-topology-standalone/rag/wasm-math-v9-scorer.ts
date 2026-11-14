/* eslint-disable */
export interface WasmTensorHandle {
  free(): void;
  shape(): Uint32Array;
  to_array(): Float32Array;
}

export interface WasmMathProgramV9Handle {
  free(): void;
  programIdentity(): string;
  programPlan(): Uint8Array;
  stepCount(): number;
  run1(a: WasmTensorHandle): WasmTensorHandle;
  run2(a: WasmTensorHandle, b: WasmTensorHandle): WasmTensorHandle;
  run3(a: WasmTensorHandle, b: WasmTensorHandle, c: WasmTensorHandle): WasmTensorHandle;
  run4(
    a: WasmTensorHandle,
    b: WasmTensorHandle,
    c: WasmTensorHandle,
    d: WasmTensorHandle
  ): WasmTensorHandle;
  run5(
    a: WasmTensorHandle,
    b: WasmTensorHandle,
    c: WasmTensorHandle,
    d: WasmTensorHandle,
    e: WasmTensorHandle
  ): WasmTensorHandle;
}

export interface WasmMathProgramV9BuilderHandle {
  free(): void;
  addBinary(op: number, lhs: number, rhs: number, output: number): void;
  addUnary(op: number, input: number, output: number): void;
  addClamp(input: number, output: number, min: number, max: number): void;
  addCosineSimilarity(lhs: number, rhs: number, output: number, epsilon: number): void;
  addExpandLike(input: number, reference: number, output: number): void;
  setOutput(slot: number): void;
  compile(): WasmMathProgramV9Handle;
}

export interface BurnMathV9Runtime {
  WasmTensor: new (data: Float32Array, shape: Uint32Array) => WasmTensorHandle;
  WasmMathProgramV9Builder: new (
    numInputs: number,
    numSlots: number
  ) => WasmMathProgramV9BuilderHandle;
  mathProgramCapabilities(): string;
  mathProgramV9Capabilities(): string;
  mathCheckOperation(
    operationId: string,
    lhsShape: Uint32Array,
    rhsShape: Uint32Array,
    u32Params: Uint32Array,
    f32Params: Float32Array
  ): string;
  mathPlanBinding(
    operationId: string,
    target: string,
    lhsShape: Uint32Array,
    rhsShape: Uint32Array,
    u32Params: Uint32Array,
    f32Params: Float32Array
  ): string;
  mathVerifyVectors(
    reference: Float32Array,
    candidate: Float32Array,
    absTol: number,
    relTol: number
  ): string;
}

export interface MathProgramV9ContractProof {
  v9Schema: string;
  opcodes: {
    add: number;
    sub: number;
    mul: number;
    div: number;
    dot: number;
    cosineSimilarity: number;
  };
  dotPreflightAdmissible: boolean;
  cosinePreflightAdmissible: boolean;
  mulPreflightAdmissible: boolean;
  addPreflightAdmissible: boolean;
  hybridFusionIdentity: string;
  hybridFusionPlanBytes: number;
  denseDotIdentity: string;
  denseDotPlanBytes: number;
  denseCosineIdentity: string;
  denseCosinePlanBytes: number;
  denseHybridIdentity: string;
  denseHybridPlanBytes: number;
}

export interface BatchScoringDiagnostics {
  totalHybridFusionBatches: number;
  totalDenseDotBatches: number;
  totalDenseCosineBatches: number;
  totalDenseHybridBatches: number;
  totalCandidatesScored: number;
  lastBatchSize: number;
  lastMaxAbsError: number;
  lastRmse: number;
  contractProof: MathProgramV9ContractProof;
}

export class WasmMathProgramV9BatchScorer {
  readonly rt: BurnMathV9Runtime;
  readonly maxCandidates: number;
  readonly dim: number;
  readonly contractProof: MathProgramV9ContractProof;

  private readonly hybridFusionProg: WasmMathProgramV9Handle;
  private readonly denseDotBatchProg: WasmMathProgramV9Handle;
  private readonly denseCosineBatchProg: WasmMathProgramV9Handle;
  private readonly denseHybridScoringProg: WasmMathProgramV9Handle;

  private readonly wBm25ScalarBuf = new Float32Array(1);
  private readonly wSimScalarBuf = new Float32Array(1);
  private readonly shapeSingleScalar = new Uint32Array([1, 1, 1, 1]);
  private readonly shapeSingleVec: Uint32Array;
  private readonly shapeBatchScalar = new Uint32Array([1, 1, 1, 1]);
  private readonly shapeBatchVec: Uint32Array;
  private readonly packedDocsStaging: Float32Array;
  private readonly queryVecStaging: Float32Array;
  private readonly scalarBm25Staging: Float32Array;
  private readonly scalarSimStaging: Float32Array;
  private readonly activeDocIdsStaging: Int32Array;

  totalHybridFusionBatches = 0;
  totalDenseDotBatches = 0;
  totalDenseCosineBatches = 0;
  totalDenseHybridBatches = 0;
  totalCandidatesScored = 0;
  lastBatchSize = 0;
  lastMaxAbsError = 0;
  lastRmse = 0;

  constructor(rt: BurnMathV9Runtime, maxCandidates = 2048, dim = 768) {
    this.rt = rt;
    this.maxCandidates = Math.max(16, maxCandidates);
    this.dim = Math.max(1, dim);
    this.shapeSingleVec = new Uint32Array([1, this.dim, 1, 1]);
    this.shapeBatchVec = new Uint32Array([1, this.dim, 1, 1]);
    this.packedDocsStaging = new Float32Array(this.maxCandidates * this.dim);
    this.queryVecStaging = new Float32Array(this.dim);
    this.scalarBm25Staging = new Float32Array(this.maxCandidates);
    this.scalarSimStaging = new Float32Array(this.maxCandidates);
    this.activeDocIdsStaging = new Int32Array(this.maxCandidates);

    const v9Cap = JSON.parse(rt.mathProgramV9Capabilities());
    const baseCap = JSON.parse(rt.mathProgramCapabilities());
    const opcodes = {
      add: Number(baseCap?.opcodes?.add ?? 17),
      sub: Number(baseCap?.opcodes?.sub ?? 18),
      mul: Number(baseCap?.opcodes?.mul ?? 19),
      div: Number(baseCap?.opcodes?.div ?? 20),
      dot: Number(baseCap?.opcodes?.dot ?? 49),
      cosineSimilarity: Number(baseCap?.opcodes?.cosineSimilarity ?? 52),
    };

    const sampleBatch = Math.min(32, this.maxCandidates);
    const sampleVecShape = new Uint32Array([sampleBatch, this.dim, 1, 1]);
    const sampleScalarShape = new Uint32Array([sampleBatch, 1, 1, 1]);
    const emptyU32 = new Uint32Array(0);
    const emptyF32 = new Float32Array(0);
    const epsF32 = new Float32Array([1e-8]);

    const dotPlan = JSON.parse(
      rt.mathPlanBinding('linalg.dot', 'program', sampleVecShape, sampleVecShape, emptyU32, emptyF32)
    );
    const cosPlan = JSON.parse(
      rt.mathPlanBinding('linalg.cosine_similarity', 'program', sampleVecShape, sampleVecShape, emptyU32, epsF32)
    );
    const mulPlan = JSON.parse(
      rt.mathPlanBinding('numeric.mul', 'program', sampleScalarShape, sampleScalarShape, emptyU32, emptyF32)
    );
    const addPlan = JSON.parse(
      rt.mathPlanBinding('numeric.add', 'program', sampleScalarShape, sampleScalarShape, emptyU32, emptyF32)
    );

    if (
      !dotPlan?.preflight?.metadata_admissible ||
      !cosPlan?.preflight?.metadata_admissible ||
      !mulPlan?.preflight?.metadata_admissible ||
      !addPlan?.preflight?.metadata_admissible
    ) {
      throw new Error(
        `WasmMathProgramV9 preflight contract rejected candidate scoring shapes: dot=${dotPlan?.status}, cos=${cosPlan?.status}, mul=${mulPlan?.status}, add=${addPlan?.status}`
      );
    }

    const fusionBuilder = new rt.WasmMathProgramV9Builder(4, 9);
    try {
      fusionBuilder.addExpandLike(2, 0, 4);
      fusionBuilder.addExpandLike(3, 1, 5);
      fusionBuilder.addBinary(opcodes.mul, 0, 4, 6);
      fusionBuilder.addBinary(opcodes.mul, 1, 5, 7);
      fusionBuilder.addBinary(opcodes.add, 6, 7, 8);
      fusionBuilder.setOutput(8);
      this.hybridFusionProg = fusionBuilder.compile();
    } finally {
      fusionBuilder.free();
    }

    const dotBuilder = new rt.WasmMathProgramV9Builder(2, 4);
    try {
      dotBuilder.addExpandLike(1, 0, 2);
      dotBuilder.addBinary(opcodes.dot, 0, 2, 3);
      dotBuilder.setOutput(3);
      this.denseDotBatchProg = dotBuilder.compile();
    } finally {
      dotBuilder.free();
    }

    const cosineBuilder = new rt.WasmMathProgramV9Builder(2, 4);
    try {
      cosineBuilder.addExpandLike(1, 0, 2);
      cosineBuilder.addCosineSimilarity(0, 2, 3, 1e-8);
      cosineBuilder.setOutput(3);
      this.denseCosineBatchProg = cosineBuilder.compile();
    } finally {
      cosineBuilder.free();
    }

    const denseHybridBuilder = new rt.WasmMathProgramV9Builder(5, 12);
    try {
      denseHybridBuilder.addExpandLike(1, 0, 5);
      denseHybridBuilder.addCosineSimilarity(0, 5, 6, 1e-8);
      denseHybridBuilder.addExpandLike(3, 2, 7);
      denseHybridBuilder.addExpandLike(4, 2, 8);
      denseHybridBuilder.addBinary(opcodes.mul, 2, 7, 9);
      denseHybridBuilder.addBinary(opcodes.mul, 6, 8, 10);
      denseHybridBuilder.addBinary(opcodes.add, 9, 10, 11);
      denseHybridBuilder.setOutput(11);
      this.denseHybridScoringProg = denseHybridBuilder.compile();
    } finally {
      denseHybridBuilder.free();
    }

    this.contractProof = {
      v9Schema: String(v9Cap?.schema ?? 'burn-research.math-program.v9'),
      opcodes,
      dotPreflightAdmissible: Boolean(dotPlan?.preflight?.metadata_admissible),
      cosinePreflightAdmissible: Boolean(cosPlan?.preflight?.metadata_admissible),
      mulPreflightAdmissible: Boolean(mulPlan?.preflight?.metadata_admissible),
      addPreflightAdmissible: Boolean(addPlan?.preflight?.metadata_admissible),
      hybridFusionIdentity: this.hybridFusionProg.programIdentity(),
      hybridFusionPlanBytes: this.hybridFusionProg.programPlan().length,
      denseDotIdentity: this.denseDotBatchProg.programIdentity(),
      denseDotPlanBytes: this.denseDotBatchProg.programPlan().length,
      denseCosineIdentity: this.denseCosineBatchProg.programIdentity(),
      denseCosinePlanBytes: this.denseCosineBatchProg.programPlan().length,
      denseHybridIdentity: this.denseHybridScoringProg.programIdentity(),
      denseHybridPlanBytes: this.denseHybridScoringProg.programPlan().length,
    };
  }

  private normalizeBatchCount(numCandidates: number): number {
    if (!Number.isFinite(numCandidates)) return 0;
    const n = Math.trunc(numCandidates);
    if (n <= 0) return 0;
    return Math.min(n, this.maxCandidates);
  }

  private prepareAlignedScalarView(
    buf: Float32Array,
    count: number,
    staging: Float32Array
  ): Float32Array {
    let needsStaging = buf.length < count;
    if (!needsStaging) {
      for (let i = 0; i < count; i++) {
        if (!Number.isFinite(buf[i]!)) {
          needsStaging = true;
          break;
        }
      }
    }
    if (!needsStaging) {
      return buf.length === count ? buf : buf.subarray(0, count);
    }
    for (let i = 0; i < count; i++) {
      const v = i < buf.length ? buf[i]! : 0;
      staging[i] = Number.isFinite(v) ? v : 0;
    }
    return staging.subarray(0, count);
  }

  private prepareAlignedVectorView(
    buf: Float32Array,
    expectedFloats: number,
    staging: Float32Array
  ): Float32Array {
    let needsStaging = buf.length < expectedFloats;
    if (!needsStaging) {
      for (let i = 0; i < expectedFloats; i++) {
        if (!Number.isFinite(buf[i]!)) {
          needsStaging = true;
          break;
        }
      }
    }
    if (!needsStaging) {
      return buf.length === expectedFloats ? buf : buf.subarray(0, expectedFloats);
    }
    for (let i = 0; i < expectedFloats; i++) {
      const v = i < buf.length ? buf[i]! : 0;
      staging[i] = Number.isFinite(v) ? v : 0;
    }
    return staging.subarray(0, expectedFloats);
  }

  fuseHybridBatch(
    numCandidates: number,
    sBm25Buf: Float32Array,
    sSimBuf: Float32Array,
    wBm25: number,
    wSim: number,
    outScores: Float32Array
  ): void {
    const B = this.normalizeBatchCount(numCandidates);
    if (B <= 0) return;

    this.shapeBatchScalar[0] = B;
    this.wBm25ScalarBuf[0] = Number.isFinite(wBm25) ? wBm25 : 0;
    this.wSimScalarBuf[0] = Number.isFinite(wSim) ? wSim : 0;

    const sBm25View = this.prepareAlignedScalarView(sBm25Buf, B, this.scalarBm25Staging);
    const sSimView = this.prepareAlignedScalarView(sSimBuf, B, this.scalarSimStaging);

    let tSBm25: WasmTensorHandle | null = null;
    let tSSim: WasmTensorHandle | null = null;
    let tWBm25: WasmTensorHandle | null = null;
    let tWSim: WasmTensorHandle | null = null;
    let tOut: WasmTensorHandle | null = null;

    try {
      tSBm25 = new this.rt.WasmTensor(sBm25View, this.shapeBatchScalar);
      tSSim = new this.rt.WasmTensor(sSimView, this.shapeBatchScalar);
      tWBm25 = new this.rt.WasmTensor(this.wBm25ScalarBuf, this.shapeSingleScalar);
      tWSim = new this.rt.WasmTensor(this.wSimScalarBuf, this.shapeSingleScalar);

      tOut = this.hybridFusionProg.run4(tSBm25, tSSim, tWBm25, tWSim);
      const res = tOut.to_array();
      const writeLen = Math.min(B, outScores.length);
      for (let i = 0; i < writeLen; i++) {
        const val = res[i]!;
        outScores[i] = Number.isFinite(val) ? val : 0;
      }

      this.totalHybridFusionBatches++;
      this.totalCandidatesScored += B;
      this.lastBatchSize = B;
    } finally {
      tOut?.free();
      tWSim?.free();
      tWBm25?.free();
      tSSim?.free();
      tSBm25?.free();
    }
  }

  scoreDenseDotBatch(
    numCandidates: number,
    packedCandVectors: Float32Array,
    queryVector: Float32Array,
    outScores: Float32Array
  ): void {
    const B = this.normalizeBatchCount(numCandidates);
    if (B <= 0) return;

    this.shapeBatchVec[0] = B;
    const totalFloats = B * this.dim;
    const candView = this.prepareAlignedVectorView(
      packedCandVectors,
      totalFloats,
      this.packedDocsStaging
    );
    const queryView = this.prepareAlignedVectorView(
      queryVector,
      this.dim,
      this.queryVecStaging
    );

    let tCand: WasmTensorHandle | null = null;
    let tQuery: WasmTensorHandle | null = null;
    let tOut: WasmTensorHandle | null = null;

    try {
      tCand = new this.rt.WasmTensor(candView, this.shapeBatchVec);
      tQuery = new this.rt.WasmTensor(queryView, this.shapeSingleVec);
      tOut = this.denseDotBatchProg.run2(tCand, tQuery);

      const res = tOut.to_array();
      const writeLen = Math.min(B, outScores.length);
      for (let i = 0; i < writeLen; i++) {
        const val = res[i]!;
        outScores[i] = Number.isFinite(val) ? val : 0;
      }

      this.totalDenseDotBatches++;
      this.totalCandidatesScored += B;
      this.lastBatchSize = B;
    } finally {
      tOut?.free();
      tQuery?.free();
      tCand?.free();
    }
  }

  scoreDenseCandidatesBatch(
    numCandidates: number,
    packedCandVectors: Float32Array,
    queryVector: Float32Array,
    outScores: Float32Array
  ): void {
    const B = this.normalizeBatchCount(numCandidates);
    if (B <= 0) return;

    this.shapeBatchVec[0] = B;
    const totalFloats = B * this.dim;
    const candView = this.prepareAlignedVectorView(
      packedCandVectors,
      totalFloats,
      this.packedDocsStaging
    );
    const queryView = this.prepareAlignedVectorView(
      queryVector,
      this.dim,
      this.queryVecStaging
    );

    let tCand: WasmTensorHandle | null = null;
    let tQuery: WasmTensorHandle | null = null;
    let tOut: WasmTensorHandle | null = null;

    try {
      tCand = new this.rt.WasmTensor(candView, this.shapeBatchVec);
      tQuery = new this.rt.WasmTensor(queryView, this.shapeSingleVec);
      tOut = this.denseCosineBatchProg.run2(tCand, tQuery);

      const res = tOut.to_array();
      const writeLen = Math.min(B, outScores.length);
      for (let i = 0; i < writeLen; i++) {
        const val = res[i]!;
        outScores[i] = Number.isFinite(val) ? val : 0;
      }

      this.totalDenseCosineBatches++;
      this.totalCandidatesScored += B;
      this.lastBatchSize = B;
    } finally {
      tOut?.free();
      tQuery?.free();
      tCand?.free();
    }
  }

  scoreActiveHolographicDocs(
    reconVector: Float32Array,
    docVectors: Float32Array,
    docWeights: Float32Array,
    totalWeight: number,
    numDocs: number,
    outDocIds: Int32Array,
    outScores: Float32Array
  ): number {
    const limit = Math.min(this.normalizeBatchCount(numDocs), docWeights.length);
    let activeCount = 0;

    for (let d = 0; d < limit; d++) {
      const w = docWeights[d]!;
      if (totalWeight > 1e-10 && (!Number.isFinite(w) || w <= 1e-10)) continue;
      this.activeDocIdsStaging[activeCount] = d;
      const srcOff = d * this.dim;
      const dstOff = activeCount * this.dim;
      for (let i = 0; i < this.dim; i++) {
        const val = srcOff + i < docVectors.length ? docVectors[srcOff + i]! : 0;
        this.packedDocsStaging[dstOff + i] = Number.isFinite(val) ? val : 0;
      }
      activeCount++;
    }

    if (activeCount === 0) return 0;

    this.scoreDenseDotBatch(activeCount, this.packedDocsStaging, reconVector, outScores);
    const idWriteLen = Math.min(activeCount, outDocIds.length);
    for (let i = 0; i < idWriteLen; i++) {
      outDocIds[i] = this.activeDocIdsStaging[i]!;
    }
    return activeCount;
  }

  scoreDenseHybridBatch(
    numCandidates: number,
    packedCandVectors: Float32Array,
    queryVector: Float32Array,
    sBm25Buf: Float32Array,
    wBm25: number,
    wSim: number,
    outScores: Float32Array
  ): void {
    const B = this.normalizeBatchCount(numCandidates);
    if (B <= 0) return;

    this.shapeBatchVec[0] = B;
    this.shapeBatchScalar[0] = B;
    this.wBm25ScalarBuf[0] = Number.isFinite(wBm25) ? wBm25 : 0;
    this.wSimScalarBuf[0] = Number.isFinite(wSim) ? wSim : 0;

    const totalFloats = B * this.dim;
    const candView = this.prepareAlignedVectorView(
      packedCandVectors,
      totalFloats,
      this.packedDocsStaging
    );
    const queryView = this.prepareAlignedVectorView(
      queryVector,
      this.dim,
      this.queryVecStaging
    );
    const sBm25View = this.prepareAlignedScalarView(sBm25Buf, B, this.scalarBm25Staging);

    let tCand: WasmTensorHandle | null = null;
    let tQuery: WasmTensorHandle | null = null;
    let tSBm25: WasmTensorHandle | null = null;
    let tWBm25: WasmTensorHandle | null = null;
    let tWSim: WasmTensorHandle | null = null;
    let tOut: WasmTensorHandle | null = null;

    try {
      tCand = new this.rt.WasmTensor(candView, this.shapeBatchVec);
      tQuery = new this.rt.WasmTensor(queryView, this.shapeSingleVec);
      tSBm25 = new this.rt.WasmTensor(sBm25View, this.shapeBatchScalar);
      tWBm25 = new this.rt.WasmTensor(this.wBm25ScalarBuf, this.shapeSingleScalar);
      tWSim = new this.rt.WasmTensor(this.wSimScalarBuf, this.shapeSingleScalar);

      tOut = this.denseHybridScoringProg.run5(tCand, tQuery, tSBm25, tWBm25, tWSim);
      const res = tOut.to_array();
      const writeLen = Math.min(B, outScores.length);
      for (let i = 0; i < writeLen; i++) {
        const val = res[i]!;
        outScores[i] = Number.isFinite(val) ? val : 0;
      }

      this.totalDenseHybridBatches++;
      this.totalCandidatesScored += B;
      this.lastBatchSize = B;
    } finally {
      tOut?.free();
      tWSim?.free();
      tWBm25?.free();
      tSBm25?.free();
      tQuery?.free();
      tCand?.free();
    }
  }

  verifyBatchEquivalence(
    reference: Float32Array,
    candidate: Float32Array,
    absTol = 1e-5,
    relTol = 1e-5
  ): { passed: boolean; maxAbsError: number; rmse: number } {
    const report = JSON.parse(
      this.rt.mathVerifyVectors(reference, candidate, absTol, relTol)
    );
    const maxAbsError = Number(report?.max_abs_error ?? 0);
    const rmse = Number(report?.rmse ?? 0);
    this.lastMaxAbsError = maxAbsError;
    this.lastRmse = rmse;
    return {
      passed: Boolean(report?.passed),
      maxAbsError,
      rmse,
    };
  }

  getDiagnostics(): BatchScoringDiagnostics {
    return {
      totalHybridFusionBatches: this.totalHybridFusionBatches,
      totalDenseDotBatches: this.totalDenseDotBatches,
      totalDenseCosineBatches: this.totalDenseCosineBatches,
      totalDenseHybridBatches: this.totalDenseHybridBatches,
      totalCandidatesScored: this.totalCandidatesScored,
      lastBatchSize: this.lastBatchSize,
      lastMaxAbsError: this.lastMaxAbsError,
      lastRmse: this.lastRmse,
      contractProof: this.contractProof,
    };
  }

  dispose(): void {
    this.hybridFusionProg.free();
    this.denseDotBatchProg.free();
    this.denseCosineBatchProg.free();
    this.denseHybridScoringProg.free();
  }

  static async createForBrowserWorker(
    maxCandidates = 2048,
    dim = 768,
    jsUrl = '/wasm/burn_research.js',
    wasmUrl = '/wasm/burn_research_bg.wasm'
  ): Promise<WasmMathProgramV9BatchScorer | null> {
    try {
      if (typeof fetch !== 'function') return null;
      const mod = await import(/* @vite-ignore */ jsUrl);
      if (typeof mod?.default === 'function') {
        await mod.default(wasmUrl);
      }
      return new WasmMathProgramV9BatchScorer(mod as BurnMathV9Runtime, maxCandidates, dim);
    } catch {
      return null;
    }
  }
}
