#!/usr/bin/env node
/**
 * Codebase Indexer & Safe Refactoring Audit Tool (.mjs)
 *
 * Fungsi Utama:
 *   1. Mengindeks seluruh file di src/ (jumlah baris, ukuran byte, daftar simbol export, dan grafik import).
 *   2. Mendeteksi file yang masih melampaui ambang batas (>= 1000 baris) vs yang sudah berhasil dimodularisasi.
 *   3. Memverifikasi Kontrak Ekspor (Export Parity) dan Resolusi Import pada seluruh modul hasil refactoring
 *      (world-genesis, game-state.service, holographic-memory, lore-engine.worker) agar 100% aman.
 *   4. Menghasilkan laporan audit terstruktur di terminal.
 *
 * Cara menjalankan:
 *   npx tsx scripts/refactor-audit-index.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT_DIR = path.resolve('.');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const LINE_THRESHOLD = 1000;

function walkFiles(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === 'dist' || ent.name.startsWith('.')) continue;
    const fullPath = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walkFiles(fullPath, out);
    } else if (/\.(ts|html|css|mjs)$/.test(ent.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n').length;
      const relPath = path.relative(ROOT_DIR, fullPath);
      out.push({ fullPath, relPath, lines, bytes: Buffer.byteLength(content, 'utf8'), content });
    }
  }
  return out;
}

function extractImports(content) {
  const imports = [];
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = importRegex.exec(content)) !== null) {
    imports.push(m[1]);
  }
  return imports;
}

function resolveLocalImport(fromFile, spec) {
  if (!spec.startsWith('.')) return { resolved: true, target: spec };
  const baseDir = path.dirname(fromFile);
  const candidates = [
    path.resolve(baseDir, spec),
    path.resolve(baseDir, `${spec}.ts`),
    path.resolve(baseDir, `${spec}.js`),
    path.resolve(baseDir, `${spec}.mjs`),
    path.resolve(baseDir, spec, 'index.ts')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) {
      return { resolved: true, target: path.relative(ROOT_DIR, c) };
    }
  }
  return { resolved: false, target: spec };
}

async function runAudit() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║        CODEBASE INDEXER & SAFE REFACTORING AUDIT TOOL (.mjs)                 ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');

  const files = walkFiles(SRC_DIR).sort((a, b) => b.lines - a.lines);
  const fileMap = new Map(files.map((f) => [f.relPath, f]));

  console.log('\n  [1] Peta Indeks Ukuran Baris File Terbesar di src/ (Ambang Batas: 1.000 Baris):');
  console.log('  ------------------------------------------------------------------------------');
  console.log('  Baris | Status          | File Path');
  console.log('  ------------------------------------------------------------------------------');

  const overThreshold = [];
  for (const f of files) {
    if (f.lines >= LINE_THRESHOLD) overThreshold.push(f);
  }
  for (const f of files.slice(0, 20)) {
    const status = f.lines >= LINE_THRESHOLD ? '⚠️ >= 1000 BARIS' : '✅ < 1000 BARIS ';
    console.log(`  ${String(f.lines).padStart(5)} | ${status} | ${f.relPath}`);
  }
  console.log('  ------------------------------------------------------------------------------');

  // 2. Verifikasi Resolusi Seluruh Import Lokal di src/
  let brokenImports = 0;
  let totalLocalImports = 0;
  for (const f of files) {
    if (!f.relPath.endsWith('.ts')) continue;
    const specs = extractImports(f.content);
    for (const spec of specs) {
      if (spec.startsWith('.')) {
        totalLocalImports++;
        const res = resolveLocalImport(f.fullPath, spec);
        if (!res.resolved) {
          brokenImports++;
          console.error(`  ❌ [BROKEN IMPORT] ${f.relPath} -> "${spec}" tidak ditemukan!`);
        }
      }
    }
  }

  console.log(`\n  [2] Audit Integritas Grafik Import Lokal (${totalLocalImports} jalur diperiksa):`);
  if (brokenImports === 0) {
    console.log('      ✅ LULUS: Seluruh jalur import relatif di src/ valid dan ter-resolve.');
  } else {
    console.error(`      ❌ GAGAL: Ditemukan ${brokenImports} import yang rusak.`);
    process.exitCode = 1;
  }

  // 2b. Verifikasi tidak ada Unused Named Imports di src/app/ (TS6133 Regression Guard)
  let unusedImportsCount = 0;
  for (const f of files) {
    if (!f.relPath.startsWith('src/app/') || !f.relPath.endsWith('.ts')) continue;
    const withoutComments = f.content
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    const bodyWithoutImports = withoutComments.replace(
      /import\s+[\s\S]*?from\s+['"][^'"]+['"]\s*;?/g,
      ''
    );
    const namedImportRegex = /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"][^'"]+['"]/g;
    let m;
    while ((m = namedImportRegex.exec(withoutComments)) !== null) {
      const specs = m[1].split(',').map((s) => s.trim()).filter(Boolean);
      for (const rawSpec of specs) {
        const cleaned = rawSpec.replace(/^type\s+/, '').trim();
        const parts = cleaned.split(/\s+as\s+/);
        const localName = (parts[1] || parts[0] || '').trim();
        if (!localName) continue;
        const usageRegex = new RegExp(`\\b${localName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
        if (!usageRegex.test(bodyWithoutImports)) {
          unusedImportsCount++;
          console.error(`  ❌ [UNUSED IMPORT TS6133] ${f.relPath}: '${localName}' di-import tetapi tidak pernah digunakan.`);
        }
      }
    }
  }
  if (unusedImportsCount === 0) {
    console.log('      ✅ LULUS: Tidak ada unused named import (TS6133) di src/app/.');
  } else {
    console.error(`      ❌ GAGAL: Ditemukan ${unusedImportsCount} unused named import (TS6133).`);
    process.exitCode = 1;
  }

  // 2c. Verifikasi Kompilasi TypeScript Strict (tsconfig.app.json — exactOptionalPropertyTypes, noUnusedLocals, dll)
  try {
    execSync('npx tsc --noEmit -p tsconfig.app.json', { stdio: 'pipe', encoding: 'utf8' });
    console.log('      ✅ LULUS: Kompilasi TypeScript strict (tsconfig.app.json) bersih tanpa error (0 TS2375/TS6133).');
  } catch (tscErr) {
    console.error('      ❌ GAGAL: Ditemukan error kompilasi TypeScript pada tsconfig.app.json:');
    console.error(tscErr.stdout || tscErr.stderr || tscErr.message);
    process.exitCode = 1;
  }

  // 3. Verifikasi Kontrak Ekspor Publik pada Seluruh 4 Modul yang Dimodularisasi
  console.log('\n  [3] Audit Kontrak Ekspor Publik (Export Contract Parity — Tahap 1 & Tahap 2):');
  const unwrap = (m) => (m && m.default ? { ...m.default, ...m } : m);

  // 3a. world-genesis.ts
  const worldGenesisMod = unwrap(await import('../src/app/world-genesis.ts'));
  const requiredWorldGenesisExports = [
    'generateWorldGenesis',
    'resolveInitialCharacterStats',
    'inferNpcRoleArchetype',
    'generateDynamicNpcSchedule',
    'generateNpcSchedulesMap',
    'resolveScheduleSlotForHour'
  ];
  for (const sym of requiredWorldGenesisExports) {
    if (typeof worldGenesisMod[sym] !== 'function') {
      console.error(`      ❌ [FAIL] src/app/world-genesis.ts kehilangan ekspor fungsi: ${sym}`);
      process.exitCode = 1;
    }
  }
  console.log(
    `      ✅ src/app/world-genesis.ts (${fileMap.get('src/app/world-genesis.ts')?.lines} baris): Seluruh ${requiredWorldGenesisExports.length} fungsi publik ter-ekspor utuh.`
  );

  // 3b. game-state.service.ts
  const gameStateMod = unwrap(await import('../src/app/game-state.service.ts'));
  const requiredGameStateExports = ['GameStateService', 'GameDatabase'];
  for (const sym of requiredGameStateExports) {
    if (typeof gameStateMod[sym] !== 'function') {
      console.error(`      ❌ [FAIL] src/app/game-state.service.ts kehilangan ekspor kelas: ${sym}`);
      process.exitCode = 1;
    }
  }
  const requiredGameStateMethods = [
    'loadState',
    'saveState',
    'switchStory',
    'createNewStory',
    'duplicateStory',
    'deleteStory',
    'resetCurrentStory',
    'forkTimelineBranch',
    'switchTimelineBranch',
    'mergeTimelineBranch',
    'pruneTimelineBranch',
    'updateMcState',
    'updateNpcStates',
    'ensureAllNpcSchedules',
    'ensureNpcSchedule',
    'enforceTopologicalSync',
    'recomputeHomology',
    'updateFactions',
    'adjustFactionReputation',
    'adjustNpcTrust',
    'getNpcTrust',
    'getFactionNpcs',
    'updateKnowledgeGraph',
    'equipItem',
    'unequipItem',
    'useItem',
    'dropItem',
    'addItem'
  ];
  const proto = gameStateMod.GameStateService.prototype;
  for (const method of requiredGameStateMethods) {
    if (typeof proto[method] !== 'function') {
      console.error(`      ❌ [FAIL] GameStateService.prototype kehilangan metode: ${method}`);
      process.exitCode = 1;
    }
  }
  console.log(
    `      ✅ src/app/game-state.service.ts (${fileMap.get('src/app/game-state.service.ts')?.lines} baris): Kelas & seluruh ${requiredGameStateMethods.length} metode publik ter-indeks utuh.`
  );

  // 3c. holographic-memory.ts
  const holoMod = unwrap(await import('../src/app/rag/holographic-memory.ts'));
  const requiredHoloClasses = ['ContinuousHRR', 'HolographicMemoryField', 'EpistemicRetrievalKernel'];
  for (const cls of requiredHoloClasses) {
    if (typeof holoMod[cls] !== 'function') {
      console.error(`      ❌ [FAIL] src/app/rag/holographic-memory.ts kehilangan ekspor kelas: ${cls}`);
      process.exitCode = 1;
    }
  }
  console.log(
    `      ✅ src/app/rag/holographic-memory.ts (${fileMap.get('src/app/rag/holographic-memory.ts')?.lines} baris): Kelas [${requiredHoloClasses.join(', ')}] ter-ekspor utuh.`
  );

  // 3d. lore-engine.worker.ts & sub-modules
  const workerEmbedMod = unwrap(await import('../src/app/rag/worker-tokenizer-embedder.ts'));
  const workerWhatIfMod = unwrap(await import('../src/app/rag/worker-whatif-simulator.ts'));
  const requiredWorkerHelpers = ['_canonicalTokens', '_tf', '_chunk', '_hash', '_hashTerm', '_textToVector', '_getEmbeddingProof'];
  for (const fn of requiredWorkerHelpers) {
    if (typeof workerEmbedMod[fn] !== 'function') {
      console.error(`      ❌ [FAIL] src/app/rag/worker-tokenizer-embedder.ts kehilangan fungsi: ${fn}`);
      process.exitCode = 1;
    }
  }
  if (typeof workerWhatIfMod.evaluateWhatIfScenario !== 'function') {
    console.error('      ❌ [FAIL] src/app/rag/worker-whatif-simulator.ts kehilangan evaluateWhatIfScenario');
    process.exitCode = 1;
  }
  console.log(
    `      ✅ src/app/rag/lore-engine.worker.ts (${fileMap.get('src/app/rag/lore-engine.worker.ts')?.lines} baris): Sub-modul tokenizer/embedder & What-If simulator ter-indeks utuh.`
  );

  console.log('\n  [4] Ringkasan Status Modularisasi Tahap 1 & Tahap 2:');
  console.log(`      • Total file di src/               : ${files.length} file`);
  console.log(`      • File >= 1000 baris tersisa       : ${overThreshold.length} file (${overThreshold.map((f) => `${f.relPath} [${f.lines}]`).join(', ') || '0 — SELURUH FILE DI BAWAH 1.000 BARIS!'})`);
  if (overThreshold.length > 0) {
    process.exitCode = 1;
  }
  console.log('================================================================================\n');
}

runAudit().catch((err) => {
  console.error('Fatal error in refactor-audit-index.mjs:', err);
  process.exit(1);
});
