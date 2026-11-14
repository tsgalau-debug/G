import { describe, it, expect } from 'vitest';
import {
  EmbeddingFreeRagEngine,
  AgentPersonalityFactory,
  SimplicialComplex,
  TopologicalSyncEngine,
  ContinuousHRR,
  encodeSemanticFallbackVector,
} from '../index';

describe('Standalone Embedding-Free RAG & Simplicial Topology Suite', () => {
  it('encodes semantic vectors deterministically without external embedding models', () => {
    const v1 = encodeSemanticFallbackVector('holographic associative memory with circular convolution', 768);
    const v2 = encodeSemanticFallbackVector('holographic associative memory with circular convolution', 768);
    const v3 = encodeSemanticFallbackVector('medieval blacksmith forging iron sword', 768);

    expect(v1.length).toBe(768);
    expect(ContinuousHRR.similarity(v1, v2)).toBeCloseTo(1.0, 5);
    expect(ContinuousHRR.similarity(v1, v3)).toBeLessThan(0.25);
  });

  it('indexes knowledge graphs, retrieves chunks, and updates VSA-RL policy', async () => {
    const engine = new EmbeddingFreeRagEngine({
      sessionId: 'test_standalone',
      memoryOnly: true,
      dim: 768,
      maxDocs: 512,
    });

    await engine.init({
      staticCorpus: {
        hrr_theory: 'Holographic Reduced Representations bind role-filler pairs via circular convolution.',
      },
    });

    await engine.syncKnowledgeGraph(
      {
        'Simplicial Homology': [
          'Computes Betti numbers beta0 and beta1 over GF(2) boundary matrices.',
        ],
      },
      {
        'Simplicial Homology::Computes Betti numbers beta0 and beta1 over GF(2) boundary matrices.': 1.4,
      }
    );

    const scholar = AgentPersonalityFactory.createScholar('scholar_1', 'Researcher');
    const response = await engine.retrieve({
      query: 'Betti numbers beta0 beta1 boundary matrices',
      entities: ['Simplicial Homology'],
      agent: scholar,
    });

    expect(response.retrieved.length).toBeGreaterThan(0);
    expect(response.decision.degraded).toBe(false);

    const outcome = engine.reportOutcome({
      decision: response.decision,
      userSatisfied: true,
      latencyMs: response.elapsedMs,
    });
    expect(outcome.updated).toBe(true);
    expect(outcome.rlSnapshot?.totalUpdates).toBe(1);

    engine.destroy();
  });

  it('supports multi-world branching, 3-way merge, and Simplicial Homology Betti numbers', async () => {
    const engine = new EmbeddingFreeRagEngine({
      sessionId: 'test_multiworld',
      memoryOnly: true,
    });
    await engine.init();

    const forkRes = engine.forkTimeline({
      name: 'Hypothesis A',
      forkTurn: 2,
      switchImmediately: true,
    });
    expect(forkRes.success).toBe(true);

    await engine.syncKnowledgeGraph({
      'Quantum Gravity': ['Spin networks quantize area and volume operators.'],
    });

    const mergeRes = engine.mergeTimeline({
      branchId: forkRes.node.id,
      targetId: 'trunk',
    });
    expect(mergeRes.success).toBe(true);

    const complex = new SimplicialComplex();
    complex.addEdge('node_a', 'node_b', 'linked');
    complex.addEdge('node_b', 'node_c', 'linked');
    complex.addEdge('node_c', 'node_a', 'linked');

    const homology = complex.computeHomology();
    expect(homology.beta0).toBe(1);
    expect(homology.beta1).toBe(1);
    expect(homology.topologicalHoles.length).toBe(1);

    const syncEngine = new TopologicalSyncEngine();
    const pre = syncEngine.synchronizePreTurn(
      [
        { name: 'Agent Alpha', location: 'Lab A', activity: 'Running experiment', faction: 'Research' },
        { name: 'Agent Beta', location: 'Lab A', activity: 'Analyzing data', faction: 'Research' },
      ],
      { 'Lab A': ['Primary holographic testing facility.'] },
      {},
      '09:00 pagi',
      'Lab A'
    );
    expect(pre.commitments.length).toBe(2);
    expect(pre.commitments[0]?.coLocatedWith).toContain('Agent Beta');

    engine.destroy();
  });
});
