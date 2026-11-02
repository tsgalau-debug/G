/* eslint-disable */
import { describe, test, expect } from 'vitest';
import { RetrievalPipeline, HybridCSRMatrix } from '../../app/rag/hybrid-pipeline';
import {
  WasmMathProgramV9BatchScorer,
  BurnMathV9Runtime,
} from '../../app/rag/wasm-math-v9-scorer';
import { encodeSemanticFallbackVector } from '../../app/rag/pipeline-bridge';
import { HolographicMemoryField } from '../../app/rag/holographic-memory';
import { MultiWorldHologram } from '../../app/rag/multi-world';
import { VSARLPolicyKernel } from '../../app/rag/vsarl-policy-kernel';
import {
  AgenticChunkOrchestrator,
  RetrievalStrategy,
} from '../../app/rag/agentic-chunk-orchestrator';
// @ts-ignore
import { loadWasm } from '../../../math compesor/helper/lib/engine.mjs';

describe('WasmMathProgramV9BatchScorer — Burn WASM V9 RAG Integration', () => {
  test('validates preflight contracts via mathPlanBinding and compiles deterministic V9 programs', async () => {
    const rt = (await loadWasm()) as BurnMathV9Runtime;
    const scorer = new WasmMathProgramV9BatchScorer(rt, 64, 768);
    const proof = scorer.contractProof;

    expect(proof.v9Schema).toBe('burn-research.math-program.v9');
    expect(proof.opcodes.add).toBe(17);
    expect(proof.opcodes.mul).toBe(19);
    expect(proof.opcodes.dot).toBe(49);
    expect(proof.dotPreflightAdmissible).toBe(true);
    expect(proof.cosinePreflightAdmissible).toBe(true);
    expect(proof.mulPreflightAdmissible).toBe(true);
    expect(proof.addPreflightAdmissible).toBe(true);
    expect(proof.hybridFusionPlanBytes).toBeGreaterThan(20);
    expect(proof.denseDotPlanBytes).toBeGreaterThan(15);
    expect(proof.denseCosinePlanBytes).toBeGreaterThan(15);
    expect(proof.denseHybridPlanBytes).toBeGreaterThan(30);

    scorer.dispose();
  });

  test('produces bit-equivalent top-k rankings to JS loop in RetrievalPipeline.query across strategies', async () => {
    const rt = (await loadWasm()) as BurnMathV9Runtime;
    const numTerms = 12;
    const numDocs = 8;
    const dim = 768;

    const inv = new HybridCSRMatrix(numTerms, numDocs, 12);
    for (let t = 0; t < numTerms; t++) {
      inv.rowPtr[t] = t;
      inv.colIdx[t] = t % numDocs;
      inv.values[t] = 1.2 + (t % 4) * 0.4;
    }
    inv.rowPtr[numTerms] = 12;

    const termUB = new Float32Array(numTerms).fill(2.5);
    const cooccur = new HybridCSRMatrix(0, 0, 0);
    const docFHRR = new Float32Array(numDocs * dim);
    const samples = [
      'Ksatria Kenji menghunus pedang katana di gerbang kuil kuno Desa Yamato',
      'Pendekar samurai mengayunkan bilah pedang di pelataran kuil tua Yamato',
      'Pedagang pasar menjual rempah dan roti hangat di dermaga pelabuhan',
      'Tetua Lin menjaga pustaka giok di puncak gunung sekte Yamato',
      'Pasukan penjaga perbatasan menyalakan obor sinyal di menara utara',
      'Tabib istana meracik ramuan penyembuh luka pedang untuk sang ksatria',
      'Naga air bangkit dari dasar danau berkabut di lembah terlarang',
      'Pandai besi menempa bilah katana baja hitam dengan api roh',
    ];
    for (let d = 0; d < numDocs; d++) {
      docFHRR.set(encodeSemanticFallbackVector(samples[d]!, dim), d * dim);
    }

    const pipeline = new RetrievalPipeline(numTerms, numDocs, dim, 256, 8, 8, 5);
    pipeline.build(inv, termUB, cooccur, docFHRR);

    const qTerms = new Int32Array([0, 1, 2, 3, 4]);
    const qIDF = new Float32Array([1.3, 0.9, 1.1, 0.85, 1.0]);
    const qVec = encodeSemanticFallbackVector('Ksatria pedang katana di kuil Desa Yamato', dim);

    const jsIdx = new Int32Array(5);
    const jsScr = new Float32Array(5);
    pipeline.setWasmBatchScorer(null);
    pipeline.query(qTerms, qIDF, qVec, 5, jsIdx, jsScr, { wBm25: 0.6, wSim: 0.4 });

    const scorer = new WasmMathProgramV9BatchScorer(rt, numDocs * 2, dim);
    pipeline.setWasmBatchScorer(scorer);

    const wasmIdx = new Int32Array(5);
    const wasmScr = new Float32Array(5);
    pipeline.query(qTerms, qIDF, qVec, 5, wasmIdx, wasmScr, { wBm25: 0.6, wSim: 0.4 });

    expect(Array.from(wasmIdx)).toEqual(Array.from(jsIdx));
    const eq = scorer.verifyBatchEquivalence(jsScr, wasmScr, 1e-5, 1e-5);
    expect(eq.passed).toBe(true);
    expect(eq.maxAbsError).toBeLessThan(1e-5);
    expect(scorer.totalHybridFusionBatches).toBe(1);

    scorer.dispose();
  });

  test('accelerates AgenticChunkOrchestrator Holographic strategy with exact inner-product equivalence', async () => {
    const rt = (await loadWasm()) as BurnMathV9Runtime;
    const dim = 768;
    const numDocs = 6;
    const docFHRR = new Float32Array(numDocs * dim);
    const loreDocs = [
      'Ksatria Kenji menghunus pedang katana di gerbang kuil kuno Desa Yamato',
      'Pendekar samurai mengayunkan bilah pedang di pelataran kuil tua Yamato',
      'Pedagang pasar menjual rempah dan roti hangat di dermaga pelabuhan selatan',
      'Tetua Lin menjaga pustaka giok dan gulungan sejarah di puncak gunung sekte',
      'Pasukan penjaga perbatasan menyalakan obor sinyal di menara benteng utara',
      'Naga air bangkit dari dasar danau berkabut di lembah terlarang',
    ];
    for (let d = 0; d < numDocs; d++) {
      docFHRR.set(encodeSemanticFallbackVector(loreDocs[d]!, dim), d * dim);
    }

    const pipeline = new RetrievalPipeline(16, numDocs, dim, 128, 8, 8, 4);
    const inv = new HybridCSRMatrix(16, numDocs, 0);
    const termUB = new Float32Array(16);
    const cooccur = new HybridCSRMatrix(0, 0, 0);
    pipeline.build(inv, termUB, cooccur, docFHRR);

    const multiWorld = new MultiWorldHologram(2, dim, numDocs, 16, docFHRR);
    const weights = new Float32Array([1.0, 0.8, 0.0, 0.9, 0.7, 0.85]);
    multiWorld.initTrunk(docFHRR, weights, 'trunk');
    const hologram: HolographicMemoryField = multiWorld.worlds[0]!;

    const rl = new VSARLPolicyKernel(32, 6, 32);
    const orchestrator = new AgenticChunkOrchestrator(
      pipeline,
      hologram,
      multiWorld,
      rl,
      dim,
      numDocs,
      4,
      32
    );

    const qTerms = new Int32Array([0, 1]);
    const qIDF = new Float32Array([1.0, 1.0]);
    const qVec = encodeSemanticFallbackVector(
      'Tetua Lin menjaga gulungan sejarah di pustaka puncak gunung',
      dim
    );

    // 1. JS path
    pipeline.setWasmBatchScorer(null);
    const jsRes = orchestrator.execute(RetrievalStrategy.Holographic, qTerms, qIDF, qVec, 2);
    const jsIndicesCopy = new Int32Array(jsRes.indices);
    const jsScoresCopy = new Float32Array(jsRes.scores);

    // 2. WASM V9 batch path
    const scorer = new WasmMathProgramV9BatchScorer(rt, numDocs * 2, dim);
    pipeline.setWasmBatchScorer(scorer);
    const wasmRes = orchestrator.execute(RetrievalStrategy.Holographic, qTerms, qIDF, qVec, 2);

    expect(Array.from(wasmRes.indices)).toEqual(Array.from(jsIndicesCopy));
    const eq = scorer.verifyBatchEquivalence(jsScoresCopy, wasmRes.scores, 1e-5, 1e-5);
    expect(eq.passed).toBe(true);
    expect(scorer.totalDenseDotBatches).toBe(1);
    expect(scorer.lastBatchSize).toBe(5); // 5 active docs (doc 2 has weight 0)

    scorer.dispose();
  });

  test('executes 5-input joint dense-hybrid scoring program (run5) matching reference formula', async () => {
    const rt = (await loadWasm()) as BurnMathV9Runtime;
    const dim = 768;
    const B = 4;
    const scorer = new WasmMathProgramV9BatchScorer(rt, 16, dim);

    const packedCands = new Float32Array(B * dim);
    const cands: Float32Array[] = [];
    for (let b = 0; b < B; b++) {
      const v = encodeSemanticFallbackVector(`Kandidat dokumen ke-${b}`, dim);
      cands.push(v);
      packedCands.set(v, b * dim);
    }
    const queryVec = encodeSemanticFallbackVector('Kandidat dokumen ke-1', dim);
    const sBm25 = new Float32Array([1.0, 0.75, 0.5, 0.25]);
    const wBm25 = 0.55;
    const wSim = 0.45;

    const wasmOut = new Float32Array(B);
    scorer.scoreDenseHybridBatch(B, packedCands, queryVec, sBm25, wBm25, wSim, wasmOut);

    const jsRef = new Float32Array(B);
    for (let b = 0; b < B; b++) {
      let dot = 0;
      for (let i = 0; i < dim; i++) dot += cands[b]![i]! * queryVec[i]!;
      jsRef[b] = wBm25 * sBm25[b]! + wSim * dot;
    }

    const eq = scorer.verifyBatchEquivalence(jsRef, wasmOut, 1e-5, 1e-5);
    expect(eq.passed).toBe(true);
    expect(scorer.totalDenseHybridBatches).toBe(1);

    scorer.dispose();
  });
});
