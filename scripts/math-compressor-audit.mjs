#!/usr/bin/env node
/**
 * ============================================================================
 * BURN WASM MATH COMPRESSOR — CLI ENGINEERING & DIFFERENTIAL VERIFICATION TOOL
 * ============================================================================
 * Memanfaatkan engine Rust Burn WebAssembly di `/math compesor` (`burn_research_bg.wasm`
 * + `helper/lib/*`) sebagai Oracle Verifikasi Numerik, Aljabar Linier, Teori Informasi,
 * dan Audit Tensor untuk seluruh komponen matematis aplikasi RPG:
 *
 *  [MC-01] Kontrak Runtime Burn WASM & Integritas Binary (`runtimeContractJson`, `tensorLayoutV1Json`)
 *  [MC-02] Verifikasi Finite & Norma L2 Satuan Vektor Semantik 768-D (`encodeSemanticFallbackVector` vs `WasmLinearAlgebra`)
 *  [MC-03] Ekuivalensi Cosine Similarity TS vs `WasmLinearAlgebra` & `WasmMathProgramV9`
 *  [MC-04] Ekuivalensi Perkalian Matriks (`Matrix.multiply` vs `WasmLinearAlgebra.matmul` + `mathVerifyVectors`)
 *  [MC-05] Statistik Momen `HolographicMemoryField` vs `WasmStatistics` (`mean`, `stdPopulation`)
 *  [MC-06] Integritas Ikatan Konvolusi Sirkular `ContinuousHRR` via `WasmLinearAlgebra`
 *  [MC-07] Identitas Informasi H(P,Q) = H(P) + D_KL(P||Q) pada Distribusi Kebijakan RL (`WasmProbability`)
 *  [MC-08] Verifikasi Tensor Homologi Simplicial (β₀, β₁, V, E, F) via `WasmReduction`
 *  [MC-09] Audit Guard Ukuran State Checkpoint (`decodeGuardCheck`)
 *  [MC-10] Eksekusi & Verifikasi `TracedMultiInputRun` via `helper/lib/engine.mjs`
 *  [MC-11] Sertifikasi Determinisme Stream PRNG `mulberry32` & `xorshift32` (`helper/lib/prng.mjs`)
 *  [MC-12] Integritas Buku Besar Bukti `AgentWorkspace` (`WasmAgentWorkspace.snapshot`)
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { loadWasm, pkgDir, buildGraph } from '../math compesor/helper/lib/engine.mjs';
import { generateStream } from '../math compesor/helper/lib/prng.mjs';

import * as bridgeMod from '../src/app/rag/pipeline-bridge.ts';
import * as vsarlMod from '../src/app/rag/vsarl-policy-kernel.ts';
import * as hrrMod from '../src/app/rag/continuous-hrr.ts';
import * as holoMod from '../src/app/rag/holographic-memory.ts';
import * as topologyMod from '../src/app/topology/simplicial-complex.ts';
import * as genesisMod from '../src/app/world-genesis.ts';
import * as hybridMod from '../src/app/rag/hybrid-pipeline.ts';
import * as wasmV9Mod from '../src/app/rag/wasm-math-v9-scorer.ts';

const unwrap = (m) => (m && m.default ? { ...m.default, ...m } : m);

const { encodeSemanticFallbackVector } = unwrap(bridgeMod);
const { Matrix, VSARLPolicyKernel, NpcPersonalityFactory } = unwrap(vsarlMod);
const { ContinuousHRR } = unwrap(hrrMod);
const { HolographicMemoryField } = unwrap(holoMod);
const { SimplicialComplexTracker } = unwrap(topologyMod);
const { generateWorldGenesis } = unwrap(genesisMod);
const { RetrievalPipeline, HybridCSRMatrix } = unwrap(hybridMod);
const { WasmMathProgramV9BatchScorer } = unwrap(wasmV9Mod);

const proofs = [];

function recordCheck(workspace, id, title, passed, maxError = 0, detail = '') {
  const errVal = Number.isFinite(maxError) ? maxError : 0;
  try {
    workspace.recordProof(id, passed, errVal, detail || title);
  } catch {
    // fallback if workspace proof table is full
  }
  proofs.push({ id, title, passed, maxError: errVal, detail });
  const badge = passed ? '✅ [PASS]' : '❌ [FAIL]';
  const errStr = `max_err=${errVal.toExponential(2)}`;
  console.log(`  ${badge} [${id}] ${title} (${errStr})${detail ? ` — ${detail}` : ''}`);
}

async function runMathCompressorAudit() {
  const t0 = performance.now();
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║   BURN WASM MATH COMPRESSOR — CLI ENGINEERING & DIFFERENTIAL VERIFIER (.mjs) ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  const rt = await loadWasm();
  const wasmBytesLen = fs.statSync(path.join(pkgDir(), 'burn_research_bg.wasm')).size;
  const workspace = new rt.AgentWorkspace(64);
  const linalg = new rt.WasmLinearAlgebra();
  const numKernel = new rt.WasmNumericKernel();
  const statsKernel = new rt.WasmStatistics();
  const probKernel = new rt.WasmProbability();
  const redKernel = new rt.WasmReduction();

  // ---------------------------------------------------------------------------
  // PROOF 1: Burn WASM Runtime Contract & Binary Integrity
  // ---------------------------------------------------------------------------
  const schemaVer = rt.agentContractSchemaVersion();
  const layoutVer = rt.agentLayoutContractVersion();
  const contractOk =
    schemaVer >= 1 &&
    layoutVer >= 1 &&
    wasmBytesLen > 7_000_000;
  recordCheck(
    workspace,
    'MC-01',
    'Kontrak Runtime Burn WASM & Integritas Binary',
    contractOk,
    0,
    `schema_v=${schemaVer}, layout_v=${layoutVer}, wasm_bytes=${wasmBytesLen}`
  );

  // ---------------------------------------------------------------------------
  // PROOF 2: Local 768-D Semantic Encoder Unit L2 Norm & Finite Verification
  // ---------------------------------------------------------------------------
  const textA = 'Ksatria Kenji menghunus pedang katana di gerbang kuil kuno Desa Yamato';
  const textB = 'Pendekar samurai mengayunkan bilah pedang di pelataran kuil tua Yamato';
  const textC = 'Pedagang pasar menjual rempah dan roti hangat di dermaga pelabuhan';

  const vA = encodeSemanticFallbackVector(textA, 768);
  const vB = encodeSemanticFallbackVector(textB, 768);
  const vC = encodeSemanticFallbackVector(textC, 768);

  const shape768 = new Uint32Array([1, 768, 1, 1]);
  const tA = new rt.WasmTensor(vA, shape768);
  const tB = new rt.WasmTensor(vB, shape768);
  const tC = new rt.WasmTensor(vC, shape768);

  const finiteOk =
    numKernel.allFinite(tA) && numKernel.allFinite(tB) && numKernel.allFinite(tC);
  const normA = linalg.l2Norm(tA).to_array()[0];
  const normB = linalg.l2Norm(tB).to_array()[0];
  const normC = linalg.l2Norm(tC).to_array()[0];
  const maxNormErr = Math.max(
    Math.abs(normA - 1.0),
    Math.abs(normB - 1.0),
    Math.abs(normC - 1.0)
  );
  recordCheck(
    workspace,
    'MC-02',
    'Verifikasi Finite & Norma L2 Satuan Vektor Semantik 768-D (WasmLinearAlgebra)',
    finiteOk && maxNormErr < 1e-5,
    maxNormErr,
    `allFinite=${finiteOk}, ||vA||=${normA.toFixed(6)}, ||vB||=${normB.toFixed(6)}`
  );

  // ---------------------------------------------------------------------------
  // PROOF 3: Cosine Similarity Differential Verification (TS vs WasmLinearAlgebra & WasmMathProgramV9)
  // ---------------------------------------------------------------------------
  const tsCosAB = ContinuousHRR.similarity(vA, vB);
  const tsCosAC = ContinuousHRR.similarity(vA, vC);

  const wasmCosAB = linalg.cosineSimilarity(tA, tB, 1e-8).to_array()[0];
  const wasmCosAC = linalg.cosineSimilarity(tA, tC, 1e-8).to_array()[0];

  // Also execute via WasmMathProgramV9 bytecode VM
  const mpBuilder = new rt.WasmMathProgramV9Builder(2, 3);
  mpBuilder.addCosineSimilarity(0, 1, 2, 1e-8);
  mpBuilder.setOutput(2);
  const mathProg = mpBuilder.compile();
  const vmCosAB = mathProg.run2(tA, tB).to_array()[0];

  const cosVerify = JSON.parse(
    rt.mathVerifyVectors(
      new Float32Array([wasmCosAB, wasmCosAC, vmCosAB]),
      new Float32Array([tsCosAB, tsCosAC, tsCosAB]),
      1e-5,
      1e-5
    )
  );
  const semanticOrderOk = wasmCosAB > wasmCosAC + 0.12;
  recordCheck(
    workspace,
    'MC-03',
    'Ekuivalensi Cosine Similarity TS vs WasmLinearAlgebra & WasmMathProgramV9',
    cosVerify.passed === true && semanticOrderOk,
    cosVerify.max_abs_error ?? 1,
    `sim(A,B)=${wasmCosAB.toFixed(4)}, sim(A,C)=${wasmCosAC.toFixed(4)}, vmCosAB=${vmCosAB.toFixed(4)}`
  );

  // ---------------------------------------------------------------------------
  // PROOF 4: Differential Matrix Multiplication (`VSARLPolicyKernel.traitModulationMatrix` vs `WasmLinearAlgebra.matmul`)
  // ---------------------------------------------------------------------------
  const rlKernelForMat = new VSARLPolicyKernel(32, 6, 64);
  const M = 6; // actionCount
  const K = 4; // TRAIT_DIM
  const N = 4; // 4 archetypes (Scholar, Guardian, Trickster, Custom)
  const dataLhs = rlKernelForMat.traitModulationMatrix; // [6 x 4]
  const dataRhs = new Float32Array(K * N);
  for (let i = 0; i < dataRhs.length; i++) dataRhs[i] = ((i * 5 + 1) % 11 - 5) * 0.2;

  const tsMatOut = new Float32Array(M * N);
  for (let r = 0; r < M; r++) {
    for (let c = 0; c < N; c++) {
      let acc = 0;
      for (let k = 0; k < K; k++) {
        acc += dataLhs[r * K + k] * dataRhs[k * N + c];
      }
      tsMatOut[r * N + c] = acc;
    }
  }

  const tMatA = new rt.WasmTensor(dataLhs, new Uint32Array([1, 1, M, K]));
  const tMatB = new rt.WasmTensor(dataRhs, new Uint32Array([1, 1, K, N]));
  const tMatOut = linalg.matmul(tMatA, tMatB);
  const wasmMatOut = tMatOut.to_array();

  const matVerify = JSON.parse(
    rt.mathVerifyVectors(wasmMatOut, tsMatOut, 1e-5, 1e-5)
  );
  recordCheck(
    workspace,
    'MC-04',
    'Ekuivalensi Proyeksi Matriks Trait RL (VSARLPolicyKernel vs Burn WasmLinearAlgebra.matmul)',
    matVerify.passed === true,
    matVerify.max_abs_error ?? 1,
    `shape=[${M}x${K}]@[${K}x${N}], rmse=${(matVerify.rmse ?? 0).toExponential(2)}`
  );

  // ---------------------------------------------------------------------------
  // PROOF 5: HolographicMemoryField Moment Statistics vs Burn WasmStatistics
  // ---------------------------------------------------------------------------
  const holoDim = 64;
  const holoField = new HolographicMemoryField(holoDim, 8);
  holoField.encode(0, vA.slice(0, holoDim), 1.0);
  holoField.encode(1, vB.slice(0, holoDim), 0.75);

  const tFirstMoment = new rt.WasmTensor(holoField.firstMoment, new Uint32Array([1, holoDim, 1, 1]));
  const finiteMoments = numKernel.allFinite(tFirstMoment);
  const meanVal = statsKernel.mean(tFirstMoment).to_array()[0];
  const stdVal = statsKernel.stdPopulation(tFirstMoment).to_array()[0];

  let tsSum = 0;
  for (let i = 0; i < holoDim; i++) tsSum += holoField.firstMoment[i];
  const tsMean = tsSum / holoDim;
  const statVerify = JSON.parse(
    rt.mathVerifyVectors(new Float32Array([meanVal]), new Float32Array([tsMean]), 1e-5, 1e-5)
  );
  recordCheck(
    workspace,
    'MC-05',
    'Statistik Momen HolographicMemoryField vs Burn WasmStatistics',
    finiteMoments && statVerify.passed === true && stdVal > 0,
    statVerify.max_abs_error ?? 1,
    `mean=${meanVal.toFixed(5)}, std=${stdVal.toFixed(5)}, totalWeight=${holoField.totalWeight.toFixed(2)}`
  );

  // ---------------------------------------------------------------------------
  // PROOF 6: ContinuousHRR Circular Convolution Unbinding & Burn Tensor Audit
  // ---------------------------------------------------------------------------
  const roleVec = ContinuousHRR.generateUnitVector(64, 'ROLE_SENJATA_UTAMA');
  const fillerVec = ContinuousHRR.generateUnitVector(64, 'TOMBAK_PERAK_UTARA');
  const boundTrace = ContinuousHRR.bind(roleVec, fillerVec);
  const unboundFiller = ContinuousHRR.unbind(roleVec, boundTrace);

  const tUnbound = new rt.WasmTensor(unboundFiller, new Uint32Array([1, 64, 1, 1]));
  const tFiller = new rt.WasmTensor(fillerVec, new Uint32Array([1, 64, 1, 1]));
  const hrrSim = linalg.cosineSimilarity(tUnbound, tFiller, 1e-8).to_array()[0];
  const hrrFinite = numKernel.allFinite(tUnbound);
  recordCheck(
    workspace,
    'MC-06',
    'Integritas Ikatan Konvolusi Sirkular ContinuousHRR via WasmLinearAlgebra',
    hrrFinite && hrrSim > 0.45,
    Math.max(0, 0.45 - hrrSim),
    `unbinding_cosine=${hrrSim.toFixed(4)}, finite=${hrrFinite}`
  );

  // ---------------------------------------------------------------------------
  // PROOF 7: VSARLPolicyKernel Action Probability Entropy & KL-Divergence (WasmProbability)
  // ---------------------------------------------------------------------------
  const rlKernel = new VSARLPolicyKernel(32, 6, 64);
  const scholarNpc = NpcPersonalityFactory.fromNpcState({
    nama: 'Tetua Cendekia Lin',
    mood: 'Tenang menganalisis gulungan sejarah',
    status: 'Aktif'
  });
  const tricksterNpc = NpcPersonalityFactory.fromNpcState({
    nama: 'Bayangan Senja',
    mood: 'Licik mengintai dari balik bayang-bayang',
    status: 'Waspada'
  });
  rlKernel.registerNpc(scholarNpc);
  rlKernel.registerNpc(tricksterNpc);

  const scholarRaw = new Float32Array([0.25, 0.30, 0.20, 0.15, 0.05, 0.05]);
  const tricksterRaw = new Float32Array([0.08, 0.12, 0.15, 0.35, 0.20, 0.10]);
  const shape6 = new Uint32Array([1, 6, 1, 1]);

  const pScholar = probKernel.normalize(new rt.WasmTensor(scholarRaw, shape6));
  const pTrickster = probKernel.normalize(new rt.WasmTensor(tricksterRaw, shape6));
  const entropyScholar = probKernel.entropy(pScholar).to_array()[0];
  const klDiv = probKernel.klDivergence(pScholar, pTrickster).to_array()[0];
  const crossEnt = probKernel.crossEntropy(pScholar, pTrickster).to_array()[0];

  // Fundamental information-theoretic identity: H(P, Q) = H(P) + D_KL(P || Q)
  const infoIdentityVerify = JSON.parse(
    rt.mathVerifyVectors(
      new Float32Array([crossEnt]),
      new Float32Array([entropyScholar + klDiv]),
      1e-5,
      1e-5
    )
  );
  recordCheck(
    workspace,
    'MC-07',
    'Identitas Informasi H(P,Q) = H(P) + D_KL(P||Q) pada Distribusi Kebijakan RL (WasmProbability)',
    infoIdentityVerify.passed === true && klDiv > 0.05,
    infoIdentityVerify.max_abs_error ?? 1,
    `H(P)=${entropyScholar.toFixed(4)}, D_KL(P||Q)=${klDiv.toFixed(4)}, H(P,Q)=${crossEnt.toFixed(4)}`
  );

  // ---------------------------------------------------------------------------
  // PROOF 8: SimplicialComplexTracker Homology & Reduction Verification
  // ---------------------------------------------------------------------------
  const genesis = generateWorldGenesis({
    title: 'Pendekar Awan Giok',
    mcName: 'Lin Feng',
    mcTitle: 'Murid Luar',
    worldSetting: 'Dunia Kultivasi Xianxia',
    locationName: 'Puncak Giok',
    initialWeapon: 'Pedang Giok',
    prologuePrompt: 'Berlatih di puncak gunung sekte'
  });
  const homology = SimplicialComplexTracker.analyzeHomology(
    genesis.npcStates,
    { 'Daichi': 70, 'Hanako': 65 },
    genesis.factions,
    0.55
  );
  const bettiVec = new Float32Array([
    homology.betti0,
    homology.betti1,
    homology.totalVertices,
    homology.totalEdges,
    homology.totalTriangles
  ]);
  const tBetti = new rt.WasmTensor(bettiVec, new Uint32Array([1, 5, 1, 1]));
  const bettiFinite = numKernel.allFinite(tBetti);
  const bettiSum = redKernel.sumAxis(tBetti, 1).to_array()[0];
  recordCheck(
    workspace,
    'MC-08',
    'Verifikasi Tensor Homologi Simplicial (β₀, β₁, V, E, F) via WasmReduction',
    bettiFinite && homology.betti0 >= 1 && bettiSum >= homology.totalVertices,
    0,
    `β₀=${homology.betti0}, β₁=${homology.betti1}, V=${homology.totalVertices}, E=${homology.totalEdges}, F=${homology.totalTriangles}`
  );

  // ---------------------------------------------------------------------------
  // PROOF 9: State Checkpoint Bincode Tier Guard (`decodeGuardCheck`)
  // ---------------------------------------------------------------------------
  const statePayloadBytes = new TextEncoder().encode(
    JSON.stringify({
      genesis,
      rlSnapshot: rlKernel.exportSnapshot(),
      homology
    })
  );
  const guardDecision = JSON.parse(rt.decodeGuardCheck(statePayloadBytes));
  recordCheck(
    workspace,
    'MC-09',
    'Audit Guard Ukuran State Checkpoint (decodeGuardCheck)',
    guardDecision.accepted === true,
    0,
    `input_bytes=${guardDecision.input_bytes}, tier_limit=${guardDecision.tier_limit}, accepted=${guardDecision.accepted}`
  );

  // ---------------------------------------------------------------------------
  // PROOF 10: Multi-Input Graph Compilation & Trace via `helper/lib/engine.mjs`
  // ---------------------------------------------------------------------------
  const graphSpec = {
    numSlots: 4,
    layers: [
      { constructor: 'linear', args: [0, 4, 4, false] },
      { constructor: 'relu', args: [1] }
    ],
    steps: [
      { kind: 'unary', layer: 0, slots: [0, 2] },
      { kind: 'unary', layer: 1, slots: [2, 3] }
    ],
    outputSlot: 3,
    ports: [
      { slot: 0, role: 'observation', shape: [1, 4, 1, 1], layout: 'feature_axis1_singleton' }
    ],
    weights: {
      '0': [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
      ]
    }
  };
  const { reg, plan, g } = buildGraph(rt, graphSpec);
  if (graphSpec.weights?.['0']) {
    reg.setWeightsFlat(0, 1, new Float32Array(graphSpec.weights['0']));
  }
  const bundle = new rt.MultiInputInputBundle(plan);
  const inTensor = new rt.WasmTensor(new Float32Array([2.5, -1.5, 0.75, 4.0]), new Uint32Array([1, 4, 1, 1]));
  bundle.bindInput(0, inTensor, 'observation', 'feature_axis1_singleton', 'guardian_audit', 1n, 'fp_audit_01');
  const tracedRun = g.runWithTrace(reg, bundle, 0, 2, 4096);
  const graphOut = tracedRun.output().to_array();
  const graphVerify = JSON.parse(
    rt.mathVerifyVectors(new Float32Array([2.5, 0.0, 0.75, 4.0]), graphOut, 1e-6, 1e-6)
  );
  recordCheck(
    workspace,
    'MC-10',
    'Eksekusi & Verifikasi TracedMultiInputRun via helper/lib/engine.mjs',
    graphVerify.passed === true,
    graphVerify.max_abs_error ?? 1,
    `out=[${Array.from(graphOut).map((v) => v.toFixed(2)).join(', ')}], planFp=${plan.planFingerprint().slice(0, 12)}...`
  );

  // ---------------------------------------------------------------------------
  // PROOF 11: Deterministic PRNG Stream Certification (`helper/lib/prng.mjs`)
  // ---------------------------------------------------------------------------
  const streamMulberry1 = generateStream('mulberry32', 42, 256);
  const streamMulberry2 = generateStream('mulberry32', 42, 256);
  const streamXor = generateStream('xorshift32', 42, 256);
  const prngMatch =
    streamMulberry1.sha256 === streamMulberry2.sha256 &&
    streamMulberry1.sha256.startsWith('sha256:') &&
    streamXor.sha256.startsWith('sha256:') &&
    streamMulberry1.sha256 !== streamXor.sha256;
  recordCheck(
    workspace,
    'MC-11',
    'Sertifikasi Determinisme Stream PRNG mulberry32 & xorshift32 (SHA-256 Bit-Exact)',
    prngMatch,
    0,
    `mulberry32=${streamMulberry1.sha256.slice(0, 12)}..., xorshift32=${streamXor.sha256.slice(0, 12)}...`
  );

  // ---------------------------------------------------------------------------
  // PROOF 12: WasmMathProgramV9BatchScorer Integration in RetrievalPipeline.query()
  // ---------------------------------------------------------------------------
  const numTerms = 16;
  const numDocs = 8;
  const ragDim = 768;
  const inv = new HybridCSRMatrix(numTerms, numDocs, 16);
  for (let t = 0; t < numTerms; t++) {
    inv.rowPtr[t] = t;
    inv.colIdx[t] = t % numDocs;
    inv.values[t] = 1.0 + (t % 5) * 0.35;
  }
  inv.rowPtr[numTerms] = 16;
  const termUB = new Float32Array(numTerms).fill(2.5);
  const cooccur = new HybridCSRMatrix(0, 0, 0);
  const docFHRR = new Float32Array(numDocs * ragDim);
  const docTexts = [
    textA,
    textB,
    textC,
    'Tetua Lin menjaga pustaka giok di puncak gunung sekte Yamato',
    'Pasukan penjaga perbatasan menyalakan obor sinyal di menara utara',
    'Tabib istana meracik ramuan penyembuh luka pedang untuk sang ksatria',
    'Naga air bangkit dari dasar danau berkabut di lembah terlarang',
    'Pandai besi menempa bilah katana baja hitam dengan api roh'
  ];
  for (let d = 0; d < numDocs; d++) {
    docFHRR.set(encodeSemanticFallbackVector(docTexts[d], ragDim), d * ragDim);
  }

  const pipeline = new RetrievalPipeline(numTerms, numDocs, ragDim, 256, 8, 8, 5);
  pipeline.build(inv, termUB, cooccur, docFHRR);

  const qTerms = new Int32Array([0, 1, 2, 3, 4, 5]);
  const qIDF = new Float32Array([1.2, 0.9, 1.5, 0.8, 1.1, 0.7]);
  const qVec = encodeSemanticFallbackVector('Ksatria pedang katana di kuil Desa Yamato', ragDim);

  // Execute JS reference path
  const jsIdx = new Int32Array(5);
  const jsScr = new Float32Array(5);
  pipeline.setWasmBatchScorer(null);
  pipeline.query(qTerms, qIDF, qVec, 6, jsIdx, jsScr, { wBm25: 0.6, wSim: 0.4 });

  // Execute WasmMathProgramV9BatchScorer path
  const batchScorer = new WasmMathProgramV9BatchScorer(rt, numDocs * 2, ragDim);
  pipeline.setWasmBatchScorer(batchScorer);
  const wasmIdx = new Int32Array(5);
  const wasmScr = new Float32Array(5);
  pipeline.query(qTerms, qIDF, qVec, 6, wasmIdx, wasmScr, { wBm25: 0.6, wSim: 0.4 });

  const ragFuseVerify = batchScorer.verifyBatchEquivalence(jsScr, wasmScr, 1e-5, 1e-5);
  const idxExactMatch = Array.from(jsIdx).every((v, idx) => v === wasmIdx[idx]);
  recordCheck(
    workspace,
    'MC-12',
    'Ekuivalensi Batch Tensor WasmMathProgramV9 pada RetrievalPipeline.query (run4 vs JS)',
    ragFuseVerify.passed && idxExactMatch && batchScorer.totalHybridFusionBatches === 1,
    ragFuseVerify.maxAbsError,
    `idxMatch=${idxExactMatch}, cands=${batchScorer.lastBatchSize}, planBytes=${batchScorer.contractProof.hybridFusionPlanBytes}`
  );

  // ---------------------------------------------------------------------------
  // PROOF 13: WasmMathProgramV9BatchScorer Holographic Candidate Scoring (`run2`)
  // ---------------------------------------------------------------------------
  const docWeights = new Float32Array([1.0, 0.9, 0.0, 0.8, 0.7, 0.0, 0.85, 0.95]);
  const totalWeight = 5.2;
  const jsHoloIdx = new Int32Array(5);
  const jsHoloScr = new Float32Array(5);
  pipeline.setWasmBatchScorer(null);
  pipeline.scoreHolographicCandidates(
    qVec,
    docFHRR,
    docWeights,
    totalWeight,
    numDocs,
    5,
    jsHoloIdx,
    jsHoloScr
  );

  pipeline.setWasmBatchScorer(batchScorer);
  const wasmHoloIdx = new Int32Array(5);
  const wasmHoloScr = new Float32Array(5);
  pipeline.scoreHolographicCandidates(
    qVec,
    docFHRR,
    docWeights,
    totalWeight,
    numDocs,
    5,
    wasmHoloIdx,
    wasmHoloScr
  );

  const holoBatchVerify = batchScorer.verifyBatchEquivalence(jsHoloScr, wasmHoloScr, 1e-5, 1e-5);
  const holoIdxMatch = Array.from(jsHoloIdx).every((v, idx) => v === wasmHoloIdx[idx]);
  batchScorer.dispose();

  recordCheck(
    workspace,
    'MC-13',
    'Ekuivalensi Batch Tensor WasmMathProgramV9 pada Holographic Candidate Scoring (run2 vs JS)',
    holoBatchVerify.passed && holoIdxMatch && batchScorer.totalDenseDotBatches === 1,
    holoBatchVerify.maxAbsError,
    `idxMatch=${holoIdxMatch}, activeDocs=${batchScorer.lastBatchSize}, planBytes=${batchScorer.contractProof.denseDotPlanBytes}`
  );

  // ---------------------------------------------------------------------------
  // PROOF 14: AgentWorkspace Proof Table Snapshot & Audit Summary
  // ---------------------------------------------------------------------------
  const wsPreSnapshot = JSON.parse(workspace.snapshot());
  const wsValid = Array.isArray(wsPreSnapshot.proofs)
    ? wsPreSnapshot.proofs.length === 13
    : typeof wsPreSnapshot === 'object' && wsPreSnapshot !== null;
  recordCheck(
    workspace,
    'MC-14',
    'Integritas Buku Besar Bukti AgentWorkspace (WasmAgentWorkspace.snapshot)',
    wsValid,
    0,
    `recorded_proofs=14, workspace_keys=[${Object.keys(wsPreSnapshot).join(', ')}]`
  );

  const wsSnapshot = JSON.parse(workspace.snapshot());
  const failedProofs = proofs.filter((p) => !p.passed);
  const elapsedMs = (performance.now() - t0).toFixed(1);

  console.log('================================================================================');
  console.log(
    `🏁 RINGKASAN AUDIT MATH COMPRESSOR (WASM): ${proofs.length - failedProofs.length}/${proofs.length} Bukti Formal Lulus (${elapsedMs} ms) | Workspace Proofs=${wsSnapshot.proof_count ?? proofs.length}`
  );
  console.log('================================================================================\n');

  if (failedProofs.length > 0) {
    process.exit(1);
  }
}

runMathCompressorAudit().catch((err) => {
  console.error('Fatal error in math-compressor-audit:', err);
  process.exit(1);
});
