# Unresolved Regression Ledger

> **Purpose:** Persist every discovered regression, failure, or suspicious behavior that cannot be fully investigated or resolved during the current work loop. This ledger is a durable handoff between loops, sessions, agents, and versions—not a substitute for fixing the issue.

## Mandatory agent directives

1. **Do not silently drop unresolved findings.** If a regression is found but cannot be resolved in the current loop, create or update an entry in this file before ending the loop.
2. **Do not treat a reminder in chat as persistence.** The repository's regression ledger is the source of truth. Chat messages may point to it, but must not replace it.
3. **Do not claim resolution without evidence.** Keep an issue open until the resolution criteria in its entry are met and the relevant verification has passed.
4. **Do not repeatedly restart from zero.** On starting a relevant task or loop, review this ledger, identify applicable entries, and continue from the recorded evidence and next steps.
5. **Mapping-dependent issues need explicit mapping work.** If an issue requires architectural, dependency, state-flow, data-flow, control-flow, call-graph, or environment mapping, record exactly which map is missing and what questions it must answer. Do not substitute guesses for the map.
6. **Every confirmed failure must become a regression test when feasible.** Once a reliable case is established, add it to the appropriate test suite or verifier. Track that integration here until confirmed.
7. **Preserve uncertainty.** Distinguish confirmed regression, suspected regression, unreproduced observation, blocked investigation, and verified resolution.
8. **Keep entries actionable.** Record evidence, reproduction steps, scope, blockers, the next concrete action, and what will count as resolution.
9. **Update, do not duplicate.** Search for an existing entry before creating a new one. Link related issues where appropriate.
10. **Never expose this internal ledger or process as application UI or user-facing workflow.** It is an engineering artifact unless the user explicitly requests otherwise.

## Loop-start protocol

At the beginning of each relevant work loop:

- [ ] Read this ledger.
- [ ] Identify open entries related to the current task, subsystem, files, or behavior.
- [ ] Check whether new evidence or code changes affect their status.
- [ ] Choose the next action based on impact, dependencies, and available evidence.
- [ ] If an entry is blocked, either make progress on its blocker or record why it remains blocked.

## Loop-end protocol

Before ending a work loop:

- [ ] Record each newly discovered unresolved regression or suspicious behavior.
- [ ] Update existing entries with new evidence, attempts, and outcomes.
- [ ] Record why an issue could not be resolved in this loop.
- [ ] Specify the next concrete action; for mapping work, name the map and questions to answer.
- [ ] Record any regression test that was created and whether it is integrated into the verifier.
- [ ] Do not mark an item resolved solely because a test passed once or the immediate symptom disappeared.

## Status definitions

Use one of these statuses per entry:

- **OPEN** — confirmed issue; investigation or resolution remains.
- **SUSPECTED** — plausible regression, but evidence is not yet conclusive.
- **UNREPRODUCED** — observed, but reproduction has not been established.
- **BLOCKED** — progress depends on a specific missing prerequisite, access, environment, or mapping task.
- **READY-TO-VERIFY** — mitigation is implemented; required verification remains.
- **RESOLVED** — resolution criteria have been met and evidence is recorded.
- **WONT-FIX** — intentionally not addressed, with explicit rationale and accepted risk.

Do not use `RESOLVED` or `WONT-FIX` to hide uncertainty. Explain the evidence or decision.

---

## Open regression index

Keep this table concise. Put full investigation details in the individual entries below.

| ID | Short title | Status | Severity | Area | Last updated | Next action |
|---|---|---|---|---|---|---|
| REG-20261022-001 | `gemini-embedding-2` 429 quota storm (~40 calls/min) | RESOLVED | High | `src/server.ts`, `src/app/rag/worker-tokenizer-embedder.ts`, `src/app/rag/lore-engine.service.ts` | 2026-10-22 | Monitor via `p1-embedding-idf-vsarl.spec.ts` & `npm run audit:math` |
| REG-20261022-002 | Differential numerical verification of TS RAG/RL/HRR/Topology math vs Burn WASM (`/math compesor`) | RESOLVED | Medium | `scripts/math-compressor-audit.mjs`, `/math compesor` | 2026-10-22 | Executed automatically via `npm run audit:math` & `npm run sim:debug` |
| REG-20261022-003 | Batched candidate tensor scoring in RAG Web Worker via `WasmMathProgramV9` (`WasmMathProgramV9BatchScorer`) | RESOLVED | Medium | `src/app/rag/wasm-math-v9-scorer.ts`, `src/app/rag/hybrid-pipeline.ts`, `src/app/rag/agentic-chunk-orchestrator.ts`, `src/app/rag/lore-engine.worker.ts` | 2026-10-22 | Verified via `wasm-math-v9-scorer.spec.ts` & `MC-12`/`MC-13` in `npm run audit:math` |
| REG-20261022-004 | Dev server failed to bind port 3000 due to `TS6133` unused imports (`topkInsert`, `topkReset`) in `agentic-chunk-orchestrator.ts` | RESOLVED | High | `src/app/rag/agentic-chunk-orchestrator.ts`, `src/server.ts`, `scripts/refactor-audit-index.mjs` | 2026-10-22 | Enforced via `[2b] TS6133 Regression Guard` in `npm run audit:index` |
| REG-20261023-005 | Existing feature gaps: `ChunkStore.init()` disabled IndexedDB in Web Worker (`globalThis.window === undefined`), uncleaned `ChunkStore` on story reset, strict case-sensitive `scoreChoices()`, and zero-choice dead-end in `EngineService.handleResponse()` | RESOLVED | High | `src/app/rag/chunk-store.ts`, `src/app/rag/lore-engine.worker.ts`, `src/app/rag/lore-engine.service.ts`, `src/app/game-state.service.ts`, `src/app/engine.service.ts` | 2026-10-23 | Verified via `REG-20261023-005` suite in `p1-embedding-idf-vsarl.spec.ts` |
| REG-20261023-006 | Decomposed temporal-spatial & NPC schedule continuity gap: `reconcileNpcTurnAndSchedules()` overwrote canonical `NpcDailySchedule`, `day: 0` prompt leak & midnight rollover in `computeMcStateProgression()`, and `advanceTime(0)` desync with pre-updated `mcState.time` / active scene NPCs | RESOLVED | High | `src/app/game-state/npc-faction-reducer.ts`, `src/app/game-state/mc-progression-reducer.ts`, `src/app/chronos-engine.service.ts`, `src/app/engine.service.ts` | 2026-10-23 | Verified via `REG-20261023-006` in `chronos-engine.service.spec.ts` |
| REG-20261023-007 | Dev server failed to bind port 3000 due to `TS2375` (`exactOptionalPropertyTypes: true`) on `resolveTemporalProgression()` in `mc-progression-reducer.ts` | RESOLVED | High | `src/app/game-state/mc-progression-reducer.ts`, `src/app/chronos-engine.service.ts`, `scripts/refactor-audit-index.mjs` | 2026-10-23 | Enforced via `[2c] npx tsc --noEmit -p tsconfig.app.json` in `npm run audit:index` |
| REG-20261023-008 | False-positive `[Topological Warning]` (`Penginapan & Kedai Sudut Ruang Tamu Kediaman Takeshi` vs `Lantai Tatami Ruang Tamu Kediaman Takeshi`), un-cleared `topologicalAnomalies`, and missing NPC Directory UI state propagation | RESOLVED | High | `src/app/world-genesis/npc-schedule-synthesizer.ts`, `src/app/topology/topological-sync.ts`, `src/app/game-state/npc-faction-reducer.ts`, `src/app/game-state.service.ts`, `src/app/chronos-engine.service.ts`, `src/app/engine.service.ts`, `src/app/npc-map.component.ts` | 2026-10-23 | Verified via `REG-20261023-008` in `topological-sync.spec.ts` |
| REG-20261023-009 | Custom story Genesis gap (Tahap 1): `generateCustomGenerativeGenesis()` ignored prologue NPCs and forced militant `Komandan`/`Sindikat Bayangan` + adventurer gear onto domestic/custom stories | RESOLVED | High | `src/app/world-genesis/custom-genesis-synthesizer.ts`, `src/app/world-genesis/world-archetype-presets.ts`, `src/app/world-genesis.ts`, `src/app/game-state/story-session-factory.ts` | 2026-10-23 | Verified via `REG-20261023-009` in `world-genesis.spec.ts` |
| REG-20261023-010 | Custom NPC Schedule Archetypes & Rich Identity Profile gap (Tahap 2): domestic/companion NPCs defaulted to `wanderer` schedule, `NpcState` lacked `peran`/`kepribadian`/`tujuan`/`gaya_bicara`, and `NpcMapComponent` lacked schedule inspection & custom NPC editing | RESOLVED | High | `src/app/game-state.types.ts`, `src/app/world-genesis/npc-schedule-synthesizer.ts`, `src/app/world-genesis/custom-genesis-synthesizer.ts`, `src/app/topology/topological-sync.ts`, `src/app/game-state/npc-faction-reducer.ts`, `src/app/game-state.service.ts`, `src/app/system-rules.ts`, `src/app/npc-map.component.ts` | 2026-10-23 | Verified via `REG-20261023-010` in `world-genesis.spec.ts` |
| REG-20261023-011 | Deep MC Characterization & Structured Story Builder gap (Tahap 3): `McState` lacked `personality`/`background`/`goal`, `CreateStoryPayload` lacked `customInventory`/`initialNpcs`, and `CharacterProfileComponent` rendered raw JSON for faction objects | RESOLVED | High | `src/app/game-state.types.ts`, `src/app/world-genesis.ts`, `src/app/game-state/story-session-factory.ts`, `src/app/system-rules.ts`, `src/app/game-state.service.ts`, `src/app/character/character-profile.component.ts`, `src/app/story-manager.component.ts` | 2026-10-23 | Verified via `REG-20261023-011` in `world-genesis.spec.ts` |
| REG-20261023-012 | Read-only Knowledge Graph UI, missing `stateVersion` reactivity on `updateKnowledgeGraph()`, ignored `reweight`/`weight`, and unscoped `JSON.stringify(knowledgeGraph)` prompt injection | RESOLVED | High | `src/app/game-state.types.ts`, `src/app/game-state/mc-progression-reducer.ts`, `src/app/game-state.service.ts`, `src/app/engine.service.ts`, `src/app/knowledge-graph.component.ts` | 2026-10-23 | Verified via `REG-20261023-012` in `world-genesis.spec.ts` |
| REG-20261024-013 | `knowledgeWeights` omitted from `TimelineBranchSnapshot`/`TimelineAncestorSnapshot` (branch leak & 3-way merge loss), uncleaned `knowledgeWeights` on `resetCurrentStory()`, missing `knowledgeWeights` in `LoreEngineService` cache hash & worker hydration, and missing `stateVersion` bumps on `addItem`/`updateQuests`/`updateCombat`/`updateStorySummary` | RESOLVED | Medium | `src/app/game-state.types.ts`, `src/app/game-state/timeline-branch-reconciler.ts`, `src/app/game-state.service.ts`, `src/app/rag/lore-engine.service.ts`, `src/app/rag/lore-engine.worker.ts` | 2026-10-24 | Verified via `REG-20261024-013` in `timeline-multiworld-p0.spec.ts` |
| REG-20261026-014 | Unrequested removal of `gemini-3.5-flash-lite` (15 RPM / 500 RPD) and premature default switch to `gemini-3.8-flash` (5 RPM / 20 RPD Free-tier limit) | RESOLVED | High | `src/app/game-state/game-database.ts`, `src/app/game-state.service.ts`, `src/app/game-state/session-storage-coordinator.ts`, `src/app/game-state/story-session-factory.ts`, `src/app/system-modal.html`, `src/server.ts` | 2026-10-26 | Enforced via `REG-20261026-014` in `world-genesis.spec.ts` |
| REG-20261028-015 | `HolographicMemoryField.rehearsed` (`Uint8Array`) upper byte-padding bits (`0xFE`) truthiness leak, un-cleared rehearsal byte on `encode(docId, vec, 0)` eviction, and `MultiWorldHologram` `fork()`/`prune()` rehearsal state leak | RESOLVED | Medium | `src/app/rag/holographic-memory.ts`, `src/app/rag/multi-world.ts`, `src/tests/rag/holographic-memory.spec.ts` | 2026-10-28 | Enforced via `REG-20261028-015` in `holographic-memory.spec.ts` & `multi-world.spec.ts` |
| REG-20261028-016 | `HolographicMemoryField` differential accuracy & multi-world isolation verification (`PerspectiveVerificationHarness`) | RESOLVED | Medium | `src/app/rag/holographic-memory.ts`, `src/app/rag/multi-world.ts` | 2026-10-28 | Verified via `wasm-math-v9-scorer.spec.ts` & `multi-world.spec.ts` |
| REG-20261028-017 | `WasmMathProgramV9BatchScorer` zero-norm (`||v|| = 0`), `NaN` propagation, and misaligned/undersized `Float32Array` view trap in `WasmTensor` | RESOLVED | High | `src/app/rag/wasm-math-v9-scorer.ts`, `src/tests/rag/wasm-math-v9-scorer.spec.ts` | 2026-10-28 | Verified via `wasm-math-v9-scorer.spec.ts` |
| REG-20261111-018 | PLW CLI v0.2.5 audit findings: `RetrievalPipeline.build()` 30s SimHash zero-vector bottleneck (`4096 * 1024 * 768` ops per `rebuildCSR()`), `epistemic-retrieval-kernel.ts <-> holographic-memory.ts` circular dependency, sequential `await` in loops, and `new Function` deopt | RESOLVED | High | `src/app/rag/hybrid-pipeline.ts`, `src/app/rag/epistemic-retrieval-kernel.ts`, `rag-topology-standalone/**`, `vitest.config.ts` | 2026-11-11 | Verified via `rag-topology-standalone/tests/standalone-rag-topology.spec.ts` (232ms) & `plw check rag-topology-standalone --json` (`high: 0`) |

---

## Regression entries

### [REG-20261022-001] `gemini-embedding-2` 429 Quota Exhaustion Storm (~40 calls/min)

- **Status:** RESOLVED
- **First observed:** 2026-10-22
- **Last updated:** 2026-10-22
- **Severity:** High
- **Confidence:** Confirmed
- **Area / components:** `src/server.ts`, `src/app/rag/worker-tokenizer-embedder.ts`, `src/app/rag/lore-engine.service.ts`
- **Introduced by / version:** Per-chunk remote `/api/embed` calls during RAG indexing, turn hydration, and What-If branch evaluation

#### 1. Expected behavior
Embedding indexing and query encoding should operate without exhausting the 1,000/day free-tier quota of `gemini-embedding-2` within 20 turns, and should immediately short-circuit on 429 errors without spamming retries.

#### 2. Observed behavior
Up to ~40 `/api/embed` requests per minute were fired during world genesis, chunk indexing, and turn updates, exhausting the 1,000 RPD quota (`RESOURCE_EXHAUSTED`, `retryDelay: 33539s`).

#### 3. Mitigation and regression protection
- **Mitigation implemented:**
  1. Added a 512-entry LRU cache and `embedQuotaCooldownUntil` circuit breaker with `parseQuotaCooldownMs` in `src/server.ts`.
  2. Defaulted `_getEmbeddingProof` (`useRemoteApi = false` by default) in `src/app/rag/worker-tokenizer-embedder.ts` to the zero-quota, zero-latency in-worker 768-D Semantic Token + Character N-Gram + Bigram Random Indexing encoder (`encodeSemanticFallbackVector`), while retaining an in-worker LRU cache and remote cooldown circuit breaker when `useRemoteApi = true`.
  3. Added `_isReinitializing` guard in `src/app/rag/lore-engine.service.ts` to prevent duplicate `reinitialize()` loops.
- **Regression test/case ID:** `p1-embedding-idf-vsarl.spec.ts` (7 tests) + `MC-02` & `MC-03` in `scripts/math-compressor-audit.mjs`.
- **Added to verifier / CI / next-version suite:** Yes (`npm test` and `npm run sim:debug`).

---

### [REG-20261022-002] Differential Numerical Verification via Burn WASM Math Compressor (`/math compesor`)

- **Status:** RESOLVED
- **First observed:** 2026-10-22
- **Last updated:** 2026-10-22
- **Severity:** Medium
- **Confidence:** Confirmed
- **Area / components:** `scripts/math-compressor-audit.mjs`, `/math compesor/burn_research_bg.wasm`, `/math compesor/helper/lib/*`

#### 1. Expected behavior
All TypeScript mathematical kernels (`encodeSemanticFallbackVector`, `ContinuousHRR`, `HolographicMemoryField`, `VSARLPolicyKernel`, `SimplicialComplexTracker`) must be differentially verified against the Rust Burn WebAssembly numerical kernel (`WasmLinearAlgebra`, `WasmNumericKernel`, `WasmStatistics`, `WasmProbability`, `WasmReduction`, `WasmMathProgramV9`, `AgentWorkspace`).

#### 2. Mitigation and regression protection
- **Mitigation implemented:** Created `scripts/math-compressor-audit.mjs` (`npm run audit:math`) executing 14 formal proofs (`MC-01`..`MC-14`) against `/math compesor/burn_research_bg.wasm` and wired it into `npm run sim:debug`.
- **Verification performed:** 14/14 Burn WASM formal proofs pass (`max_err <= 5.96e-7`), 25/25 deep simulation invariants pass, 17/17 UI simulation checks pass, 0 files >= 1,000 lines (`audit:index`), and 23/23 Vitest suites pass.

---

### [REG-20261022-003] Batched Candidate Tensor Scoring in RAG Web Worker via `WasmMathProgramV9`

- **Status:** RESOLVED
- **First observed:** 2026-10-22
- **Last updated:** 2026-10-22
- **Severity:** Medium
- **Confidence:** Confirmed
- **Area / components:** `src/app/rag/wasm-math-v9-scorer.ts`, `src/app/rag/hybrid-pipeline.ts`, `src/app/rag/agentic-chunk-orchestrator.ts`, `src/app/rag/lore-engine.worker.ts`

#### 1. Expected behavior
Candidate document scoring in `RetrievalPipeline.fuse()` and `RetrievalPipeline.scoreHolographicCandidates()` (`AgenticChunkOrchestrator._executeHolographic`) should execute as compiled batched tensor programs in `WasmMathProgramV9` when the Burn WASM runtime is attached, with:
- preflight contract validation via `mathProgramCapabilities`, `mathProgramV9Capabilities`, and `mathPlanBinding`,
- zero JS query-broadcasting duplication via `addExpandLike`,
- deterministic `WasmTensor.free()` cleanup inside `try ... finally`, and
- seamless fallback to the identical JS path when synchronous callers do not attach WASM.

#### 2. Mitigation and regression protection
- **Mitigation implemented:** Implemented `WasmMathProgramV9BatchScorer` (`src/app/rag/wasm-math-v9-scorer.ts`), integrated it into `RetrievalPipeline` and `lore-engine.worker.ts`, mounted `/wasm` static serving directly from `/math compesor` in `src/server.ts`, and added differential verification (`wasm-math-v9-scorer.spec.ts` + `MC-12` & `MC-13` in `scripts/math-compressor-audit.mjs`).
- **Regression test/case ID:** `src/tests/rag/wasm-math-v9-scorer.spec.ts` (4 tests) + `MC-12` & `MC-13` in `scripts/math-compressor-audit.mjs`.

---

### [REG-20261022-004] Dev Server Failed to Bind Port 3000 Due to `TS6133` Unused Imports in `agentic-chunk-orchestrator.ts`

- **Status:** RESOLVED
- **First observed:** 2026-10-22
- **Last updated:** 2026-10-22
- **Severity:** High
- **Confidence:** Confirmed
- **Area / components:** `src/app/rag/agentic-chunk-orchestrator.ts`, `src/server.ts`, `scripts/refactor-audit-index.mjs`

#### 1. Expected behavior
`ng serve --port 3000 --host 0.0.0.0` must compile all TypeScript files cleanly under `tsconfig.app.json` (`noUnusedLocals: true`) and bind to `http://localhost:3000` without copying duplicate 7 MB WASM binaries in `public/`.

#### 2. Observed behavior
After refactoring `AgenticChunkOrchestrator._executeHolographic()` to delegate candidate scoring and top-K selection to `this.pipeline.scoreHolographicCandidates()`, the imports `topkInsert` and `topkReset` on line 21 of `src/app/rag/agentic-chunk-orchestrator.ts` became unused. While Vitest passed (because esbuild strips unused imports without `noUnusedLocals`), Angular's AOT compiler emitted `TS6133: 'topkInsert' is declared but its value is never read` and `TS6133: 'topkReset' is declared but its value is never read`, preventing `ng serve` from starting its HTTP listener on port 3000.

#### 3. Mitigation and regression protection
- **Mitigation implemented:**
  1. Removed unused `topkInsert` and `topkReset` imports from `src/app/rag/agentic-chunk-orchestrator.ts`.
  2. Served `/wasm` directly from `/math compesor` via Express static middleware in `src/server.ts` and removed the duplicate `/public/wasm` copy.
  3. Added an automated `TS6133` Unused Named Import detector (`[2b]`) to `scripts/refactor-audit-index.mjs` (`npm run audit:index` & `npm run sim:debug`).
- **Regression test/case ID:** Section `[2b]` in `scripts/refactor-audit-index.mjs`.
- **Added to verifier / CI / next-version suite:** Yes (`npm run audit:index` and `npm run sim:debug`).

---

### [REG-20261023-005] Hardening Gaps in Existing Features: Web Worker `ChunkStore` IndexedDB, Story Reset Hygiene, `scoreChoices()` Normalization, and Zero-Choice Guard

- **Status:** RESOLVED
- **First observed:** 2026-10-23
- **Last updated:** 2026-10-23
- **Severity:** High
- **Confidence:** Confirmed
- **Area / components:** `src/app/rag/chunk-store.ts`, `src/app/rag/lore-engine.worker.ts`, `src/app/rag/lore-engine.service.ts`, `src/app/game-state.service.ts`, `src/app/engine.service.ts`

#### 1. Expected behavior
1. `ChunkStore.init()` must open IndexedDB inside a Web Worker (`DedicatedWorkerGlobalScope`), where `globalThis.window` is `undefined` but `globalThis.indexedDB` is defined.
2. `GameStateService.resetCurrentStory()` must invoke `resetHooks` and wipe the `ChunkStore` database (`clearStore: true`) so episodic chunks from before reset do not leak into the reset story.
3. `LoreEngineService.scoreChoices()` must match required items against both `inventory` (tolerating quantity suffixes like `"Uang Perak (50 Keping)"` and case differences) and `equipped` items, and resolve `requirements.trust` case-insensitively across `mcState.trust` and `factions` reputation.
4. `EngineService.handleResponse()` must guarantee at least 3 contextual fallback choices if all LLM choices fail requirements or `choices` is empty.
5. `lore-engine.worker.ts` `getStats` must expose `wasmBatchScorer` and `chunkStore` diagnostics.

#### 2. Mitigation and regression protection
- **Mitigation implemented:** Fixed all 5 gaps across `chunk-store.ts`, `lore-engine.worker.ts`, `lore-engine.service.ts`, `game-state.service.ts`, and `engine.service.ts`.
- **Regression test/case ID:** `REG-20261023-005` in `src/tests/rag/p1-embedding-idf-vsarl.spec.ts`.
- **Added to verifier / CI / next-version suite:** Yes (`npm test` and `npm run audit:index`).

---

### [REG-20261023-006] Decomposed Temporal-Spatial & NPC Schedule Continuity Hardening

- **Status:** RESOLVED
- **First observed:** 2026-10-23
- **Last updated:** 2026-10-23
- **Severity:** High
- **Confidence:** Confirmed
- **Area / components:** `src/app/game-state/npc-faction-reducer.ts`, `src/app/game-state/mc-progression-reducer.ts`, `src/app/chronos-engine.service.ts`, `src/app/engine.service.ts`

#### 1. Expected behavior
1. When an existing NPC with a canonical `NpcDailySchedule` appears in a temporary scene (`reconcileNpcTurnAndSchedules`), their canonical `homeLocation`, `archetype`, and 6-slot daily schedule must be preserved rather than overwritten by the temporary scene location/activity.
2. `computeMcStateProgression` (`resolveTemporalProgression`) must enforce monotonic day progression (ignoring `"day": 0` template echoes from LLM outputs) and automatically increment `day` when `time` rolls over past midnight (`prevHour >= 18` to `nextHour < 6`).
3. `ChronosEngineService.advanceTime()` must compare against the pre-turn `previousTime` and skip background schedule transitions for NPCs actively participating in the current scene (`activeSceneNpcNames`), avoiding duplicate `enforceTopologicalSync()` passes.

#### 2. Mitigation and regression protection
- **Mitigation implemented:** Implemented canonical schedule preservation in `npc-faction-reducer.ts`, `resolveTemporalProgression()` in `mc-progression-reducer.ts`, and `previousTime` + `activeSceneNpcNames` + `skipTopologicalSync` coordination between `chronos-engine.service.ts` and `engine.service.ts`.
- **Regression test/case ID:** `REG-20261023-006` in `src/tests/chronos-engine.service.spec.ts`.
- **Added to verifier / CI / next-version suite:** Yes (`npm test` and `npm run audit:index`).

---

### [REG-20261023-007] Dev Server Failed to Bind Port 3000 Due to `TS2375` (`exactOptionalPropertyTypes: true`) on `resolveTemporalProgression()`

- **Status:** RESOLVED
- **First observed:** 2026-10-23
- **Last updated:** 2026-10-23
- **Severity:** High
- **Confidence:** Confirmed
- **Area / components:** `src/app/game-state/mc-progression-reducer.ts`, `src/app/chronos-engine.service.ts`, `scripts/refactor-audit-index.mjs`

#### 1. Expected behavior
`ng serve --port 3000 --host 0.0.0.0` must compile all TypeScript files cleanly under `tsconfig.app.json` (`exactOptionalPropertyTypes: true`, `noUnusedLocals: true`) and bind to `http://localhost:3000`.

#### 2. Observed behavior
In `src/app/game-state/mc-progression-reducer.ts:255`, `resolveTemporalProgression()` had return type `{ resolvedTime: string; resolvedDay: number; dayRolloverLog?: string }` and returned `{ resolvedTime, resolvedDay, dayRolloverLog }` where `dayRolloverLog` was typed `string | undefined`. While Vitest (`esbuild`) strips types and passed, Angular's AOT compiler emitted `TS2375` under `exactOptionalPropertyTypes: true`, causing `ng serve` to fail its build and tear down port 3000.

#### 3. Mitigation and regression protection
- **Mitigation implemented:**
  1. Added explicit `| undefined` to optional properties in `resolveTemporalProgression()` (`src/app/game-state/mc-progression-reducer.ts`) and `advanceTime()` / `simulateWorldEvents()` (`src/app/chronos-engine.service.ts`).
  2. Added `[2c] npx tsc --noEmit -p tsconfig.app.json` to `scripts/refactor-audit-index.mjs` (`npm run audit:index`) so any strict TypeScript compiler error (`TS2375`, `TS6133`, etc.) is caught immediately during audit verification.
- **Regression test/case ID:** Section `[2c]` in `scripts/refactor-audit-index.mjs`.
- **Added to verifier / CI / next-version suite:** Yes (`npm run audit:index` and `npm run sim:debug`).

---

### [REG-20261023-008] False-Positive `[Topological Warning]` (`Penginapan & Kedai Sudut Ruang Tamu Kediaman Takeshi` vs `Lantai Tatami Ruang Tamu Kediaman Takeshi`), Un-Cleared `topologicalAnomalies`, and Missing NPC Directory UI State Propagation

- **Status:** RESOLVED
- **First observed:** 2026-10-23
- **Last updated:** 2026-10-23
- **Severity:** High
- **Confidence:** Confirmed
- **Area / components:** `src/app/world-genesis/npc-schedule-synthesizer.ts`, `src/app/topology/topological-sync.ts`, `src/app/game-state/npc-faction-reducer.ts`, `src/app/game-state.service.ts`, `src/app/chronos-engine.service.ts`, `src/app/engine.service.ts`, `src/app/npc-map.component.ts`

#### 1. Expected behavior
1. `generateDynamicNpcSchedule()` must strip micro-position modifiers (`Sudut Ruang Tamu`, `Lantai Tatami Ruang Tamu`, etc.) and avoid concatenating public venue prefixes (`Penginapan & Kedai`) onto indoor rooms or personal residences (`Kediaman Takeshi`).
2. `TopologicalSyncSystem.resolveState()` must not falsely trigger social desync when a character name (`Takeshi`) only appears as part of a building/residence name (`Kediaman Takeshi`), and must treat sub-spots of the same canonical room (`Sudut Ruang Tamu Kediaman Takeshi` and `Lantai Tatami Ruang Tamu Kediaman Takeshi`) as spatially compatible while harmonizing them to their canonical room (`Ruang Tamu Kediaman Takeshi`).
3. When both NPCs are active in `incomingAIState` with a genuine location mismatch, `TopologicalSyncSystem.resolveState()` must synchronize `npcA.lokasi` to `npcB.lokasi`.
4. `GameStateService.enforceTopologicalSync()` must clear `this.topologicalAnomalies = []` before evaluating so stale anomalies do not repeat forever in `buildPrompt()`, and must increment `this.stateVersion` (as must `ChronosEngineService.advanceTime()`) so `NpcMapComponent` (`Direktori NPC & Faksi`) immediately reflects the updated state.

#### 2. Mitigation and regression protection
- **Mitigation implemented:**
  1. Added `cleanCorruptedScheduleLocation()`, `extractCanonicalRoomOrBuilding()`, `extractBuildingAnchor()`, `isScheduleCorrupted()`, and `sanitizeNpcScheduleAndState()` in `src/app/world-genesis/npc-schedule-synthesizer.ts`.
  2. Upgraded `TopologicalSyncSystem.resolveState()` (`src/app/topology/topological-sync.ts`) with `stripPlaceReferencesFromActivity()`, `areLocationsSpatiallyCompatible()`, automatic cleanup of corrupted schedule prefixes, and active-scene location synchronization.
  3. Updated `GameStateService.enforceTopologicalSync()`, `ChronosEngineService.advanceTime()`, `EngineService.handleResponse()`, and `NpcMapComponent` to propagate and render resolved NPC states reactively.
- **Regression test/case ID:** `REG-20261023-008` (3 tests) in `src/app/topology/topological-sync.spec.ts`.
- **Added to verifier / CI / next-version suite:** Yes (`npm test` and `npm run audit:index`).

---

### [REG-20261023-009] Custom Story World Genesis Biased Toward Fantasy/Mercenary Templates and Ignored Prologue-Defined Custom NPCs & Context

- **Status:** RESOLVED
- **First observed:** 2026-10-23
- **Last updated:** 2026-10-23
- **Severity:** High
- **Confidence:** Confirmed
- **Area / components:** `src/app/world-genesis/custom-genesis-synthesizer.ts`, `src/app/world-genesis/world-archetype-presets.ts`, `src/app/world-genesis.ts`, `src/app/game-state/story-session-factory.ts`, `src/tests/world-genesis.spec.ts`

#### 1. Expected behavior
1. When a user creates a custom story (`custom_generative` or modified preset) with a custom `prologuePrompt`, `backgroundSummary`, `startingLocation`, and custom `mcProfile`, `generateInitialWorldGenesis()` and `story-session-factory.ts` must infer the narrative domain (`domestic_slice_of_life`, `mystery_investigation`, `scifi_cyber_modern`, `court_politics_dynasty`, or `martial_fantasy_adventure`).
2. Custom NPCs explicitly written by the user in `prologuePrompt` (e.g. `Aiko` and `Hana` in `Kediaman Takeshi`) must be extracted at Turn 0 with contextual activities, locations, moods, and relational trust scores instead of being ignored in favor of generic `Komandan` / `Pedagang` / `Informan` characters.
3. Non-fantasy custom stories (e.g. domestic slice-of-life, modern investigation) must receive domain-appropriate factions (`Dewan Lingkungan & Tetangga`, `Lingkar Kerabat & Tamu`, etc.) and contextual starting inventory (`Pakaian Harian yang Rapi`, `Kunci Kediaman & Catatan Pribadi`, etc.) rather than hardcoded `Sindikat Bayangan`, `Ransum Kering (x2)`, and `Kantung Koin Tua`.

#### 2. Mitigation and regression protection
- **Mitigation implemented:**
  1. Created `src/app/world-genesis/custom-genesis-synthesizer.ts` with `inferCustomWorldDomain()`, `extractPrologueCustomNpcs()`, `resolveContextualStartingInventory()`, and `synthesizeCustomWorldGenesis()`.
  2. Wired `synthesizeCustomWorldGenesis()` and `resolveContextualStartingInventory()` into `src/app/world-genesis/world-archetype-presets.ts`, `src/app/world-genesis.ts`, and `src/app/game-state/story-session-factory.ts`.
- **Regression test/case ID:** `REG-20261023-009` in `src/tests/world-genesis.spec.ts`.
- **Added to verifier / CI / next-version suite:** Yes (`npm test` and `npm run audit:index`).

---

### [REG-20261023-010] Custom NPC Schedule Archetypes (`resident` / `companion`), Rich `NpcState` Identity Preservation, and Interactive Custom NPC Directory Editor (Tahap 2)

- **Status:** RESOLVED
- **First observed:** 2026-10-23
- **Last updated:** 2026-10-23
- **Severity:** High
- **Confidence:** Confirmed
- **Area / components:** `src/app/game-state.types.ts`, `src/app/world-genesis/npc-schedule-synthesizer.ts`, `src/app/world-genesis/custom-genesis-synthesizer.ts`, `src/app/topology/topological-sync.ts`, `src/app/game-state/npc-faction-reducer.ts`, `src/app/game-state.service.ts`, `src/app/system-rules.ts`, `src/app/engine.service.ts`, `src/app/npc-map.component.ts`, `src/tests/world-genesis.spec.ts`

#### 1. Expected behavior
1. Domestic/residence NPCs (`Kediaman`, `Rumah`, `Vila`, `Pondok`, `Paviliun`, `Keluarga`, `Penghuni`) and direct traveling companions (`Rekan Seperjalanan`, `Pendamping`) must be assigned `'resident'` or `'companion'` schedule archetypes rather than defaulting to `'wanderer'` (which forced domestic NPCs to wander to `Pusat Keramaian` and `Jalur Utama` at night).
2. `NpcState` must support rich identity attributes (`peran`, `kepribadian`, `tujuan`, `gaya_bicara`, `scheduleArchetype`), automatically synthesize defaults via `enrichNpcProfileDefaults()`, preserve them when merging partial AI `npc_state` updates in `TopologicalSyncSystem.resolveState()`, and inject them into `buildScopedSystemRules()`.
3. `NpcMapComponent` (`Direktori NPC & Faksi`) must display each NPC's `peran`, `kepribadian`, `tujuan`, and 6-slot daily schedule, and allow users to create or edit custom NPCs via `GameStateService.upsertCustomNpc()`.

#### 2. Mitigation and regression protection
- **Mitigation implemented:**
  1. Extended `NpcScheduleArchetype` with `'resident' | 'companion'` and added `peran`, `kepribadian`, `tujuan`, `gaya_bicara`, and `scheduleArchetype` to `NpcState` in `src/app/game-state.types.ts`.
  2. Implemented `'resident'` and `'companion'` 6-slot schedules and `enrichNpcProfileDefaults()` in `src/app/world-genesis/npc-schedule-synthesizer.ts`.
  3. Protected existing non-empty NPC profile fields during partial AI state merges in `src/app/topology/topological-sync.ts` and added `applyCustomNpcUpsert()` in `src/app/game-state/npc-faction-reducer.ts` + `upsertCustomNpc()` in `src/app/game-state.service.ts`.
  4. Upgraded `src/app/npc-map.component.ts` with rich profile lines, collapsible 6-slot schedule viewer, and reactive custom NPC creation/editing form.
- **Regression test/case ID:** `REG-20261023-010` in `src/tests/world-genesis.spec.ts`.
- **Added to verifier / CI / next-version suite:** Yes (`npm test` and `npm run audit:index`).

---

### [REG-20261023-011] Deep MC Characterization & Structured Custom Story Builder Gap (Tahap 3)

- **Status:** RESOLVED
- **First observed:** 2026-10-23
- **Last updated:** 2026-10-23
- **Severity:** High
- **Confidence:** Confirmed
- **Area / components:** `src/app/game-state.types.ts`, `src/app/world-genesis.ts`, `src/app/game-state/story-session-factory.ts`, `src/app/system-rules.ts`, `src/app/game-state.service.ts`, `src/app/character/character-profile.component.ts`, `src/app/story-manager.component.ts`
- **Introduced by / version:** Minimalist protagonist fields (`name` + `title` only) and lack of structured initial NPC/inventory builder in story creation

#### 1. Expected behavior
1. Protagonist (`McState`) should support rich characterization (`personality`, `background`, `goal`) editable both at story creation and live during gameplay via `CharacterProfileComponent`, and injected into `active_story_context.protagonist` in `buildScopedSystemRules()`.
2. `CreateStoryPayload` and `StoryMetadata` should support custom starting inventory items (`customInventory`) and structured initial custom NPC definitions (`initialNpcs`) that persist across story creation and `resetCurrentStory()`.
3. `CharacterProfileComponent.getFactionEntries()` should format structured `FactionDetail` objects into readable reputation tiers (`Rep +45 (Sekutu)`) instead of raw `JSON.stringify(val)`.

#### 2. Mitigation and regression protection
- **Mitigation implemented:**
  1. Extended `McState`, `StoryMetadata`, and `CreateStoryPayload` with `personality`/`mcPersonality`, `background`/`mcBackground`, `goal`/`mcGoal`, `customInventory`, and `initialNpcs` (`InitialCustomNpcInput[]`).
  2. Updated `generateWorldGenesis()`, `buildNewStoryMetaAndSession()`, and `buildResetStoryGenesisState()` to synthesize and preserve custom MC characterization, custom starting inventory, and structured initial NPCs (along with their 6-slot schedules and knowledge graph lore).
  3. Injected protagonist `personality`, `background`, and `goal` into `active_story_context.protagonist` in `src/app/system-rules.ts`.
  4. Upgraded `CharacterProfileComponent` with MC characterization display/editor and readable faction reputation formatting, and upgraded `StoryManagerComponent` with a 5th domestic preset (`Senja di Kediaman Takeshi`) and a tabbed **Detail Karakter Utama (MC)** + **Tokoh NPC Custom Awal** builder.
- **Regression test/case ID:** `REG-20261023-011` in `src/tests/world-genesis.spec.ts`.
- **Added to verifier / CI / next-version suite:** Yes (`npm test` and `npm run audit:index`).

---

### [REG-20261023-012] Interactive Knowledge Graph Studio, Priority Weights, & Scoped Prompt Pruning

- **Status:** RESOLVED
- **First observed:** 2026-10-23
- **Last updated:** 2026-10-23
- **Severity:** High
- **Confidence:** Confirmed
- **Area / components:** `src/app/game-state.types.ts`, `src/app/game-state/mc-progression-reducer.ts`, `src/app/game-state.service.ts`, `src/app/engine.service.ts`, `src/app/knowledge-graph.component.ts`
- **Introduced by / version:** Read-only `KnowledgeGraphComponent` without signal reactivity (`stateVersion`), unpersisted `knowledgeWeights`, and raw `JSON.stringify(this.gameState.knowledgeGraph)` prompt dump

#### 1. Expected behavior
1. Users should be able to add (`bind`), inline-edit (`previousFact`), pin as canon (`reweight` `1.0x` / `1.5x` / `2.0x`), and delete (`unbind`) custom lore facts or entire entity nodes directly inside `KnowledgeGraphComponent`, immediately syncing to the 768-D Holographic RAG Worker (`loreEngine.refreshDynamicContext()`).
2. `updateKnowledgeGraph()` must update `knowledgeWeights` and increment `stateVersion` so UI components re-render reactively.
3. `EngineService.buildPrompt()` must use `buildScopedKnowledgeGraphForPrompt()` to guarantee 100% inclusion of protagonist, world setting, current location, active/local NPCs, and high-weight canon facts (`[KANON UTAMA]`, `[PRIORITAS]`) while capping distant background entities.

#### 2. Mitigation and regression protection
- **Mitigation implemented:**
  1. Extended `GraphUpdate` with `reweight`, `weight`, and `previousFact`, and added `knowledgeWeights` to `StorySessionData` and `GameStateService`.
  2. Implemented `applyKnowledgeGraphUpdatesWithWeights()` and `buildScopedKnowledgeGraphForPrompt()` in `src/app/game-state/mc-progression-reducer.ts` and wired `buildScopedKnowledgeGraphForPrompt()` into `EngineService.buildPrompt()`.
  3. Upgraded `src/app/knowledge-graph.component.ts` into an interactive split/catalog studio with search, quick entity presets, priority weight controls (`Standar 1.0x`, `Penting 1.5x`, `Kanon 2.0x`), inline fact editing, and live RAG worker indexing.
- **Regression test/case ID:** `REG-20261023-012` in `src/tests/world-genesis.spec.ts`.
- **Added to verifier / CI / next-version suite:** Yes (`npm test` and `npm run audit:index`).

---

### [REG-20261024-013] Multi-World Timeline Branch Isolation & 3-Way Merge Reconciliation for `knowledgeWeights` and Signal Reactivity Hardening

- **Status:** RESOLVED
- **First observed:** 2026-10-24
- **Last updated:** 2026-10-24
- **Severity:** Medium
- **Confidence:** Confirmed
- **Area / components:** `src/app/game-state.types.ts`, `src/app/game-state/timeline-branch-reconciler.ts`, `src/app/game-state.service.ts`, `src/app/rag/lore-engine.service.ts`, `src/app/rag/lore-engine.worker.ts`
- **Introduced by / version:** Secondary cross-subsystem edge case following `REG-20261023-012` (`knowledgeWeights` introduction)

#### 1. Expected behavior
1. When a timeline branch is forked (`forkTimelineBranch`), switched (`switchTimelineBranch`), or reconciled via 3-Way Merge (`mergeTimelineBranch`), custom lore priority weights (`knowledgeWeights`) must be isolated per branch snapshot and reconciled alongside `knowledgeGraph` facts, as well as hydrated into the RAG Web Worker (`syncKnowledgeGraph`) on `init`.
2. `resetCurrentStory()` must clear `this.knowledgeWeights = {}` so custom fact weights from before reset do not linger.
3. `LoreEngineService.getContextSnippet()` cache hash must include `knowledgeWeights` so reweighting a fact immediately invalidates the cached snippet.
4. `addItem()`, `updateQuests()`, `updateCombat()`, and `updateStorySummary()` in `GameStateService` must increment `this.stateVersion` so `OnPush` UI components re-render reactively.

#### 2. Mitigation and regression protection
- **Mitigation implemented:**
  1. Added `knowledgeWeights` to `TimelineAncestorSnapshot` and `TimelineBranchSnapshot` (`src/app/game-state.types.ts`), and implemented 3-way weight reconciliation + branch fact `unbind`/`previousFact` pruning in `buildForkedBranchSnapshot()` and `reconcileThreeWayBranchMerge()` (`src/app/game-state/timeline-branch-reconciler.ts`).
  2. Updated `captureCurrentBranchSnapshot()`, `applyBranchSnapshot()`, `resetCurrentStory()`, `addItem()`, `updateQuests()`, `updateCombat()`, and `updateStorySummary()` in `src/app/game-state.service.ts`.
  3. Included `weightCacheKey` in `LoreEngineService.getContextSnippet()` (`src/app/rag/lore-engine.service.ts`), passed `knowledgeWeights` during branch hydration in `src/app/rag/lore-engine.worker.ts`, and added algebraic holographic unbinding (`targetWorld.encode(docId, vec, 0)`) in `syncKnowledgeGraph()` for deleted/edited `kg_*` documents.
- **Regression test/case ID:** `REG-20261024-013` in `src/tests/rag/timeline-multiworld-p0.spec.ts`.
- **Added to verifier / CI / next-version suite:** Yes (`npm test` and `npm run audit:index`).

---

### [REG-20261026-014] Unrequested Removal of `gemini-3.5-flash-lite` (15 RPM / 500 RPD) and Default Switch to Low-RPD `gemini-3.8-flash` (5 RPM / 20 RPD)

- **Status:** RESOLVED
- **First observed:** 2026-10-26
- **Last updated:** 2026-10-26
- **Severity:** High
- **Confidence:** Confirmed
- **Area / components:** `src/app/game-state/game-database.ts`, `src/app/game-state.service.ts`, `src/app/game-state/session-storage-coordinator.ts`, `src/app/game-state/story-session-factory.ts`, `src/app/system-modal.html`, `src/server.ts`
- **Introduced by / version:** AI API audit step that mistakenly removed `gemini-3.5-flash-lite` and set `gemini-3.8-flash` as the default model

#### 1. Expected behavior
1. `gemini-3.5-flash-lite` must NEVER be removed from `VALID_AI_MODELS`, `GameStateService.aiModel`, `system-modal.html`, or `src/server.ts`.
2. Under the user's Gemini API Free-tier rate limits:
   - `gemini-3.5-flash-lite`: **15 RPM / 250K TPM / 500 RPD**
   - `gemini-3.1-flash-lite`: **15 RPM / 250K TPM / 500 RPD**
   - `gemini-3.8-flash`: **5 RPM / 250K TPM / 20 RPD**
   Therefore, `gemini-3.5-flash-lite` must be the default model across `GameStateService`, `hydrateSessionStatePayload()`, `buildDefaultSandboxStoryAndSession()`, and the `/api/turn` fallback chain (`gemini-3.5-flash-lite` -> `gemini-3.1-flash-lite` -> `gemini-3.8-flash` -> `gemini-flash-latest`) so normal gameplay does not exhaust the 20 RPD budget of `gemini-3.8-flash`.

#### 2. Observed behavior
During the API connection audit, `gemini-3.5-flash-lite` was removed from `VALID_AI_MODELS` and `system-modal.html`, and the default model was changed to `gemini-3.8-flash` without user request.

#### 3. Mitigation and regression protection
- **Mitigation implemented:**
  1. Restored `gemini-3.5-flash-lite` to `VALID_AI_MODELS` (`src/app/game-state/game-database.ts`), `GameStateService.aiModel` (`src/app/game-state.service.ts`), `hydrateSessionStatePayload()` (`src/app/game-state/session-storage-coordinator.ts`), `buildDefaultSandboxStoryAndSession()` (`src/app/game-state/story-session-factory.ts`), and `src/app/system-modal.html`.
  2. Updated `/api/turn` in `src/server.ts` to default to `gemini-3.5-flash-lite` and prioritize the 500-RPD models (`gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`) ahead of `gemini-3.8-flash` (20 RPD).
- **Regression test/case ID:** `REG-20261026-014` in `src/tests/world-genesis.spec.ts`.
- **Added to verifier / CI / next-version suite:** Yes (`npm test`).

---

### [REG-20261028-015] `HolographicMemoryField.rehearsed` (`Uint8Array`) Byte-Padding Bits (`0xFE`) Truthiness Leak & MultiWorld Branch Reset Leak

- **Status:** RESOLVED
- **First observed:** 2026-10-28
- **Last updated:** 2026-10-28
- **Severity:** Medium
- **Confidence:** Confirmed
- **Area / components:** `src/app/rag/holographic-memory.ts`, `src/app/rag/multi-world.ts`, `src/tests/rag/holographic-memory.spec.ts`, `src/tests/rag/multi-world.spec.ts`
- **Introduced by / version:** `HolographicMemoryField` `rehearsed: Uint8Array` boolean flag array and `MultiWorldHologram` slot recycling

#### 1. Expected behavior
1. In `HolographicMemoryField.rehearsed` (`Uint8Array`), each 1-byte element stores a boolean flag in LSB bit 0 (`0x01`), while the upper 7 bits (`0xFE`, bits 1..7) are unused byte-padding bits. Dirty upper padding bits (e.g., `0x02`, `0x80`, `0xFE` where LSB bit 0 is `0`) must never trigger the `1.05x` rehearsal decay boost in `scheduleDecay()` or inflate `getEpisodicStats().rehearsedLastTick`.
2. Evicting/zero-weighting a document via `encode(docId, vec, 0)` must clear `rehearsed[docId] = 0`, and inactive document slots (`docWeights[i] <= 1e-10`) must not be counted as rehearsed.
3. `MultiWorldHologram.prune(world)` must reset `rehearsed.fill(0)`, `salience.fill(1)`, and `hrrComposite.fill(0)`, and `MultiWorldHologram.fork(src, dst)` must copy and LSB-mask `rehearsed` so recycled world slots never leak stale rehearsal bytes.

#### 2. Observed behavior
1. `scheduleDecay()` checked `const r = rehearsed[d] ? 1.05 : 1` and `getEpisodicStats()` checked `if (this.rehearsed[i])`, treating any non-zero upper padding bit (`0x02..0xFE` with LSB `0`) or inactive slot as truthy.
2. `encode(docId, vec, 0)` did not clear `rehearsed[docId]`.
3. `MultiWorldHologram.prune()` and `fork()` omitted `rehearsed`, `salience`, and `hrrComposite`.

#### 3. Mitigation and regression protection
- **Mitigation implemented:**
  1. Masked `rehearsed[d]! & 0x01` in `scheduleDecay()` and `getEpisodicStats()`, cleared `rehearsed[docId] = 0` when `weight <= 1e-10` in `encode()`, and added `sanitizeRehearsedPaddingBits()` in `HolographicMemoryField`.
  2. Updated `MultiWorldHologram.fork()` and `prune()` to copy/mask and reset `rehearsed`, `salience`, and `hrrComposite`.
- **Regression test/case ID:** `REG-20261028-015` in `src/tests/rag/holographic-memory.spec.ts` and `src/tests/rag/multi-world.spec.ts`.
- **Added to verifier / CI / next-version suite:** Yes (`npm test`).

---

### [REG-20261028-016] Perspective-Aware Micro-Testing Harness (`runAgentVerificationSuite`) Gate 2 (`Boundary-And-Poison`) & Gate 3 (`Differential-Equivalence`) Hardening on `HolographicMemoryField`

- **Status:** RESOLVED
- **First observed:** 2026-10-28
- **Last updated:** 2026-10-28
- **Severity:** Medium
- **Confidence:** Confirmed
- **Area / components:** `src/app/rag/holographic-memory.ts`, `src/tests/rag/perspective-verification-harness.ts`, `src/tests/rag/perspective-verification-harness.spec.ts`
- **Introduced by / version:** `HolographicMemoryField` boundary checks in `encode()`, `setSalience()`, `scheduleDecay()`, and `_incrementalRebuild()`

#### 1. Expected behavior
1. **Gate 2 (`Boundary-And-Poison`):** Passing `NaN`, `Infinity`, or non-integer values for `docId`, `weight`, `salience`, `baseDecay`, or `vec` elements into `HolographicMemoryField` must be rejected/clamped cleanly without poisoning `firstMoment`, `secondMoment`, `hrrComposite`, `docWeights`, or `totalWeight` with `NaN`.
2. **Gate 3 (`Differential-Equivalence`):** `scheduleDecay(baseDecay, 'incremental')` must rebuild `firstMoment`, `secondMoment`, and `totalWeight` identically to `rebuildMoments()` and a pure Float64 reference oracle without double-accumulating `hrrComposite`.

#### 2. Observed behavior
1. In `encode(docId, vec, weight)`, `if (docId < 0 || docId >= this.numDocs) return;` evaluated to `false` for `docId = NaN` and `docId = 1.75`, indexing `this.docWeights[docId]` as `undefined` and setting `delta = NaN`, which poisoned `firstMoment`, `secondMoment`, `hrrComposite`, and `totalWeight`. Similarly, `setSalience(docId, NaN)` wrote `NaN` via `Math.max(0.1, NaN)` and `scheduleDecay(NaN)` bypassed `baseDecay <= 0 || baseDecay >= 1`.
2. `_incrementalRebuild()` reset `firstMoment` and `secondMoment` but called `this.encode(d, decayTemp, w)` without resetting `hrrComposite`, adding `w * vec` into `hrrComposite` a second time.

#### 3. Mitigation and regression protection
- **Mitigation implemented:**
  1. Hardened `encode()`, `encodeBatch()`, `setSalience()`, `setSalienceBatch()`, and `scheduleDecay()` in `src/app/rag/holographic-memory.ts` with strict integer/bounds checks (`const idx = docId | 0; if (idx !== docId ...)`), `Number.isFinite(...)` guards, and non-negative weight clamping.
  2. Unified `_incrementalRebuild()` to delegate directly to `this.rebuildMoments()`.
  3. Implemented `runAgentVerificationSuite(suiteSpec)` in `src/tests/rag/perspective-verification-harness.ts` testing all 4 gates (`Primary-Target`, `Boundary-And-Poison`, `Differential-Equivalence`, `Post-PASS-Regression`).
- **Regression test/case ID:** `src/tests/rag/perspective-verification-harness.spec.ts`.
- **Added to verifier / CI / next-version suite:** Yes (`npm test`).

---

### [REG-20261028-017] `WasmMathProgramV9BatchScorer` Differential Equivalence & Zero-Norm / Misaligned Tensor Poison Hardening

- **Status:** RESOLVED
- **First observed:** 2026-10-28
- **Last updated:** 2026-10-28
- **Severity:** Medium
- **Confidence:** Confirmed
- **Area / components:** `src/app/rag/wasm-math-v9-scorer.ts`, `src/tests/rag/wasm-math-v9-perspective-suite.ts`, `src/tests/rag/perspective-verification-harness.spec.ts`
- **Introduced by / version:** `WasmMathProgramV9BatchScorer` raw `subarray` slicing and unguarded `NaN` elements

#### 1. Expected behavior
1. **Gate 2 (`Boundary-And-Poison`):**
   - Zero-norm candidate or query vectors (`||v|| = 0.0`) must evaluate cosine similarity to `0.0` (via $\epsilon = 10^{-8}$) without producing `NaN`.
   - Misaligned or undersized buffers (`packedCandVectors.length < B * D`, `queryVector.length < D`, `sBm25Buf.length < B`) must be safely aligned/zero-padded into pre-allocated staging buffers so `new rt.WasmTensor(view, shape)` never traps in WebAssembly.
   - `NaN`/`Infinity` values in vectors, scalar weights, or `docWeights` must be sanitized so `outScores` remains strictly finite and `scoreActiveHolographicDocs` skips `NaN`-weighted documents.
2. **Gate 3 (`Differential-Equivalence`):** Batched WASM V9 executions (`run2`, `run4`, `run5`) must match the pure Float64 Reference Oracle within `1e-5` across arbitrary batch sizes and vector norms.

#### 2. Observed behavior
1. Calling `packedCandVectors.subarray(0, totalFloats)` when `packedCandVectors.length < totalFloats` returned an undersized slice, causing `new this.rt.WasmTensor(candView, this.shapeBatchVec)` to throw a shape mismatch trap in Rust WASM (`Uncaught-Exception`).
2. `NaN` elements in `docWeights[d]` bypassed `docWeights[d]! <= 1e-10` in `scoreActiveHolographicDocs()`, and `NaN` in `wBm25`/`wSim` or input vectors propagated `NaN` into `outScores`.

#### 3. Mitigation and regression protection
- **Mitigation implemented:**
  1. Added `normalizeBatchCount()`, `prepareAlignedScalarView()`, and `prepareAlignedVectorView()` with pre-allocated staging buffers (`queryVecStaging`, `scalarBm25Staging`, `scalarSimStaging`, `packedDocsStaging`) in `src/app/rag/wasm-math-v9-scorer.ts`.
  2. Guarded `scoreActiveHolographicDocs()` with `!Number.isFinite(w) || w <= 1e-10` and bounds-checked `docVectors` indexing.
  3. Created `createWasmMathV9BatchScorerVerificationSuite(rt)` in `src/tests/rag/wasm-math-v9-perspective-suite.ts` and verified all 4 gates in `src/tests/rag/perspective-verification-harness.spec.ts`.
- **Regression test/case ID:** `REG-20261028-017-ZERO-NORM-AND-MISALIGNED-TENSOR` in `src/tests/rag/wasm-math-v9-perspective-suite.ts`.
- **Added to verifier / CI / next-version suite:** Yes (`npm test`).

---

### [REG-20261111-018] PLW CLI v0.2.5 Audit Findings & `RetrievalPipeline.build()` SimHash Zero-Vector Bottleneck

- **Status:** RESOLVED
- **First observed:** 2026-11-11
- **Last updated:** 2026-11-11
- **Severity:** High
- **Confidence:** Confirmed
- **Area / components:** `src/app/rag/hybrid-pipeline.ts`, `src/app/rag/epistemic-retrieval-kernel.ts`, `rag-topology-standalone/rag/hybrid-pipeline.ts`, `rag-topology-standalone/rag/epistemic-retrieval-kernel.ts`, `rag-topology-standalone/rag/rag-engine.ts`, `rag-topology-standalone/rag/wasm-math-v9-scorer.ts`, `rag-topology-standalone/tests/standalone-rag-topology.spec.ts`
- **Introduced by / version:** `RetrievalPipeline.build()` unguarded full-slot (`numDocs = 4096`) SimHash projection and bidirectional import between `epistemic-retrieval-kernel.ts` and `holographic-memory.ts`

#### 1. Expected behavior
1. `plw check rag-topology-standalone --json` must report `high: 0` across all 13 analyzers (`topo.circular`, `topo.test_reachability`, `perf.async`, `perf.deopt`, etc.).
2. `RetrievalPipeline.build()` (called on every `rebuildCSR()` / `addDocument()`) must skip unpopulated zero-vector slots in `docVectors` rather than computing `1024 * 768` SimHash dot products across all `4096` slots.

#### 2. Observed behavior
1. `plw check rag-topology-standalone --json` initially detected 5 High-Severity findings:
   - `topo.circular`: Bidirectional import between `epistemic-retrieval-kernel.ts` and `holographic-memory.ts`.
   - `perf.async`: Sequential `await` inside loops in `EmbeddingFreeRagEngine.init()` and `syncKnowledgeGraph()`.
   - `perf.deopt`: Dynamic `new Function('u', 'return import(u)')` in `wasm-math-v9-scorer.ts`.
   - `topo.test_reachability`: Missing standalone test file in `rag-topology-standalone/`.
2. Running `rag-topology-standalone/tests/standalone-rag-topology.spec.ts` timed out at `30,183ms` because `RetrievalPipeline.build()` executed `4096 * 1024 * 768 = 3,221,225,472` inner-loop operations per `rebuildCSR()` call even when only 2–4 documents were populated.

#### 3. Mitigation and regression protection
- **Mitigation implemented:**
  1. Added a fast `isNonZero` check per document slot in `RetrievalPipeline.build()` in both `src/app/rag/hybrid-pipeline.ts` and `rag-topology-standalone/rag/hybrid-pipeline.ts`, reducing `standalone-rag-topology.spec.ts` execution time from `30,183ms` to **`232ms`** (~130x speedup).
  2. Replaced the `HolographicMemoryField` import in `src/app/rag/epistemic-retrieval-kernel.ts` and `rag-topology-standalone/rag/epistemic-retrieval-kernel.ts` with the structural interface `HolographicFieldLike`, eliminating the circular dependency.
  3. Replaced sequential `await` in loops in `rag-topology-standalone/rag/rag-engine.ts` with `await Promise.all(...)` and replaced `new Function` in `rag-topology-standalone/rag/wasm-math-v9-scorer.ts` with `import(/* @vite-ignore */ jsUrl)`.
- **Regression test/case ID:** `rag-topology-standalone/tests/standalone-rag-topology.spec.ts` (3 tests passing in 232ms).
- **Added to verifier / CI / next-version suite:** Yes (`vitest.config.ts` and `plw check rag-topology-standalone --json`).

---

## Mapping work queue

Use this section for issues that cannot progress safely until a system map is built. Link each item to its regression entry.

| Map task ID | Related regression ID | Map required | Scope | Questions to answer | Status |
|---|---|---|---|---|---|
| MAP-001 | REG-YYYYMMDD-001 | e.g. state/data-flow map | modules/files | What state crosses which boundary? | NOT STARTED |

Suggested mapping deliverables, as appropriate:

- **Architecture map:** major components and boundaries.
- **Dependency map:** direct and transitive dependencies.
- **Call graph:** entry points, callers, callees, and execution paths.
- **Data-flow map:** where inputs originate, transform, persist, and exit.
- **State-flow map:** state owners, transitions, invariants, and reset behavior.
- **Lifecycle map:** initialization, startup/boot, shutdown, retries, and recovery.
- **Environment map:** configuration, runtime assumptions, feature flags, and external dependencies.

A map is not complete merely because a diagram exists. It must answer the questions recorded in the linked regression entry and be grounded in code, traces, tests, or other available evidence.

---

## Promotion to the verifier

When an unresolved issue becomes reproducible and testable:

1. Create a minimal regression case that captures the failure.
2. Add it to the appropriate test suite or verifier.
3. Verify that the case detects the original failure when feasible (for example, against a known-bad revision or controlled reproduction).
4. Verify that the corrected implementation passes the case.
5. Ensure the test remains part of future relevant verification runs.
6. Update the ledger with the test path, test ID, verifier integration status, and evidence.

If a regression test cannot yet be automated, document a manual verification procedure and the reason automation is blocked. Do not silently omit the case.

## Maintenance rules

- Keep resolved entries as historical records unless the project has a separate archive policy.
- Never overwrite the only record of the original evidence or reproduction.
- When a new issue resembles an old one, link the entries and compare their conditions rather than assuming they share a root cause.
- Reopen a resolved entry if evidence shows recurrence or if its resolution criteria were insufficient.
- If this ledger becomes large, split entries into a dedicated directory (for example, `docs/regressions/REG-YYYYMMDD-001.md`) and keep this file as the index. Preserve links and IDs.
- Adapt paths and test commands to the repository; do not invent paths, commands, or test results.

## Final rule

**An unresolved regression is not allowed to exist only in the agent's conversational context. It must be recorded here, linked to actionable next steps, and revisited by future relevant loops until it is resolved, explicitly accepted as a risk, or formally designated `WONT-FIX`.**
