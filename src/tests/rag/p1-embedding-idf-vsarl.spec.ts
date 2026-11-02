import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { runInInjectionContext, Injector } from '@angular/core';
import { encodeSemanticFallbackVector, rebuildPipelineFromIndexer } from '../../app/rag/pipeline-bridge';
import { BaseIndexer } from '../../app/rag/base-indexer';
import { RetrievalPipeline, HybridCSRMatrix } from '../../app/rag/hybrid-pipeline';
import { VSARLPolicyKernel, NpcPersonalityFactory } from '../../app/rag/vsarl-policy-kernel';
import { HolographicMemoryField } from '../../app/rag/holographic-memory';
import { MultiWorldHologram } from '../../app/rag/multi-world';
import { AgenticChunkOrchestrator } from '../../app/rag/agentic-chunk-orchestrator';
import { EngineService } from '../../app/engine.service';
import { GameStateService } from '../../app/game-state.service';
import { LoreEngineService } from '../../app/rag/lore-engine.service';
import { ChronosEngineService } from '../../app/chronos-engine.service';

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  if (normA <= 1e-12 || normB <= 1e-12) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

describe('P1 Regression Suite: AUD-02 (Semantic Fallback & CSR IDF) & AUD-03 (VSA-RL Policy Kernel)', () => {
  describe('AUD-02: Semantic Token + N-Gram Random Indexing Fallback (encodeSemanticFallbackVector)', () => {
    it('preserves high cosine similarity across shifted word positions and morphological variants', () => {
      const dim = 768;
      const v1 = encodeSemanticFallbackVector('Kaelen menyerang gerbang benteng utara dengan tombak perak', dim);
      const v2 = encodeSemanticFallbackVector('Pada malam hari di benteng utara, Kaelen melakukan penyerangan ke gerbang memakai tombak perak', dim);
      const vUnrelated = encodeSemanticFallbackVector('Resep roti gandum manis dan seduhan teh melati hangat di kedai', dim);

      // Verify unit L2 norm
      let normSq = 0;
      for (let i = 0; i < dim; i++) normSq += v1[i]! * v1[i]!;
      expect(normSq).toBeCloseTo(1.0, 4);

      const simRelated = cosineSimilarity(v1, v2);
      const simUnrelated = cosineSimilarity(v1, vUnrelated);

      expect(simRelated).toBeGreaterThan(0.5);
      expect(simUnrelated).toBeLessThan(0.18);
      expect(simRelated - simUnrelated).toBeGreaterThan(0.4);
    });

    it('uses real BM25 IDF weights from BaseIndexer to prioritize rare entities in CSR retrieval', () => {
      const maxDocs = 32;
      const dim = 768;
      const indexer = new BaseIndexer({ maxDocs, maxResults: 16 });
      const docIdMap = new Map<string, number>();
      const docFHRR = new Float32Array(maxDocs * dim);

      const hashTerm = (t: string): number => {
        let h = 0;
        for (let i = 0; i < t.length; i++) {
          h = Math.trunc((h << 5) - h + t.charCodeAt(i));
        }
        return Math.abs(h);
      };

      const docs = [
        { key: 'doc_0', text: 'petualangan langkah jalan cerita dunia wilayah' },
        { key: 'doc_1', text: 'petualangan langkah jalan cerita kota desa' },
        { key: 'doc_2', text: 'petualangan langkah jalan cerita hutan sungai' },
        { key: 'doc_3', text: 'petualangan langkah jalan cerita gunung lembah' },
        { key: 'doc_rare', text: 'petualangan artefak_astral_kuno segel_void' }
      ];

      docs.forEach((d, idx) => {
        docIdMap.set(d.key, idx);
        const tf = new Map<string, number>();
        for (const w of d.text.split(' ')) {
          tf.set(w, (tf.get(w) || 0) + 1);
        }
        indexer.indexDocument(
          { id: d.key, metadata: {}, chunkIds: [`${d.key}_c0`], modifiedAt: Date.now(), accessCount: 0 },
          [{ id: `${d.key}_c0`, docId: d.key, text: d.text, termFreq: tf, modifiedAt: Date.now() }]
        );
        const vec = encodeSemanticFallbackVector(d.text, dim);
        docFHRR.set(vec, idx * dim);
      });

      const idfCommon = indexer.getTermIDF('petualangan');
      const idfRare = indexer.getTermIDF('artefak_astral_kuno');
      expect(idfRare).toBeGreaterThan(idfCommon * 3);

      const pipeline = new RetrievalPipeline(2048, maxDocs, dim, 1024, 32);
      pipeline.build(
        new HybridCSRMatrix(2048, maxDocs, 0),
        new Float32Array(2048),
        new HybridCSRMatrix(2048, 2048, 0),
        docFHRR
      );
      rebuildPipelineFromIndexer(indexer, pipeline, docIdMap, 2048, maxDocs, hashTerm, docFHRR);

      const queryTerms = ['petualangan', 'langkah', 'artefak_astral_kuno'];
      const qTermIds = new Int32Array(queryTerms.map(t => hashTerm(t) % 2048));
      const qIDF = new Float32Array(queryTerms.map(t => indexer.getTermIDF(t)));
      const qVec = encodeSemanticFallbackVector(queryTerms.join(' '), dim);

      const outIdx = new Int32Array(10);
      const outScores = new Float32Array(10);
      pipeline.query(qTermIds, qIDF, qVec, queryTerms.length, outIdx, outScores);

      // Document 4 ('doc_rare') must rank #1 due to high IDF of 'artefak_astral_kuno'
      expect(outIdx[0]).toBe(4);
    });
  });

  describe('AUD-03: VSA-RL Policy Kernel Generic Conditioning, Persistence & Dynamic Outcome Evaluation', () => {
    it('classifies generic NPCs via NpcPersonalityFactory.fromNpcState and resolves raw NpcState objects without crashing', () => {
      const tabib = NpcPersonalityFactory.fromNpcState({
        nama: 'Tabib Agung Lin',
        mood: 'Fokus meneliti gulungan obat',
        status: 'Tenang'
      });
      expect(tabib.archetype).toBe('scholar');

      const komandan = NpcPersonalityFactory.fromNpcState({
        nama: 'Panglima Bima',
        mood: 'Waspada mengawasi benteng',
        aktivitas: 'Berjaga di gerbang'
      });
      expect(komandan.archetype).toBe('guardian');

      const penyelundup = NpcPersonalityFactory.fromNpcState({
        nama: 'Raka si Pembisik',
        mood: 'Licik dan santai',
        aktivitas: 'Menawar barang gelap'
      });
      expect(penyelundup.archetype).toBe('trickster');

      // Verify raw NpcState object passed into orchestrate() and selectAction()
      const dim = 768;
      const numDocs = 16;
      const hologram = new HolographicMemoryField(dim, numDocs, 16);
      const docFHRR = new Float32Array(numDocs * dim);
      const multiWorld = new MultiWorldHologram(4, dim, numDocs, 16, docFHRR);
      multiWorld.initTrunk(docFHRR, hologram.docWeights, 'trunk');
      const rlPolicy = new VSARLPolicyKernel(32, 6, 64);
      const pipeline = new RetrievalPipeline(2048, numDocs, dim, 1024, 32);
      const orchestrator = new AgenticChunkOrchestrator(pipeline, multiWorld.worlds[0]!, multiWorld, rlPolicy, dim, numDocs);

      const rawNpcState = {
        nama: 'Tetua Pustakawan',
        lokasi: 'Menara Arsip',
        aktivitas: 'Membaca naskah kuno',
        mood: 'Analitis',
        status: 'Sehat'
      };

      const qTermIds = new Int32Array([1, 2]);
      const qIDF = new Float32Array([1.5, 2.0]);
      const qVec = encodeSemanticFallbackVector('naskah kuno menara arsip', dim);

      const decision = orchestrator.orchestrate(
        ['naskah', 'kuno'],
        qTermIds,
        qIDF,
        qVec,
        2,
        rawNpcState as any
      );

      expect(decision.npcArchetype).toBe('scholar');
      expect(decision.npcId).toBe('tetua pustakawan');
    });

    it('exports and restores VSARLPolicyKernel learned weights across sessions with zero drift', () => {
      const kernelA = new VSARLPolicyKernel(32, 6, 64);
      const stateBinary = new Uint32Array(kernelA.stateWords);
      stateBinary[0] = 0b1010110011;

      kernelA.storeExperience(stateBinary, 3, 2.5, 0.2, 0.9, 'scholar');
      kernelA.learn(1);

      const snap = kernelA.exportSnapshot();
      expect(snap.policyFHRR.length).toBe(6 * 32);
      expect(snap.archetypePolicyFHRR.length).toBe(4 * 6 * 32);

      const kernelB = new VSARLPolicyKernel(32, 6, 64);
      kernelB.restoreSnapshot(snap);

      for (let i = 0; i < kernelA.policyFHRR.length; i++) {
        expect(kernelB.policyFHRR[i]).toBeCloseTo(kernelA.policyFHRR[i]!, 6);
      }
      for (let i = 0; i < kernelA.archetypePolicyFHRR.length; i++) {
        expect(kernelB.archetypePolicyFHRR[i]).toBeCloseTo(kernelA.archetypePolicyFHRR[i]!, 6);
      }
      for (let i = 0; i < kernelA.traitModulationMatrix.length; i++) {
        expect(kernelB.traitModulationMatrix[i]).toBeCloseTo(kernelA.traitModulationMatrix[i]!, 6);
      }
    });

    it('evaluates LLM response acceptance and grounding dynamically in EngineService.handleResponse', () => {
      const injector = Injector.create({
        providers: [
          { provide: GameStateService, useClass: GameStateService },
          {
            provide: LoreEngineService,
            useValue: {
              scoreChoices: (choices: any[]) => choices.map(c => ({ ...c, isValid: true })),
              syncKnowledgeGraph: () => {},
              lastRetrieval: () => [{ entry: { key: 'c1', content: 'Pedang pusaka tersimpan di kuil utara' } }]
            }
          },
          { provide: ChronosEngineService, useValue: { advanceTime: () => {} } },
          { provide: EngineService, useClass: EngineService }
        ]
      });

      const engine = runInInjectionContext(injector, () => injector.get(EngineService));

      // 1. Empty / unparseable response -> fallback synthesized -> must report llmAccepted = false
      const fallbackEval = engine.handleResponse('Teks rusak tanpa blok JSON');
      expect(fallbackEval.parsedValidJson).toBe(false);
      expect(fallbackEval.usedFallbackNarrative).toBe(true);
      expect(fallbackEval.llmAccepted).toBe(false);
      expect(fallbackEval.userSatisfied).toBe(false);

      // 2. Valid grounded LLM response -> must report llmAccepted = true & userSatisfied = true
      const validResponse = `Monolog Eksekutif: Pemeriksaan kuil utara.
\`\`\`json
{
  "new_full_chronicle_entry": {
    "narrative": "Sang pengembara menemukan pedang pusaka yang tersimpan rapat di altar kuil utara.",
    "narrative_blocks": [
      {
        "name": "Protagonis",
        "narration": "Cahaya perak memancar dari bilah pedang pusaka di kuil utara.",
        "dialogue": "Akhirnya kutemukan.",
        "action": "Mengangkat pedang"
      }
    ],
    "mc_state": {
      "status": "Bugar",
      "expGained": 20
    },
    "choices": [
      { "id": "C-1", "text": "Memeriksa ukiran kuno pada gagang pedang", "weight": 0.9 }
    ]
  }
}
\`\`\``;
      const validEval = engine.handleResponse(validResponse);
      expect(validEval.parsedValidJson).toBe(true);
      expect(validEval.usedFallbackNarrative).toBe(false);
      expect(validEval.llmAccepted).toBe(true);
      expect(validEval.userSatisfied).toBe(true);
      expect(validEval.groundingScore).toBeGreaterThanOrEqual(0.75);
    });

    it('operates as a Warm-Started Decision Model from Turn 1 (Zero-Shot) and prevents 0x000003FF sign-bit state collapse (AUD-05)', () => {
      const pipeline = new RetrievalPipeline(2048, 64, 768, 4, 8);
      const hologram = new HolographicMemoryField(768, 64, 8);
      const multiWorld = new MultiWorldHologram(768, 64, 8, 8);
      const rlPolicy = new VSARLPolicyKernel(32, 6, 64);
      rlPolicy.epsilon = 0; // Deterministic scoring mode

      const orchestrator = new AgenticChunkOrchestrator(
        pipeline,
        hologram,
        multiWorld,
        rlPolicy,
        768,
        64,
        8,
        32
      );

      // 1. Uniform constant vector must yield 0.0 global dot-product score (Zero-Sum row invariant)
      const uniformState = new Float32Array(32).fill(0.1);
      const uniformExplain = rlPolicy.explainAction(uniformState);
      for (const score of uniformExplain.globalScores) {
        expect(Math.abs(score)).toBeLessThan(1e-6);
      }

      // 2. Turn 1 (0 training steps, no NPC): Specific rare keyword query (High IDF, 0 OOV, short)
      const rareVec = encodeSemanticFallbackVector('Aethelgard Grimoire', 768);
      const rareIds = new Int32Array([101, 202]);
      const rareIdf = new Float32Array([3.2, 2.9]); // High BM25 IDF
      const stratRare = orchestrator.inspect(
        ['Aethelgard', 'Grimoire'],
        rareVec,
        undefined,
        rareIds,
        rareIdf,
        0
      );
      const packedRare = orchestrator.stateBinaryBuf[0]!;

      // 3. Turn 1 (0 training steps, no NPC): Abstract / OOV paraphrase query (Low IDF / negative IDs)
      const oovVec = encodeSemanticFallbackVector('bisikan bayangan tak kasat mata', 768);
      const oovIds = new Int32Array([-1, -1, -1, -1]); // OOV terms
      const oovIdf = new Float32Array([0.15, 0.15, 0.15, 0.15]);
      const stratOov = orchestrator.inspect(
        ['bisikan', 'bayangan', 'kasat', 'mata'],
        oovVec,
        undefined,
        oovIds,
        oovIdf,
        0
      );
      const packedOov = orchestrator.stateBinaryBuf[0]!;

      // 4. Turn 1 (0 training steps, no NPC): Long multi-entity relational query (8 unique terms)
      const relTerms = ['hubungan', 'faksi', 'utara', 'selatan', 'perjanjian', 'raja', 'benteng', 'konflik'];
      const relVec = encodeSemanticFallbackVector(relTerms.join(' '), 768);
      const relIds = new Int32Array([1, 2, 3, 4, 5, 6, 7, 8]);
      const relIdf = new Float32Array([1.3, 1.4, 1.2, 1.3, 1.5, 1.2, 1.4, 1.3]);
      const stratRel = orchestrator.inspect(
        relTerms,
        relVec,
        undefined,
        relIds,
        relIdf,
        0
      );
      const packedRel = orchestrator.stateBinaryBuf[0]!;

      // 5. Re-query / Anomaly Recovery step (requeryCount = 2)
      const stratRequery = orchestrator.inspect(
        ['Aethelgard', 'Grimoire'],
        rareVec,
        undefined,
        rareIds,
        rareIdf,
        2
      );

      // Verify Zero-Shot Decision Routing differentiates query profiles without needing training
      expect(stratRare).toBe(0);    // Bm25Fast for short, high-IDF exact keyword lookup
      expect(stratOov).toBe(1);     // SemanticFhrr for OOV / synonym query
      expect(stratRel).toBe(2);     // GraphDiffuse for long multi-entity relational query
      expect(stratRequery).toBe(5); // SelfCorrect when requery recovery is active

      // Verify state bit-packing does NOT collapse to constant 0x000003FF
      expect(packedRare).not.toBe(0x000003FF);
      expect(packedOov).not.toBe(0x000003FF);
      expect(packedRel).not.toBe(0x000003FF);
      expect(packedRare).not.toBe(packedOov);
      expect(packedOov).not.toBe(packedRel);
    });

    it('uses zero-quota local semantic projection by default and trips circuit breaker when useRemoteApi=true', async () => {
      const { _getEmbeddingProof, _resetWorkerEmbeddingCircuitBreaker } = await import('../../app/rag/worker-tokenizer-embedder');
      _resetWorkerEmbeddingCircuitBreaker();

      const originalSelf = (globalThis as any).self;
      const originalFetch = globalThis.fetch;
      let fetchCount = 0;

      try {
        (globalThis as any).self = { location: { origin: 'http://localhost:3000' } };
        globalThis.fetch = (async () => {
          fetchCount++;
          return {
            ok: true,
            status: 200,
            json: async () => ({
              embedding: [],
              degraded: true,
              quotaCooldownUntil: Date.now() + 600_000
            })
          } as any;
        }) as any;

        // 1. Default mode (useRemoteApi = false): 0 network calls for any number of lore/KG/episode entries
        for (let i = 1; i <= 20; i++) {
          const localProof = await _getEmbeddingProof(`Entri lore dan memori ke-${i}`, 768);
          expect(localProof.degraded).toBe(false);
          expect(localProof.vector.length).toBe(768);
        }
        expect(fetchCount).toBe(0);

        // 2. Explicit remote mode (useRemoteApi = true): first call probes /api/embed and trips circuit breaker
        const p1 = await _getEmbeddingProof('Lore pertama tentang menara kuno', 768, true);
        expect(p1.source).toBe('fallback');
        expect(p1.degraded).toBe(true);
        expect(p1.vector.length).toBe(768);
        expect(fetchCount).toBe(1);

        // Next 9 remote-mode calls must short-circuit locally without hitting /api/embed
        for (let i = 2; i <= 10; i++) {
          const pi = await _getEmbeddingProof(`Lore ke-${i} tentang wilayah dan faksi`, 768, true);
          expect(pi.source).toBe('fallback');
          expect(pi.degraded).toBe(true);
          expect(pi.vector.length).toBe(768);
        }
        expect(fetchCount).toBe(1);
      } finally {
        (globalThis as any).self = originalSelf;
        globalThis.fetch = originalFetch;
        _resetWorkerEmbeddingCircuitBreaker();
      }
    });
  });

  describe('REG-20261023-005 — Existing Feature Gap Hardening (ChunkStore, Choice Scoring, Zero-Choice Guard)', () => {
    it('initializes ChunkStore in Web Worker scope where globalThis.window is undefined and supports clearAll()', async () => {
      const { ChunkStore } = await import('../../app/rag/chunk-store');
      const originalWindow = (globalThis as any).window;
      try {
        // Simulate DedicatedWorkerGlobalScope: window is undefined, indexedDB is present
        delete (globalThis as any).window;
        const store = new ChunkStore({
          dbName: 'Test_Worker_ChunkStore_REG005',
          storeName: 'lore_chunks',
          maxMemoryChunks: 2,
          version: 1
        });
        await store.init();
        await store.writeChunks([
          { id: 'c1', docId: 'd1', text: 'Chunk Satu', termFreq: new Map([['satu', 1]]), tokenCount: 2, modifiedAt: 1 },
          { id: 'c2', docId: 'd2', text: 'Chunk Dua', termFreq: new Map([['dua', 1]]), tokenCount: 2, modifiedAt: 2 },
          { id: 'c3', docId: 'd3', text: 'Chunk Tiga', termFreq: new Map([['tiga', 1]]), tokenCount: 2, modifiedAt: 3 }
        ]);
        // Even with maxMemoryChunks=2, c1 is persisted if IDB is available, and clearAll() wipes cache
        await store.clearAll();
        expect(store.getMemoryStats().cached).toBe(0);
        store.close();
      } finally {
        (globalThis as any).window = originalWindow;
      }
    });

    it('matches inventory with quantity suffixes, equipped items, and case-insensitive trust/faction requirements in scoreChoices()', () => {
      const injector = Injector.create({
        providers: [
          { provide: GameStateService, useClass: GameStateService },
          { provide: LoreEngineService, useClass: LoreEngineService },
          { provide: ChronosEngineService, useClass: ChronosEngineService },
          { provide: EngineService, useClass: EngineService }
        ]
      });

      runInInjectionContext(injector, () => {
        const gameState = injector.get(GameStateService);
        const loreEngine = injector.get(LoreEngineService);
        const engine = injector.get(EngineService);

        gameState.mcState.inventory = ['Uang Perak (50 Keping)', 'Lentera Minyak'];
        gameState.mcState.equipped = { weapon: 'Pedang Besi Tua', bag: 'Tas Kulit' };
        gameState.mcState.trust = { 'Tetua Desa': 45 };
        gameState.factions = {
          'Serikat Pedagang': { name: 'Serikat Pedagang', description: 'Pedagang', reputation: 30 }
        };

        const scored = loreEngine.scoreChoices([
          {
            id: 'C-1',
            text: 'Menebas penghalang dengan pedang dan membayar uang perak',
            weight: 0.7,
            targetEntity: 'tetua desa',
            targetFaction: 'serikat pedagang',
            requirements: {
              inventory: ['pedang besi tua', 'Uang Perak'],
              trust: { 'tetua desa': 40, 'serikat pedagang': 25 }
            }
          }
        ]);

        expect(scored[0]?.isValid).toBe(true);
        expect(scored[0]?.failureReasons).toEqual([]);

        // Verify zero-choice fallback guard when all LLM choices fail requirements
        const outcome = engine.handleResponse(
          'Monolog\n```json\n{"new_full_chronicle_entry":{"narrative":"Narasi adegan yang cukup panjang di gerbang kota.","choices":[{"id":"C-LOCK","text":"Buka segel kerajaan","requirements":{"inventory":["Kunci Raja Naga"]}}]}}\n```'
        );
        const lastEntry = gameState.chronicle[gameState.chronicle.length - 1];
        expect(lastEntry?.choices?.length).toBeGreaterThanOrEqual(3);
        expect(outcome.parsedValidJson).toBe(true);
      });
    });
  });
});


