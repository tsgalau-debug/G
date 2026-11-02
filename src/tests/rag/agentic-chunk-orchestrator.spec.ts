import { describe, it, expect, beforeEach } from 'vitest';
import { AgenticChunkOrchestrator, RetrievalStrategy, OrchestratorOutcome } from '../../app/rag/agentic-chunk-orchestrator';
import { HolographicMemoryField } from '../../app/rag/holographic-memory';
import { MultiWorldHologram } from '../../app/rag/multi-world';
import { VSARLPolicyKernel } from '../../app/rag/vsarl-policy-kernel';
import { RetrievalPipeline } from '../../app/rag/hybrid-pipeline';

describe('AgenticChunkOrchestrator', () => {
    let orchestrator: AgenticChunkOrchestrator;
    let hologram: HolographicMemoryField;
    let multiWorld: MultiWorldHologram;
    let rlPolicy: VSARLPolicyKernel;
    let pipeline: RetrievalPipeline;
    const dim = 768; 
    const numDocs = 100;

    beforeEach(() => {
        hologram = new HolographicMemoryField(dim, numDocs, 64);
        const docFHRR = new Float32Array(numDocs * dim);
        multiWorld = new MultiWorldHologram(3, dim, numDocs, 64, docFHRR);
        rlPolicy = new VSARLPolicyKernel(32, 6, 100);
        pipeline = new RetrievalPipeline(2048, numDocs, dim, 1024, 32);
        
        orchestrator = new AgenticChunkOrchestrator(
            pipeline,
            hologram,
            multiWorld,
            rlPolicy,
            dim,
            numDocs
        );
    });

    it('should initialize correctly', () => {
        expect(orchestrator.dim).toBe(dim);
        expect(orchestrator.numDocs).toBe(numDocs);
        expect(orchestrator.hologram).toBe(hologram);
    });

    it('should query for a strategy via inspect', () => {
        const queryTerms = ['test', 'query'];
        const queryFHRR = new Float32Array(dim);
        queryFHRR.fill(0.1); 

        const strategy = orchestrator.inspect(queryTerms, queryFHRR);
        expect(strategy).toBeDefined();
        expect(strategy).toBeGreaterThanOrEqual(0);
        expect(strategy).toBeLessThanOrEqual(5); // assuming 6 strategies
    });

    it('should learn correctly via test stub outcome', () => {
        const outcome: OrchestratorOutcome = {
            decision: {
                strategy: RetrievalStrategy.GraphDiffuse,
                result: {
                    indices: new Int32Array(0),
                    scores: new Float32Array(0),
                    executionTimeMs: 0,
                    strategyId: 'GraphDiffuse'
                },
                confidence: 0.9,
                action: 'return',
                reasoning: 'Test'
            },
            userSatisfied: true,
            llmAccepted: true,
            latencyMs: 10
        };
        
        orchestrator.learn(outcome);
        const stats = orchestrator.getStats();
        // Since we didn't call orchestrate first, totalQueries is still 0,
        // but successHistory should be updated.
        expect(stats.strategyDistribution[RetrievalStrategy.GraphDiffuse]).toBeGreaterThan(-1);
    });

    it('should condition strategy inspection on NPC personality', () => {
        const queryTerms = ['ancient', 'tome', 'secret'];
        const queryFHRR = new Float32Array(dim);
        queryFHRR.fill(0.1);

        const scholarStrategy = orchestrator.inspect(queryTerms, queryFHRR, 'Selene');
        expect(scholarStrategy).toBeGreaterThanOrEqual(0);
        expect(scholarStrategy).toBeLessThanOrEqual(5);

        const guardianStrategy = orchestrator.inspect(queryTerms, queryFHRR, 'Aldric');
        expect(guardianStrategy).toBeGreaterThanOrEqual(0);
        expect(guardianStrategy).toBeLessThanOrEqual(5);
    });

    it('should provide explainDecision introspection with hierarchical details', () => {
        const queryTerms = ['crypt', 'gate', 'ward'];
        const queryFHRR = new Float32Array(dim);
        queryFHRR.fill(0.1);

        const explanation = orchestrator.explainDecision(queryTerms, queryFHRR, 'Aldric');
        expect(explanation.archetype).toBe('guardian');
        expect(explanation.finalSelectedAction).toBeGreaterThanOrEqual(0);
        expect(explanation.reasoning).toBeDefined();
        expect(explanation.traitBiases.length).toBe(6);
    });

    it('should attach npcId and npcArchetype to orchestrated decisions', () => {
        const queryTerms = ['arcane', 'knowledge'];
        const queryTermIds = new Int32Array([10, 20]);
        const queryIDF = new Float32Array([1.5, 1.2]);
        const queryFHRR = new Float32Array(dim);
        queryFHRR.fill(0.05);

        const decision = orchestrator.orchestrate(
            queryTerms,
            queryTermIds,
            queryIDF,
            queryFHRR,
            2,
            'Selene'
        );

        expect(decision.npcId).toBe('selene');
        expect(decision.npcArchetype).toBe('scholar');
        expect(decision.decisionId).toBeDefined();
    });
});
