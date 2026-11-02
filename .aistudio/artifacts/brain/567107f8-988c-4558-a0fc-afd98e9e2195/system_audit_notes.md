# System Audit Notes — Stage 1 & Stage 2 Modularization (< 1,000 Lines Target)

## 1. Summary of Refactored Modules
All 4 files in `src/` that originally exceeded 1,000 lines have been safely decomposed into focused domain modules with 100% export and method parity:

1. **`src/app/world-genesis.ts`** (`1,203` lines -> **`158` lines**)
   - `src/app/world-genesis/world-archetype-presets.ts` (`623` lines)
   - `src/app/world-genesis/npc-schedule-synthesizer.ts` (`438` lines)

2. **`src/app/rag/holographic-memory.ts`** (`1,166` lines -> **`571` lines**)
   - `src/app/rag/continuous-hrr.ts` (`236` lines): `ContinuousHRR`, `HRRMatchResult`, `HRRExtractionResult`
   - `src/app/rag/epistemic-retrieval-kernel.ts` (`320` lines): `EpistemicRetrievalKernel`, `RetrievalDecision`

3. **`src/app/rag/lore-engine.worker.ts`** (`1,136` lines -> **`834` lines**)
   - `src/app/rag/worker-tokenizer-embedder.ts` (`196` lines): Deterministic 384-D pseudo-embedding, canonical Indonesian/English tokenization, chunking, and cryptographic proof generation.
   - `src/app/rag/worker-whatif-simulator.ts` (`127` lines): Counterfactual What-If evaluation over HRR, Simplicial Homology, and VSARL policy kernel.

4. **`src/app/game-state.service.ts`** (`1,766` lines -> **`969` lines**)
   - `src/app/game-state/game-database.ts` (`34` lines): Dexie database schema & `VALID_AI_MODELS`
   - `src/app/game-state/timeline-branch-reconciler.ts` (`123` lines): Deep clone & 3-way LCA timeline branch reconciliation
   - `src/app/game-state/mc-progression-reducer.ts` (`381` lines): Pure MC progression, inventory consumption, equipment, faction reputation tiering, and knowledge graph reducer
   - `src/app/game-state/story-session-factory.ts` (`264` lines): Legacy migration, sandbox genesis, new story factory, and hydration normalizer
   - `src/app/game-state/npc-faction-reducer.ts` (`193` lines): Topological sync, NPC schedule reconciliation, and faction delta reducer
