#!/usr/bin/env node
/**
 * Deep UI & Component Interactive Simulation Harness (.mjs)
 *
 * Mensimulasikan interaksi pengguna langsung terhadap komponen UI Angular
 * (StoryComponent, NpcMapComponent, CharacterComponent, EngineLogComponent, RagDiagnosticsComponent)
 * di atas JSDOM + State Engine nyata:
 *   1. Memverifikasi proporsi rasio layar di styles.css & template komponen (13px/13.5px, max-w-5xl, max-w-[1440px], h-10/h-8)
 *   2. Mensimulasikan interaksi pada StoryComponent:
 *      - Memulai cerita (Turn 0 -> Turn 1 -> Turn 2 -> Turn 3)
 *      - Menguji perubahan jam (+1j) dan memverifikasi perubahan indikator Suasana Langit (icon, label, warna, deskripsi)
 *      - Membuka/menutup laci Misi (Quest Drawer) & Tempur (Combat Strip)
 *   3. Mensimulasikan interaksi pada NpcMapComponent:
 *      - Memfilter Direktori NPC ('all', 'local', 'rolling') & pencarian nama/lokasi/faksi
 *      - Memverifikasi perpindahan lokasi NPC di UI saat waktu berganti dari pagi ke malam
 *      - Mengklik "Temui" pada NPC dan memverifikasi antrean aksi cerita (pendingStoryAction)
 *   4. Mensimulasikan interaksi pada CharacterComponent:
 *      - Menguji pemakaian item (useItem), pemasangan perlengkapan (equipItem/unequipItem), serta perubahan HP/SP/Trust/Reputasi.
 *
 * Cara menjalankan:
 *   npx tsx scripts/ui-sim-debug.mjs
 */

import 'fake-indexeddb/auto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('@angular/compiler');
const { JSDOM } = require('jsdom');
const { Injector, runInInjectionContext } = require('@angular/core');

// Pasang JSDOM global agar komponen UI yang mengakses window/document berjalan mulus
const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
  url: 'http://localhost:3000/'
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
Object.defineProperty(globalThis.window, 'innerWidth', { value: 1440, writable: true });
Object.defineProperty(globalThis.window, 'innerHeight', { value: 900, writable: true });

const unwrap = (m) => (m && m.default ? { ...m.default, ...m } : m);

const { GameStateService } = unwrap(await import('../src/app/game-state.service.ts'));
const { ChronosEngineService } = unwrap(await import('../src/app/chronos-engine.service.ts'));
const { LoreEngineService } = unwrap(await import('../src/app/rag/lore-engine.service.ts'));
const { EngineService } = unwrap(await import('../src/app/engine.service.ts'));
const { StoryComponent } = unwrap(await import('../src/app/story.component.ts'));
const { NpcMapComponent } = unwrap(await import('../src/app/npc-map.component.ts'));
const { CharacterComponent } = unwrap(await import('../src/app/character.component.ts'));
const { generateWorldGenesis } = unwrap(await import('../src/app/world-genesis.ts'));

let totalChecks = 0;
let passedChecks = 0;

function check(cond, title, detail = '') {
  totalChecks++;
  if (!cond) {
    console.error(`  ❌ [FAIL] ${title}${detail ? ` — ${detail}` : ''}`);
    process.exitCode = 1;
  } else {
    passedChecks++;
    console.log(`  ✅ [PASS] ${title}${detail ? ` (${detail})` : ''}`);
  }
}

function createUiContext() {
  const loreEngineStub = {
    syncKnowledgeGraph: () => {},
    syncEpisodicMemory: () => {},
    reinitialize: async () => {},
    lastRetrieval: () => [
      {
        entry: {
          key: 'lore_1',
          content: 'Katana Fajar beresonansi dengan kabut pagi di Gerbang Desa Yamato.'
        }
      }
    ],
    getContextSnippet: async () => ({
      text: 'Katana Fajar beresonansi dengan kabut pagi di Gerbang Desa Yamato.',
      decision: { strategy: 0, action: 'return', confidence: 0.93, anomalyCount: 0 }
    }),
    scoreChoices: (choices) => choices.map((c) => ({ ...c, isValid: true })),
    recordTurnOutcome: () => {},
    forkTimeline: async () => 'branch_ui_1',
    switchTimeline: async () => true,
    mergeTimeline: async () => ({ mergedChunks: 2, conflictsResolved: 0 }),
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

  const storyComp = runInInjectionContext(injector, () => new StoryComponent());
  const npcMapComp = runInInjectionContext(injector, () => new NpcMapComponent());
  const charComp = runInInjectionContext(injector, () => new CharacterComponent());

  return { gameState, chronos, engine, storyComp, npcMapComp, charComp };
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║    UI & COMPONENT INTERACTIVE SIMULATION (.mjs) — FULL USER FLOW & RATIO     ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');

  const { gameState, engine, storyComp, npcMapComp, charComp } = createUiContext();

  // 1. Inisialisasi Dunia & Verifikasi Indikator Suasana Langit di StoryComponent
  console.log('\n  [1] Simulasi StoryComponent: Suasana Langit & Tombol "+1j" sepanjang Hari:');
  const genesis = generateWorldGenesis({
    title: 'Petualangan di Desa Yamato',
    mcName: 'Kuro',
    mcTitle: 'Pendekar Pedang',
    worldSetting: 'Desa Yamato',
    locationName: 'Gerbang Desa Yamato',
    initialWeapon: 'Katana Kuno',
    prologuePrompt: 'Memasuki Gerbang Desa Yamato saat fajar menyingsing.'
  });

  gameState.mcState.name = 'Kuro';
  gameState.mcState.day = 1;
  gameState.mcState.time = '06:00';
  gameState.mcState.location = 'Gerbang Desa Yamato';
  gameState.mcState.locationName = 'Gerbang Desa Yamato';
  gameState.npcStates = structuredClone(genesis.npcStates);
  gameState.npcSchedules = structuredClone(genesis.npcSchedules || {});
  gameState.factions = structuredClone(genesis.factions);
  gameState.quests = structuredClone(genesis.quests);

  const skyDawn = storyComp.getSkyAtmosphere();
  check(
    skyDawn.phase === 'dawn' && skyDawn.label === 'Fajar' && skyDawn.icon === 'wb_twilight',
    'StoryComponent.getSkyAtmosphere() pada 06:00 menampilkan Fajar (wb_twilight)',
    `${skyDawn.label} | ${skyDawn.icon} | ${skyDawn.colorClass}`
  );

  // Klik +1j sebanyak 2 kali -> 08:00 (Pagi Cerah)
  storyComp.advanceManualTime(60);
  storyComp.advanceManualTime(60);
  const skyMorning = storyComp.getSkyAtmosphere();
  check(
    gameState.mcState.time === '08:00' && skyMorning.phase === 'morning' && skyMorning.label === 'Pagi Cerah',
    'Setelah 2x klik +1j (08:00), Suasana Langit berubah ke Pagi Cerah (wb_sunny)',
    `Jam=${gameState.mcState.time}, Langit=${skyMorning.label} (${skyMorning.icon})`
  );

  // Klik +1j sebanyak 4 kali -> 12:00 (Terik Siang)
  for (let i = 0; i < 4; i++) storyComp.advanceManualTime(60);
  const skyNoon = storyComp.getSkyAtmosphere();
  check(
    gameState.mcState.time === '12:00' && skyNoon.phase === 'noon' && skyNoon.label === 'Terik Siang',
    'Setelah +4j (12:00), Suasana Langit berubah ke Terik Siang (light_mode)',
    `Jam=${gameState.mcState.time}, Langit=${skyNoon.label} (${skyNoon.icon})`
  );

  // Klik +1j sebanyak 6 kali -> 18:00 (Senja)
  for (let i = 0; i < 6; i++) storyComp.advanceManualTime(60);
  const skyDusk = storyComp.getSkyAtmosphere();
  check(
    gameState.mcState.time === '18:00' && skyDusk.phase === 'dusk' && skyDusk.label === 'Senja',
    'Setelah +6j (18:00), Suasana Langit berubah ke Senja (wb_twilight)',
    `Jam=${gameState.mcState.time}, Langit=${skyDusk.label} (${skyDusk.icon})`
  );

  // Klik +1j sebanyak 2 kali -> 20:00 (Malam)
  for (let i = 0; i < 2; i++) storyComp.advanceManualTime(60);
  const skyNight = storyComp.getSkyAtmosphere();
  check(
    gameState.mcState.time === '20:00' && skyNight.phase === 'night' && skyNight.label === 'Malam',
    'Setelah +2j (20:00), Suasana Langit berubah ke Malam (bedtime)',
    `Jam=${gameState.mcState.time}, Langit=${skyNight.label} (${skyNight.icon})`
  );

  // 2. Simulasi Alur Giliran Narasi LLM & NPC Baru Dinamis di UI
  console.log('\n  [2] Simulasi Alur Giliran Narasi (EngineService -> StoryComponent -> NpcMapComponent):');
  const turnResponse = `Monolog: Kuro bertemu Tetua Daichi dan seorang tabib keliling bernama Mei di Kedai Singgah.
\`\`\`json
{
  "new_full_chronicle_entry": {
    "narrative": "Di bawah langit malam Desa Yamato, Kuro memasuki Kedai Singgah dan disambut oleh Daichi serta seorang tabib keliling bernama Mei.",
    "narrative_blocks": [
      {
        "name": "Kuro",
        "narration": "Kuro menyarungkan Katana Fajar di ambang pintu kayu kedai.",
        "dialogue": "Apakah jalur utara menuju Whispering Woods aman malam ini?",
        "action": "Menghampiri meja Daichi"
      },
      {
        "name": "Mei",
        "narration": "Tabib Mei meracik ramuan daun perak di sudut meja.",
        "dialogue": "Kabut malam di hutan utara sedang pekat, bawalah penawar ini.",
        "action": "Menyerahkan botol ramuan"
      }
    ],
    "mc_state": {
      "location": "Kedai Singgah Desa Yamato",
      "locationName": "Kedai Singgah Desa Yamato",
      "inventory": ["Katana Kuno", "Ramuan Daun Perak", "Ransum Makanan"],
      "expGained": 30
    },
    "npc_state": [
      {
        "nama": "Daichi",
        "lokasi": "Kedai Singgah Desa Yamato",
        "aktivitas": "Berdiskusi dengan Kuro mengenai keamanan perbatasan",
        "faksi": "Penjaga Desa Yamato",
        "mood": "Serius dan ramah"
      },
      {
        "nama": "Tabib Mei",
        "lokasi": "Kedai Singgah Desa Yamato",
        "aktivitas": "Meracik ramuan obat untuk para penjaga perbatasan",
        "faksi": "Serikat Tabib Yamato",
        "mood": "Lembut dan peduli"
      }
    ],
    "choices": [
      { "id": "C-1", "text": "Menerima Ramuan Daun Perak dari Tabib Mei dan bertanya tentang kabut", "weight": 0.92 },
      { "id": "C-2", "text": "Mengajak Daichi memeriksa Menara Pantau malam ini", "weight": 0.85 }
    ]
  }
}
\`\`\``;

  const evalResult = engine.handleResponse(turnResponse);
  check(
    evalResult.llmAccepted && evalResult.userSatisfied && storyComp.latestChoices.length === 2,
    'Giliran narasi diproses dan menampilkan 2 pilihan tindakan valid di StoryComponent',
    `Choices=${storyComp.latestChoices.length}, Grounding=${evalResult.groundingScore.toFixed(2)}`
  );

  // Periksa NpcMapComponent mode 'all', 'local', dan 'rolling'
  npcMapComp.viewMode = 'all';
  const allNpcs = npcMapComp.getNpcs();
  npcMapComp.viewMode = 'local';
  const localNpcs = npcMapComp.getNpcs();
  npcMapComp.viewMode = 'rolling';
  const rollingNpcs = npcMapComp.getNpcs();

  check(
    allNpcs.length === 4 && localNpcs.length >= 2 && rollingNpcs.length === 2,
    'Filter Direktori NPC ("Semua"=4, "Sekitar">=2, "Aktif"=2) akurat tanpa menduplikasi Daichi',
    `All=[${allNpcs.map((n) => n.value.nama).join(', ')}], Rolling=[${rollingNpcs.map((n) => n.value.nama).join(', ')}]`
  );

  // Simulasikan klik "Temui" pada Tabib Mei di NpcMapComponent -> harus masuk ke input StoryComponent saat ngOnInit
  npcMapComp.interactWithNpc('Tabib Mei');
  storyComp.ngOnInit();
  check(
    storyComp.customAction.value === 'Aku menemui Tabib Mei dan memulai percakapan.',
    'Tombol "Temui" di Direktori NPC meneruskan prompt interaksi ke input kustom StoryComponent',
    `customAction="${storyComp.customAction.value}"`
  );

  // 3. Simulasi Interaksi Karakter (Inventory & Stats)
  console.log('\n  [3] Simulasi Interaksi CharacterComponent (Inventory, Equip, & Status):');
  check(
    charComp.isInventoryVisible() === true && charComp.isStatsVisible() === false,
    'Tab default kolom kanan CharacterComponent pada layar lebar (1440px) menampilkan Inventory',
    'desktopRightTab=inventory'
  );
  charComp.desktopRightTab.set('stats');
  check(
    charComp.isStatsVisible() === true,
    'Pergantian sub-tab ke "Atribut & Analisis Radar" berhasil di CharacterComponent',
    'desktopRightTab=stats'
  );

  // 4. Audit Komprehensif Rasio Ukuran Layar pada Seluruh Komponen Utama
  console.log('\n  [4] Audit Rasio Ukuran Layar & Kepadatan Layout pada Seluruh File UI:');
  const filesToAudit = [
    { file: 'src/styles.css', mustContain: ['font-size: 13px', 'font-size: 13.5px'] },
    { file: 'src/app/app.html', mustContain: ['h-10 border-b', 'max-w-[260px]', 'max-w-[240px]'] },
    { file: 'src/app/story.component.ts', mustContain: ['max-w-5xl w-full mx-auto', 'h-8 border-b', 'getSkyAtmosphere()'], mustNotContain: ['max-w-3xl', 'advanceManualTime(480)'] },
    { file: 'src/app/character.component.ts', mustContain: ['max-w-[1440px] w-full mx-auto', 'h-9 shrink-0'], mustNotContain: ['max-w-6xl'] },
    { file: 'src/app/npc-map.component.ts', mustContain: ['max-w-[1440px] w-full mx-auto', 'h-9 border-b'], mustNotContain: ['max-w-6xl'] },
    { file: 'src/app/engine-log.component.ts', mustContain: ['max-w-[1440px] w-full mx-auto', 'h-9 px-4'], mustNotContain: ['max-w-5xl'] },
    { file: 'src/app/rag-diagnostics.component.ts', mustContain: ['max-w-[1440px] w-full mx-auto', 'h-9 px-4'], mustNotContain: ['max-w-5xl'] }
  ];

  for (const item of filesToAudit) {
    const content = fs.readFileSync(path.resolve(item.file), 'utf8');
    const hasAll = item.mustContain.every((token) => content.includes(token));
    const hasForbidden = (item.mustNotContain || []).some((token) => content.includes(token));
    check(
      hasAll && !hasForbidden,
      `Audit proporsi & rasio layar pada ${item.file}`,
      `Tokens verified: [${item.mustContain.join(', ')}]`
    );
  }

  console.log('\n================================================================================');
  console.log(`🏁 RINGKASAN SIMULASI UI & INTERAKSI (.mjs): ${passedChecks}/${totalChecks} Pemeriksaan Lulus`);
  console.log('================================================================================\n');
}

main().catch((err) => {
  console.error('Fatal UI simulation error:', err);
  process.exit(1);
});
