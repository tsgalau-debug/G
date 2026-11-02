import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RetrievalPipeline } from '../../app/rag/hybrid-pipeline';
import { rebuildPipelineFromIndexer } from '../../app/rag/pipeline-bridge';
import { BaseIndexer, DocumentHeader, IndexedChunk } from '../../app/rag/base-indexer';
import { AgenticChunkOrchestrator, RetrievalStrategy, OrchestratorOutcome } from '../../app/rag/agentic-chunk-orchestrator';
import { HolographicMemoryField } from '../../app/rag/holographic-memory';
import { MultiWorldHologram } from '../../app/rag/multi-world';
import { VSARLPolicyKernel } from '../../app/rag/vsarl-policy-kernel';

function makeChunk(id: string, docId: string, text: string): IndexedChunk {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const tf = new Map<string, number>();
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  const maxF = Math.max(...Object.values(freq), 1);
  for (const [k, v] of Object.entries(freq)) tf.set(k, v / maxF);

  return {
    id,
    docId,
    text,
    termFreq: tf,
    tokenCount: words.length,
    modifiedAt: Date.now(),
  };
}

describe('Regression-Aware Verification: Core System Invariants', () => {
  describe('Regression Case 1: Pipeline Bridge SimHash & CSR Bounds Invariant', () => {
    const numTerms = 128;
    const numDocs = 4;
    const dim = 16;
    const numBits = 32;

    it('should safely rebuild CSR without docFHRR and preserve existing fingerprints', async () => {
      const indexer = new BaseIndexer();
      const chunk1 = makeChunk('c1', 'docA', 'kael found ancient relic in forest');
      await indexer.indexDocument({ id: 'docA', chunkIds: ['c1'], metadata: {} } as DocumentHeader, [chunk1]);

      const keyToNumericId = new Map<string, number>([['docA', 0]]);
      const hashTerm = (t: string) => {
        let h = 0;
        for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
        return Math.abs(h);
      };

      const pipeline = new RetrievalPipeline(numTerms, numDocs, dim, numBits, 10, 10, 3);
      pipeline.fingerprints = new Uint32Array(numDocs * 1);
      pipeline.fingerprints[0] = 0xdeadbeef;

      // Rebuild without docFHRR
      rebuildPipelineFromIndexer(indexer, pipeline, keyToNumericId, numTerms, numDocs, hashTerm);

      expect(pipeline.invLists.data).toBeGreaterThan(0);
      // Existing fingerprints must be preserved, not wiped to zero
      expect(pipeline.fingerprints[0]).toBe(0xdeadbeef);
    });

    it('should ignore malformed or under-sized docFHRR without generating NaN fingerprints', async () => {
      const indexer = new BaseIndexer();
      const chunk1 = makeChunk('c1', 'docA', 'solaria sun city');
      await indexer.indexDocument({ id: 'docA', chunkIds: ['c1'], metadata: {} } as DocumentHeader, [chunk1]);

      const keyToNumericId = new Map<string, number>([['docA', 0]]);
      const hashTerm = (t: string) => 42;

      const pipeline = new RetrievalPipeline(numTerms, numDocs, dim, numBits, 10, 10, 3);
      pipeline.fingerprints = new Uint32Array(numDocs * 1);
      pipeline.fingerprints[0] = 0x12345678;

      // Under-sized docFHRR (needs numDocs * dim = 64 elements, only pass 4)
      const undersizedFHRR = new Float32Array(4);
      rebuildPipelineFromIndexer(indexer, pipeline, keyToNumericId, numTerms, numDocs, hashTerm, undersizedFHRR);

      // Must not corrupt fingerprints with NaN
      expect(pipeline.fingerprints[0]).toBe(0x12345678);
    });

    it('should correctly compute SimHash when full docFHRR is supplied', async () => {
      const indexer = new BaseIndexer();
      const chunk1 = makeChunk('c1', 'docA', 'crystal beacon activated');
      await indexer.indexDocument({ id: 'docA', chunkIds: ['c1'], metadata: {} } as DocumentHeader, [chunk1]);

      const keyToNumericId = new Map<string, number>([['docA', 0]]);
      const hashTerm = (t: string) => 7;

      const pipeline = new RetrievalPipeline(numTerms, numDocs, dim, numBits, 10, 10, 3);
      const fullDocFHRR = new Float32Array(numDocs * dim);
      for (let i = 0; i < dim; i++) fullDocFHRR[i] = (i % 2 === 1) ? 2.0 : -1.0;

      rebuildPipelineFromIndexer(indexer, pipeline, keyToNumericId, numTerms, numDocs, hashTerm, fullDocFHRR);

      expect(pipeline.invLists.data).toBeGreaterThan(0);
      expect(pipeline.fingerprints[0]).toBeGreaterThan(0);
    });
  });

  describe('Regression Case 2: AgenticChunkOrchestrator Learning & Stub Resiliency', () => {
    let orchestrator: AgenticChunkOrchestrator;
    let mockPolicy: any;

    beforeEach(() => {
      const pipeline: any = { query: vi.fn() };
      const hologram: any = {
        docVectors: new Float32Array(64 * 32),
        dim: 32,
        numDocs: 64,
        totalWeight: 1,
        reconstruct: vi.fn().mockReturnValue(0.8),
        expansionGradient: vi.fn(),
      };
      const multiWorld: any = {
        validateCrossWorld: vi.fn().mockReturnValue({ action: 'accept' }),
      };
      mockPolicy = {
        selectAction: vi.fn().mockReturnValue(RetrievalStrategy.GraphDiffuse),
        packState: vi.fn(),
        estimateValue: vi.fn().mockReturnValue(0.65),
        storeExperience: vi.fn(),
        learn: vi.fn(),
        resolvePersonality: vi.fn().mockReturnValue(null),
        getNpc: vi.fn().mockReturnValue(null),
        shapeReward: vi.fn().mockImplementation((r: number) => r),
        getArchetypeIndex: vi.fn().mockReturnValue(0),
      };

      orchestrator = new AgenticChunkOrchestrator(
        pipeline,
        hologram,
        multiWorld,
        mockPolicy,
        32,
        64,
        8,
        16
      );
    });

    it('should update successHistory and train policy even when decisionId is missing (stub outcome)', () => {
      const initialSuccess = orchestrator['successHistory'][RetrievalStrategy.GraphDiffuse];
      expect(initialSuccess).toBe(0);

      const stubOutcome: OrchestratorOutcome = {
        decision: {
          strategy: RetrievalStrategy.GraphDiffuse,
          result: { indices: new Int32Array(0), scores: new Float32Array(0), count: 0 },
          confidence: 0.8,
          action: 'return',
          reasoning: 'Stub test',
          anomalyCount: 0,
        },
        userSatisfied: true,
        llmAccepted: true,
        latencyMs: 12,
      };

      orchestrator.learn(stubOutcome);

      // successHistory must be updated from 0 to (1 - 0.1)*0 + 0.1*1.0 = 0.1
      const updatedSuccess = orchestrator['successHistory'][RetrievalStrategy.GraphDiffuse];
      expect(updatedSuccess).toBeCloseTo(0.1, 4);
      expect(mockPolicy.storeExperience).toHaveBeenCalled();
      expect(mockPolicy.learn).toHaveBeenCalledWith(1);
    });

    it('should accept both 6-arg and 4-arg orchestrate signatures without error', () => {
      const queryTerms = ['artifact', 'temple'];
      const queryIDF = new Float32Array([1.2, 1.4]);
      const queryFHRR = new Float32Array(32);

      // 4-arg call
      const decision4 = orchestrator.orchestrate(queryTerms, queryIDF as any, queryFHRR, 2);
      expect(decision4).toBeDefined();
      expect(decision4.action).toBeDefined();

      // 6-arg call
      const termIds = new Int32Array([1, 2]);
      const decision6 = orchestrator.orchestrate(queryTerms, termIds, queryIDF, queryFHRR, 2);
      expect(decision6).toBeDefined();
      expect(decision6.decisionId).toBeDefined();
    });
  });

  describe('Regression Case 3: HolographicMemoryField Zero-Weight Moment Cleanliness', () => {
    it('should zero firstMoment and secondMoment when memory field completely fades', () => {
      const dim = 8;
      const numDocs = 4;
      const memory = new HolographicMemoryField(dim, numDocs);

      const vec = new Float32Array(dim);
      vec[0] = 1.0;
      memory.encode(0, vec, 0.001);

      expect(memory.totalWeight).toBeGreaterThan(0);
      expect(memory.firstMoment[0]).toBeGreaterThan(0);

      // Severe decay that pushes weights below 1e-6
      memory.scheduleDecay(0.0001, 'lazy');

      expect(memory.totalWeight).toBe(0);
      expect(memory.firstMoment[0]).toBe(0);
      expect(memory.secondMoment[0]).toBe(0);

      // Reconstruct on empty field returns 0 and zeroes output
      const out = new Float32Array(dim);
      out.fill(999);
      const coh = memory.reconstruct(vec, out);
      expect(coh).toBe(0);
      expect(out[0]).toBe(0);
    });
  });
});
