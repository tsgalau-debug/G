#!/usr/bin/env node
/**
 * Deep Simulation & Multi-Subsystem Diagnostic Harness (.mjs)
 *
 * Menjalankan simulasi mendalam end-to-end lintas seluruh subsistem:
 *   1. Chronos Engine 24-Jam: Suasana Langit (7 fase) + Jadwal Harian NPC Dinamis (AUD-06)
 *   2. VSA-RL Decision Scoring Model: Warm-Start Bandit, 32-bit State Bitmask & Online Grounding (AUD-03/05)
 *   3. Semantic Token+N-Gram Embedding & Real BM25 IDF CSR Retrieval (AUD-02)
 *   4. Simplicial Complex Homology atas GF(2) (β₀, β₁) & Vietoris-Rips Persistence (AUD-04)
 *   5. Multi-World Timeline DAG (Fork, Isolasi Slot Memori, What-If, 3-Way Merge) & Viewport Ratio Audit (AUD-01)
 *
 * Cara menjalankan:
 *   npx tsx scripts/deep-sim-debug.mjs
 */

import 'fake-indexeddb/auto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('@angular/compiler');
const { Injector, runInInjectionContext } = require('@angular/core');

const unwrap = (m) => (m && m.default ? { ...m.default, ...m } : m);

const { GameStateService } = unwrap(await import('../src/app/game-state.service.ts'));
const { ChronosEngineService } = unwrap(await import('../src/app/chronos-engine.service.ts'));
const { LoreEngineService } = unwrap(await import('../src/app/rag/lore-engine.service.ts'));
const { EngineService } = unwrap(await import('../src/app/engine.service.ts'));
const {
  generateWorldGenesis,
  generateDynamicNpcSchedule,
  inferNpcRoleArchetype,
  resolveScheduleSlotForHour
} = unwrap(await import('../src/app/world-genesis.ts'));
const {
  encodeSemanticFallbackVector,
  rebuildPipelineFromIndexer
} = unwrap(await import('../src/app/rag/pipeline-bridge.ts'));
const { BaseIndexer } = unwrap(await import('../src/app/rag/base-indexer.ts'));
const { RetrievalPipeline, HybridCSRMatrix } = unwrap(await import('../src/app/rag/hybrid-pipeline.ts'));
const { VSARLPolicyKernel, NpcPersonalityFactory } = unwrap(await import('../src/app/rag/vsarl-policy-kernel.ts'));
const { HolographicMemoryField } = unwrap(await import('../src/app/rag/holographic-memory.ts'));
const { MultiWorldHologram } = unwrap(await import('../src/app/rag/multi-world.ts'));
const { AgenticChunkOrchestrator } = unwrap(await import('../src/app/rag/agentic-chunk-orchestrator.ts'));
const { SimplicialComplexTracker } = unwrap(await import('../src/app/topology/simplicial-complex.ts'));

const STRATEGY_NAMES = [
  '0:BM25_FAST',
  '1:SEMANTIC_FHRR',
  '2:GRAPH_DIFFUSE',
  '3:HOLOGRAPHIC',
  '4:HYBRID_RRF',
  '5:SELF_CORRECT'
];

let totalAssertions = 0;
let passedAssertions = 0;

function assertCond(condition, message, detail = '') {
  totalAssertions++;
  if (!condition) {
    console.error(`  ❌ [FAIL] ${message}${detail ? ` — ${detail}` : ''}`);
    process.exitCode = 1;
  } else {
    passedAssertions++;
    console.log(`  ✅ [PASS] ${message}${detail ? ` (${detail})` : ''}`);
  }
}

function cosineSim(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na > 1e-12 && nb > 1e-12 ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

function createSimulationContext() {
  const loreEngineStub = {
    syncKnowledgeGraph: () => {},
    syncEpisodicMemory: () => {},
    reinitialize: async () => {},
    lastRetrieval: () => [
      { entry: { key: 'c1', content: 'Katana Fajar ditempa dari meteorit astral untuk menjaga Gerbang Desa Yamato dari Sindikat Kabut Hitam.' } }
    ],
    getContextSnippet: async () => ({
      text: 'Kaelen menjaga Gerbang Desa Yamato dengan Katana Fajar sambil mengawasi Sindikat Kabut Hitam.',
      decision: {
        strategy: 4,
        action: 'return',
        confidence: 0.91,
        anomalyCount: 0
      }
    }),
    scoreChoices: (choices) => choices.map((c) => ({ ...c, isValid: true })),
    recordTurnOutcome: () => {},
    forkTimeline: async () => 'branch_sim_1',
    switchTimeline: async () => true,
    mergeTimeline: async () => ({ mergedChunks: 3, conflictsResolved: 1 }),
    pruneTimeline: async () => true
  };

  let injector;
  injector = Injector.create({
    providers: [
      { provide: LoreEngineService, useValue: loreEngineStub },
      {
        provide: GameStateService,
        useFactory: () => runInInjectionContext(injector, () => new GameStateService())
      },
      {
        provide: ChronosEngineService,
        useFactory: () => runInInjectionContext(injector, () => new ChronosEngineService())
      },
      {
        provide: EngineService,
        useFactory: () => runInInjectionContext(injector, () => new EngineService())
      }
    ]
  });

  const gameState = injector.get(GameStateService);
  const chronos = injector.get(ChronosEngineService);
  const engine = injector.get(EngineService);

  return { gameState, chronos, engine, loreEngineStub };
}

async function runLayer1ChronosAndSkySimulation() {
  console.log('\n================================================================================');
  console.log('🌅 LAYER 1: SIMULASI 24-JAM CHRONOS, SUASANA LANGIT & JADWAL NPC DINAMIS (AUD-06)');
  console.log('================================================================================');

  const { gameState, chronos } = createSimulationContext();

  // Inisialisasi dunia Yamato
  const genesis = generateWorldGenesis({
    title: 'Kronik Fajar Yamato',
    mcName: 'Kaelen',
    mcTitle: 'Penjaga Perbatasan',
    worldSetting: 'Desa Yamato',
    locationName: 'Gerbang Desa Yamato',
    initialWeapon: 'Katana Fajar',
    prologuePrompt: 'Menjaga perbatasan dari Sindikat Kabut Hitam'
  });

  gameState.mcState.name = 'Kaelen';
  gameState.mcState.day = 1;
  gameState.mcState.time = '05:00';
  gameState.mcState.location = 'Gerbang Desa Yamato';
  gameState.mcState.locationName = 'Gerbang Desa Yamato';
  gameState.npcStates = structuredClone(genesis.npcStates);
  gameState.npcSchedules = structuredClone(genesis.npcSchedules || {});

  // Tambahkan 3 NPC baru secara dinamis seperti hasil ekstraksi narasi LLM (updateNpcStates)
  gameState.updateNpcStates({
    'Kurogane si Penempa': {
      nama: 'Kurogane si Penempa',
      lokasi: 'Bengkel Besi Yamato',
      aktivitas: 'Menempa bilah baja di tungku bara',
      faksi: 'Serikat Pengrajin Yamato',
      mood: 'Bersemangat'
    },
    'Sora si Pengintai': {
      nama: 'Sora si Pengintai',
      lokasi: 'Hutan Perbatasan Yamato',
      aktivitas: 'Mengintai pergerakan penyelundup Sindikat Kabut Hitam',
      faksi: 'Klan Bayangan Yamato',
      mood: 'Dingin dan terukur'
    },
    'Cendekiawan Riku': {
      nama: 'Cendekiawan Riku',
      lokasi: 'Ruang Arsip Yamato',
      aktivitas: 'Menelaah gulungan sejarah kuno',
      faksi: 'Perpustakaan Yamato',
      mood: 'Tenang dan analitis'
    }
  });

  const npcKeys = Object.keys(gameState.npcStates);
  assertCond(
    npcKeys.length === 6,
    'Preservasi NPC Genesis + Registrasi NPC Dinamis baru di updateNpcStates',
    `Total NPC aktif: ${npcKeys.length} (${npcKeys.join(', ')})`
  );

  const getSched = (name) =>
    gameState.npcSchedules[name] ||
    gameState.npcSchedules[name.replaceAll(' ', '_')] ||
    Object.values(gameState.npcSchedules).find((s) => s.npcName === name);

  assertCond(
    getSched('Kurogane si Penempa')?.archetype === 'merchant' &&
      getSched('Sora si Pengintai')?.archetype === 'shadow' &&
      getSched('Cendekiawan Riku')?.archetype === 'scholar',
    'Inferensi arketipe peran NPC dinamis akurat',
    `Kurogane=${getSched('Kurogane si Penempa')?.archetype}, Sora=${getSched('Sora si Pengintai')?.archetype}, Riku=${getSched('Cendekiawan Riku')?.archetype}`
  );

  // Verifikasi bahwa pembaruan NPC Genesis berdasarkan nama ('Daichi') meng-update NPC_DAICHI_107 tanpa duplikasi
  gameState.updateNpcStates([
    {
      nama: 'Daichi',
      lokasi: 'Gerbang Desa Yamato',
      aktivitas: 'Menyapa Kaelen di gerbang utama',
      faksi: 'Penjaga Desa Yamato',
      mood: 'Ramah'
    }
  ]);
  assertCond(
    Object.keys(gameState.npcStates).length === 6 && !gameState.npcStates['Daichi'],
    'Pembaruan NPC Genesis berdasarkan nama ("Daichi") memperbarui key asli (NPC_DAICHI_107) tanpa duplikasi',
    `Keys: [${Object.keys(gameState.npcStates).join(', ')}]`
  );

  const observedPhases = new Set();
  const locationTrajectory = new Map();
  for (const k of npcKeys) locationTrajectory.set(k, new Set());

  console.log('\n  [Tabel Simulasi Perjalanan Waktu 24 Jam — Step +60 Menit]:');
  console.log('  ---------------------------------------------------------------------------------------------------------');
  console.log('  Hari | Jam   | Fase Langit  | Label Langit | Icon        | Contoh Rotasi Lokasi NPC Dinamis & Homologi');
  console.log('  ---------------------------------------------------------------------------------------------------------');

  // Simulasikan juga jam 17:45 untuk memverifikasi fase Senja (17:30 - 18:59)
  const duskCheck = chronos.getSkyAtmosphere('17:45');
  observedPhases.add(duskCheck.phase);

  for (let step = 0; step < 24; step++) {
    const sky = chronos.getSkyAtmosphere(gameState.mcState.time);
    observedPhases.add(sky.phase);

    for (const k of npcKeys) {
      const loc = gameState.npcStates[k]?.lokasi || gameState.npcStates[k]?.location;
      if (loc) locationTrajectory.get(k).add(loc);
    }

    const daichiLoc = gameState.npcStates['NPC_DAICHI_107']?.lokasi || '-';
    const soraNpc = gameState.npcStates['Sora si Pengintai'] || gameState.npcStates['Sora_si_Pengintai'];
    const soraLoc = soraNpc?.lokasi || '-';
    const topo = gameState.homologyState();
    const b0 = topo?.betti0 ?? '-';
    const b1 = topo?.betti1 ?? '-';

    if (step % 2 === 0 || sky.phase === 'dawn' || sky.phase === 'dusk') {
      console.log(
        `  H-${String(gameState.mcState.day).padEnd(2)} | ${gameState.mcState.time} | ${sky.phase.padEnd(12)} | ${sky.label.padEnd(12)} | ${sky.icon.padEnd(11)} | Daichi@${daichiLoc.slice(0, 22)} | Sora@${soraLoc.slice(0, 22)} (β₀=${b0}, β₁=${b1})`
      );
    }

    chronos.advanceTime(60);
  }
  console.log('  ---------------------------------------------------------------------------------------------------------');

  assertCond(
    observedPhases.size === 7,
    'Seluruh 7 fase Suasana Langit terpetakan sepanjang 24 jam',
    `Fase teramati: [${Array.from(observedPhases).join(', ')}]`
  );
  assertCond(
    gameState.mcState.day === 2 && gameState.mcState.time === '05:00',
    'Pergantian hari (Day Rollover) setelah 24x +1j akurat',
    `Hari=${gameState.mcState.day}, Jam=${gameState.mcState.time}`
  );

  for (const k of npcKeys) {
    const distinctLocs = locationTrajectory.get(k).size;
    assertCond(
      distinctLocs >= 3,
      `NPC "${gameState.npcStates[k]?.nama}" berpindah lokasi secara dinamis sepanjang 24 jam`,
      `${distinctLocs} lokasi berbeda: ${Array.from(locationTrajectory.get(k)).join(' -> ')}`
    );
  }
}

async function runLayer2VSARLDecisionSimulation() {
  console.log('\n================================================================================');
  console.log('🧠 LAYER 2: SIMULASI VSA-RL DECISION SCORING MODEL & ONLINE BANDIT (AUD-03/AUD-05)');
  console.log('================================================================================');

  const maxTerms = 2048;
  const maxDocs = 64;
  const dim = 768;
  const pipeline = new RetrievalPipeline(maxTerms, maxDocs, dim, 4, 8);
  const holo = new HolographicMemoryField(dim, maxDocs, 8);
  const multiWorld = new MultiWorldHologram(dim, maxDocs, 8, 8);
  const policy = new VSARLPolicyKernel(32, 6, 64);
  policy.epsilon = 0; // Deterministic scoring mode

  const orchestrator = new AgenticChunkOrchestrator(
    pipeline,
    holo,
    multiWorld,
    policy,
    dim,
    maxDocs,
    8,
    32
  );

  const scenarios = [
    {
      name: 'Entitas Spesifik Langka (High IDF, 0 OOV, Ringkas)',
      terms: ['Katana_Fajar_Kuno', 'Meteorit_Astral'],
      ids: new Int32Array([101, 202]),
      idf: new Float32Array([3.2, 2.9]),
      requery: 0,
      expectedStrategy: 0, // Bm25Fast
      npc: undefined
    },
    {
      name: 'Istilah Parafrase / Sinonim OOV (0 Match Leksikal)',
      terms: ['bisikan', 'bayangan', 'kasat', 'mata'],
      ids: new Int32Array([-1, -1, -1, -1]),
      idf: new Float32Array([0.15, 0.15, 0.15, 0.15]),
      requery: 0,
      expectedStrategy: 1, // SemanticFhrr
      npc: NpcPersonalityFactory.createScholar('selyse', 'Selyse')
    },
    {
      name: 'Kueri Relasional Multi-Entitas Panjang (8 Entitas)',
      terms: ['hubungan', 'faksi', 'utara', 'selatan', 'perjanjian', 'raja', 'benteng', 'konflik'],
      ids: new Int32Array([1, 2, 3, 4, 5, 6, 7, 8]),
      idf: new Float32Array([1.3, 1.4, 1.2, 1.3, 1.5, 1.2, 1.4, 1.3]),
      requery: 0,
      expectedStrategy: 2, // GraphDiffuse
      npc: undefined
    },
    {
      name: 'Pemulihan Anomali / Re-Query Loop (requeryCount = 2)',
      terms: ['Katana_Fajar_Kuno', 'Meteorit_Astral'],
      ids: new Int32Array([101, 202]),
      idf: new Float32Array([3.2, 2.9]),
      requery: 2,
      expectedStrategy: 5, // SelfCorrect
      npc: NpcPersonalityFactory.createTrickster('oboro', 'Oboro')
    }
  ];

  const seenBitmasks = new Set();

  console.log('\n  [Tabel Telemetri Keputusan VSA-RL Decision Model (Turn 1 Warm-Start)]:');
  for (const sc of scenarios) {
    const qFhrr = encodeSemanticFallbackVector(sc.terms.join(' '), dim);
    const chosenStrat = orchestrator.inspect(sc.terms, qFhrr, sc.npc, sc.ids, sc.idf, sc.requery);
    const rawMask = orchestrator.stateBinaryBuf[0] >>> 0;
    const hexMask = `0x${rawMask.toString(16).padStart(8, '0')}`;
    if (sc.requery === 0) {
      seenBitmasks.add(hexMask);
    }

    const explain = policy.explainAction(orchestrator.stateBuf, sc.npc);
    const scoreSummary = explain.finalScores
      .map((s, idx) => `${STRATEGY_NAMES[idx].split(':')[1]}=${s.toFixed(2)}`)
      .join(', ');

    console.log(`  • Skenario : ${sc.name}`);
    console.log(`    NPC/Role : ${sc.npc ? `${sc.npc.name} (${sc.npc.archetype})` : 'System Global (Neutral)'} | Bitmask: ${hexMask}`);
    console.log(`    Strategi : ${STRATEGY_NAMES[chosenStrat]} (Target: ${STRATEGY_NAMES[sc.expectedStrategy]})`);
    console.log(`    Skor 6-A : [${scoreSummary}]`);

    assertCond(
      chosenStrat === sc.expectedStrategy,
      `Decision Routing memilih ${STRATEGY_NAMES[chosenStrat]} untuk "${sc.name}"`,
      `Bitmask=${hexMask}`
    );
  }

  assertCond(
    seenBitmasks.size === 3 && !seenBitmasks.has('0x000003ff'),
    'Tidak ada Sign-Bit State Collapse (0x000003FF); setiap profil kueri memiliki bitmask unik',
    `Bitmasks: [${Array.from(seenBitmasks).join(', ')}]`
  );

  // Verifikasi evaluasi grounding dinamis di EngineService.handleResponse
  const { engine } = createSimulationContext();
  const brokenEval = engine.handleResponse('Output rusak tanpa JSON');
  const groundedEval = engine.handleResponse(`Monolog: Kaelen memegang Katana Fajar di Gerbang Desa Yamato.
\`\`\`json
{
  "new_full_chronicle_entry": {
    "narrative": "Kaelen mengangkat Katana Fajar dari meteorit astral saat menjaga Gerbang Desa Yamato dari Sindikat Kabut Hitam.",
    "narrative_blocks": [
      {
        "name": "Kaelen",
        "narration": "Cahaya Katana Fajar menembus kabut malam di Gerbang Desa Yamato.",
        "dialogue": "Sindikat Kabut Hitam tidak akan lewat.",
        "action": "Bersiap di gerbang"
      }
    ],
    "mc_state": { "status": "Siaga", "expGained": 15 },
    "choices": [
      { "id": "C-1", "text": "Periksa menara pantau gerbang", "weight": 0.9 }
    ]
  }
}
\`\`\``);

  assertCond(
    brokenEval.llmAccepted === false && groundedEval.llmAccepted === true && groundedEval.groundingScore >= 0.75,
    'Evaluasi Grounding Dinamis di EngineService membedakan respons cacat vs ter-grounding lore',
    `Broken(accepted=${brokenEval.llmAccepted}), Grounded(accepted=${groundedEval.llmAccepted}, score=${groundedEval.groundingScore.toFixed(2)})`
  );
}

async function runLayer3EmbeddingAndIdfSimulation() {
  console.log('\n================================================================================');
  console.log('🔎 LAYER 3: SIMULASI SEMANTIC EMBEDDING FALLBACK & CSR BM25 IDF (AUD-02)');
  console.log('================================================================================');

  const dim = 768;
  const vOriginal = encodeSemanticFallbackVector(
    'Pasukan Garnisun Benteng Gagak memperkuat pertahanan jembatan utara sebelum badai malam',
    dim
  );
  const vParaphrase = encodeSemanticFallbackVector(
    'Sebelum badai malam turun, pertahanan jembatan utara diperkuat oleh Garnisun Benteng Gagak',
    dim
  );
  const vMorphology = encodeSemanticFallbackVector(
    'Penguatan pertahanan di jembatan utara oleh prajurit Benteng Gagak saat malam berbadai',
    dim
  );
  const vNoise = encodeSemanticFallbackVector(
    'Pedagang buah menawarkan apel manis dan teh hangat di pelabuhan selatan',
    dim
  );

  const simPara = cosineSim(vOriginal, vParaphrase);
  const simMorph = cosineSim(vOriginal, vMorphology);
  const simNoise = cosineSim(vOriginal, vNoise);

  console.log(`  • Cosine(Asli vs Urutan Kata Dibalik) : ${simPara.toFixed(4)}`);
  console.log(`  • Cosine(Asli vs Variasi Morfologi)   : ${simMorph.toFixed(4)}`);
  console.log(`  • Cosine(Asli vs Kalimat Tak Terkait) : ${simNoise.toFixed(4)}`);

  assertCond(
    simPara > 0.75 && simMorph > 0.45 && simNoise < 0.15,
    'Pemisahan ruang semantik Token + Bigram + Char 3-Gram tajam & tahan perubahan urutan kata',
    `Δ(Morph - Noise) = ${(simMorph - simNoise).toFixed(3)}`
  );
}

async function runLayer4TopologicalHomologySimulation() {
  console.log('\n================================================================================');
  console.log('📐 LAYER 4: SIMULASI TOPOLOGI SIMPLICIAL COMPLEX & HOMOLOGI GF(2) (AUD-04)');
  console.log('================================================================================');

  // Kombinasi K_4 (4 segitiga redundan, rank(∂_2)=3) + C_4 (lubang segiempat) + C_5 (lubang segilima)
  const npcStates = {
    // Komponen 1: Klik K_4
    K1: { nama: 'Vane', lokasi: 'Aula Komando', faksi: 'Garda', aktivitas: 'Rapat strategi' },
    K2: { nama: 'Sera', lokasi: 'Aula Komando', faksi: 'Garda', aktivitas: 'Rapat strategi' },
    K3: { nama: 'Dorn', lokasi: 'Aula Komando', faksi: 'Garda', aktivitas: 'Rapat strategi' },
    K4: { nama: 'Lyra', lokasi: 'Aula Komando', faksi: 'Garda', aktivitas: 'Rapat strategi' },

    // Komponen 2: C_4 Patrol Loop
    P1: { nama: 'Penjaga Utara', lokasi: 'Pos Utara', faksi: 'Patroli', aktivitas: 'Kontak dengan Penjaga Timur dan Penjaga Barat' },
    P2: { nama: 'Penjaga Timur', lokasi: 'Pos Timur', faksi: 'Patroli', aktivitas: 'Kontak dengan Penjaga Utara dan Penjaga Selatan' },
    P3: { nama: 'Penjaga Selatan', lokasi: 'Pos Selatan', faksi: 'Patroli', aktivitas: 'Kontak dengan Penjaga Timur dan Penjaga Barat' },
    P4: { nama: 'Penjaga Barat', lokasi: 'Pos Barat', faksi: 'Patroli', aktivitas: 'Kontak dengan Penjaga Selatan dan Penjaga Utara' },

    // Komponen 3: C_5 Pentagon Spy Ring
    S1: { nama: 'Agen Satu', lokasi: 'Titik A', faksi: 'Bayangan', aktivitas: 'Sinyal ke Agen Dua dan Agen Lima' },
    S2: { nama: 'Agen Dua', lokasi: 'Titik B', faksi: 'Bayangan', aktivitas: 'Sinyal ke Agen Satu dan Agen Tiga' },
    S3: { nama: 'Agen Tiga', lokasi: 'Titik C', faksi: 'Bayangan', aktivitas: 'Sinyal ke Agen Dua dan Agen Empat' },
    S4: { nama: 'Agen Empat', lokasi: 'Titik D', faksi: 'Bayangan', aktivitas: 'Sinyal ke Agen Tiga dan Agen Lima' },
    S5: { nama: 'Agen Lima', lokasi: 'Titik E', faksi: 'Bayangan', aktivitas: 'Sinyal ke Agen Empat dan Agen Satu' }
  };

  const result = SimplicialComplexTracker.analyzeHomology(npcStates, {}, {}, 0.55);
  const beta1Bars = result.persistenceDiagram.filter((b) => b.dimension === 1);

  console.log(
    `  • Vertices (0-Simplex): ${result.totalVertices} | Edges (1-Simplex): ${result.totalEdges} | Triangles (2-Simplex): ${result.totalTriangles}`
  );
  console.log(`  • Invarian Betti      : β₀ = ${result.betti0} (Klaster), β₁ = ${result.betti1} (Cavity Independen atas GF(2))`);
  for (const cav of result.cavities) {
    console.log(`  • Cavity Terdeteksi   : Siklus C_${cav.loop.length} [${cav.loop.join(' -> ')}] (Perimeter=${cav.perimeter.toFixed(2)})`);
  }
  for (const bar of beta1Bars) {
    console.log(
      `  • Persistence Bar H₁  : ${bar.featureName} | birth=${bar.birth.toFixed(3)} -> death=${bar.death.toFixed(3)} (pers=${bar.persistence.toFixed(3)})`
    );
  }

  assertCond(
    result.betti0 === 3 && result.betti1 === 2 && result.cavities.length === 2,
    'Reduksi matriks batas ∂₂ atas GF(2) memisahkan klik K₄ (β₁=0) dari dua lubang independen C₄ & C₅ (β₁=2)',
    `β₀=${result.betti0}, β₁=${result.betti1}, Cavities=${result.cavities.map((c) => `C_${c.loop.length}`).join(' + ')}`
  );
}

async function runLayer5TimelineDAGAndViewportAudit() {
  console.log('\n================================================================================');
  console.log('🌿 LAYER 5: SIMULASI MULTI-WORLD TIMELINE DAG (AUD-01) & AUDIT RASIO VIEWPORT');
  console.log('================================================================================');

  const { gameState } = createSimulationContext();
  gameState.mcState.name = 'Kaelen';
  gameState.mcState.location = 'Gerbang Desa Yamato';
  gameState.mcState.locationName = 'Gerbang Desa Yamato';
  gameState.quests = {
    'Q-MAIN': {
      title: 'Pertahanan Gerbang',
      description: 'Jaga gerbang dari serangan malam.',
      status: 'active',
      objectives: ['Periksa menara pantau']
    }
  };

  // Fork timeline dari trunk pada Giliran 1 lalu switch ke cabang paralel
  const branchId = 'branch_kabut_hitam_1';
  await gameState.forkTimelineBranch(branchId, 'trunk', 1, 'Cabang Negosiasi Kabut Hitam');
  await gameState.switchTimelineBranch(branchId);
  assertCond(
    Boolean(gameState.timelineSnapshots[branchId]) && gameState.activeTimelineId() === branchId,
    'Fork Timeline membuat snapshot cabang baru dan mengaktifkan cabang tersebut',
    `activeTimelineId=${gameState.activeTimelineId()}, parent=${gameState.timelineSnapshots[branchId]?.parentTimelineId}`
  );

  // Ubah state di cabang paralel (termasuk NPC baru + jadwal NPC di cabang paralel)
  gameState.mcState.location = 'Markas Rahasia Kabut Hitam';
  gameState.mcState.locationName = 'Markas Rahasia Kabut Hitam';
  gameState.quests['Q-BRANCH'] = {
    title: 'Pakta Bayangan',
    description: 'Menjalin kesepakatan rahasia di cabang paralel.',
    status: 'active',
    objectives: ['Bertemu Goro']
  };
  gameState.updateNpcStates([
    {
      nama: 'Goro si Tangan Besi',
      lokasi: 'Markas Rahasia Kabut Hitam',
      aktivitas: 'Menimbang kesepakatan dengan Kaelen',
      faksi: 'Sindikat Kabut Hitam',
      mood: 'Curiga'
    }
  ]);

  // Kembali ke trunk dan buktikan isolasi state (Quest & NPC cabang tidak bocor ke Trunk)
  await gameState.switchTimelineBranch('trunk');
  assertCond(
    gameState.mcState.locationName === 'Gerbang Desa Yamato' &&
      !gameState.quests['Q-BRANCH'] &&
      !gameState.npcStates['Goro si Tangan Besi'],
    'Isolasi State Trunk vs Cabang Paralel terjaga penuh saat Switch Timeline',
    `Lokasi Trunk="${gameState.mcState.locationName}", Q-BRANCH di Trunk=${Boolean(gameState.quests['Q-BRANCH'])}, Goro di Trunk=${Boolean(gameState.npcStates['Goro si Tangan Besi'])}`
  );

  // Merge cabang kembali ke trunk (3-Way Merge)
  await gameState.mergeTimelineBranch(branchId, 'trunk', true, {
    autoResolved: 2,
    flaggedForLLM: 0,
    finalCoherence: 0.94
  });
  assertCond(
    gameState.activeTimelineId() === 'trunk' &&
      Boolean(gameState.quests['Q-BRANCH']) &&
      Boolean(gameState.npcStates['Goro si Tangan Besi']) &&
      Boolean(gameState.npcSchedules['Goro si Tangan Besi']),
    '3-Way Merge menggabungkan Quest, NPC baru, dan Jadwal Harian NPC cabang kembali ke Trunk secara utuh',
    `Quests=[${Object.keys(gameState.quests).join(', ')}], Goro Schedule Archetype=${gameState.npcSchedules['Goro si Tangan Besi']?.archetype}`
  );

  // Audit konfigurasi CSS & Template untuk Rasio Layar (Anti-Zoom)
  const stylesCss = fs.readFileSync(path.resolve('src/styles.css'), 'utf8');
  const storyTs = fs.readFileSync(path.resolve('src/app/story.component.ts'), 'utf8');
  const appHtml = fs.readFileSync(path.resolve('src/app/app.html'), 'utf8');
  const charTs = fs.readFileSync(path.resolve('src/app/character.component.ts'), 'utf8');
  const npcMapTs = fs.readFileSync(path.resolve('src/app/npc-map.component.ts'), 'utf8');

  assertCond(
    stylesCss.includes('font-size: 13px') && stylesCss.includes('font-size: 13.5px'),
    'Skala root font-size di src/styles.css disetel ke 13px/13.5px (~82-84% zoom ratio)',
    'html { font-size: 13px / 13.5px }'
  );
  assertCond(
    storyTs.includes('max-w-5xl w-full mx-auto') && !storyTs.includes('max-w-3xl'),
    'Kontainer Chronicle (story.component.ts) diperluas ke max-w-5xl w-full dan bebas dari max-w-3xl sempit',
    'max-w-5xl w-full mx-auto'
  );
  assertCond(
    charTs.includes('max-w-[1440px] w-full mx-auto') &&
      npcMapTs.includes('max-w-[1440px] w-full mx-auto') &&
      appHtml.includes('h-10 border-b'),
    'Ruang kerja Karakter & Dunia/NPC menggunakan max-w-[1440px] dengan Top Bar ramping h-10',
    'max-w-[1440px] + h-10 header'
  );
}

async function main() {
  const startMs = performance.now();
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║   DEEP SIMULATION & DIAGNOSTIC SUITE (.mjs) — CHRONICLE ENGINE FULL AUDIT   ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');

  await runLayer1ChronosAndSkySimulation();
  await runLayer2VSARLDecisionSimulation();
  await runLayer3EmbeddingAndIdfSimulation();
  await runLayer4TopologicalHomologySimulation();
  await runLayer5TimelineDAGAndViewportAudit();

  const elapsed = (performance.now() - startMs).toFixed(1);
  console.log('\n================================================================================');
  console.log(`🏁 RINGKASAN SIMULASI MENDALAM: ${passedAssertions}/${totalAssertions} Invarian Lulus (${elapsed} ms)`);
  console.log('================================================================================\n');
}

main().catch((err) => {
  console.error('Fatal error in deep simulation:', err);
  process.exit(1);
});
